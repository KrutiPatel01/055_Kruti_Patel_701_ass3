import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Profile() {
  const { logout } = useAuth();
  const [emp, setEmp] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/employee/me')
      .then(setEmp)
      .catch((err) => {
        if (err.status === 401) logout(); // token expired/invalid -> back to login
        else setError(err.message);
      });
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!emp) return <p>Loading...</p>;

  const rows = [
    ['Employee ID', emp.empid],
    ['Name', emp.name],
    ['Email', emp.email],
    ['Phone', emp.phone || '-'],
    ['Department', emp.department],
    ['Designation', emp.designation],
    ['Joined on', new Date(emp.joinDate).toDateString()]
  ];

  return (
    <>
      <h1>My Profile</h1>
      <table className="result-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><th>{k}</th><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
