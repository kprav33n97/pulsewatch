# PulseWatch

Website & API uptime monitoring. Add a URL, and PulseWatch checks it every 30 seconds and records availability and response time.

## Architecture

    React (Vite, :5173)  --/api-->  Express API (:4000)  -->  SQLite file
                                      └─ checker loop (every 30s)

## Run locally (WSL / Linux)

Requires Node.js 22.13+ (use nvm).

    # terminal 1: backend
    cd backend && npm install && npm start

    # terminal 2: frontend
    cd frontend && npm install && npm run dev

Open http://localhost:5173

## API

| Method | Path | Purpose |
|---|---|---|
| GET | /health | liveness check |
| GET | /api/monitors | list monitors with latest status |
| POST | /api/monitors | add `{name, url}` |
| DELETE | /api/monitors/:id | delete |
| POST | /api/monitors/:id/check | check now |
| GET | /api/monitors/:id/checks | last 100 checks |
| GET | /api/stats | dashboard counts |

## Config (backend/.env.example)

PORT, DB_PATH, CHECK_INTERVAL_SECONDS
