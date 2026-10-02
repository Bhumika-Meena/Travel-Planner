# 🌍 Gamified Travel Planner

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0ea5e9&height=200&section=header&text=Gamified%20Travel%20Planner&fontSize=38&fontColor=FFFFFF&animation=fadeIn" alt="Travel Planner Banner" />
</p>

<p align="center">
  <strong>Plan smarter, explore further, and level up your adventures.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47a248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Zod-Validation-3e67b1?logo=zod" alt="Zod" />
  <img src="https://img.shields.io/badge/Tests-115%20Passing-brightgreen?logo=jest" alt="Jest Tests" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📌 Overview

**Gamified Travel Planner** is a full-stack web application designed to transform travel organization into an engaging journey. Built with **Next.js 14 App Router**, **TypeScript**, and **MongoDB**, it combines AI-driven itinerary suggestions, real-time messaging, behavior-based gamification, and robust production-grade engineering (strict Zod validation, JWT security, structured logging, and comprehensive automated test suites).

---

## ✨ Key Features

- **🎯 Smart Trip & Itinerary Planning**
  - Create and customize trips with destinations, dates, and activity checklists.
  - One-click **"View on Google Maps"** navigation for every destination and place.
  - Interactive status tracking: upcoming, active, and completed journeys.

- **🤖 Dual-Engine AI Recommendations**
  - **Google Gemini API**: Contextual destination recommendations tailored to preferences.
  - **Hugging Face (Mistral-7B)**: Intelligent place and activity suggestions generated dynamically.

- **🎮 Behavior-Driven Gamification Engine**
  - Earn points and XP for planning trips and completing itinerary milestones.
  - Tiered level progression (Explorer, Wanderer, Voyager, Pathfinder, Trailblazer, etc.).
  - Milestone badge unlock system with real-time feedback.
  - Competitive global leaderboard tracking top travelers.

- **💬 Real-Time Direct Messaging**
  - Event-driven 1-on-1 chat powered by a standalone **Socket.IO** server.
  - End-to-end JWT handshake authentication and persistent message history in MongoDB.
  - Real-time online/offline presence indicators.

- **🛡️ Enterprise Security & Validation**
  - Modern authentication via signed JWTs (`jose`) stored in secure HTTP-only cookies.
  - Password hashing with salted `bcryptjs` and email verification via 6-digit OTPs.
  - Edge-compatible Next.js Middleware route guarding for protected routes and APIs.
  - Strict **Zod** request body schemas with structured 400 error reporting.
  - In-memory rate limiting against brute-force and request abuse.

- **📊 Production Observability & Health Monitoring**
  - Structured application logging via **Pino** with automated credential redaction.
  - Dedicated `/api/health` monitoring endpoint with live MongoDB ping and latency tracking.

- **🖼️ Profile & Media Management**
  - Cloudinary CDN integration for profile photos with automatic fallback to local storage.
  - Client-side image cropping and sanitization.

---

## 🏗️ Architecture & Tech Stack

```
travel-planner/
├── src/
│   ├── app/                      # Next.js 14 App Router (Pages & API Routes)
│   │   ├── (auth)/               # login, register, verify-email, forgot-password, reset-password
│   │   ├── api/                  # RESTful API route handlers
│   │   │   ├── auth/             # Authentication & session endpoints
│   │   │   ├── chat/             # Chat conversations & token generation
│   │   │   ├── health/           # Public health check endpoint
│   │   │   ├── trips/            # Trip CRUD, suggestions & task completion
│   │   │   └── users/            # User profile, stats & leaderboard
│   │   ├── dashboard/            # User dashboard with stats & current trips
│   │   ├── my-trips/             # Past and active trip listings
│   │   ├── plan-trip/            # Trip builder with AI suggestions
│   │   ├── profile/              # User profile & settings
│   │   ├── leaderboard/          # Global gamification rankings
│   │   └── chat/                 # Direct messaging interface
│   ├── components/               # Reusable UI components & dashboard cards
│   ├── context/                  # React AuthContext & global state
│   ├── hooks/                    # Custom React hooks (e.g., useDashboard)
│   ├── lib/                      # Core backend utilities
│   │   ├── api-response.ts       # Standardized API response formatters
│   │   ├── auth.ts               # JWT sign & verify helpers (jose)
│   │   ├── env.ts                # Environment variable validation
│   │   ├── gamification.ts       # XP reward & badge calculation engine
│   │   ├── logger.ts             # Structured Pino logger with redactions
│   │   ├── mongodb.ts            # MongoDB connection singleton & indexes
│   │   ├── rateLimit.ts          # In-memory token bucket rate limiter
│   │   └── schemas.ts            # Zod validation schemas
│   ├── models/                   # Mongoose schemas & TypeScript interfaces
│   ├── utils/                    # Email dispatch & client validation helpers
│   ├── middleware.ts             # Next.js Edge route guard & session verifier
│   └── __tests__/                # Jest unit & integration test suites (115 tests)
├── chat-server.js                # Standalone Node.js Express + Socket.IO server
├── jest.config.ts                # Jest configuration with ts-jest & ESM
├── tsconfig.json                 # TypeScript compiler configuration
└── render.yaml                   # Infrastructure-as-code deployment config
```

