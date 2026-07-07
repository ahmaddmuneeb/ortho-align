import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, authorize, authorizeEmployee, denyPatient } from '../middleware/auth';
import { AuthRequest } from '../types';
import { CaseStatus, ClarificationCategory, EmployeeType, UserRole } from '@prisma/client';
import { CaseClarificationService } from '../services/case-clarification.service';
import { CaseService } from '../services/case.service';
import { WorkflowService } from '../services/workflow.service';
import { clampString } from '../lib/validation';

const router = Router();

router.use(authenticate, denyPatient);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

const VALID_CATEGORIES = Object.values(ClarificationCategory);

/**
 * @swagger
 * /api/cases/{id}/clarifications:
 *   post:
 *     tags: [Case Clarifications]
 *     summary: Employee requests clarification from the doctor
 *     description: Sends an assigned (not-yet-started) case back to the doctor with an issue category, message, and optional attachments (ASSIGNED -> CLARIFICATION_REQUESTED)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - message
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [WRONG_FILES, MISSING_SCANS, DISTORTED_SCAN_DATA, MISMATCHED_PATIENT_DATA, MISSING_RECORDS, POOR_SCAN_QUALITY, OTHER_TECHNICAL_ISSUE]
 *               message:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Clarification requested and case moved to CLARIFICATION_REQUESTED
 *       400:
 *         description: Validation error or invalid transition
 *       403:
 *         description: Forbidden - not the assigned designer or case not in ASSIGNED status
 *       404:
 *         description: Case not found
 */
router.post(
  '/:id/clarifications',
  authorizeEmployee(EmployeeType.DESIGNER, EmployeeType.BOTH),
  upload.array('files', 5),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id as string;
      const userId = req.user!.id;
      const { category } = req.body;
      const message = clampString(req.body.message, 5000, { required: true, multiline: true });
      const files = req.files as Express.Multer.File[];

      if (!category || !VALID_CATEGORIES.includes(category as ClarificationCategory)) {
        res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
        return;
      }

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const caseRecord = await CaseService.getCaseById(caseId);
      if (!caseRecord) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      if (caseRecord.designerId !== userId) {
        res.status(403).json({ error: 'Forbidden - you are not the assigned designer for this case' });
        return;
      }

      if (caseRecord.status !== CaseStatus.ASSIGNED) {
        res.status(400).json({
          error: `Cannot request clarification in status: ${caseRecord.status}. Case must be in ASSIGNED status.`,
        });
        return;
      }

      const clarification = await CaseClarificationService.createClarification(
        caseId,
        userId,
        category as ClarificationCategory,
        message,
        files
      );

      const updatedCase = await WorkflowService.transitionCaseStatus(
        caseId,
        CaseStatus.CLARIFICATION_REQUESTED,
        userId,
        req.user!.role,
        req.user!.employeeType,
        `Clarification requested: ${category}`
      );

      res.status(201).json({
        message: 'Clarification requested and case sent back to doctor',
        clarification,
        case: updatedCase,
      });
    } catch (error: any) {
      console.error('Create clarification error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/cases/{id}/clarifications:
 *   get:
 *     tags: [Case Clarifications]
 *     summary: Get clarification requests for a case
 *     description: Accessible by the case's CLIENT owner, the assigned EMPLOYEE, and ADMIN
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of clarifications, newest first
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Case not found
 */
router.get('/:id/clarifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const caseId = req.params.id as string;

    const caseRecord = await CaseService.getCaseById(caseId);
    if (!caseRecord) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const canAccess = await CaseClarificationService.canUserAccessClarifications(
      caseId,
      req.user!.id,
      req.user!.role
    );

    if (!canAccess) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const clarifications = await CaseClarificationService.getCaseClarifications(caseId);

    res.json({ clarifications });
  } catch (error) {
    console.error('Get clarifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/cases/{id}/clarifications/{clarificationId}/resolve:
 *   post:
 *     tags: [Case Clarifications]
 *     summary: Doctor resubmits after addressing a clarification request
 *     description: Marks the clarification resolved and moves the case back to ASSIGNED (CLARIFICATION_REQUESTED -> ASSIGNED). Upload corrected files first via POST /api/cases/{id}/files.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: clarificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Case resubmitted to the employee
 *       403:
 *         description: Forbidden - not the case owner
 *       404:
 *         description: Case or clarification not found
 */
router.post(
  '/:id/clarifications/:clarificationId/resolve',
  authorize(UserRole.CLIENT),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id as string;
      const clarificationId = req.params.clarificationId as string;

      const caseRecord = await CaseService.getCaseById(caseId);
      if (!caseRecord) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      if (caseRecord.createdById !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden - can only resolve clarifications on your own cases' });
        return;
      }

      await CaseClarificationService.resolveClarification(clarificationId);

      const updatedCase = await WorkflowService.transitionCaseStatus(
        caseId,
        CaseStatus.ASSIGNED,
        req.user!.id,
        req.user!.role,
        req.user!.employeeType
      );

      res.json({
        message: 'Case resubmitted to the assigned employee',
        case: updatedCase,
      });
    } catch (error: any) {
      console.error('Resolve clarification error:', error);
      res.status(error.message === 'Clarification not found' ? 404 : 500).json({
        error: error.message || 'Internal server error',
      });
    }
  }
);

export default router;
