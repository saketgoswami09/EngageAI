# 🤖 WhatsApp AI Automation Platform

A **production-ready**, full-stack WhatsApp Conversational AI system. Businesses can connect their WhatsApp Business number, let an AI handle customer conversations, auto-capture leads, store documents, and view live analytics — all from a React dashboard.

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack & Why](#tech-stack--why)
3. [Project Structure — File by File](#project-structure--file-by-file)
4. [Build From Scratch — Step by Step](#build-from-scratch--step-by-step)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Running the Project](#running-the-project)
7. [API Routes Reference](#api-routes-reference)
8. [Tips & Common Gotchas](#tips--common-gotchas)

---

## Architecture Overview

```
WhatsApp User
      │
      ▼ (HTTPS webhook POST)
 Meta Cloud API
      │
      ▼
 ┌────────────┐     ┌──────────┐     ┌────────────┐
 │  Express   │────▶│ Bull     │────▶│  AI        │
 │  Backend   │     │ Queue    │     │  Service   │
 │  (Node.js) │     │ (Redis)  │     │  (Groq/    │
 └────────────┘     └──────────┘     │  OpenAI)   │
       │                             └────────────┘
       │
       ▼
 ┌────────────┐   ┌──────────────┐   ┌──────────────┐
 │  MongoDB   │   │  Cloudinary  │   │  React       │
 │  (Data)    │   │  (Files)     │   │  Dashboard   │
 └────────────┘   └──────────────┘   └──────────────┘
```

**Flow:** A customer sends a WhatsApp message → Meta forwards it to your webhook → backend queues it in Redis via Bull → AI service replies → response is sent back via WhatsApp Cloud API. Meanwhile, the React dashboard lets you monitor conversations, leads, and analytics in real time.

---

## Tech Stack & Why

| Layer | Technology | Why |
|---|---|---|
| **Backend framework** | Express.js | Minimal, unopinionated, huge ecosystem |
| **Database** | MongoDB + Mongoose | Flexible schema — conversations vary in shape |
| **Cache / Queue** | Redis + Bull | Async job queue prevents webhook timeouts; caching speeds things up |
| **AI** | Groq / OpenAI compatible | OpenAI-compatible API keeps you provider-agnostic |
| **File Storage** | Cloudinary | Free 25 GB tier, great for documents/images received via WhatsApp |
| **OCR** | Tesseract.js | Extract text from images sent by users (pure JS, no server binary needed) |
| **Auth** | JWT (access + refresh tokens) | Stateless, scales horizontally |
| **Frontend** | React 19 + Vite | Fast HMR, modern React features |
| **Charts** | Recharts | Lightweight chart library for analytics |
| **HTTP Client** | Axios | Used on both frontend (dashboard API calls) and backend (calling Meta & AI APIs) |
| **Logging** | Winston + morgan | Structured JSON logs with daily rotation |
| **Security** | Helmet, CORS, mongoSanitize, rate-limit | Standard production hardening |
| **Containerisation** | Docker + docker-compose | One-command local spin-up with all services |

---

## Project Structure — File by File

```
whatsappAutomation/
├── docker-compose.yml          ← spins up MongoDB + Redis + backend + frontend
├── backend/
│   ├── .env.example            ← template — copy to .env and fill in
│   ├── Dockerfile              ← builds the Node.js backend image
│   ├── seed.js                 ← creates a default admin user in MongoDB
│   ├── package.json
│   └── src/
│       ├── app.js              ← ★ ENTRY POINT — Express app wired here
│       ├── config/
│       │   ├── db.js           ← connects to MongoDB via Mongoose
│       │   ├── redis.js        ← connects ioredis client, used by Bull & rate-limiter
│       │   └── env.js          ← validates required env vars on startup
│       ├── routes/
│       │   ├── webhook.js      ← GET (verify) + POST (receive messages) from Meta
│       │   ├── auth.js         ← /api/auth — login, refresh, logout
│       │   ├── users.js        ← /api/users — admin user management
│       │   ├── conversations.js← /api/conversations — list, get, reply
│       │   ├── leads.js        ← /api/leads — CRM-lite: list, update, export
│       │   ├── documents.js    ← /api/documents — upload, list, get
│       │   ├── analytics.js    ← /api/analytics — stats for the dashboard
│       │   └── settings.js     ← /api/settings — AI persona, prompts, toggles
│       ├── controllers/
│       │   ├── authController.js         ← login/register/refresh logic
│       │   ├── conversationController.js ← fetch & send manual replies
│       │   ├── leadController.js         ← lead CRUD + CSV export
│       │   ├── documentController.js     ← upload to Cloudinary + OCR
│       │   ├── analyticsController.js    ← aggregate queries for charts
│       │   ├── settingsController.js     ← read/write AI settings doc
│       │   └── userController.js         ← profile, password change
│       ├── services/
│       │   ├── aiService.js      ← ★ calls Groq/OpenAI to generate replies; manages token budget
│       │   ├── conversationService.js ← conversation history helpers, auto-lead detection
│       │   ├── documentService.js     ← Cloudinary upload + Tesseract OCR pipeline
│       │   └── leadService.js         ← upsert leads, tag, score
│       ├── models/
│       │   ├── Admin.js          ← admin user schema (bcrypt hashed password)
│       │   ├── Conversation.js   ← phone number + status + assignedTo
│       │   ├── Message.js        ← each individual message (role, content, tokens)
│       │   ├── Lead.js           ← captured name/email/phone + stage + notes
│       │   ├── Document.js       ← Cloudinary URL + OCR text + conversation ref
│       │   └── User.js           ← (customer-side) WhatsApp profile info
│       ├── queues/
│       │   └── messageQueue.js   ← Bull queue — processes incoming WhatsApp messages async
│       ├── middleware/
│       │   ├── auth.js           ← verifyToken middleware (JWT)
│       │   ├── errorHandler.js   ← global Express error handler
│       │   ├── rateLimiter.js    ← express-rate-limit + redis store
│       │   └── validate.js       ← wraps express-validator for clean route validation
│       └── utils/
│           ├── AppError.js       ← custom Error subclass with statusCode
│           ├── logger.js         ← Winston logger (console + daily rotating files)
│           ├── catchAsync.js     ← wraps async controllers (not needed with express-async-errors)
│           └── (other helpers)
└── frontend/
    ├── Dockerfile              ← builds React app → Nginx static server
    ├── nginx.conf              ← serves /dist, proxies /api → backend
    ├── vite.config.js          ← Vite config (React plugin)
    ├── index.html              ← SPA shell
    └── src/
        ├── main.jsx            ← ReactDOM.createRoot entry
        ├── App.jsx             ← router, protected routes
        ├── index.css           ← global styles / CSS variables
        ├── api/
        │   └── axios.js        ← Axios instance with base URL + auth interceptors
        ├── context/
        │   └── AuthContext.jsx ← React context for current admin user
        ├── components/         ← reusable UI bits (Sidebar, Nav, etc.)
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── ConversationsPage.jsx
        │   ├── LeadsPage.jsx
        │   ├── DocumentsPage.jsx
        │   ├── AnalyticsPage.jsx
        │   └── SettingsPage.jsx
        └── assets/
```

---

## Build From Scratch — Step by Step

Follow these steps in order to rebuild this project from zero.

### Step 1 — Prerequisites

Install these tools first:

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop) (needed for Redis + MongoDB locally)
- **Git** — [git-scm.com](https://git-scm.com)
- A **Meta Developer account** with a WhatsApp Business App — [developers.facebook.com](https://developers.facebook.com)
- A **Groq account** (free, generous tier) — [console.groq.com](https://console.groq.com)
- A **Cloudinary account** (free 25 GB) — [cloudinary.com](https://cloudinary.com)

---

### Step 2 — Scaffold the Backend

```bash
mkdir whatsappAutomation && cd whatsappAutomation
mkdir -p backend/src/{config,routes,controllers,services,models,queues,middleware,utils}
cd backend
npm init -y
```

Install all dependencies:

```bash
npm install express dotenv helmet cors morgan express-async-errors \
  express-mongo-sanitize express-rate-limit express-validator \
  hpp xss-clean mongoose ioredis bull rate-limit-redis \
  jsonwebtoken bcryptjs axios cloudinary tesseract.js \
  multer winston winston-daily-rotate-file uuid node-cron joi

npm install -D nodemon eslint jest supertest
```

> **Tip:** `express-async-errors` monkey-patches Express so you don't need a `try/catch` in every async controller — errors automatically reach your global error handler.

---

### Step 3 — Config Files First (`src/config/`)

**Why start here?** These run before anything else. A misconfigured DB connection crashes the app immediately.

#### `config/env.js`
Validates required environment variables at startup. If `MONGO_URI` or `JWT_ACCESS_SECRET` is missing, the process exits early with a clear message instead of a cryptic crash later.

```js
// Pattern: list required keys, loop + throw
const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', ...];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
});
```

#### `config/db.js`
Calls `mongoose.connect(process.env.MONGO_URI)`. Export it as an async function — `app.js` awaits it before starting the HTTP server so the app never accepts requests before the DB is ready.

#### `config/redis.js`
Creates an `ioredis` client. Export both the client and a `connectRedis()` function. Use `lazyConnect: true` so the app doesn't crash if Redis is temporarily unavailable — Bull will reconnect on its own.

---

### Step 4 — Utilities (`src/utils/`)

Build these before routes and controllers because everything depends on them.

#### `utils/AppError.js`
```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinction: operational vs programmer error
  }
}
module.exports = AppError;
```
> **Tip:** The `isOperational` flag lets your error handler send safe messages to clients for expected errors (404, 401) while hiding stack traces for unexpected crashes.

#### `utils/logger.js`
Configure Winston with two transports:
1. Console transport (colorized `dev` format)
2. `DailyRotateFile` transport (JSON format, keeps 14 days of logs)

Morgan HTTP logs should pipe into `logger.http()` so all logs go through one system.

---

### Step 5 — Models (`src/models/`)

Define your Mongoose schemas. Design rule: **one collection per domain concept**.

| Model | Key fields | Purpose |
|---|---|---|
| `Admin` | email, passwordHash, role | Dashboard users (bcrypt hashed) |
| `User` | waId (WhatsApp ID), name, phone | WhatsApp end-user profiles |
| `Conversation` | waId, status (open/closed/bot), assignedTo | Thread per customer |
| `Message` | conversationId, role (user/assistant), content, tokens | Each message in a thread |
| `Lead` | name, phone, email, stage, score, conversationId | CRM record, auto-captured |
| `Document` | cloudinaryUrl, ocrText, mimeType, conversationId | Uploaded files |

> **Tip:** Add Mongoose indexes early. `Conversation` needs an index on `waId`. `Message` needs a compound index on `(conversationId, createdAt)` for fast conversation history lookups.

---

### Step 6 — Middleware (`src/middleware/`)

#### `middleware/errorHandler.js`
This is the **last** middleware in `app.js`. It receives `(err, req, res, next)`.

```js
// Pattern
if (err.isOperational) {
  return res.status(err.statusCode).json({ status: 'error', message: err.message });
}
// Don't leak internals
logger.error(err);
res.status(500).json({ status: 'error', message: 'Something went wrong' });
```

#### `middleware/auth.js`
Extracts the Bearer token from the `Authorization` header, verifies it with `jsonwebtoken`, and attaches `req.admin` for downstream controllers.

#### `middleware/rateLimiter.js`
Two limiters: a general API limiter and a stricter auth limiter (prevent brute-force login). Uses `rate-limit-redis` to share state across multiple Node processes.

---

### Step 7 — The Webhook Route (`src/routes/webhook.js`)

This is the **most critical route** — it's how Meta talks to your app.

```
GET /webhook  → Meta sends hub.challenge to verify your endpoint
POST /webhook → Meta sends actual messages here
```

**IMPORTANT:** Mount the webhook route **before** `express.json()` middleware. Meta signs the payload with HMAC-SHA256 using your `WHATSAPP_APP_SECRET`. You need the **raw body** (a Buffer) to verify the signature. Once `express.json()` parses it, the raw body is gone.

```js
// In app.js — ORDER MATTERS!
app.use('/webhook', webhookRoutes);   // ← raw body available here
app.use(express.json());              // ← parses body for all other routes
```

On a valid POST, don't process the message inline — push it to the Bull queue and immediately return `200 OK`. Meta retries if you don't respond within 20 seconds.

---

### Step 8 — The Message Queue (`src/queues/messageQueue.js`)

```js
const Queue = require('bull');
const messageQueue = new Queue('whatsapp-messages', { redis: redisClient });

messageQueue.process(async (job) => {
  const { waId, message } = job.data;
  // 1. Save message to DB
  // 2. Call aiService to get reply
  // 3. Send reply via WhatsApp Cloud API
  // 4. Save assistant message to DB
});
```

> **Tip:** Set `attempts: 3` and `backoff: { type: 'exponential', delay: 2000 }` on jobs. If the AI service is rate-limited, the job will retry automatically without losing the message.

---

### Step 9 — AI Service (`src/services/aiService.js`)

This is the brain of the system. Key responsibilities:

1. **Build the prompt context** — fetch last N messages from DB, convert to `[{role, content}]` array for the AI API.
2. **Inject system prompt** — pulled from the `Settings` document in MongoDB (configurable from the dashboard).
3. **Call the AI API** — uses `axios.post` to the OpenAI-compatible endpoint (`AI_BASE_URL`).
4. **Track token budget** — read/write a daily counter in Redis. If `AI_DAILY_TOKEN_BUDGET` is exceeded, return a fallback message.
5. **Per-user rate limiting** — store per-`waId` call counts in Redis with a 1-hour TTL.

> **Tip:** Keep `AI_BASE_URL` as an env var pointing to Groq's OpenAI-compatible endpoint. Switching to OpenAI or Together.ai is just a config change.

---

### Step 10 — Other Services

#### `services/documentService.js`
1. Receive a file buffer (via `multer` memory storage)
2. Upload to Cloudinary using `cloudinary.uploader.upload_stream`
3. If the file is an image or PDF, run `Tesseract.js` OCR on it and save the extracted text to the `Document` model
4. Return the `Document` record to the controller

#### `services/leadService.js`
Called by `conversationService` automatically when the AI extracts a name, email, or phone from a conversation. Uses `findOneAndUpdate` with `{ upsert: true }` so the same customer is never duplicated.

#### `services/conversationService.js`
Manages conversation state transitions (bot → open → closed). Helper for fetching paginated message history. Triggers `leadService.upsert()` when contact info is detected.

---

### Step 11 — Controllers & Routes

Follow this pattern for every resource:

```
routes/leads.js       →  defines URL + HTTP verb + middleware chain
controllers/leadController.js  →  thin layer: validate input, call service, send response
services/leadService.js        →  business logic: DB queries, transformations
```

> **Tip:** Controllers should be ≤ 20 lines each. If a controller is getting long, move logic to the service layer.

---

### Step 12 — Wire Everything in `app.js`

```js
require('express-async-errors');  // must be first
require('dotenv').config();
const express = require('express');

// ... middleware setup (helmet, cors, morgan)

app.use('/webhook', webhookRoutes);  // BEFORE json parser
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

// API routes
app.use('/api/auth', authRoutes);
// ... rest of routes

app.all('*', (req, res, next) => next(new AppError('Not found', 404)));
app.use(errorHandler);  // MUST be last

const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT);
};
start();
```

---

### Step 13 — Scaffold the Frontend

```bash
cd ../   # back to whatsappAutomation root
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom react-hot-toast lucide-react recharts date-fns
```

#### Key frontend files:

**`src/api/axios.js`** — Create a shared Axios instance:
```js
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(null, err => {
  if (err.response?.status === 401) window.location.href = '/login';
  return Promise.reject(err);
});
export default api;
```

**`src/context/AuthContext.jsx`** — Wrap the app in a React Context that stores the current admin user and provides `login()` / `logout()` functions.

**`src/App.jsx`** — Use `react-router-dom` v7 with protected routes:
```jsx
<Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
<Route path="/login" element={<LoginPage />} />
```

---

### Step 14 — Docker Compose (Full Stack)

`docker-compose.yml` orchestrates 4 services:

| Service | Image | Port |
|---|---|---|
| `mongodb` | `mongo:7-jammy` | 27017 |
| `redis` | `redis:7-alpine` | 6379 |
| `backend` | built from `./backend/Dockerfile` | 5000 |
| `frontend` | built from `./frontend/Dockerfile` | 80 |

The frontend Nginx config proxies `/api` → `backend:5000`, so the React app can call `/api/...` without CORS issues in production.

---

### Step 15 — Seed Admin User

```bash
cd backend
node seed.js
```

This creates a default admin user (`admin@example.com` / `Admin123!`) for first login. Change the password immediately after.

---

## Environment Variables Reference

Copy `backend/.env.example` to `backend/.env` and fill it in:

| Variable | What it does | Where to get it |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | MongoDB Atlas free tier |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` locally, or Upstash |
| `JWT_ACCESS_SECRET` | Signs 15-min access tokens | `node -e "require('crypto').randomBytes(64).toString('hex')"` |
| `JWT_REFRESH_SECRET` | Signs 7-day refresh tokens | Same as above, different value |
| `WHATSAPP_PHONE_NUMBER_ID` | Your WA Business phone ID | Meta Developer Dashboard |
| `WHATSAPP_ACCESS_TOKEN` | Meta API token | Meta Developer Dashboard |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Any string you pick | You define this, paste into Meta dashboard |
| `WHATSAPP_APP_SECRET` | Used for HMAC signature verification | Meta App → Settings → Basic |
| `AI_BASE_URL` | AI provider base URL | `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | AI provider API key | Groq console |
| `AI_MODEL` | Model to use | `llama3-8b-8192` (Groq free tier) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary dashboard |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` (dev) |

---

## Running the Project

### Option A — Docker (recommended, easiest)

```bash
# From the project root
docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### Option B — Manual (for active development)

**Terminal 1 — Redis & MongoDB via Docker:**
```bash
docker-compose up mongodb redis
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev   # nodemon hot-reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev   # Vite dev server at http://localhost:5173
```

### Exposing the Webhook for Local Dev

Meta needs a public HTTPS URL for your webhook. Use [ngrok](https://ngrok.com):

```bash
ngrok http 5000
```

Take the `https://xxxx.ngrok.io` URL and enter it in Meta's WhatsApp webhook settings as:
```
https://xxxx.ngrok.io/webhook
```

---

## API Routes Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/login` | No | Admin login → returns tokens |
| `POST` | `/api/auth/refresh` | No | Refresh access token |
| `GET` | `/api/conversations` | Yes | List all conversations |
| `GET` | `/api/conversations/:id` | Yes | Messages in a conversation |
| `POST` | `/api/conversations/:id/reply` | Yes | Manual reply (bypasses AI) |
| `GET` | `/api/leads` | Yes | All leads with filters |
| `GET` | `/api/leads/export` | Yes | Download leads as CSV |
| `PATCH` | `/api/leads/:id` | Yes | Update lead (stage, notes) |
| `POST` | `/api/documents/upload` | Yes | Upload file → Cloudinary + OCR |
| `GET` | `/api/analytics/overview` | Yes | Message counts, lead stats |
| `GET/PUT` | `/api/settings` | Yes | AI persona, system prompt |
| `GET` | `/webhook` | No | Meta webhook verification |
| `POST` | `/webhook` | No | Incoming WhatsApp messages |

---

## Tips & Common Gotchas

### 🔴 Critical: Webhook Route Order
Mount `/webhook` **before** `express.json()`. If you don't, HMAC verification will always fail because the raw body is already consumed.

### 🟡 Bull Queue + Redis Connection
If Redis is down, Bull throws an unhandled rejection on startup. Either wrap queue creation in a try/catch or make Redis optional with `lazyConnect`. Or simply use Docker to always have Redis available.

### 🟡 Meta Webhook Retries
Meta retries webhook delivery if it doesn't get a `200` within 20 seconds. Always respond immediately (just `res.sendStatus(200)`) and do the actual processing in the Bull queue. If you do the AI call inline, timeouts cause duplicate messages.

### 🟢 Token Budget
Set `AI_DAILY_TOKEN_BUDGET` realistically. Groq's free tier gives ~14,400 requests/day on some models. Budget ~200 tokens per conversation turn.

### 🟢 Keeping AI Context Short
Send only the last 10–15 messages to the AI, not the entire conversation history. Groq's `llama3-8b-8192` has an 8k context window — you'll hit it fast if you dump everything.

### 🟢 `express-async-errors`
This package patches Express so any error thrown inside an `async` route handler automatically calls `next(error)`. Without it (or without wrapping every handler in `try/catch`), unhandled promise rejections crash the process.

### 🟡 Mongoose `runValidators`
Always pass `{ runValidators: true }` to `findByIdAndUpdate` and similar methods. Mongoose only runs schema validators on `save()` by default, not on update methods.

### 🟢 Environment Variable Validation
Validate all required env vars in `config/env.js` at startup. Fail fast with a clear message rather than getting a cryptic error 10 minutes later when a specific code path is hit.

### 🟡 `trust proxy`
Set `app.set('trust proxy', 1)` if you're behind Nginx or any reverse proxy. Without it, `req.ip` gives the proxy's IP and rate limiting doesn't work per-user.

### 🟢 Cloudinary Upload Stream
When using Multer with `memoryStorage`, you get a `Buffer`, not a file path. Upload to Cloudinary using `upload_stream` and wrap it in a Promise:
```js
const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({...}, (err, result) => {
    if (err) reject(err); else resolve(result);
  });
  stream.end(buffer);
});
```

### 🟡 Vite Proxy vs Nginx Proxy
In development, configure Vite to proxy `/api` to your backend:
```js
// vite.config.js
export default { server: { proxy: { '/api': 'http://localhost:5000' } } }
```
In production (Docker), Nginx does the same job via `nginx.conf`. Never hardcode `http://localhost:5000` in frontend code — always use relative `/api` paths.

### 🟢 Seeding Admin
Run `node seed.js` only once. It's idempotent (uses `upsert`), but don't commit your real credentials — use environment variables or a `.env` file.

---

## License

MIT