### Technology Breakdown

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Heroicons, Framer Motion |
| **Backend** | Next.js API Route Handlers, Node.js, Express, Socket.IO |
| **Database** | MongoDB Atlas with native connection pool & compound/TTL indexes |
| **Validation** | Zod v3 |
| **Auth & Security** | `jose` (JWT), `bcryptjs`, HTTP-only cookies, Rate Limiting |
| **AI Services** | Google Gemini (`@google/generative-ai`), Hugging Face Inference |
| **Email Service** | Nodemailer with Gmail SMTP / local dev console fallback |
| **Media Storage** | Cloudinary CDN with local fallback |
| **Logging** | Pino & pino-pretty with sensitive field redaction |
| **Testing** | Jest, ts-jest, 115 passing tests across 9 suites |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or higher (Node 20 recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A running MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

### 1. Clone the Repository

```bash
git clone https://github.com/Bhumika-Meena/Travel-Planner.git
cd Travel-Planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in the configuration values:

| Variable | Description | Default / Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (**Required**) | `mongodb+srv://...` |
| `MONGODB_DB` | Database name | `travel_planner` |
| `JWT_SECRET` | 256-bit secret key for JWT signing (**min. 32 chars in prod**) | `your_secret_32_characters_minimum` |
| `NEXT_PUBLIC_APP_URL` | Application root URL | `http://localhost:3000` |
| `PORT` | Standalone chat server port | `3001` |
| `NEXT_PUBLIC_CHAT_SOCKET_URL` | Socket.IO endpoint URL | `http://localhost:3001` |
| `EMAIL_SERVER_USER` | Gmail address for OTPs/password reset | `your-email@gmail.com` |
| `EMAIL_SERVER_PASSWORD` | Google App Password (16 characters) | `your-app-password` |
| `GEMINI_API_KEY` | Google Gemini API key for recommendations | `AIza...` |
| `HUGGINGFACE_API_KEY` | Hugging Face token for AI suggestions | `hf_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional) | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) | `your_api_secret` |
| `LOG_LEVEL` | Pino logging level (`debug`, `info`, `warn`, `error`) | `info` |

> 💡 **Local Development Tip**: If email credentials are not set, OTP codes and password reset links are printed directly to the terminal for easy testing.

---

## 💻 Running the Application

### Start Development Server

Run the Next.js development server:

```bash
npm run dev
```

The web application will be available at [http://localhost:3000](http://localhost:3000).

### Start Real-Time Chat Server (Optional for messaging)

In a separate terminal, launch the standalone Socket.IO service:

```bash
npm run chat-server
```

The chat service will run on port `3001` (or your configured `PORT`).

---

## 🧪 Testing & Code Quality

The project includes an extensive test suite covering unit logic and API integration endpoints:

```bash
# Run all Jest test suites
npm test

# Run tests with code coverage report
npm run test:coverage

# Run ESLint validation
npm run lint

# Run TypeScript type check
npx tsc --noEmit
```

### Test Coverage Highlights
- **Auth Unit Tests**: JWT generation, expiration validation, signature verification, and secret strength enforcement.
- **Validation Tests**: Password complexity, RFC email rules, name sanitization, and Zod schemas.
- **Gamification Tests**: Point calculation engine, task rewards, level boundary math, and badge unlocks.
- **Integration Tests**: Mocked DB integration testing for `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/trips`, `/api/trips/[id]/complete-task`, and trip ownership security.

---

## 🚢 Production Deployment

### 1. Next.js Web App (Vercel or Render)
- Connect your GitHub repository to **Vercel** or **Render**.
- Set build command to `npm run build` and start command to `npm start`.
- Configure the environment variables listed in `.env.example`.
- Ensure `JWT_SECRET` is at least 32 characters long.

### 2. Standalone Chat Server (Render)
The repository includes a ready-to-use `render.yaml` and `Procfile` configured for dual deployment:
- **Build Command**: `npm install`
- **Start Command**: `node chat-server.js`
- Set `NEXT_PUBLIC_APP_URL` to your production frontend URL so CORS allows socket connections.

### 3. Health Checks
- Continuous deployment health checks can target `GET /api/health` to monitor uptime and database connectivity without credentials.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
