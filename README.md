# 🏙️ CivicFix — Civic Issue Reporting Platform

A beautiful, fully functional civic complaint management webapp built with React + Vite + Tailwind CSS.

## ✨ Features

- **User Auth** — Register, login, logout (stored in localStorage)
- **Report Issues** — 4-step wizard with photo upload, category selection, location tagging
- **Public Feed** — Browse all issues with search, filter by category/status, sort by newest/popular/trending
- **Issue Detail** — Full timeline tracker, upvoting, comments
- **Admin Dashboard** — View all complaints, update statuses, add notes, stats
- **Notifications** — Get notified when your issue status changes
- **Profile** — View your reports, badges, stats
- **Persistent Data** — All data saved in localStorage

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173
```

## 🔐 Demo Accounts

| Role    | Email                 | Password   |
|---------|-----------------------|------------|
| Citizen | arjun@example.com     | password   |
| Citizen | meera@example.com     | password   |
| Admin   | admin@civicfix.in     | admin123   |

> **Tip**: Use the "Demo Citizen" / "Demo Admin" quick-fill buttons on the login page!

## 📦 Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Syne (display) + DM Sans (body)
- **Data**: localStorage (swap for a real API/DB)

## 🗺️ Map Integration

The map UI is ready — to enable live maps:
1. Get a Google Maps API key at [console.cloud.google.com](https://console.cloud.google.com)
2. Or use Leaflet.js (free) with OpenStreetMap
3. Replace the map placeholder in `src/pages/ReportIssue.jsx` and `src/pages/IssueDetail.jsx`

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Navbar.jsx
│   ├── IssueCard.jsx
│   ├── StatCard.jsx
│   └── Toast.jsx
├── context/
│   └── AppContext.jsx  # Global state (auth, issues, notifications)
├── pages/
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Feed.jsx
│   ├── ReportIssue.jsx
│   ├── IssueDetail.jsx
│   ├── AdminDashboard.jsx
│   ├── Profile.jsx
│   └── Notifications.jsx
└── utils/
    └── helpers.js     # Categories, status config, time utils
```

## 🔧 To add a real backend

1. Replace `AppContext.jsx` API calls with `fetch()` / `axios` to your backend
2. Use JWT tokens for auth (store in httpOnly cookies)
3. PostgreSQL or MongoDB for data persistence
4. Cloudinary for photo uploads
5. Socket.io for real-time notifications

## 🎨 Design

- **Colors**: Deep Navy `#0f1729` + Flame Orange `#ff6b35`
- **Fonts**: Syne (headings) + DM Sans (body)
- **Aesthetic**: Modern civic/urban — bold, clean, professional

---

Built with ❤️ for better cities.
