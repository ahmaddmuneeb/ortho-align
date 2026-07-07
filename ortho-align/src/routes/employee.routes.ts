import { Router, Response } from 'express';
import { authenticate, authorizeEmployee } from '../middleware/auth';
import { AuthRequest } from '../types';
import { EmployeeType, CaseStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { DashboardService } from '../services/dashboard.service';

const router = Router();

/**
 * @swagger
 * /api/employee/dashboard:
 *   get:
 *     tags: [Employee]
 *     summary: Get employee dashboard stats
 *     description: Returns case counts and stats for the assigned designer/QC employee
 *     responses:
 *       200:
 *         description: Employee dashboard stats
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - must be employee
 */
router.get('/dashboard', authenticate, authorizeEmployee(EmployeeType.DESIGNER, EmployeeType.QC, EmployeeType.BOTH), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await DashboardService.getEmployeeDashboard(req.user!.id, req.user!.employeeType);
    res.json({ stats });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employee/cases:
 *   get:
 *     tags: [Employee]
 *     summary: Get cases assigned to employee
 *     description: Designer or QC gets all cases assigned to them
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, CLARIFICATION_REQUESTED, IN_DESIGN, PENDING_QC, QC_REJECTED, PENDING_CLIENT_REVIEW, CLIENT_REJECTED, APPROVED]
 *         description: Filter by case status
 *     responses:
 *       200:
 *         description: List of assigned cases
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - must be employee
 */
router.get('/cases', authenticate, authorizeEmployee(EmployeeType.DESIGNER, EmployeeType.QC, EmployeeType.BOTH), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const employeeType = req.user!.employeeType;
    const statusFilter = req.query.status as CaseStatus | undefined;

    const whereClause: any = {
      OR: [],
    };

    // Add conditions based on employee type
    if (employeeType === EmployeeType.DESIGNER || employeeType === EmployeeType.BOTH) {
      whereClause.OR.push({ designerId: userId });
    }

    if (employeeType === EmployeeType.QC || employeeType === EmployeeType.BOTH) {
      whereClause.OR.push({ qcId: userId });
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        qc: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        files: {
          select: {
            id: true,
            category: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
        prescription: true,
        productionUrls: {
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        workflowLogs: {
          select: { toStatus: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({ cases });
  } catch (error) {
    console.error('Get employee cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/employee/cases/{id}:
 *   get:
 *     tags: [Employee]
 *     summary: Get case details
 *     description: Designer or QC gets full details of assigned case
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not assigned to this case
 *       404:
 *         description: Case not found
 */
router.get('/cases/:id', authenticate, authorizeEmployee(EmployeeType.DESIGNER, EmployeeType.QC, EmployeeType.BOTH), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const caseId = req.params.id as string;
    const userId = req.user!.id;

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        patient: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        designer: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeType: true,
          },
        },
        qc: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeType: true,
          },
        },
        files: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        prescription: true,
        productionUrls: {
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        workflowLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!caseRecord) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Check if employee is assigned to this case
    if (caseRecord.designerId !== userId && caseRecord.qcId !== userId) {
      res.status(403).json({ error: 'Forbidden - not assigned to this case' });
      return;
    }

    res.json({ case: caseRecord });
  } catch (error) {
    console.error('Get employee case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
