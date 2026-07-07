import prisma from '../lib/prisma';
import { ClarificationCategory, UserRole } from '@prisma/client';
import { S3Service } from './s3.service';

const clarificationInclude = {
  requestedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  attachments: true,
};

export class CaseClarificationService {
  static async createClarification(
    caseId: string,
    requestedById: string,
    category: ClarificationCategory,
    message: string,
    files?: Express.Multer.File[]
  ) {
    const clarification = await prisma.caseClarification.create({
      data: {
        caseId,
        requestedById,
        category,
        message,
      },
    });

    if (files && files.length > 0) {
      const attachmentData = await Promise.all(
        files.map(async (file) => {
          const timestamp = Date.now();
          const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const key = `cases/${caseId}/clarifications/${clarification.id}/${timestamp}-${sanitizedFileName}`;
          const fileUrl = await S3Service.uploadBuffer(key, file.buffer, file.mimetype);

          return {
            clarificationId: clarification.id,
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
          };
        })
      );

      await prisma.caseClarificationAttachment.createMany({ data: attachmentData });
    }

    return prisma.caseClarification.findUnique({
      where: { id: clarification.id },
      include: clarificationInclude,
    });
  }

  static async getCaseClarifications(caseId: string) {
    return prisma.caseClarification.findMany({
      where: { caseId },
      include: clarificationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async resolveClarification(clarificationId: string) {
    const clarification = await prisma.caseClarification.findUnique({
      where: { id: clarificationId },
    });

    if (!clarification) {
      throw new Error('Clarification not found');
    }

    return prisma.caseClarification.update({
      where: { id: clarificationId },
      data: { resolvedAt: new Date() },
      include: clarificationInclude,
    });
  }

  static async canUserAccessClarifications(
    caseId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) {
      return false;
    }

    if (userRole === UserRole.CLIENT && caseRecord.createdById === userId) {
      return true;
    }

    if (
      userRole === UserRole.EMPLOYEE &&
      (caseRecord.designerId === userId || caseRecord.qcId === userId)
    ) {
      return true;
    }

    return false;
  }
}
