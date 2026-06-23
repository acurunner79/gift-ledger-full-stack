# Gift Ledger

Gift Ledger is a private gift-list management app built with React, Express, Prisma, and PostgreSQL. It allows users to create named gift lists, connect with trusted users, view connected users’ gift lists, and reserve or mark gifts as purchased without revealing the surprise to the list owner.

## Current Status

Gift Ledger is running on the newer named-list architecture.

Completed core features:

* User registration and login
* Protected authenticated routes
* User settings page
* Profile updates
* Per-user theme selection
* Named gift lists
* Add, edit, and archive gift items
* Gift alternatives
* User connections
* Incoming and outgoing connection requests
* Connected-user gift list viewing
* Reserve gift quantities
* Mark reserved gifts as purchased
* Cancel reservations
* Owner-safe claim privacy
* Dashboard list summaries
* Production-readiness cleanup

## Tech Stack

### Frontend

* React
* Vite
* TypeScript
* React Router
* CSS variables for themes

### Backend

* Node.js
* Express
* TypeScript
* Prisma 7
* PostgreSQL
* JWT authentication
* Helmet security headers
* CORS allowlist
* Auth rate limiting

### Database

* PostgreSQL
* Prisma schema and migrations

## Project Structure

```txt
gift-ledger/
├── backend/
├── frontend/
├── docs/
├── README.md
└── .gitignore
```

## Main Features

### Authentication

Users can register, log in, and access protected application pages with JWT authentication.

Protected routes require an Authorization bearer token. Public routes include:

```txt
GET /health
GET /api/themes
POST /api/auth/register
POST /api/auth/login
```

### Gift Lists

Users can create multiple named gift lists instead of relying on a single default list.

Supported list actions:

* View all personal lists
* Create a new list
* Open a specific list
* Edit list details
* Mark a list as default
* Add items to a selected list
* Edit items
* Archive items

### Gift Items

Gift items support:

* Item name
* Item link
* Item description
* Quantity wanted
* Alternative options

### Connections

Users can search for another user by email and send a connection request. Once accepted, connected users can view each other’s named gift lists.

Connection states include:

* Pending
* Accepted
* Declined
* Blocked

### Claim / Purchase Privacy

Connected users can reserve or purchase gifts without exposing the surprise to the gift-list owner.

The gift-list owner does not see claim data for their own list.

Connected viewers can see:

* Available quantity
* Total reserved quantity
* Total purchased quantity
* Their own active reservation
* Their own purchased quantity

Buyer identities are not exposed to other users.

## Themes

Gift Ledger includes multiple themes:

* North Pole
* Rebel Alliance
* Swiftie Era
* Winter Frost

Themes are stored per user and applied after login.

Public login and registration pages use the North Pole theme by default.

## Environment Variables

Real `.env` files should never be committed.

Safe example files are provided:

```txt
backend/.env.example
frontend/.env.example
```

### Backend Environment Variables

Create:

```txt
backend/.env
```

Example:

```env
PORT=3001

DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME

JWT_SECRET=replace-with-a-long-random-secret

FRONTEND_ORIGIN=http://localhost:5173
```

For multiple allowed frontend origins:

```env
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:4173,https://gift-ledger.example.com
```

### Frontend Environment Variables

Create:

```txt
frontend/.env.local
```

Example:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Production example:

```env
VITE_API_BASE_URL=https://api.gift-ledger.example.com
```

## Local Development Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3. Configure Environment Files

Create the backend environment file:

```txt
backend/.env
```

Create the frontend environment file:

```txt
frontend/.env.local
```

Use the `.env.example` files as templates.

### 4. Run Prisma Migrations

From the backend folder:

```bash
npx prisma migrate dev
```

Generate Prisma client if needed:

```bash
npx prisma generate
```

### 5. Start Backend Dev Server

