import prisma from '../lib/prisma';
import { CaseStatus, EmployeeType } from '@prisma/client';

export interface EmployeeDashboardStats {
  totalAssigned: number;
  completed: number;
  inProgress: number;
  pending: number;
  waitingForClarification: number;
  declined: number;
  revisionCases: number;
  completedRevisions: number;
  avgCompletionDays: number | null;
}

export interface DashboardStats {
  totalPatients: number;
  totalCases: number;
  casesThisMonth: number;
  totalRefinements: number;
  refinementsThisMonth: number;
  casesByStatus: {
    pendingPayment: number;
    inDesignReview: number;
    inQcReview: number;
    approvalRequired: number;
    completed: number;
    cancelled: number;
    clarificationRequired: number;
  };
}

export class DashboardService {
  static async getClientDashboard(clientId: string): Promise<DashboardStats> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total patients
    const totalPatients = await prisma.patient.count({
      where: { createdById: clientId },
    });

    // Get all cases for this client
    const allCases = await prisma.case.findMany({
      where: { createdById: clientId },
      select: {
        id: true,
        status: true,
        refinementCount: true,
        createdAt: true,
      },
    });

    const totalCases = allCases.length;

    // Cases this month
    const casesThisMonth = allCases.filter(
      (c) => c.createdAt >= firstDayOfMonth
    ).length;

    // Total refinements (sum of all refinement counts)
    const totalRefinements = allCases.reduce(
      (sum, c) => sum + c.refinementCount,
      0
    );

    // Refinements this month
    const refinementsThisMonth = await prisma.caseWorkflowLog.count({
      where: {
        case: { createdById: clientId },
        toStatus: {
          in: [CaseStatus.QC_REJECTED, CaseStatus.CLIENT_REJECTED],
        },
        createdAt: { gte: firstDayOfMonth },
      },
    });

    // Cases by status
    const casesByStatus = {
      pendingPayment: allCases.filter((c) => c.status === CaseStatus.PENDING_PAYMENT).length,
      inDesignReview: allCases.filter((c) => 
        c.status === CaseStatus.IN_DESIGN || 
        c.status === CaseStatus.ASSIGNED ||
        c.status === CaseStatus.OPENED
      ).length,
      inQcReview: allCases.filter((c) => c.status === CaseStatus.PENDING_QC).length,
      approvalRequired: allCases.filter((c) => c.status === CaseStatus.PENDING_CLIENT_REVIEW).length,
      completed: allCases.filter((c) => c.status === CaseStatus.APPROVED).length,
      cancelled: allCases.filter((c) => c.status === CaseStatus.CANCELLED).length,
      clarificationRequired: allCases.filter(
        (c) => c.status === CaseStatus.CLARIFICATION_REQUESTED
      ).length,
    };

    return {
      totalPatients,
      totalCases,
      casesThisMonth,
      totalRefinements,
      refinementsThisMonth,
      casesByStatus,
    };
  }

  static async getEmployeeDashboard(
    employeeId: string,
    employeeType: EmployeeType | null | undefined
  ): Promise<EmployeeDashboardStats> {
    const whereClause: any = { OR: [] };
    if (employeeType === EmployeeType.DESIGNER || employeeType === EmployeeType.BOTH) {
      whereClause.OR.push({ designerId: employeeId });
    }
    if (employeeType === EmployeeType.QC || employeeType === EmployeeType.BOTH) {
      whereClause.OR.push({ qcId: employeeId });
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        revisionNumber: true,
        workflowLogs: {
          select: { toStatus: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const totalAssigned = cases.length;
    const completed = cases.filter((c) => c.status === CaseStatus.APPROVED).length;
    const inProgress = cases.filter(
      (c) => c.status === CaseStatus.IN_DESIGN || c.status === CaseStatus.PENDING_QC
    ).length;
    const pending = cases.filter((c) => c.status === CaseStatus.ASSIGNED).length;
    const waitingForClarification = cases.filter(
      (c) => c.status === CaseStatus.CLARIFICATION_REQUESTED
    ).length;
    const declined = cases.filter((c) => c.status === CaseStatus.CLIENT_REJECTED).length;
    const revisionCases = cases.filter((c) => c.revisionNumber > 1).length;
    const completedRevisions = cases.filter(
      (c) => c.status === CaseStatus.APPROVED && c.revisionNumber > 1
    ).length;

    const completionDurations: number[] = [];
    for (const c of cases) {
      if (c.status !== CaseStatus.APPROVED) continue;
      const assignedLog = c.workflowLogs.find((l) => l.toStatus === CaseStatus.ASSIGNED);
      const approvedLog = [...c.workflowLogs].reverse().find((l) => l.toStatus === CaseStatus.APPROVED);
      if (assignedLog && approvedLog) {
        const days =
          (approvedLog.createdAt.getTime() - assignedLog.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        completionDurations.push(days);
      }
    }
    const avgCompletionDays =
      completionDurations.length > 0
        ? Number(
            (completionDurations.reduce((sum, d) => sum + d, 0) / completionDurations.length).toFixed(1)
          )
        : null;

    return {
      totalAssigned,
      completed,
      inProgress,
      pending,
      waitingForClarification,
      declined,
      revisionCases,
      completedRevisions,
      avgCompletionDays,
    };
  }
}
