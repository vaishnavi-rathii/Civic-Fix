# CivicFix — Backend API

Express.js + Prisma + SQLite backend for the CivicFix civic issue reporting platform.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** SQLite (via Prisma ORM)
- **Auth:** JWT (7-day access tokens, `Authorization: Bearer <token>`)
- **File Uploads:** multer — saved to `uploads/` folder, served at `/uploads/<filename>`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run database migration (creates dev.db)
npx prisma migrate dev --name init

# 3. Seed demo data
node prisma/seed.js

# 4. Start dev server (with auto-restart on file changes)
npm run dev
```

Server runs at **http://localhost:5001**

## Demo Accounts (after seeding)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@civicfix.in      | admin123   |
| Citizen | arjun@example.com      | password   |
| Citizen | meera@example.com      | password   |

---

## API Reference

All responses use `{ error: "message" }` format on failure.

### Auth — `/api/auth`

#### `POST /api/auth/register`
Create a new citizen account.

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ravi Kumar","email":"ravi@example.com","password":"password123"}'
```

Response: `{ token, user }`

---

#### `POST /api/auth/login`

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@example.com","password":"password"}'
```

Response: `{ token, user }`

---

#### `GET /api/auth/me`
Requires `Authorization: Bearer <token>`

```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

Response: `{ user }` with issue/vote/comment counts

---

### Issues — `/api/issues`

#### `GET /api/issues`
List issues. Supports query params:
- `page` (default: 1), `limit` (default: 20, max: 50)
- `category` — POTHOLE | GARBAGE | STREETLIGHT | WATER_SUPPLY | DRAINAGE | ROAD_DAMAGE | PARK | OTHER
- `status` — OPEN | IN_REVIEW | IN_PROGRESS | RESOLVED | REJECTED
- `sort` — `newest` (default) | `popular`
- `search` — searches title, description, address

```bash
# Get all issues
curl http://localhost:5001/api/issues

# Filter by category and status
curl "http://localhost:5001/api/issues?category=POTHOLE&status=OPEN"

# Search
curl "http://localhost:5001/api/issues?search=pothole&sort=popular"

# Pagination
curl "http://localhost:5001/api/issues?page=2&limit=10"
```

Response: `{ data: Issue[], meta: { total, page, limit, totalPages, hasNext, hasPrev } }`

---

#### `GET /api/issues/:id`
Single issue with timeline (status history).

```bash
curl http://localhost:5001/api/issues/<issue-id>
```

Response: `{ issue }` — includes `voteCount`, `commentCount`, `userVoted`, `timeline`, `author`

---

#### `POST /api/issues`
Create a new issue. Requires auth. Accepts `multipart/form-data` for photos.

```bash
# Without photo
curl -X POST http://localhost:5001/api/issues \
  -H "Authorization: Bearer <token>" \
  -F "title=Broken street light on main road" \
  -F "description=The street light near the bus stop has not been working for 2 weeks. Very unsafe at night." \
  -F "category=STREETLIGHT" \
  -F "latitude=28.6304" \
  -F "longitude=77.2177" \
  -F "address=Bus Stop, Connaught Place, New Delhi"

# With a photo
curl -X POST http://localhost:5001/api/issues \
  -H "Authorization: Bearer <token>" \
  -F "title=Pothole on Ring Road" \
  -F "description=Large pothole causing traffic hazard near the flyover" \
  -F "category=POTHOLE" \
  -F "latitude=28.6200" \
  -F "longitude=77.2050" \
  -F "address=Ring Road near Moti Bagh flyover, New Delhi" \
  -F "photos=@/path/to/photo.jpg"
```

Response: `{ issue }` with `photos` as array of `/uploads/<filename>` paths

---

#### `POST /api/issues/:id/vote`
Toggle upvote. Requires auth. Calling again removes the vote.

```bash
curl -X POST http://localhost:5001/api/issues/<issue-id>/vote \
  -H "Authorization: Bearer <token>"
```

Response: `{ voteCount: 5, userVoted: true }`

---

#### `GET /api/issues/:id/comments`

```bash
curl "http://localhost:5001/api/issues/<issue-id>/comments?page=1&limit=20"
```

Response: `{ data: Comment[], meta }`

---

#### `POST /api/issues/:id/comments`
Requires auth.

```bash
curl -X POST http://localhost:5001/api/issues/<issue-id>/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"body":"This is really dangerous, needs urgent attention!"}'
```

Response: `{ comment }` with author info

---

### Admin — `/api/admin`
All routes require `Authorization: Bearer <admin-token>` (admin@civicfix.in / admin123)

#### `GET /api/admin/stats`

```bash
curl http://localhost:5001/api/admin/stats \
  -H "Authorization: Bearer <admin-token>"
```

Response:
```json
{
  "totalIssues": 10,
  "totalUsers": 3,
  "byStatus": { "OPEN": 4, "IN_PROGRESS": 2, "RESOLVED": 1, "IN_REVIEW": 2, "REJECTED": 1 },
  "byCategory": { "POTHOLE": 1, "GARBAGE": 1, "STREETLIGHT": 2, ... }
}
```

---

#### `GET /api/admin/issues`
All issues with author info. Supports same query params as public list plus higher `limit` (up to 100).

```bash
curl "http://localhost:5001/api/admin/issues?status=OPEN" \
  -H "Authorization: Bearer <admin-token>"
```

---

#### `PATCH /api/admin/issues/:id/status`
Update issue status. Creates a StatusHistory entry.

```bash
curl -X PATCH http://localhost:5001/api/admin/issues/<issue-id>/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","note":"Work order issued to PWD department. Team dispatched."}'
```

Response: `{ issue, historyEntry }`

---

### Health Check

```bash
curl http://localhost:5001/api/health
```

---

## Uploaded Files

Photos are saved to `server/uploads/` and served at:
```
http://localhost:5001/uploads/<filename>
```

The `photos` field on issues is an array of these paths, e.g. `["/uploads/1234567890-123456.jpg"]`.

## Valid Values

**Categories:** `POTHOLE` | `GARBAGE` | `STREETLIGHT` | `WATER_SUPPLY` | `DRAINAGE` | `ROAD_DAMAGE` | `PARK` | `OTHER`

**Statuses:** `OPEN` | `IN_REVIEW` | `IN_PROGRESS` | `RESOLVED` | `REJECTED`
