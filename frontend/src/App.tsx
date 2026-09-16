import { Routes, Route } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import DashboardHome from '@/pages/DashboardHome';
import Courses from '@/pages/Courses';
import Batches from '@/pages/Batches';
import CalendarPage from '@/pages/Calendar';
import Students from '@/pages/Students';
import Attendance from '@/pages/Attendance';
import Invoices from '@/pages/Invoices';
import NotFound from '@/pages/NotFound';

export default function App() {
  useCurrentUser();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/invoices" element={<Invoices />} />

          <Route element={<ProtectedRoute roles={['admin', 'tutor']} />}>
            <Route path="/attendance" element={<Attendance />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/students" element={<Students />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
