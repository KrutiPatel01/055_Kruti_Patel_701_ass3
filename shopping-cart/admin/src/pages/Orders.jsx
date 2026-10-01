import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

const STATUSES = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const fail = (err) => {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      navigate('/login');
    } else setError(err.message);
  };

  const load = () => api('/orders').then(setOrders).catch(fail);
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    try {
      await api(`/orders/${id}/status`, { method: 'PUT', body: { status } });
      load();
    } catch (err) { fail(err); }
  }

  return (
    <>
      <h1>Orders</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="result-table">
        <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Address</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>{o.user ? `${o.user.name} (${o.user.email})` : 'deleted user'}</td>
              <td>{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</td>
              <td>₹{o.total}</td>
              <td>{o.address}</td>
              <td>
                <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="6" className="muted">No orders yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
