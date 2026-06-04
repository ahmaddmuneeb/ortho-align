export type UserRole = 'CLIENT' | 'ADMIN' | 'EMPLOYEE' | 'PATIENT';
export type EmployeeType = 'DESIGNER' | 'QC' | 'BOTH' | null;
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AuthUser {
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
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'CLIENT';
  gender: Gender;
  region: string;
  phone: string;
  website?: string;
  businessAddress: string;
  hearAboutUs: string;
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
  };
}

export interface CaseSummary {
  id: string;
  status: string;
  patientId?: string;
  createdAt?: string;
  updatedAt?: string;
}
