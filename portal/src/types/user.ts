import type { EmployeeType, Gender, UserRole } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeType: EmployeeType;
  gender?: Gender | null;
  region?: string | null;
  phone?: string | null;
  website?: string | null;
  businessAddress?: string | null;
  hearAboutUs?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ProfileMePatch = {
  name?: string;
  phone?: string;
  website?: string;
  businessAddress?: string;
};
