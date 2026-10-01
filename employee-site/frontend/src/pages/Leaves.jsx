import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const emptyForm = { date: '', reason: '', grant: 'no' };

export default function Leaves() {
  const { logout } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  function handleAuthError(err) {
    if (err.status === 401) logout();
    else setMessage(err.message);
  }

  function loadLeaves() {
    api('/leaves').then(setLeaves).catch(handleAuthError);
  }

  useEffect(loadLeaves, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    try {
      await api('/leaves', { method: 'POST', body: form });
      setForm(emptyForm);
      setMessage('Leave application added.');
      loadLeaves();
    } catch (err) {
      if (err.status === 400) setErrors(err.errors);
      else handleAuthError(err);
    }
  }

  return (
    <>
      <h1>Apply for Leave</h1>
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" name="date" value={form.date} onChange={change} className={errors.date ? 'input-error' : ''} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason</label>
          <textarea id="reason" name="reason" rows="3" value={form.reason} onChange={change} className={errors.reason ? 'input-error' : ''} />
          {errors.reason && <span className="field-error">{errors.reason}</span>}
        </div>

        <div className="form-group">
          <label>Grant</label>
          <div className="inline-options">
            {['yes', 'no'].map((v) => (
              <label key={v} className="inline-label">
                <input type="radio" name="grant" value={v} checked={form.grant === v} onChange={change} />
                {v === 'yes' ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
          {errors.grant && <span className="field-error">{errors.grant}</span>}
        </div>

        <button type="submit">Add Leave</button>
      </form>

      <h2>My Leave Applications</h2>
      {leaves.length === 0 ? (
        <p className="muted">No leave applications yet.</p>
      ) : (
        <table className="result-table">
          <thead>
            <tr><th>Date</th><th>Reason</th><th>Grant</th><th>Applied on</th></tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l._id}>
                <td>{new Date(l.date).toLocaleDateString()}</td>
                <td>{l.reason}</td>
                <td><span className={'badge ' + l.grant}>{l.grant === 'yes' ? 'Yes' : 'No'}</span></td>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
