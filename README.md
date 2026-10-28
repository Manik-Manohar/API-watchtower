# API WatchTower

## What is this?

Think about all the apps you use — they usually depend on other services running in the background to work properly. For example, an app might need a weather service, a login service, or a payment service to respond correctly every time you use it.

The problem is: when one of those services quietly breaks or slows down, nobody usually notices right away — not until users start complaining.

**API WatchTower solves that.** It's a system that automatically checks a list of APIs on its own, again and again, without anyone needing to do it manually. It keeps track of whether each one is working, how fast it's responding, and it immediately flags anything that goes down — all shown on a simple live dashboard.

In short: it's a small, automated "health monitor" for APIs.

## How it works, step by step

1. A background process checks a list of APIs every 30 seconds, completely on its own
2. For each API, it records whether it responded successfully and how long it took
3. Every result gets saved, so there's a real history to look back on — not just the current moment
4. If an API fails, it's automatically logged as an alert
5. A dashboard shows all of this live — current status, response times, uptime history, and recent failures

## Tech stack, in plain terms

**Backend — the "brain" that does the checking**
- **Python + Flask** — runs the server. Think of it as the engine that listens for requests and sends back answers.
- **APScheduler** — a timer that runs quietly in the background, automatically triggering a check every 30 seconds, without anyone clicking anything.
- **Requests** — the tool that actually goes out and pings each API, the same way a browser would, and measures how long it takes to respond.
- **MySQL** — a database, basically a big organized notebook, where every check result and every failure gets written down and saved for later.

**Frontend — the part people actually look at**
- **React** — builds the dashboard as reusable pieces (a status card, a stat box, an alert entry), instead of one giant messy page.
- **Vite** — runs and builds the frontend quickly during development.
- **CSS** — handles how everything looks (colors, spacing, layout).

## Project structure

API-watchtower/
├── backend/
│ ├── main.py → Flask server and API routes
│ ├── services.py → List of monitored APIs + check logic
│ ├── database.py → MySQL connection + queries
│ ├── requirements.txt
│ └── .env → Local database settings (not shared or uploaded)
├── frontend/
│ ├── src/
│ │ ├── App.jsx → Main dashboard component
│ │ └── App.css → Dashboard styling
│ └── ...
└── README.md


## How to run it locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create a file named `.env` inside `backend/` (this stays on your own machine only — it's excluded from Git) and fill in your own local MySQL details:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your own MySQL password>
DB_NAME=watchtower


Create the database in MySQL:
```sql
CREATE DATABASE watchtower;
```

Set up the tables:
```bash
python database.py
```

Start the server:
```bash
python main.py
```
Backend runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Confirms the server is running |
| `GET /api/services` | Live status check of all monitored APIs |
| `GET /api/alerts` | List of all logged failure alerts |
| `GET /api/services/<id>/history?days=N` | Historical uptime data for one API |

## Monitored APIs

By default, the system monitors:
- JSONPlaceholder
- Open-Meteo Weather API
- GitHub API
- A deliberately broken endpoint (included to demonstrate failure detection and alerting)

