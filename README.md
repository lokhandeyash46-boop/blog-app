# Inkwell — Production-Ready Blog Website

A full-stack blog built with **Node.js, Express, MongoDB and EJS**, featuring role-based access
control, secure authentication, SEO-friendly slugs, and a REST API — built as a modular,
layered (MVC) application.

## Features

- **Authentication** — registration, login and logout using JWT stored in an httpOnly cookie
  (not localStorage, so it can't be read by client-side JS or stolen via XSS).
- **Role-based access control** — `user` and `admin` roles. The first registered account
  automatically becomes an admin. Admins can manage every post and promote/demote users.
- **Secure CRUD for posts** — create, edit, delete and view posts, gated by ownership or admin
  role via middleware (`requireOwnerOrAdmin`).
- **SEO-friendly routing** — posts are served at `/your-post-title-as-a-slug`, with automatic,
  collision-safe slug generation in the `Post` model.
- **Validation & sanitization** — `express-validator` on every form/API input, plus
  `express-mongo-sanitize` to strip NoSQL injection attempts and `helmet` for safe HTTP headers.
- **REST API** — a clean, versioned-style JSON API under `/api/posts` for headless/front-end use.
- **Modular, layered codebase** — `routes/ → controllers/ → models/`, with `middleware/` for
  cross-cutting concerns (auth, validation, error handling).
- **Production-ready basics** — centralized error handling, rate limiting on auth routes,
  environment-based configuration, and a seed script for demo data.

## Tech stack

| Layer      | Choice                                  |
|------------|------------------------------------------|
| Frontend   | EJS templates + vanilla CSS/JS (server-rendered) |
| Backend    | Node.js + Express.js                    |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT (httpOnly cookie) + bcrypt password hashing |
| Validation | express-validator                       |
| Security   | helmet, express-mongo-sanitize, express-rate-limit |

## Project structure

```
blog-website/
├── app.js                  # App entry point — wires middleware & routes
├── config/
│   └── db.js                # MongoDB connection
├── models/
│   ├── User.js               # User schema, password hashing, roles
│   └── Post.js                # Post schema, slug generation, text index
├── controllers/
│   ├── authController.js      # Register / login / logout
│   ├── postController.js      # Server-rendered post CRUD
│   ├── apiController.js       # JSON REST API for posts
│   └── userController.js      # Profile + admin user management
├── middleware/
│   ├── auth.js                 # attachUser, requireAuth, requireRole, requireOwnerOrAdmin
│   ├── validate.js             # express-validator rule sets + handler
│   └── error.js                # notFound + centralized errorHandler
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   └── apiRoutes.js
├── views/                    # EJS templates (layout + partials + pages)
├── public/                   # Static CSS/JS
└── utils/
    └── seed.js                 # Seeds an admin, a writer and sample posts
```

## Getting started

### 1. Install dependencies

```bash
cd blog-website
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own secrets:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/inkwell_blog
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
SESSION_SECRET=replace_this_with_another_long_random_secret
COOKIE_NAME=inkwell_token
```

You need a running MongoDB instance — either locally or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster (just paste its connection string into
`MONGO_URI`).

### 3. (Optional) Seed demo data

```bash
npm run seed
```

This creates:
- **Admin** — `admin@inkwell.test` / `Password123`
- **Writer** — `asha@inkwell.test` / `Password123`
- 4 sample posts (3 published, 1 draft)

### 4. Run the app

```bash
npm run dev     # with nodemon, auto-restarts on change
# or
npm start
```

Visit `http://localhost:3000`.

## REST API reference

All API responses follow `{ success, data | message, meta? }`.

| Method | Endpoint              | Auth required        | Description                          |
|--------|------------------------|-----------------------|---------------------------------------|
| GET    | `/api/posts`            | No                    | List published posts (paginated, filterable by `?category=` and `?q=`) |
| GET    | `/api/posts/:slug`       | No (own drafts need auth) | Get a single post by slug         |
| POST   | `/api/posts`             | Yes                   | Create a post (author = current user) |
| PUT    | `/api/posts/:id`         | Yes — owner or admin  | Update a post                         |
| DELETE | `/api/posts/:id`         | Yes — owner or admin  | Delete a post                         |

Authentication for the API uses the same JWT cookie set by `/login`. For a separate frontend
(e.g. a React app), send requests with `credentials: 'include'`.

## Security notes

- Passwords are hashed with bcrypt (12 salt rounds) and never returned in queries (`select: false`).
- JWTs live in an **httpOnly, sameSite cookie** — not accessible to JavaScript, reducing XSS risk.
- All form and API inputs are validated server-side; MongoDB operator injection is stripped by
  `express-mongo-sanitize`.
- `helmet` sets a restrictive Content-Security-Policy and other protective headers.
- Auth routes are rate-limited to slow down brute-force attempts.

## Suggested next steps for deployment

1. Set `NODE_ENV=production` and use strong, unique values for `JWT_SECRET` / `SESSION_SECRET`.
2. Put the app behind HTTPS (e.g. via a reverse proxy like Nginx, or a platform like Render/Railway).
3. Use a managed MongoDB instance (Atlas) rather than a local database.
4. Add a process manager (PM2) or container orchestration for restarts and zero-downtime deploys.
