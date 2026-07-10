import { CaseStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export class CaseService {
  static async createCase(data: {
    patientId: string;
    createdById: string;
    notes?: string;
  }) {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const caseNumber = (await prisma.case.count({ where: { patientId: data.patientId } })) + 1;

    const newCase = await prisma.case.create({
      data: {
        patientId: data.patientId,
        createdById: data.createdById,
        notes: data.notes,
        status: CaseStatus.PENDING_PAYMENT,
        caseNumber,
      },
      include: {
        patient: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.caseWorkflowLog.create({
      data: {
        caseId: newCase.id,
        toStatus: CaseStatus.PENDING_PAYMENT,
        performedById: data.createdById,
        note: 'Case created',
      },
    });

    return newCase;
  }

  static async assignCase(data: {
    caseId: string;
    designerId: string;
    qcId?: string;
    assignedById: string;
    dueDate?: Date;
  }) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: data.caseId },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    if (caseRecord.status !== CaseStatus.OPENED) {
      throw new Error('Case must be in OPENED status to be assigned');
    }

    const designer = await prisma.user.findUnique({
      where: { id: data.designerId },
    });

    if (!designer) {
      throw new Error('Designer not found');
    }

    let qc = null;
    if (data.qcId) {
      qc = await prisma.user.findUnique({ where: { id: data.qcId } });
      if (!qc) {
        throw new Error('QC not found');
      }
    }

    const operations: any[] = [
      prisma.case.update({
        where: { id: data.caseId },
        data: {
          designerId: data.designerId,
          ...(data.qcId && { qcId: data.qcId }),
          status: CaseStatus.ASSIGNED,
          ...(data.dueDate && { dueDate: data.dueDate }),
        },
        include: {
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
        },
      }),
      prisma.caseWorkflowLog.create({
        data: {
          caseId: data.caseId,
          fromStatus: CaseStatus.OPENED,
          toStatus: CaseStatus.ASSIGNED,
          performedById: data.assignedById,
          note: qc
            ? `Assigned to designer: ${designer.name}, QC: ${qc.name}`
            : `Assigned to designer: ${designer.name}`,
        },
      }),
    ];

    if (qc) {
      operations.push(
        prisma.caseAssignment.create({
          data: {
            caseId: data.caseId,
            designerId: data.designerId,
            qcId: data.qcId!,
            assignedById: data.assignedById,
          },
        }),
      );
    }

    const [updatedCase] = await prisma.$transaction(operations);

    return updatedCase;
  }

  static async claimQc(caseId: string, qcUserId: string) {
    const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    if (caseRecord.qcId) {
      throw new Error('This case already has a QC reviewer assigned');
    }

    if (!caseRecord.designerId) {
      throw new Error('Case must have a designer assigned before QC can claim it');
    }

    const qc = await prisma.user.findUnique({ where: { id: qcUserId } });
    if (!qc) {
      throw new Error('QC user not found');
    }

    const [updatedCase] = await prisma.$transaction([
      prisma.case.update({
        where: { id: caseId },
        data: { qcId: qcUserId },
        include: {
          designer: { select: { id: true, name: true, email: true } },
          qc: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.caseWorkflowLog.create({
        data: {
          caseId,
          toStatus: caseRecord.status,
          performedById: qcUserId,
          note: `QC claimed: ${qc.name}`,
          version: `${caseRecord.caseNumber}-${caseRecord.revisionNumber}`,
        },
      }),
      prisma.caseAssignment.create({
        data: {
          caseId,
          designerId: caseRecord.designerId,
          qcId: qcUserId,
          assignedById: qcUserId,
        },
      }),
    ]);

    return updatedCase;
  }

  static async getCaseById(caseId: string) {
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
          },
        },
        qc: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: true,
        prescription: true,
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

    return caseRecord;
  }

  static async listCases(filters: {
    createdById?: string;
    designerId?: string;
    qcId?: string;
    status?: CaseStatus;
    patientId?: string;
  }) {
    const cases = await prisma.case.findMany({
      where: {
        ...(filters.createdById && { createdById: filters.createdById }),
        ...(filters.designerId && { designerId: filters.designerId }),
        ...(filters.qcId && { qcId: filters.qcId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.patientId && { patientId: filters.patientId }),
      },
      include: {
        patient: true,
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
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        prescription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cases;
  }

  static async updateCaseNotes(caseId: string, notes: string) {
    return prisma.case.update({
      where: { id: caseId },
      data: { notes },
    });
  }
}
