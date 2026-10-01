import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../CartContext.jsx';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, setCart, refresh } = useCart();
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState(null);

  async function run(fn) {
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  const changeQty = (p, qty) => run(async () => setCart(await api('/cart/' + p._id, { method: 'PUT', body: { qty } })));
  const remove = (p) => run(async () => setCart(await api('/cart/' + p._id, { method: 'DELETE' })));

  const placeOrder = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/orders', { method: 'POST', body: { address } });
      await refresh();
      navigate('/orders');
    });
  };

  if (cart.items.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <p className="muted">Your cart is empty.</p>
      </>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      {msg && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

      <table className="result-table">
        <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          {cart.items.map(({ product, qty, lineTotal }) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>₹{product.price}</td>
              <td>
                <input
                  type="number" min="1" max={product.stock} className="qty" value={qty}
                  onChange={(e) => e.target.value && changeQty(product, Number(e.target.value))}
                />
              </td>
              <td>₹{lineTotal}</td>
              <td><button className="small danger" onClick={() => remove(product)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total">Total: <strong>₹{cart.total}</strong></div>

      <form onSubmit={placeOrder} className="card">
        <h3>Checkout</h3>
        <div className="form-group">
          <label>Delivery address</label>
          <textarea rows="3" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <button type="submit">Place order</button>
      </form>
    </>
  );
}
