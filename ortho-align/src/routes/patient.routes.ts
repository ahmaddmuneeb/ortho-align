import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';
import { UserRole } from '@prisma/client';
import { CaseService } from '../services/case.service';
import { CaseFileService } from '../services/case-file.service';
import { CommentService } from '../services/comment.service';
import { PatientPortalService } from '../services/patient-portal.service';
import prisma from '../lib/prisma';
import './patient.swagger';

const router = Router();

router.use(authenticate, authorize(UserRole.PATIENT));

async function requireLinkedPatient(
  req: AuthRequest,
  res: Response,
): Promise<string | null> {
  const patientId = await PatientPortalService.getLinkedPatientId(req.user!.id);
  if (!patientId) {
    res.status(403).json({ error: 'No patient record linked to this account' });
    return null;
  }
  return patientId;
}

router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const patient = await PatientPortalService.getLinkedPatient(req.user!.id);
    res.json({ user, patient });
  } catch (error) {
    console.error('Patient me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cases', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = await requireLinkedPatient(req, res);
    if (!patientId) return;

    const cases = await CaseService.listCases({ patientId });
    res.json({ cases });
  } catch (error) {
    console.error('Patient list cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cases/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = await requireLinkedPatient(req, res);
    if (!patientId) return;

    const id = req.params.id as string;
    const ownsCase = await PatientPortalService.caseBelongsToPatient(id, patientId);
    if (!ownsCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const caseRecord = await CaseService.getCaseById(id);
    res.json({ case: caseRecord });
  } catch (error) {
    console.error('Patient get case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cases/:id/files', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = await requireLinkedPatient(req, res);
    if (!patientId) return;

    const id = req.params.id as string;
    const ownsCase = await PatientPortalService.caseBelongsToPatient(id, patientId);
    if (!ownsCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const files = await CaseFileService.getCaseFiles(id);
    res.json({ files });
  } catch (error) {
    console.error('Patient get case files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cases/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = await requireLinkedPatient(req, res);
    if (!patientId) return;

    const id = req.params.id as string;
    const ownsCase = await PatientPortalService.caseBelongsToPatient(id, patientId);
    if (!ownsCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const comments = await CommentService.getCaseComments(id, UserRole.PATIENT);
    res.json({ comments });
  } catch (error) {
    console.error('Patient get case comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
