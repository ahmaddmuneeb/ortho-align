import type { Gender } from './auth';
import type { CaseRecord } from './case';

export interface LinkedPatient {
  id: string;
  name: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PatientMeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'PATIENT';
    createdAt: string;
    updatedAt?: string;
  };
  patient: LinkedPatient | null;
}

export interface PatientCasesResponse {
  cases: CaseRecord[];
}

export interface CreatePatientAccountPayload {
  patientId: string;
  email: string;
  password: string;
  name: string;
}

export interface CreatePatientAccountResponse {
  user: { id: string; email: string; name: string; role: 'PATIENT' };
  patient: { id: string; name: string };
  temporaryPassword: string;
}
