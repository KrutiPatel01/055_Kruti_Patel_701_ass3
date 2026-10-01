import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

export default function Categories() {
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [msg, setMsg] = useState(null); // { type, text }

  const fail = (err) => {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      navigate('/login');
    } else setMsg({ type: 'error', text: err.message });
  };

  const load = () => api('/categories').then(setTree).catch(fail);
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/categories', { method: 'POST', body: { name, parent: parent || null } });
      setName('');
      setMsg({ type: 'success', text: 'Category added.' });
      load();
    } catch (err) { fail(err); }
  }

  async function rename(cat) {
    const newName = window.prompt('New name', cat.name);
    if (!newName || newName.trim() === cat.name) return;
    try {
      await api('/categories/' + cat._id, { method: 'PUT', body: { name: newName } });
      load();
    } catch (err) { fail(err); }
  }

  async function remove(cat) {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    setMsg(null);
    try {
      await api('/categories/' + cat._id, { method: 'DELETE' });
      load();
    } catch (err) { fail(err); }
  }

  return (
    <>
      <h1>Categories (2 levels)</h1>
      {msg && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

      <form onSubmit={add} className="row-form">
        <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Top level (Level 1)</option>
          {tree.map((p) => <option key={p._id} value={p._id}>Sub-category of: {p.name}</option>)}
        </select>
        <button type="submit">Add</button>
      </form>

      {tree.length === 0 && <p className="muted">No categories yet.</p>}
      <ul className="tree">
        {tree.map((p) => (
          <li key={p._id}>
            <div className="tree-row">
              <strong>{p.name}</strong>
              <span className="actions">
                <button className="small grey" onClick={() => rename(p)}>Rename</button>
                <button className="small danger" onClick={() => remove(p)}>Delete</button>
              </span>
            </div>
            <ul>
              {p.children.map((c) => (
                <li key={c._id}>
                  <div className="tree-row">
                    <span>{c.name}</span>
                    <span className="actions">
                      <button className="small grey" onClick={() => rename(c)}>Rename</button>
                      <button className="small danger" onClick={() => remove(c)}>Delete</button>
                    </span>
                  </div>
                </li>
              ))}
              {p.children.length === 0 && <li className="muted">no sub-categories</li>}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
