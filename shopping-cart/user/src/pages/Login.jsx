import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, setToken, getToken } from '../api.js';
import { useCart } from '../CartContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  if (getToken()) return <Navigate to="/" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setError('');
    try {
      const path = mode === 'login' ? '/auth/user/login' : '/auth/user/register';
      const data = await api(path, { method: 'POST', body: form });
      setToken(data.token);
      localStorage.setItem('user_name', data.name);
      await refresh();
      navigate('/');
    } catch (err) {
      if (err.status === 400) setErrors(err.errors);
      else setError(err.message);
    }
  }

  const fe = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <div className="container narrow" style={{ padding: 0, boxShadow: 'none' }}>
      <h1>{mode === 'login' ? 'Login' : 'Create account'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} noValidate>
        {mode === 'register' && (
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={change} className={errors.name ? 'input-error' : ''} />
            {fe('name')}
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input name="email" value={form.email} onChange={change} className={errors.email ? 'input-error' : ''} />
          {fe('email')}
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={change} className={errors.password ? 'input-error' : ''} />
          {fe('password')}
        </div>
        <button type="submit">{mode === 'login' ? 'Log In' : 'Register'}</button>
      </form>
      <p className="hint">
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setError(''); }}>
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </a>
      </p>
    </div>
  );
}
