# Q7 — Shopping Cart (MERN) with Admin site and User site

Three parts that share one API and one MongoDB database:

| Folder | What | Port |
|---|---|---|
| `backend/` | Express + Mongoose + JWT API | 5007 |
| `admin/` | React admin site: categories, products, orders | 5173 |
| `user/` | React user site: browse, cart, checkout, my orders | 5174 |

## Features
**Admin site** (login `admin / admin123`, created automatically on first start)
- **2-level categories**: Level 1 (e.g. *Electronics*) → Level 2 (e.g. *Mobiles*). Add / rename / delete.
  A sub-category cannot have children, and a category with children or products cannot be deleted.
- **Products** CRUD – every product belongs to a *level-2* category (name, price, stock, image URL, description).
- **Orders** – see all orders and change status (Placed → Shipped → Delivered / Cancelled).

**User site**
- Register / login (JWT), browse products, filter by category (choosing a Level-1 category shows the products of all its sub-categories), search.
- **Cart** stored in the database per user: add, change quantity, remove (stock is checked).
- **Checkout**: delivery address → order is created, stock is reduced, cart is emptied.
- **My Orders** list.

## Run
Start MongoDB, then use three terminals:
```bash
# 1) API
cd backend
npm install
npm run seed      # optional sample categories + products
npm start

# 2) admin site  -> http://localhost:5173
cd admin
npm install
npm run dev

# 3) user site   -> http://localhost:5174
cd user
npm install
npm run dev
```

## API summary
| Method | URL | Who |
|---|---|---|
| POST | `/api/auth/admin/login` | – |
| POST | `/api/auth/user/register`, `/api/auth/user/login` | – |
| GET | `/api/categories` (tree), `/api/products`, `/api/products/:id` | public |
| POST/PUT/DELETE | `/api/categories`, `/api/products` | admin |
| GET/POST/PUT/DELETE | `/api/cart` | user |
| POST | `/api/orders` · GET `/api/orders/mine` | user |
| GET | `/api/orders` · PUT `/api/orders/:id/status` | admin |

## Viva notes
- The JWT contains `{id, role}`; the `auth('admin')` / `auth('user')` middleware checks the role, so a
  user token can never call admin routes.
- Order lines copy the product name and price at purchase time, so later price changes don't rewrite history.
- Stock is reduced with a conditional update (`stock >= qty`) so two buyers cannot buy the last item.
- Categories use a self-reference (`parent`) – one collection, two levels.
