import type { Gender } from './auth';

export type { Gender };

export interface PatientUserRef {
  id: string;
  name: string;
  email: string;
}

export interface PatientCaseRef {
  id: string;
  status: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: PatientUserRef;
  cases?: PatientCaseRef[];
}

export interface PatientCreatePayload {
  name: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  address?: string | null;
  notes?: string | null;
  /** ADMIN only — CLIENT user who owns the patient record */
  createdById?: string;
}

export interface PatientDeleteResponse {
  message: string;
  deletedCaseCount: number;
}

export type PatientUpdatePayload = Partial<PatientCreatePayload>;

export interface PatientsListResponse {
  patients: Patient[];
}

export interface PatientResponse {
  patient: Patient;
}
