import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Layout() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="container">
      <nav>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/profile">Page 1 - Profile</NavLink>
        <NavLink to="/leaves">Page 2 - Leave</NavLink>
        <span className="spacer" />
        <span className="who">{employee.name} ({employee.empid})</span>
        <button className="link-button" onClick={handleLogout}>Logout</button>
      </nav>
      <Outlet />
    </div>
  );
}
