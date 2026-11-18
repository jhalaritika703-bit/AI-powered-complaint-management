# ComplaintDesk: AI-powered complaint management (MERN + Gemini)

Customers submit a complaint. Gemini categorizes it, sets a priority, summarizes it and drafts a polite reply.
Everything is stored in MongoDB. An admin dashboard filters complaints and updates their status.

## Folder structure

```
complaint-mvp/
├── package.json              # root scripts: setup, dev, test, build
├── server/                   # Express API
│   ├── .env.example          # copy to .env and fill in
│   ├── src/
│   │   ├── server.js         # entry: loads env, connects DB, starts app
│   │   ├── app.js            # Express app (middleware + routes)
│   │   ├── constants.js      # categories, priorities, statuses
│   │   ├── validators.js     # Zod schemas: request input AND Gemini output
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── models/Complaint.js
│   │   ├── services/gemini.js        # Gemini call + response validation
│   │   ├── controllers/complaintController.js
│   │   ├── routes/complaints.js
│   │   └── middleware/errorHandler.js
│   └── tests/                # node:test, no DB or API key needed
└── client/                   # React + Vite
    ├── vite.config.js        # proxies /api to http://localhost:5000
    └── src/
        ├── main.jsx, App.jsx, api.js, constants.js, styles.css
        ├── components/       # Badge, Spinner, ErrorMessage, AnalysisCard
        └── pages/            # SubmitComplaint, Dashboard, ComplaintDetail
```

## Setup (Node 20.19+ or 22+)

1. Get a free Gemini key at https://aistudio.google.com/apikey
2. Have MongoDB running locally, or create a free Atlas cluster and copy its connection string.
3. Run:

```bash
npm install            # installs "concurrently" at the root
npm run setup          # installs server and client dependencies
cp server/.env.example server/.env     # Windows: copy server\.env.example server\.env
# edit server/.env: set MONGODB_URI and GEMINI_API_KEY
npm run dev            # API on :5000, app on http://localhost:5173
```

Or use two terminals: `cd server && npm run dev` and `cd client && npm run dev`.

## API

| Method | Route | Body / query | Notes |
|---|---|---|---|
| POST | `/api/complaints` | `{customerName, email, description}` | Validates, calls Gemini, saves, returns `{complaint}` |
| GET | `/api/complaints` | `?category=&priority=&status=` | Newest first, max 200 |
| GET | `/api/complaints/stats` | | Counters for the dashboard |
| GET | `/api/complaints/:id` | | One complaint with analysis and status history |
| PATCH | `/api/complaints/:id/status` | `{status}` | `Pending`, `In Progress` or `Resolved` |
| POST | `/api/complaints/:id/reanalyze` | | Retries Gemini (used when analysis failed) |
| GET | `/api/health` | | Liveness check |

Errors always look like `{ "error": { "message": "...", "details": [...] } }`.

## Test it

Automated (no DB or key needed): `npm test`

Smoke test with curl (needs MongoDB and a Gemini key):

```bash
curl -s localhost:5000/api/health

curl -s -X POST localhost:5000/api/complaints -H "Content-Type: application/json" \
  -d '{"customerName":"Asha Verma","email":"asha@example.com","description":"I was charged twice for order #4821 and nobody has replied to my two emails. I need this fixed today."}'
# expect 201, category Payment, priority High, aiStatus "success"

curl -s "localhost:5000/api/complaints?priority=High"
curl -s -X PATCH localhost:5000/api/complaints/<ID>/status -H "Content-Type: application/json" -d '{"status":"In Progress"}'
```

Manual checklist:
- [ ] Submit with empty fields shows inline errors, nothing is sent
- [ ] Valid submit shows a spinner, then the category, priority, summary and suggested reply
- [ ] The document appears in MongoDB (`complaints` collection) with `analysis` filled in
- [ ] Dashboard lists it; each filter and "Clear filters" work; sorting by priority works
- [ ] Detail page: status buttons update the status and add a history entry
- [ ] Stop the backend: the dashboard shows an error with "Try again"
- [ ] Set a wrong `GEMINI_API_KEY`: the complaint is still saved, the customer sees the manual-review notice, and the admin can use "Run AI analysis" once the key is fixed

## Design decisions (for the presentation)

- **Gemini returns structured JSON** (`responseMimeType` + a JSON schema), and the server re-validates it with Zod, so an unexpected category or malformed output is never saved or shown.
- **AI failure never loses a complaint.** It is saved with `aiStatus: "failed"` and can be re-analyzed.
- **Prompt-injection hardening.** Complaint text is wrapped in delimiters and the system prompt says to treat it as data only.
- **Secrets stay on the server.** The browser only talks to `/api`.
- **Rate limit** on AI routes (10/min per IP) protects the free Gemini quota.
- **Query filters are validated against enums**, so Mongo operators cannot be injected through the URL.

## Known limitations (say these before a judge asks)

- No authentication: `/admin` is open. Production needs a login and admin-only routes.
- The customer sees the AI-suggested reply because the brief asks for it; in production, show it only to staff.
- No email sending (the "Reply by email" button opens the admin's mail client).
- List is capped at 200 complaints with no pagination.
- Complaints without an analysis don't appear when a category or priority filter is active.
