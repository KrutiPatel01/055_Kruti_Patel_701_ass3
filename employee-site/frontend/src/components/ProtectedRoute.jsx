import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute() {
  const { employee } = useAuth();
  return employee ? <Outlet /> : <Navigate to="/login" replace />;
}
