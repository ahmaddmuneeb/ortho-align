import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/Layout';
import { getEmployeeHomePath, getRoleHomePath } from './lib/routes';
import { useAppSelector } from './store/hooks';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientNewPage } from './pages/PatientNewPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { CasesPage } from './pages/CasesPage';
import { CaseNewPage } from './pages/CaseNewPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { EmployeeQueuePage } from './pages/employee/EmployeeQueuePage';
import { EmployeeCaseDetailPage } from './pages/employee/EmployeeCaseDetailPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeCaseHistoryPage } from './pages/employee/EmployeeCaseHistoryPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminEmployeeNewPage } from './pages/admin/AdminEmployeeNewPage';
import { AdminCasesPage } from './pages/admin/AdminCasesPage';
import { AdminCaseNewPage } from './pages/admin/AdminCaseNewPage';
import { AdminCaseDetailPage } from './pages/admin/AdminCaseDetailPage';
import { AdminPatientsPage } from './pages/admin/AdminPatientsPage';
import { AdminPatientNewPage } from './pages/admin/AdminPatientNewPage';
import { AdminPatientDetailPage } from './pages/admin/AdminPatientDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { PatientLayout } from './components/PatientLayout';
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { PatientCasesPage } from './pages/patient/PatientCasesPage';
import { PatientCaseDetailPage } from './pages/patient/PatientCaseDetailPage';

function HomeRedirect() {
  const { user, token, loading } = useAppSelector((s) => s.auth);
  if (loading) return null;
  if (!user || !token) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user)} replace />;
}

function EmployeeHomeRedirect() {
  const { user, token } = useAppSelector((s) => s.auth);
  if (!user || !token) return <Navigate to="/login" replace />;
  return <Navigate to={getEmployeeHomePath(user.employeeType)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CLIENT']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/new" element={<PatientNewPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/new" element={<CaseNewPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['EMPLOYEE']} />}>
        <Route path="/employee" element={<EmployeeHomeRedirect />} />
        <Route element={<PortalLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
          <Route path="/employee/history" element={<EmployeeCaseHistoryPage />} />
          <Route path="/employee/designer" element={<EmployeeQueuePage />} />
          <Route path="/employee/qc" element={<EmployeeQueuePage />} />
          <Route path="/employee/cases/:id" element={<EmployeeCaseDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['PATIENT']} />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          <Route path="/patient/cases" element={<PatientCasesPage />} />
          <Route path="/patient/cases/:id" element={<PatientCaseDetailPage />} />
          <Route path="/patient/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/patients" element={<AdminPatientsPage />} />
          <Route path="/admin/patients/new" element={<AdminPatientNewPage />} />
          <Route path="/admin/patients/:id" element={<AdminPatientDetailPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/new" element={<AdminEmployeeNewPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/cases" element={<AdminCasesPage />} />
          <Route path="/admin/cases/new" element={<AdminCaseNewPage />} />
          <Route path="/admin/cases/:id" element={<AdminCaseDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
