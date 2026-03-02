# NEXT CARGO - Second-Hand Luxury Marketplace

## Overview
A full-stack second-hand luxury marketplace (Thai-language UI) built with Express + React (Vite) + PostgreSQL + Drizzle ORM.
Brand name: **NEXT CARGO** (all caps). All UI text is in Thai language.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn UI, Wouter, TanStack Query
- **Backend**: Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: bcryptjs password hashing, express-session with pg-backed store (connect-pg-simple)
- **Chat**: Polling-based (every 3 seconds)
- **Payments**: Mock payment gateway
- **File Upload**: multer, stored in `/uploads/`, max 5MB, images only

## Project Structure
```
client/src/
  App.tsx          - Router with all routes
  components/
    header.tsx     - Top navigation with search, categories, user menu (Thai)
    footer.tsx     - Footer with links (Thai)
    product-card.tsx - Product card + skeleton + price formatter (฿ symbol)
    ui/            - Shadcn UI components
  hooks/
    use-auth.tsx   - Auth context provider + hook (staleTime: 0, setQueryData on login/register)
  pages/
    home.tsx       - Home page with hero, categories, products (Thai)
    search.tsx     - Search with filters (Thai)
    product-detail.tsx - Product detail with buy/chat (Thai)
    category.tsx   - Category listing (Thai)
    login.tsx      - Login form (Thai)
    register.tsx   - Registration with buyer/seller toggle (Thai)
    dashboard.tsx  - Seller dashboard overview with KYC banner (Thai)
    dashboard-products.tsx - Seller product management (Thai)
    dashboard-product-new.tsx - Create/edit product with file upload (Thai)
    dashboard-orders.tsx - Seller order management (Thai)
    dashboard-verify.tsx - KYC verification page for sellers (Thai)
    buyer-orders.tsx - Buyer order history (Thai)
    chat.tsx       - Chat conversation list (Thai)
    chat-conversation.tsx - Chat messages with polling (Thai)
    mock-pay.tsx   - Mock payment page (Thai)
    admin.tsx      - Admin panel with products, orders, categories, users, KYC management (Thai)
    not-found.tsx  - 404 page (Thai)
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
- Users (email/password auth, roles: user/admin, accountType: buyer/seller, KYC fields: kycStatus, idCardNumber, idCardImageFront/Back)
- Categories (Thai names, slugs, active/inactive)
- Products (seller, category, images, brand, model, size, color, location, status: active/reserved/sold/hidden)
- Conversations (tied to product, buyer, seller)
- Messages (polling-based chat, rate limit 30 msgs/min)
- Orders (status flow: pending_payment -> paid -> preparing -> shipped -> completed)
- Payments (mock gateway with session-based flow)

## KYC Flow
1. Seller registers with accountType="seller"
2. Seller navigates to /dashboard/verify and submits ID card front/back + ID number
3. KYC status goes to "pending"
4. Admin approves/rejects via admin panel (/admin, Users tab)
5. KYC status becomes "approved" or "rejected"

## Demo Accounts
- Admin: admin@luxemarket.com / admin123
- Seller 1: seller1@luxemarket.com / seller123
- Seller 2: seller2@luxemarket.com / seller123
- Buyer: buyer@luxemarket.com / buyer123

## Environment Variables
- DATABASE_URL (auto-provisioned)
- SESSION_SECRET

## Key Features
- Email/password authentication with buyer/seller toggle at registration
- KYC seller verification flow (ID card upload, admin approval)
- Product listings with images, search, category filtering, extra fields (brand/model/size/color/location)
- Seller dashboard for product/order management
- Buyer order tracking
- Real-time chat via polling
- Mock payment gateway with success/fail/cancel flows
- Admin panel for product/order/category/user/KYC management
- Atomic product reservation to prevent double-selling
- All UI in Thai language
