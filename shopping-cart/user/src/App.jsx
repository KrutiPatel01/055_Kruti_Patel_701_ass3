import { Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getToken, clearToken } from './api.js';
import { useCart } from './CartContext.jsx';
import Login from './pages/Login.jsx';
import Shop from './pages/Shop.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';

function Layout() {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const loggedIn = !!getToken();

  function logout() {
    clearToken();
    refresh();
    navigate('/');
  }

  return (
    <div className="container">
      <nav>
        <strong>Online Shop</strong>
        <NavLink to="/" end>Shop</NavLink>
        {loggedIn && <NavLink to="/cart">Cart<span className="cart-pill">{cart.count}</span></NavLink>}
        {loggedIn && <NavLink to="/orders">My Orders</NavLink>}
        <span className="spacer" />
        {loggedIn ? (
          <>
            <span className="muted">Hi, {localStorage.getItem('user_name')}</span>
            <button className="link-button" onClick={logout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login">Login / Register</NavLink>
        )}
      </nav>
      <Outlet />
    </div>
  );
}

// pages that need a logged-in user
function RequireUser() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireUser />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
