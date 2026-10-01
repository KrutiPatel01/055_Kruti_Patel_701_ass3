import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api('/orders/mine').then(setOrders).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <h1>My Orders</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 && !error && <p className="muted">You have not placed any orders yet.</p>}

      {orders.map((o) => (
        <div className="card" key={o._id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{new Date(o.createdAt).toLocaleString()}</strong>
            <span className="badge">{o.status}</span>
          </div>
          <ul>
            {o.items.map((i, idx) => <li key={idx}>{i.name} × {i.qty} — ₹{i.price * i.qty}</li>)}
          </ul>
          <div>Total: <strong>₹{o.total}</strong></div>
          <div className="muted">Deliver to: {o.address}</div>
        </div>
      ))}
    </>
  );
}
