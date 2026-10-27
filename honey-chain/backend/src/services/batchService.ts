import { prisma } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  generatePublicBatchId,
  hashBatch,
  hashBatchEvent,
  successResponse,
  paginatedResponse,
} from '../utils/helpers';
import { logger } from '../utils/logger';
import { auditLog } from './auditService';
import { BatchStatus } from '@prisma/client';

// Valid batch state transitions
const VALID_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  DRAFT: ['COLLECTED'],
  COLLECTED: ['PROCESSING'],
  PROCESSING: ['QUALITY_TESTING'],
  QUALITY_TESTING: ['APPROVED', 'RECALLED'],
  APPROVED: ['PACKAGED', 'RECALLED'],
  PACKAGED: ['IN_DISTRIBUTION', 'RECALLED'],
  IN_DISTRIBUTION: ['AT_RETAILER', 'RECALLED'],
  AT_RETAILER: ['SOLD', 'RECALLED'],
  SOLD: ['RECALLED'],
  RECALLED: [],
};

// Event types per status transition
const TRANSITION_EVENTS: Partial<Record<BatchStatus, string>> = {
  COLLECTED: 'HONEY_COLLECTED',
  PROCESSING: 'PROCESSING_STARTED',
  QUALITY_TESTING: 'QUALITY_TESTING_STARTED',
  APPROVED: 'QUALITY_APPROVED',
  PACKAGED: 'BATCH_PACKAGED',
  IN_DISTRIBUTION: 'TRANSFERRED_TO_DISTRIBUTOR',
  AT_RETAILER: 'TRANSFERRED_TO_RETAILER',
  SOLD: 'BATCH_SOLD',
  RECALLED: 'BATCH_RECALLED',
};

export async function createBatch(
  beekeeperId: string,
  userId: string,
  data: {
    floralSource?: string;
    variety?: string;
    harvestSeason?: string;
    harvestYear?: number;
    totalQuantityKg?: number;
    unit?: string;
    packagingType?: string;
    storageConditions?: string;
    notes?: string;
  }
) {
  const beekeeper = await prisma.beekeeper.findUnique({ where: { id: beekeeperId } });
  if (!beekeeper) throw ApiError.notFound('Beekeeper profile not found');

  const publicBatchId = generatePublicBatchId();

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.honeyBatch.create({
      data: {
        publicBatchId,
        beekeeperId,
        organizationId: beekeeper.organizationId,
        clusterId: beekeeper.clusterId,
        status: BatchStatus.DRAFT,
        totalQuantityKg: data.totalQuantityKg,
        remainingQuantityKg: data.totalQuantityKg,
        floralSource: data.floralSource,
        variety: data.variety,
        harvestSeason: data.harvestSeason,
        harvestYear: data.harvestYear,
        unit: data.unit || 'kg',
        packagingType: data.packagingType,
        storageConditions: data.storageConditions,
        notes: data.notes,
      },
    });

    // Create initial batch event
    const eventPayload = {
      batchId: created.id,
      eventType: 'BATCH_CREATED',
      performedBy: userId,
      description: 'Honey batch created',
      metadata: { publicBatchId, floralSource: data.floralSource },
      eventAt: new Date(),
    };

    const eventHash = hashBatchEvent(eventPayload);

    await tx.batchEvent.create({
      data: {
        ...eventPayload,
        eventHash,
        metadata: eventPayload.metadata as object,
      },
    });

    return created;
  });

  await auditLog({
    userId,
    action: 'BATCH_CREATED',
    entityType: 'HoneyBatch',
    entityId: batch.id,
    description: `Batch ${publicBatchId} created`,
    metadata: { publicBatchId },
  });

  logger.info('Batch created', { batchId: batch.id, publicBatchId, userId });
  return batch;
}

export async function getBatches(
  filters: {
    beekeeperId?: string;
    organizationId?: string;
    status?: BatchStatus;
    page: number;
    limit: number;
  }
) {
  const where = {
    deletedAt: null,
    ...(filters.beekeeperId ? { beekeeperId: filters.beekeeperId } : {}),
    ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [batches, total] = await Promise.all([
    prisma.honeyBatch.findMany({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        beekeeper: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { events: true, qualityTests: true } },
        blockchainRecord: { select: { status: true, registrationTxHash: true } },
        qrCode: { select: { isActive: true, publicBatchId: true } },
      },
    }),
    prisma.honeyBatch.count({ where }),
  ]);

  return paginatedResponse(batches, total, filters.page, filters.limit);
}

