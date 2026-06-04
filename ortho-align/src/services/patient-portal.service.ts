import prisma from '../lib/prisma';

export class PatientPortalService {
  static async getLinkedPatientId(userId: string): Promise<string | null> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    return patient?.id ?? null;
  }

  static async getLinkedPatient(userId: string) {
    return prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        notes: true,
        createdAt: true,
      },
    });
  }

  static async caseBelongsToPatient(caseId: string, patientId: string): Promise<boolean> {
    const record = await prisma.case.findFirst({
      where: { id: caseId, patientId },
      select: { id: true },
    });
    return Boolean(record);
  }
}
