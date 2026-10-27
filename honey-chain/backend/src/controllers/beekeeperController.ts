import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse } from '../utils/helpers';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

export async function createOrUpdateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      organizationId,
      clusterId,
      beekeeperCode,
      registrationNumber,
      experienceYears,
      address,
      village,
      district,
      state,
      pincode,
      latitude,
      longitude,
      bankAccountNumber,
      ifscCode,
    } = req.body;

    // Check if code is already in use by another beekeeper
    if (beekeeperCode) {
      const existing = await prisma.beekeeper.findFirst({
        where: { beekeeperCode, NOT: { userId } },
      });
      if (existing) {
        throw ApiError.badRequest(`Beekeeper code '${beekeeperCode}' is already registered`);
      }
    }

    // Upsert profile
    const profile = await prisma.beekeeper.upsert({
      where: { userId },
      update: {
        ...(organizationId !== undefined && { organizationId }),
        ...(clusterId !== undefined && { clusterId }),
        ...(beekeeperCode && { beekeeperCode }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
        ...(address !== undefined && { address }),
        ...(village !== undefined && { village }),
        ...(district !== undefined && { district }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(ifscCode !== undefined && { ifscCode }),
      },
      create: {
        userId,
        organizationId,
        clusterId,
        beekeeperCode: beekeeperCode || `BK-${Date.now().toString().slice(-6)}`,
        registrationNumber,
        experienceYears: experienceYears ? Number(experienceYears) : 0,
        address,
        village,
        district,
        state,
        pincode,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        bankAccountNumber,
        ifscCode,
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        cluster: { select: { id: true, name: true, code: true } },
      },
    });

    // Ensure user role is updated to BEEKEEPER if it was CONSUMER
    if (req.user!.role === UserRole.CONSUMER) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.BEEKEEPER },
      });
    }

    res.status(200).json(successResponse(profile, 'Beekeeper profile updated successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getMyProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await prisma.beekeeper.findUnique({
      where: { userId: req.user!.id },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        cluster: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            hives: true,
            honeyBatches: true,
          },
        },
      },
    });

    if (!profile) {
      throw ApiError.notFound('Beekeeper profile not found');
    }

    res.json(successResponse(profile));
  } catch (err) {
    next(err);
  }
}

export async function getProfileById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const profile = await prisma.beekeeper.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        organization: { select: { id: true, name: true, code: true } },
        cluster: { select: { id: true, name: true, code: true } },
        _count: { select: { hives: true, honeyBatches: true } },
      },
    });

    if (!profile) {
      throw ApiError.notFound('Beekeeper profile not found');
    }

    res.json(successResponse(profile));
  } catch (err) {
    next(err);
  }
}
