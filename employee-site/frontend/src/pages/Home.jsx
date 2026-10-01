import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { employee } = useAuth();
  return (
    <>
      <h1>Welcome, {employee.name}</h1>
      <p>Choose a page:</p>
      <ul className="home-links">
        <li><Link to="/profile">Page 1 - View my profile</Link></li>
        <li><Link to="/leaves">Page 2 - Apply for leave / my leave list</Link></li>
      </ul>
    </>
  );
}
