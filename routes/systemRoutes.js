
import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createOrganisation, getOrganisationById, getUserById, getUserOrganisations, addUserToOrganisation} from '../controllers/systemController.js';

const router = express.Router();

router.get('/users/:id', verifyToken, getUserById);
router.get('/organisations', verifyToken, getUserOrganisations);
router.post('/organisations', verifyToken, createOrganisation);
router.get('/organisations/:orgId', verifyToken, getOrganisationById);
router.post('/organisations/:orgId/users', addUserToOrganisation);

export default router;