export async function getBatchById(id: string) {
  const batch = await prisma.honeyBatch.findFirst({
    where: { OR: [{ id }, { publicBatchId: id }], deletedAt: null },
    include: {
      beekeeper: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          organization: { select: { name: true, code: true } },
          cluster: { select: { name: true, code: true } },
        },
      },
      collections: { include: { hive: true } },
      processingRecords: true,
      qualityTests: true,
      blockchainRecord: true,
      qrCode: true,
      documents: { where: { deletedAt: null } },
      _count: { select: { events: true, consumerVerifications: true } },
    },
  });

  if (!batch) throw ApiError.notFound('Batch not found');
  return batch;
}

export async function getBatchTraceability(batchId: string) {
  const batch = await getBatchById(batchId);
  const events = await prisma.batchEvent.findMany({
    where: { batchId: batch.id },
    orderBy: { eventAt: 'asc' },
  });

  return {
    batch,
    events,
    eventCount: events.length,
  };
}

export async function updateBatchStatus(
  batchId: string,
  userId: string,
  newStatus: BatchStatus,
  options?: { notes?: string; location?: string; metadata?: Record<string, unknown> }
) {
  const batch = await prisma.honeyBatch.findFirst({
    where: { id: batchId, deletedAt: null },
  });

  if (!batch) throw ApiError.notFound('Batch not found');

  const allowedNext = VALID_TRANSITIONS[batch.status];
  if (!allowedNext.includes(newStatus)) {
    throw ApiError.unprocessable(
      `Invalid status transition from ${batch.status} to ${newStatus}. Allowed: ${allowedNext.join(', ') || 'none'}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const eventType = TRANSITION_EVENTS[newStatus] || `STATUS_CHANGED_TO_${newStatus}`;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBatch = await tx.honeyBatch.update({
      where: { id: batchId },
      data: {
        status: newStatus,
        ...(newStatus === 'RECALLED' ? { recalledAt: new Date(), recallReason: options?.notes } : {}),
        ...(newStatus === 'SOLD' || newStatus === 'PACKAGED' ? { finalizedAt: new Date() } : {}),
      },
    });

    const eventPayload = {
      batchId,
      eventType,
      performedBy: userId,
      description: options?.notes || `Batch status changed to ${newStatus}`,
      metadata: {
        fromStatus: batch.status,
        toStatus: newStatus,
        location: options?.location,
        ...(options?.metadata || {}),
      },
      eventAt: new Date(),
    };

    const eventHash = hashBatchEvent(eventPayload);

    await tx.batchEvent.create({
      data: {
        ...eventPayload,
        location: options?.location,
        eventHash,
        metadata: eventPayload.metadata as object,
      },
    });

    return updatedBatch;
  });

  await auditLog({
    userId,
    action: 'BATCH_STATUS_CHANGED',
    entityType: 'HoneyBatch',
    entityId: batchId,
    description: `Batch ${batch.publicBatchId} status: ${batch.status} → ${newStatus}`,
    metadata: { fromStatus: batch.status, toStatus: newStatus },
  });

  return updated;
}

export async function addHoneyCollection(
  userId: string,
  beekeeperId: string,
  data: {
    batchId: string;
    hiveId: string;
    collectionDate: string;
    quantityKg: number;
    temperatureC?: number;
    humidityPercent?: number;
    notes?: string;
  }
) {
  const batch = await prisma.honeyBatch.findFirst({
    where: { id: data.batchId, beekeeperId, deletedAt: null },
  });
  if (!batch) throw ApiError.notFound('Batch not found or access denied');

  const hive = await prisma.hive.findFirst({
    where: { id: data.hiveId, beekeeperId },
  });
  if (!hive) throw ApiError.notFound('Hive not found or access denied');

  const collection = await prisma.$transaction(async (tx) => {
    const col = await tx.honeyCollection.create({
      data: {
        batchId: data.batchId,
        hiveId: data.hiveId,
        beekeeperId,
        collectionDate: new Date(data.collectionDate),
        quantityKg: data.quantityKg,
        temperatureC: data.temperatureC,
        humidityPercent: data.humidityPercent,
        notes: data.notes,
        collectedBy: userId,
      },
    });

    // Update batch quantity
    await tx.honeyBatch.update({
      where: { id: data.batchId },
      data: {
        totalQuantityKg: { increment: data.quantityKg },
        remainingQuantityKg: { increment: data.quantityKg },
      },
    });

    // Append event
    const eventPayload = {
      batchId: data.batchId,
      eventType: 'HONEY_COLLECTED',
      performedBy: userId,
      description: `${data.quantityKg} kg honey collected from hive ${hive.hiveCode}`,
      metadata: { hiveId: data.hiveId, hiveCode: hive.hiveCode, quantityKg: data.quantityKg },
      eventAt: new Date(data.collectionDate),
    };
    await tx.batchEvent.create({
      data: {
        ...eventPayload,
        eventHash: hashBatchEvent(eventPayload),
        metadata: eventPayload.metadata as object,
      },
    });

    return col;
  });

  return collection;
}

export async function getBatchEvents(batchId: string) {
  const events = await prisma.batchEvent.findMany({
    where: { batchId },
    orderBy: { eventAt: 'asc' },
  });
  return events;
}

// Public verification (no auth required)
export async function publicVerifyBatch(publicBatchId: string, ipAddress?: string, userId?: string) {
  const batch = await prisma.honeyBatch.findFirst({
    where: { publicBatchId, deletedAt: null },
    include: {
      beekeeper: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          organization: { select: { name: true } },
          cluster: { select: { name: true, district: true, state: true } },
        },
      },
      collections: {
        include: {
          hive: {
            select: { hiveCode: true, village: true, district: true, state: true },
          },
        },
        orderBy: { collectionDate: 'asc' },
      },
      processingRecords: { orderBy: { processedAt: 'asc' } },
      qualityTests: {
        select: {
          status: true,
          testDate: true,
          overallGrade: true,
          moisturePercent: true,
          testStandard: true,
        },
        orderBy: { testDate: 'asc' },
      },
      blockchainRecord: true,
      events: { orderBy: { eventAt: 'asc' } },
      qrCode: { select: { isActive: true } },
    },
  });

  let verificationResult = 'BATCH_NOT_FOUND';
  let blockchainVerified = false;

  if (!batch) {
    // If querying demo batch and database is not yet seeded, return the demo record
    if (publicBatchId.toUpperCase() === 'HC-DEMO-001') {
      return getDemoBatchVerificationResult();
    }
    // Cannot record verification attempt — no valid batchId FK to reference.
    // Simply return not-found without writing a broken DB record.
    return { verificationResult: 'BATCH_NOT_FOUND', batch: null };
  }

  // Check blockchain integrity
  if (batch.blockchainRecord && batch.blockchainRecord.status === 'CONFIRMED') {
    const expectedHash = hashBatch(batch);
    blockchainVerified = expectedHash === batch.blockchainRecord.batchHash;
    verificationResult = blockchainVerified ? 'VERIFIED' : 'BLOCKCHAIN_MISMATCH';
  } else {
    verificationResult = 'NOT_BLOCKCHAIN_REGISTERED';
  }

  // Update QR scan count
  if (batch.qrCode) {
    await prisma.qRCode.update({
      where: { batchId: batch.id },
      data: { scanCount: { increment: 1 } },
    });
  }

  // Log verification
  await prisma.consumerVerification.create({
    data: {
      batchId: batch.id,
      publicBatchId,
      userId,
      ipAddress,
      verificationResult,
      blockchainVerified,
    },
  });

  // Return only public-safe information
  return {
    verificationResult,
    blockchainVerified,
    batch: {
      publicBatchId: batch.publicBatchId,
      status: batch.status,
      floralSource: batch.floralSource,
      variety: batch.variety,
      harvestSeason: batch.harvestSeason,
      harvestYear: batch.harvestYear,
      totalQuantityKg: batch.totalQuantityKg,
      packagingType: batch.packagingType,
      finalizedAt: batch.finalizedAt,
      producer: {
        name: `${batch.beekeeper.user.firstName} ${batch.beekeeper.user.lastName.charAt(0)}.`,
        organization: batch.beekeeper.organization?.name,
        cluster: batch.beekeeper.cluster?.name,
        district: batch.beekeeper.district,
        state: batch.beekeeper.state,
      },
      collections: batch.collections.map((c) => ({
        collectionDate: c.collectionDate,
        quantityKg: c.quantityKg,
        hive: c.hive,
      })),
      processingRecords: batch.processingRecords.map((p) => ({
        processedAt: p.processedAt,
        processingType: p.processingType,
      })),
      qualityTests: batch.qualityTests,
      events: batch.events.map((e) => ({
        eventType: e.eventType,
        description: e.description,
        eventAt: e.eventAt,
        eventHash: e.eventHash,
      })),
      blockchainRecord: batch.blockchainRecord
        ? {
            status: batch.blockchainRecord.status,
            registrationTxHash: batch.blockchainRecord.registrationTxHash,
            registrationBlock: batch.blockchainRecord.registrationBlock,
            registrationAt: batch.blockchainRecord.registrationAt,
          }
        : null,
    },
  };
}

export function getDemoBatchVerificationResult() {
  return {
    verificationResult: 'VERIFIED',
    blockchainVerified: true,
    isDemo: true,
    batch: {
      publicBatchId: 'HC-DEMO-001',
      status: 'PACKAGED',
      floralSource: 'Wild Acacia',
      variety: 'Wild Acacia Himalayan Raw Honey',
      harvestSeason: 'Spring 2025',
      harvestYear: 2025,
      totalQuantityKg: 120.0,
      packagingType: '500g Food-Grade Hexagonal Glass Jar',
      finalizedAt: new Date('2025-04-20T10:15:00Z'),
      producer: {
        name: 'Rajesh K.',
        organization: 'Himalayan Organic Apiaries Ltd.',
        cluster: 'Dehradun Valley Hive Cluster A',
        district: 'Dehradun',
        state: 'Uttarakhand',
      },
      collections: [
        {
          collectionDate: new Date('2025-04-12T11:45:00Z'),
          quantityKg: 120.0,
          hive: {
            hiveCode: 'HIVE-001',
            village: 'Maldevta',
            district: 'Dehradun',
            state: 'Uttarakhand',
          },
        },
      ],
      processingRecords: [
        {
          processedAt: new Date('2025-04-15T09:00:00Z'),
          processingType: 'Cold Micro-Mesh Filtration & Low-Temp Settling',
        },
      ],
      qualityTests: [
        {
          status: 'PASS',
          testDate: new Date('2025-04-18T16:20:00Z'),
          overallGrade: 'Grade A Pure Raw Honey (99.4% Purity)',
          moisturePercent: 17.2,
          testStandard: 'FSSAI / Codex Alimentarius Standard CXS 12-1981',
        },
      ],
      events: [
        {
          eventType: 'BATCH_CREATED',
          description: 'Batch HC-DEMO-001 initialized by beekeeper Rajesh Kumar',
          eventAt: new Date('2025-04-12T08:30:00Z'),
          eventHash: '0x1a8f9c4d2e7b5a3f1c8e9d0b2a4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a',
        },
        {
          eventType: 'HONEY_COLLECTED',
          description: '120 kg raw honey harvested from Hive HIVE-001 at 24.5°C ambient temperature',
          eventAt: new Date('2025-04-12T11:45:00Z'),
          eventHash: '0x2b9c0d1e3f8a6b4c2d9f0e1a3b5d7f1a1b3d5f7a1b3d5f7a1b3d5f7a1b3d5f7a',
        },
        {
          eventType: 'PROCESSING_STARTED',
          description: 'Cold-filtered through micro-mesh screens to preserve bio-active enzymes',
          eventAt: new Date('2025-04-15T09:00:00Z'),
          eventHash: '0x3c0d1e2f4a9b7c5d3e0a1f2b4c6e8a2b2c4e6a8b2c4e6a8b2c4e6a8b2c4e6a8b',
        },
        {
          eventType: 'QUALITY_APPROVED',
          description: 'Lab test passed: 17.2% moisture, 99.4% purity, 0% synthetic syrups or antibiotics',
          eventAt: new Date('2025-04-18T16:20:00Z'),
          eventHash: '0x4d1e2f3a5b0c8d6e4f1b2a3c5d7f9b3c3d5f7b9c3d5f7b9c3d5f7b9c3d5f7b9c',
        },
        {
          eventType: 'BATCH_PACKAGED',
          description: 'Bottled in 500g glass jars with tamper-evident cryptographic QR seal',
          eventAt: new Date('2025-04-20T10:15:00Z'),
          eventHash: '0x5e2f3a4b6c1d9e7f5a2c3b4d6e8a0c4d4e6a8c0d4e6a8c0d4e6a8c0d4e6a8c0d',
        },
        {
          eventType: 'BLOCKCHAIN_REGISTERED',
          description: 'Merkle batch hash anchored on Ethereum Sepolia ledger in block #6428910',
          eventAt: new Date('2025-04-20T14:32:00Z'),
          eventHash: '0x6f3a4b5c7d2e0f8a6b3d4c5e7f9b1d5e5f7b9d1e5f7b9d1e5f7b9d1e5f7b9d1e',
        },
      ],
      blockchainRecord: {
        status: 'CONFIRMED',
        registrationTxHash: '0x8f7d6a4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d',
        registrationBlock: 6428910,
        registrationAt: new Date('2025-04-20T14:32:00Z'),
      },
    },
  };
}

