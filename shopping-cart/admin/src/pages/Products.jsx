import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

const empty = { name: '', description: '', price: '', stock: '', imageUrl: '', category: '' };

export default function Products() {
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);

  const fail = (err) => {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      navigate('/login');
    } else setMsg({ type: 'error', text: err.message });
  };

  const load = () => {
    api('/categories').then(setTree).catch(fail);
    api('/products').then(setProducts).catch(fail);
  };
  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setErrors({});
    setMsg(null);
    try {
      if (editId) await api('/products/' + editId, { method: 'PUT', body: form });
      else await api('/products', { method: 'POST', body: form });
      setMsg({ type: 'success', text: editId ? 'Product updated.' : 'Product added.' });
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      if (err.status === 400) setErrors(err.errors);
      else fail(err);
    }
  }

  function startEdit(p) {
    setEditId(p._id);
    setErrors({});
    setForm({
      name: p.name, description: p.description || '', price: p.price, stock: p.stock,
      imageUrl: p.imageUrl || '', category: p.category ? p.category._id : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api('/products/' + p._id, { method: 'DELETE' });
      load();
    } catch (err) { fail(err); }
  }

  const err = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <>
      <h1>Products</h1>
      {msg && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

      <form onSubmit={save} noValidate className="card">
        <h3>{editId ? 'Edit product' : 'Add product'}</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={change} className={errors.name ? 'input-error' : ''} />
            {err('name')}
          </div>
          <div className="form-group">
            <label>Sub-category</label>
            <select name="category" value={form.category} onChange={change} className={errors.category ? 'input-error' : ''}>
              <option value="">-- choose --</option>
              {tree.map((p) => (
                <optgroup key={p._id} label={p.name}>
                  {p.children.map((c) => <option key={c._id} value={c._id}>{p.name} &rsaquo; {c.name}</option>)}
                </optgroup>
              ))}
            </select>
            {err('category')}
          </div>
          <div className="form-group">
            <label>Price</label>
            <input type="number" step="0.01" name="price" value={form.price} onChange={change} className={errors.price ? 'input-error' : ''} />
            {err('price')}
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input type="number" name="stock" value={form.stock} onChange={change} className={errors.stock ? 'input-error' : ''} />
            {err('stock')}
          </div>
        </div>
        <div className="form-group">
          <label>Image URL (optional)</label>
          <input name="imageUrl" value={form.imageUrl} onChange={change} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" rows="2" value={form.description} onChange={change} />
        </div>
        <button type="submit">{editId ? 'Update' : 'Add product'}</button>{' '}
        {editId && <button type="button" className="grey" onClick={() => { setEditId(null); setForm(empty); setErrors({}); }}>Cancel</button>}
      </form>

      <table className="result-table">
        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.imageUrl ? <img src={p.imageUrl} alt="" className="thumb" /> : '-'}</td>
              <td>{p.name}</td>
              <td>{p.category ? `${p.category.parent ? p.category.parent.name + ' › ' : ''}${p.category.name}` : '-'}</td>
              <td>₹{p.price}</td>
              <td>{p.stock}</td>
              <td className="actions">
                <button className="small grey" onClick={() => startEdit(p)}>Edit</button>
                <button className="small danger" onClick={() => remove(p)}>Delete</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan="6" className="muted">No products yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
