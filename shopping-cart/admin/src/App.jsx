import { Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getToken, clearToken } from './api.js';
import Login from './pages/Login.jsx';
import Categories from './pages/Categories.jsx';
import Products from './pages/Products.jsx';
import Orders from './pages/Orders.jsx';

function AdminLayout() {
  const navigate = useNavigate();
  if (!getToken()) return <Navigate to="/login" replace />;

  function logout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="container">
      <nav>
        <strong>Shop Admin</strong>
        <NavLink to="/categories">Categories</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <span className="spacer" />
        <button className="link-button" onClick={logout}>Logout</button>
      </nav>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/categories" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
      <Route path="*" element={<Navigate to="/categories" replace />} />
    </Routes>
  );
}
