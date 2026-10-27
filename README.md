# DevLog — Developer Blogging Platform

A full-stack, Hashnode-inspired blogging platform for developers, built with the **MERN stack**. Write Markdown articles with syntax-highlighted code, organise them with technology tags, and publish them to a public feed.

![Stack](https://img.shields.io/badge/stack-MERN-4f46e5)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb)
![Backend](https://img.shields.io/badge/backend-Express%20%2B%20MongoDB-10b981)

---

## Features

- **Secure authentication** — registration and login with bcrypt password hashing and JWT bearer tokens.
- **Protected routes** — writing, editing and deleting require a valid session; API endpoints enforce ownership.
- **Markdown authoring** — a split editor with live preview, word count and estimated read time.
- **Syntax-highlighted code** — fenced code blocks are highlighted with Prism (JavaScript, TypeScript, Python, Bash, SQL and more).
- **Technology tags** — up to five tags per article, normalised to slugs and indexed for filtering.
- **Search & filtering** — full-text search across titles, descriptions and tags, plus one-click tag filters.
- **Author profiles** — public profile pages listing each author's published articles.
- **Full CRUD** — create, read, update and delete articles from the UI and the REST API.
- **Responsive UI** — mobile-first layout built with Tailwind CSS.

## Tech stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB, Mongoose |
| Backend | Node.js, Express, JWT, bcryptjs, CORS, dotenv |
| Frontend | React 19, Vite, React Router, React Context API |
| Content | react-markdown, react-syntax-highlighter (Prism) |
| Styling | Tailwind CSS v4 |
| HTTP | Axios |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Run the frontend

```bash
npm run dev
```

Open <http://localhost:3000>.

> The UI runs in **demo mode** when the API is not reachable: articles and accounts are stored in
> `localStorage` so you can explore the whole product without a database. The navbar shows a
> `demo data` badge whenever this fallback is active.

Demo sign-in: `arun@devlog.dev` / `password123`

### 3. Run the full stack

Create a `.env` file (see `.env.example`):

```env
MONGODB_URI=mongodb://127.0.0.1:27017/devlog
JWT_SECRET=replace-with-a-long-random-string
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
```

Then start the API in a second terminal:

```bash
npm run server
```

With the API healthy at `/api/health`, the client talks to MongoDB instead of the demo store.
Vite proxies `/api` to `http://localhost:4000` during development.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run server` | Run the Express API with hot reload (`tsx watch`) |

## API reference

Base URL: `/api`

### Users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/users/register` | — | Create an account, returns a JWT |
| `POST` | `/users/login` | — | Authenticate, returns a JWT |
| `GET` | `/users/me` | Bearer | Current user |
| `GET` | `/users/:username` | — | Public profile with the author's articles |

### Blogs

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/blogs?tag=&search=&page=&limit=` | — | Paginated, filterable feed |
| `GET` | `/blogs/:slug` | — | Single article |
| `POST` | `/blogs` | Bearer | Create an article |
| `PUT` | `/blogs/:slug` | Bearer + owner | Update an article |
| `DELETE` | `/blogs/:slug` | Bearer + owner | Delete an article |

### Tags

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/tags` | All tags with usage-derived ordering |
| `GET` | `/tags/:slug/blogs` | Articles carrying a tag |

Protected endpoints expect `Authorization: Bearer <token>`.

## Project structure

```
backend/
  middleware/authMiddleware.ts   JWT verification + token signing
  models/User.ts                 bcrypt hashing, compares passwords
  models/Blog.ts                 slug generation, read-time, tag index
  models/Tag.ts                  normalised tag documents
  routes/*.ts                    REST endpoints
  server.ts                      Express app, CORS, health check
src/
  components/                    Navbar, BlogCard, MarkdownView, Avatar, route guard
  context/AuthContext.tsx        Session state via React Context
  lib/api.ts                     Typed Axios client + demo fallback
  lib/demo.ts                    localStorage-backed sample dataset
  pages/                         Feed, auth, editor, article, profile
```

## Production notes

- Build the client with `npm run build`, then run the API with `NODE_ENV=production` to serve `dist/` from Express.
- Set `JWT_SECRET` to a strong random value; rotating it invalidates all sessions.
- Restrict `CLIENT_ORIGIN` to your deployed frontend domain.
- Passwords are hashed with a per-user salt in a Mongoose `pre('save')` hook — never stored in plain text.

## License

MIT
