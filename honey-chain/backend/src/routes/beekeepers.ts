import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as beekeeperController from '../controllers/beekeeperController';

const router = Router();

/**
 * @swagger
 * /api/beekeepers/me:
 *   get:
 *     summary: Get current authenticated beekeeper profile
 *     tags: [Beekeepers]
 */
router.get('/me', authenticate, beekeeperController.getMyProfile);

/**
 * @swagger
 * /api/beekeepers:
 *   post:
 *     summary: Create or update current user's beekeeper profile
 *     tags: [Beekeepers]
 */
router.post('/', authenticate, beekeeperController.createOrUpdateProfile);

/**
 * @swagger
 * /api/beekeepers/{id}:
 *   get:
 *     summary: Get beekeeper profile by ID
 *     tags: [Beekeepers]
 */
router.get('/:id', authenticate, beekeeperController.getProfileById);

export default router;
