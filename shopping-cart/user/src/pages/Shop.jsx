import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api.js';
import { useCart } from '../CartContext.jsx';

export default function Shop() {
  const navigate = useNavigate();
  const { setCart } = useCart();
  const [tree, setTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(''); // '' = all
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { api('/categories').then(setTree).catch(() => {}); }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    api('/products?' + params).then(setProducts).catch((e) => setMsg({ type: 'error', text: e.message }));
  }, [category, q]);

  async function addToCart(p) {
    if (!getToken()) return navigate('/login');
    setMsg(null);
    try {
      setCart(await api('/cart', { method: 'POST', body: { productId: p._id, qty: 1 } }));
      setMsg({ type: 'success', text: `"${p.name}" added to cart.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  const catBtn = (id, label, extra = '') => (
    <button className={`cat-btn ${extra} ${category === id ? 'active' : ''}`} onClick={() => setCategory(id)}>{label}</button>
  );

  return (
    <div className="shop">
      <aside className="sidebar">
        <h3>Categories</h3>
        <ul>
          <li>{catBtn('', 'All products')}</li>
          {tree.map((p) => (
            <li key={p._id}>
              {catBtn(p._id, p.name)}
              <ul>
                {p.children.map((c) => <li key={c._id}>{catBtn(c._id, c.name, 'sub')}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        <div className="search-row">
          <input placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {msg && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

        {products.length === 0 ? (
          <p className="muted">No products found.</p>
        ) : (
          <div className="products">
            {products.map((p) => (
              <div className="product-card" key={p._id}>
                <img src={p.imageUrl || 'https://placehold.co/400x300?text=No+image'} alt={p.name} />
                <div className="body">
                  <span className="crumb">{p.category ? `${p.category.parent ? p.category.parent.name + ' › ' : ''}${p.category.name}` : ''}</span>
                  <strong>{p.name}</strong>
                  <span className="muted">{p.description}</span>
                  <span className="price">₹{p.price}</span>
                  {p.stock > 0 ? (
                    <button onClick={() => addToCart(p)}>Add to cart</button>
                  ) : (
                    <button disabled className="grey">Out of stock</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