From the backend folder:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:3001
```

### 6. Start Frontend Dev Server

From the frontend folder:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

## Production Build Tests

### Backend Build

From the backend folder:

```bash
npm run build
```

### Backend Production Start

From the backend folder:

```bash
npm start
```

Expected output:

```txt
Gift Ledger API running on port 3001
```

### Frontend Build

From the frontend folder:

```bash
npm run build
```

### Frontend Preview

From the frontend folder:

```bash
npm run preview
```

If the preview server runs on port `4173`, make sure the backend `FRONTEND_ORIGIN` allows it during local preview testing:

```env
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:4173
```

## Important API Routes

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Settings

```txt
GET   /api/settings
PATCH /api/settings/profile
PATCH /api/settings/theme
```

### Themes

```txt
GET /api/themes
```

### Lists

```txt
GET   /api/lists
POST  /api/lists
GET   /api/lists/:listId
PATCH /api/lists/:listId
PATCH /api/lists/:listId/default
POST  /api/lists/:listId/items
PATCH /api/lists/:listId/items/:itemId
PATCH /api/lists/:listId/items/:itemId/archive
GET   /api/lists/connected
```

### Connected Gift Lists

```txt
GET /api/gifts/users/:userId/lists/:listId
```

### Connections

```txt
GET   /api/connections
GET   /api/connections/search
POST  /api/connections/request
PATCH /api/connections/:connectionId/accept
PATCH /api/connections/:connectionId/decline
```

### Gift Claims

```txt
POST  /api/gift-claims/items/:itemId/reserve
PATCH /api/gift-claims/:claimId/purchase
PATCH /api/gift-claims/:claimId/cancel
```

## Legacy Route Cleanup

Gift Ledger previously used single-list routes. These have been removed from active frontend/backend usage.

Removed legacy API patterns:

```txt
/api/gifts/my-list
/api/gifts/items
/api/gifts/users/:userId/list
```

Removed legacy frontend path:

```txt
/connections/:userId/list
```

The app now uses named-list routes:

```txt
/lists
/lists/:listId
/connections/:userId/lists/:listId
/api/gifts/users/:userId/lists/:listId
```

The `/my-list` frontend redirect may remain as a bookmark-friendly redirect to `/lists`.

## Security and Production Readiness

Implemented security features:

* JWT-based authentication
* Password hashing with bcrypt
* Backend password validation
* Generic login failure messages
* CORS allowlist through `FRONTEND_ORIGIN`
* Helmet security headers
* JSON request size limit of `100kb`
* Auth route rate limiting
* Clean JSON 404 handler
* Clean JSON 500 handler
* Environment-based frontend API URL
* Demo credentials removed from frontend code
* Real `.env` files ignored by git
* Safe `.env.example` files included
* Backend and frontend npm audits clean

### Dependency Note

The backend uses a controlled npm override to resolve a nested Prisma tooling advisory without downgrading Prisma.

Expected backend dependency behavior:

```txt
Prisma remains on 7.8.0
@hono/node-server resolves to 1.19.13
npm audit reports 0 vulnerabilities
```

Do not run:

```bash
npm audit fix --force
```

That command may downgrade Prisma and break the Prisma 7 setup.

## Useful Commands

### Backend

```bash
cd backend
npm run dev
npm run build
npm start
npm audit
npm audit --omit=dev
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm audit
```

### Full Legacy Route Audit

From the project root:

```bash
grep -R "/api/gifts/my-list\|/api/gifts/items\|/api/gifts/users/.*/list\|/connections/.*/list" -n frontend/src backend/src
```

Valid named-list matches may include:

```txt
/api/gifts/users/${userId}/lists/${listId}
/connections/${userId}/lists/${listId}
```

Old single-list routes should not appear.

## Current Validation Checklist

The following flows have been tested and confirmed:

* Register page builds and displays password guidance
* Login works
* Dashboard loads
* My Lists opens
* Named list opens
* Add item works
* Edit item works
* Archive item works
* Connected named lists show on Dashboard
* Connected named lists show on Connections page
* Connected named list opens by list ID
* Reserve gift quantity works
* Mark reserved gift as purchased works
* Cancel reservation works
* Logout works
* Backend production start works
* Frontend production preview works
* Private routes reject missing tokens
* Public routes remain available

## Future Improvements

Recommended future phases:

* Add email verification
* Add password reset flow
* Add account deletion controls
* Add connection blocking management
* Add list sharing controls
* Add richer gift categories or tags
* Add due dates or holiday/event grouping
* Add deployment scripts
* Add Docker deployment
* Add automated tests
* Add CI checks for build and audit
