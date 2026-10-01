import { useEffect, useState } from 'react';
import { api } from './api.js';

const emptyForm = { rollNo: '', name: '', email: '', course: '', age: '' };

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null); // null = adding, number = editing
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { type: 'success' | 'error', text }
  const [q, setQ] = useState('');

  // READ
  function load() {
    api('/students?q=' + encodeURIComponent(q))
      .then(setStudents)
      .catch((err) => setMsg({ type: 'error', text: err.message }));
  }
  useEffect(load, [q]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
  }

  // CREATE / UPDATE
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setMsg(null);
    try {
      if (editId) await api('/students/' + editId, { method: 'PUT', body: form });
      else await api('/students', { method: 'POST', body: form });
      setMsg({ type: 'success', text: editId ? 'Student updated.' : 'Student added.' });
      resetForm();
      load();
    } catch (err) {
      if (err.status === 400) setErrors(err.errors);
      else setMsg({ type: 'error', text: err.message });
    }
  }

  function startEdit(s) {
    setEditId(s.id);
    setErrors({});
    setForm({ rollNo: s.rollNo, name: s.name, email: s.email, course: s.course, age: s.age });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // DELETE
  async function handleDelete(s) {
    if (!window.confirm(`Delete ${s.name} (${s.rollNo})?`)) return;
    try {
      await api('/students/' + s.id, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Student deleted.' });
      if (editId === s.id) resetForm();
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  const field = (name, label, type = 'text') => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={form[name]} onChange={change} className={errors[name] ? 'input-error' : ''} />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="container">
      <h1>Student CRUD <span className="muted">(Express + Sequelize + React)</span></h1>

      {msg && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

      <form onSubmit={handleSubmit} noValidate className="card">
        <h3>{editId ? 'Edit student' : 'Add student'}</h3>
        <div className="grid-2">
          {field('rollNo', 'Roll No')}
          {field('name', 'Name')}
          {field('email', 'Email')}
          {field('course', 'Course')}
          {field('age', 'Age', 'number')}
        </div>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>{' '}
        {editId && <button type="button" className="grey" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="toolbar">
        <h2>Students ({students.length})</h2>
        <input className="search" placeholder="Search name / roll no / course" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <table className="result-table">
        <thead>
          <tr><th>Roll No</th><th>Name</th><th>Email</th><th>Course</th><th>Age</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.rollNo}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.course}</td>
              <td>{s.age}</td>
              <td className="actions">
                <button className="small grey" onClick={() => startEdit(s)}>Edit</button>
                <button className="small danger" onClick={() => handleDelete(s)}>Delete</button>
              </td>
            </tr>
          ))}
          {students.length === 0 && <tr><td colSpan="6" className="muted">No students found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
