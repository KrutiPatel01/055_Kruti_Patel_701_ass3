import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken } from './api.js';

const CartContext = createContext(null);

// Keeps the cart (from the server) available to the navbar, shop and cart pages
export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });

  const refresh = useCallback(async () => {
    if (!getToken()) return setCart({ items: [], total: 0, count: 0 });
    try {
      setCart(await api('/cart'));
    } catch {
      setCart({ items: [], total: 0, count: 0 });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <CartContext.Provider value={{ cart, setCart, refresh }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
