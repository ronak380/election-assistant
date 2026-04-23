# 🗳️ ElectionGuide — AI-Powered Election Assistant

> **Prompt Wars Hackathon Submission** — An interactive, AI-powered civic education platform helping Indian citizens navigate the election process with confidence.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-blue?logo=google)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps-JS_SDK-green?logo=google-maps)](https://developers.google.com/maps)
[![Cloud Run](https://img.shields.io/badge/Deployed_on-Cloud_Run-blue?logo=google-cloud)](https://cloud.google.com/run)

---

## 📋 Overview

**ElectionGuide** is a production-ready web application that empowers Indian voters through:

- 🤖 **AI Election Assistant** — Gemini 2.5-powered chatbot answering voter registration, EVM, VVPAT, ECI, and polling station questions
- 📋 **Interactive Election Timeline** — Animated, expandable cards walking through every phase from candidate filing to certification
- 🗺️ **Polling Station Locator** — Google Maps integration with live geolocation, geofencing alerts when you're within 500m of a polling booth
- 🔔 **Push Notifications** — Firebase Cloud Messaging (FCM) for election deadline reminders
- 🔐 **Google Sign-In** — Firebase Authentication for personalised chat history

---

## 🚀 Tech Stack & Google SDKs

| Service | SDK / Package | Purpose |
|---|---|---|
| **Gemini AI** | `@google/generative-ai` | AI chatbot with 3-model fallback chain |
| **Google Maps** | `@googlemaps/js-api-loader` + `@vis.gl/react-google-maps` | Interactive polling station map |
| **Firebase Auth** | `firebase/auth` | Google Sign-In for users |
| **Firestore** | `firebase-admin/firestore` | Chat history persistence |
| **Firebase Admin** | `firebase-admin` | Server-side token verification |
| **FCM** | `firebase-admin/messaging` + `firebase/messaging` | Push notification reminders |
| **GA4 + GTM** | `gtag` via GTM snippet | User behaviour analytics |
| **Cloud Run** | Docker + `cloudbuild.yaml` | Production deployment |

---

## ✨ Key Features

### AI Chatbot
- Gemini **2.5-flash → 2.0-flash → 1.5-flash** automatic fallback chain
- **In-memory LRU cache** (50 entries) — repeated questions skip the API entirely
- **History trimming** — only last 3 turns sent to stay within free-tier token limits
- Server-side rate limiter (50 req/min per IP) with `X-RateLimit-*` headers

### Security
- Full **Content Security Policy (CSP)** via Next.js Edge Middleware
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- Firebase ID token verification on all authenticated API routes
- Admin credentials never exposed to the client

### Accessibility (WCAG 2.1)
- Skip navigation link, `aria-live` regions, `aria-expanded`, `role="log"`
- All interactive elements keyboard navigable
- Reduced motion support (`prefers-reduced-motion`)
- Semantic HTML5 throughout

### Performance
- Static asset caching (1 year, immutable)
- Fluid typography with `clamp()`
- Glassmorphism UI with CSS custom properties
- `IntersectionObserver` for scroll-triggered animations

---

## 🛠️ Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd election-assistant
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your values — see .env.local.example for full documentation
```

**Required keys:**
- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/app/apikey) (free)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — from [GCP Console](https://console.cloud.google.com/)
- Firebase client SDK keys — from [Firebase Console](https://console.firebase.google.com/)
- Firebase Admin SDK credentials — from GCP Service Account JSON

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run linting
npm run lint
```

### Test Coverage

| File | Tests |
|---|---|
| `geofence.ts` | Haversine distance, geofence detection, nearby search |
| `election-data.ts` | Phase ordering, required fields, FAQ integrity |
| `analytics.ts` | GA4 event tracking, gtag mocking |
| `gemini.ts` | Cache hits, fallback chain, history trimming |
| `/api/chat` | Validation, rate limit headers, auth, error handling |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # Gemini proxy with rate limiting
│   │   ├── history/route.ts     # Firestore chat history CRUD
│   │   └── notify/route.ts      # FCM push notification sender
│   ├── assistant/page.tsx       # AI chatbot page
│   ├── locator/page.tsx         # Polling station map page
│   ├── timeline/page.tsx        # Election timeline page
│   ├── globals.css              # Design system + CSS custom properties
│   └── layout.tsx               # Root layout (GTM, GA4, fonts)
├── components/
│   ├── ElectionChatbot.tsx      # AI chat UI component
│   ├── ElectionTimeline.tsx     # Animated timeline component
│   ├── Navbar.tsx               # Responsive navbar with auth
│   └── PollingLocator.tsx       # Google Maps component
├── lib/
│   ├── gemini.ts                # Gemini SDK + cache + fallback
│   ├── geofence.ts              # Haversine distance + geofencing
│   ├── election-data.ts         # Static phase/FAQ data
│   ├── analytics.ts             # GA4 event helpers
│   ├── firebase.ts              # Firebase client SDK singleton
│   └── firebase-admin.ts        # Firebase Admin SDK singleton
├── middleware.ts                # CSP + security headers (Edge)
└── __tests__/                   # Jest test suite (5 test files)
```

---

## 🐳 Docker / Cloud Run Deployment

```bash
# Build the Docker image
docker build -t election-assistant .

# Run locally
docker run -p 3000:3000 --env-file .env.local election-assistant

# Deploy to Cloud Run (uses cloudbuild.yaml)
gcloud builds submit --config cloudbuild.yaml
```

---

## 🔑 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat` | Optional | Send message to Gemini, get AI reply |
| `GET` | `/api/history` | Required | Fetch user's chat history from Firestore |
| `POST` | `/api/history` | Required | Save message pair to Firestore |
| `POST` | `/api/notify` | Required | Send FCM push notification |

---

## 📊 Scoring Highlights

| Criterion | Implementation |
|---|---|
| **Codebase quality** | TypeScript strict, JSDoc on all functions, ESLint + Husky pre-commit |
| **Test coverage** | 5 test files, 50+ assertions across all utility and API layers |
| **Accessibility** | WCAG 2.1 AA — skip links, aria-live, aria-expanded, keyboard nav |
| **Security** | CSP, X-Frame-Options, rate limiting, Firebase token verification |
| **Google services** | Gemini, Maps, Firebase Auth, Firestore, FCM, GA4, GTM, Cloud Run |
| **Performance** | Response caching, static asset headers, fluid typography |
| **Observability** | Structured JSON logging for Google Cloud Logging integration |

---

## 📊 BigQuery Analytics & Scaling

### BigQuery Integration
The application is pre-configured for BigQuery analytics. See `bigquery-schema.json` for the data structure. You can export:
- AI Chat topic distribution
- Cache efficiency metrics
- Regional interest (via anonymised locator searches)

### Scaling on Cloud Run
- **Concurrency**: Set to 80 (default) to handle high-traffic spikes.
- **CPU Allocation**: "Always allocated" recommended for minimum cold-start latency.
- **Global Deployment**: Use [Cloud Run Global Load Balancing](https://cloud.google.com/run/docs/configuring/load-balancing) to serve Indian users from the `asia-south1` (Mumbai) region for sub-100ms latency.

---

## 📄 License

MIT — Built for the Prompt Wars Hackathon.
