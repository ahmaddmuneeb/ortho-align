import type { AuthUser } from '../types/auth';

export function getEmployeeHomePath(employeeType: AuthUser['employeeType']): string {
  if (employeeType === 'QC') return '/employee/qc';
  if (employeeType === 'DESIGNER') return '/employee/designer';
  if (employeeType === 'BOTH') return '/employee/designer';
  return '/employee/designer';
}

export function getRoleHomePath(user: AuthUser | AuthUser['role']): string {
  const role = typeof user === 'string' ? user : user.role;
  if (role === 'CLIENT') return '/dashboard';
  if (role === 'PATIENT') return '/patient/dashboard';
  if (role === 'ADMIN') return '/admin';
  if (role === 'EMPLOYEE') {
    const employeeType = typeof user === 'string' ? null : user.employeeType;
    return getEmployeeHomePath(employeeType);
  }
  return '/login';
}
