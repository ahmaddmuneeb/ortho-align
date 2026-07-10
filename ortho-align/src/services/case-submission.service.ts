import prisma from '../lib/prisma';
import { CaseStatus } from '@prisma/client';
import { S3Service } from './s3.service';

export class CaseSubmissionService {
  static async uploadPaymentProof(
    caseId: string,
    file: Express.Multer.File
  ): Promise<{ paymentProofUrl: string }> {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    if (caseRecord.status !== CaseStatus.PENDING_PAYMENT) {
      throw new Error('Case must be in PENDING_PAYMENT status to upload payment proof');
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `cases/${caseId}/payment-proof/${timestamp}-${sanitizedFileName}`;

    const paymentProofUrl = await S3Service.uploadBuffer(
      key,
      file.buffer,
      file.mimetype,
    );

    await prisma.case.update({
      where: { id: caseId },
      data: { paymentProofUrl },
    });

    return { paymentProofUrl };
  }

  static async submitCase(caseId: string, userId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        files: true,
        prescription: true,
      },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    if (caseRecord.status !== CaseStatus.PENDING_PAYMENT) {
      throw new Error('Case must be in PENDING_PAYMENT status to submit');
    }

    if (!caseRecord.paymentProofUrl) {
      throw new Error('Payment proof must be uploaded before submission');
    }

    if (caseRecord.files.length === 0) {
      throw new Error('At least one file must be uploaded before submission');
    }

    if (!caseRecord.prescription) {
      throw new Error('Prescription must be added before submission');
    }

    const [updatedCase] = await prisma.$transaction([
      prisma.case.update({
        where: { id: caseId },
        data: {
          status: CaseStatus.PENDING_APPROVAL,
          submittedAt: new Date(),
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
          files: true,
          prescription: true,
        },
      }),
      prisma.caseWorkflowLog.create({
        data: {
          caseId,
          fromStatus: CaseStatus.PENDING_PAYMENT,
          toStatus: CaseStatus.PENDING_APPROVAL,
          performedById: userId,
          note: 'Case submitted with payment proof',
        },
      }),
    ]);

    return updatedCase;
  }

  static async approvePaymentAndAssign(
    caseId: string,
    designerId: string,
    qcId: string | undefined,
    adminId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    if (caseRecord.status !== CaseStatus.PENDING_APPROVAL) {
      throw new Error('Case must be in PENDING_APPROVAL status to approve');
    }

    const designer = await prisma.user.findUnique({
      where: { id: designerId },
    });

    if (!designer) {
      throw new Error('Designer not found');
    }

    let qc = null;
    if (qcId) {
      qc = await prisma.user.findUnique({ where: { id: qcId } });
      if (!qc) {
        throw new Error('QC not found');
      }
    }

    const operations: any[] = [
      prisma.case.update({
        where: { id: caseId },
        data: {
          status: CaseStatus.IN_DESIGN,
          designerId,
          ...(qcId && { qcId }),
        },
        include: {
          patient: true,
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
          caseId,
          fromStatus: CaseStatus.PENDING_APPROVAL,
          toStatus: CaseStatus.IN_DESIGN,
          performedById: adminId,
          note: qc
            ? `Payment approved. Assigned to designer: ${designer.name}, QC: ${qc.name}`
            : `Payment approved. Assigned to designer: ${designer.name}`,
        },
      }),
    ];

    if (qc) {
      operations.push(
        prisma.caseAssignment.create({
          data: {
            caseId,
            designerId,
            qcId: qcId!,
            assignedById: adminId,
          },
        }),
      );
    }

    const [updatedCase] = await prisma.$transaction(operations);

    return updatedCase;
  }
}
