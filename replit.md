# LUXE MARKET - Second-Hand Luxury Marketplace

## Overview
A full-stack second-hand luxury marketplace built with Express + React (Vite) + PostgreSQL + Drizzle ORM.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn UI, Wouter, TanStack Query
- **Backend**: Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: bcryptjs password hashing, express-session with pg-backed store
- **Chat**: Polling-based (every 3 seconds)
- **Payments**: Mock payment gateway

## Project Structure
```
client/src/
  App.tsx          - Router with all routes
  components/
    header.tsx     - Top navigation with search, categories, user menu
    footer.tsx     - Footer with links
    product-card.tsx - Product card + skeleton + price formatter
    ui/            - Shadcn UI components
  hooks/
    use-auth.tsx   - Auth context provider + hook
  pages/
    home.tsx       - Home page with hero, categories, products
    search.tsx     - Search with filters
    product-detail.tsx - Product detail with buy/chat
    category.tsx   - Category listing
    login.tsx      - Login form
    register.tsx   - Registration form
    dashboard.tsx  - Seller dashboard overview
    dashboard-products.tsx - Seller product management
    dashboard-product-new.tsx - Create/edit product
    dashboard-orders.tsx - Seller order management
    buyer-orders.tsx - Buyer order history
    chat.tsx       - Chat conversation list
    chat-conversation.tsx - Chat messages with polling
    mock-pay.tsx   - Mock payment page
    admin.tsx      - Admin panel (products, orders, categories, users)
server/
  index.ts         - Express app setup
  db.ts            - Database connection
  routes.ts        - All API routes
  storage.ts       - Database operations (IStorage interface)
  seed.ts          - Seed data with demo users/products
  vite.ts          - Vite dev server middleware
shared/
  schema.ts        - Drizzle schema + Zod validators + types
```

## Database Models
- Users (email/password auth, roles: user/admin)
- Categories (Thai names, slugs, active/inactive)
- Products (seller, category, images, status: active/reserved/sold/hidden)
- Conversations (tied to product, buyer, seller)
- Messages (polling-based chat)
- Orders (status flow: pending_payment -> paid -> preparing -> shipped -> completed)
- Payments (mock gateway with session-based flow)

## Demo Accounts
- Admin: admin@luxemarket.com / admin123
- Seller 1: seller1@luxemarket.com / seller123
- Seller 2: seller2@luxemarket.com / seller123
- Buyer: buyer@luxemarket.com / buyer123

## Environment Variables
- DATABASE_URL (auto-provisioned)
- SESSION_SECRET
- MOCKPAY_WEBHOOK_SECRET

## Key Features
- Email/password authentication with role-based access
- Product listings with images, search, category filtering
- Seller dashboard for product/order management
- Buyer order tracking
- Real-time chat via polling
- Mock payment gateway with success/fail/cancel flows
- Admin panel for moderation
- Atomic product reservation to prevent double-selling
