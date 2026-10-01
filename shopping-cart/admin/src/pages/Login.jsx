import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, setToken, getToken } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (getToken()) return <Navigate to="/categories" replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/auth/admin/login', { method: 'POST', body: { username, password } });
      setToken(data.token);
      navigate('/categories');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container narrow">
      <h1>Admin Login</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">Log In</button>
      </form>
      <p className="hint">Default: admin / admin123</p>
    </div>
  );
}
