# CivicFix — Civic Issue Reporting Platform

A civic issue reporting platform built with React 18 + Vite + Tailwind CSS. Citizens report local infrastructure problems, track their status, and engage with the community — backed by AI-powered tools.

Built as part of the **Design Thinking and Innovation** course at Bennett University, 2025.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Routing**: React Router v6
- **Maps**: Leaflet + React Leaflet + Nominatim (free, no API key)
- **Icons**: Lucide React
- **State / Persistence**: React Context + localStorage
- **AI Features**: Rule-based simulator (works offline, no API key needed)
- **Fonts**: Syne (display) + DM Sans (body) via Google Fonts

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173` by default.

---

## Demo Accounts

| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Citizen | arjun@example.com   | password  |
| Admin   | admin@civicfix.in   | admin123  |

> Admins cannot self-register. Admin accounts are pre-seeded only.  
> Citizens register normally via the Register page.

---

## Features

### Phase 1 — Core Reporting

- **4-step report wizard**: Category → Details → Location → Review
- **Photo upload** with AI auto-analysis (problem type, severity, confidence)
- **Voice input** via Web Speech API — transcript cleaned by AI
- **AI Issue Analysis** — suggests category, severity, urgency, responsible department, and generates a formal complaint letter
- **Real GPS location** — `Use My Location` button using `navigator.geolocation`, Nominatim reverse geocoding, draggable Leaflet map marker that re-geocodes on drag
- **Issue Feed** — sortable by newest / most upvoted / trending, AI-powered natural language search
- **Status tracking** — Reported → In Review → In Progress → Resolved / Rejected
- **Upvotes and comments** per issue

### Phase 2 — Admin & AI Insights

- **Admin Dashboard** — full issue management table (search, filter, status updates with notes)
- **AI City Health Score** — circular progress indicator, narrative, label (Poor/Fair/Good/Excellent)
- **Priority Actions** — 5-item ranked admin action list
- **Problem Hotspots** — top 3 problem areas by issue density
- **Sentiment Pulse** — overall citizen sentiment + frustrated complaint list + suggested response
- **AI Resolution Suggester** — per-issue: root cause, action plan, department, budget range, draft citizen response
- **Letter Generator** — formal complaint drafting in Indian government format, Hindi translation, PDF download, WhatsApp share
- **AI City Predictor** (Landing page) — enter any locality to get civic score, top issues, monsoon risks
- **Notifications** — in-app alerts on status changes, mark as read
- **User Profile** — reported issues, resolved count, earned badges

### Phase 3 — Polish & Demo-Ready

- **Duplicate Issue Warning Modal** — on submit, checks if the same category was filed in the last 7 days
- **AI Duplicate Detector** — title/description similarity check on step 3 of the report wizard
- **Impact Section on Profile** — citizen rank badge (Newcomer → Active Citizen → Community Hero → City Champion)
- **Enhanced Status Timeline** — icon per status, timestamp, admin note, pulsing current-status ring
- **Copy Link + Print Report** buttons on every issue detail page
- **Redesigned Login/Register** — dark navy card design, Citizen/Admin pill toggle
- **Clean Feed empty state** — "No issues yet. Be the first to report one!"

---

## Project Structure

```
src/
├── components/       # Navbar, IssueCard, AIBadge, AIChatbot, Toast, etc.
├── context/          # AppContext — global state (issues, users, auth)
├── lib/              # claude.js — AI simulator (rule-based, works offline)
├── pages/            # Landing, Login, Register, Feed, ReportIssue,
│                     # IssueDetail, AdminDashboard, Profile, Notifications,
│                     # LetterGenerator
└── utils/            # helpers.js — CATEGORIES, STATUS_CONFIG, timeAgo
```

---

## Team

Made by students of Bennett University for the DTI course, 2025.
