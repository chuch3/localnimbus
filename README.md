# LocalNimbus

> A full-stack survey platform built with a TypeScript/Express API, a Vue frontend, audit logging, CSV export for XMDrive, and a PySpark validation layer for distributed data processing concepts.

---

## Overview

This project is a survey collection platform that accepts ratings, stores them persistently, logs every request for auditability, and exports responses as CSV for daily reporting. It is built for cloud-native architecture where the local implementation demonstrates the database -> API -> frontend stack, while the cloud design proposes how the same system would scale using managed hosting, object storage, and scheduled jobs.

---

## Features

- **Survey intake**: accepts `Good`, `OK`, `Poor`; rejects anything else.
- **Persistent storage**: valid responses survive app restarts (SQLite locally).
- **Audit logging**: every request/action recorded in 1–2 sentences with action, outcome, and timestamp.
- **CSV export**: stored responses exported and uploaded to XMDrive / `box.xmu.edu.my` as a shared daily report.
- **Daily stats**: `/api/stats` endpoint for reporting.
- **Health check**: `/api/health` for provider monitoring.
- **PySpark validation**: a local-mode job that filters, deduplicates, and counts ratings, verified against a manual trace.

---

## Architecture

```
┌─────────────────┐
│   Vue Frontend  │  TypeScript
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│ Express Backend │  TypeScript (HTTP handling only)
└────────┬────────┘
         │ Drizzle ORM
┌────────▼────────┐
│   PostgreSQL    │  (PSQL)
└─────────────────┘
```

**Architectural Layers:**

1. **Database**: PSQL, accessed via Drizzle ORM.
2. **Express backend**: TypeScript, responsible only for HTTP handling.
3. **Frontend**: Vue framework

### Data Models
**Survey**

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `rating` | `Good` / `OK` / `Poor` |
| `name` | Respondent name |
| `date created` | Timestamp |

**Log**

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `action` | e.g. `SENT` |
| `details` | e.g. `sending cum` |
| `date created` | Timestamp |


---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/survey` | Receive a survey submission from the view |
| `GET` | `/api/survey/:id` | Look up a survey by ID |
| `GET` | `/api/export` | Get `.csv` to send to XMDrive |
| `GET` | `/api/stats` | Daily reports |
| `GET` | `/api/health` | Health check for providers |


## Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL (PSQL) |
| ORM | Drizzle ORM |
| Backend | TypeScript + Express |
| Frontend | TypeScript + Vue |
| Data preprocessing | PySpark (local mode) |
| Concepts explored | GFS · MapReduce · BigQuery |


---

## 🧪 Tests

| Test | Coverage |
|------|----------|
| API endpoints | `POST /api/survey`, `GET /api/survey/:id`, `GET /api/export`, `GET /api/stats`, `GET /api/health` |
| `Supertest` (`app.ts`) | Asserts access-log per request with correct audit events (valid/invalid) |
| `Logger.test` | Select mocks for `auditlogs` |
| Error-handling middleware | Ensures failed requests are captured in audit logs |

---

## Todo 

- Need more innovation or write on your own 
    - [ ] implement the old HDFS & Hive server 
    - [ ] /api/export allow change of upload size for XMDrive

- [x] crud logic index.ts
- [x] server audit logs & response logs
    - auditlogs()
        - select logtable order by createdat
        - filter action, outcome, logId
- backend 
    - express only for HTTP handling
    - API endpoint: 
        - [x] POST /api/survey (receive from view)
        - [x] GET /api/survey/:id (lookup survey by ID)
        - [x] GET /api/export (get .csv to send to XMDrive)
        - [x] GET /api/stats (daily reports)
        - [x] GET /api/health (for providers)

- Tests
    - API Endpoints
        - [x] POST /api/survey (receive from view)
        - [x] GET /api/survey/:id (lookup survey by ID)
        - [x] GET /api/export (get .csv to send to XMDrive)
        - [x] GET /api/stats (daily reports)
        - [x] GET /api/health (for providers)

    - [x] error-handling middleware needed to for audit logs in express

    - [x] Supertest for app.ts, asserting access-log per requests with 
    correct audit events (valid/invalid)
    - [x] Logger.test, select mocks for auditlogs

- /api/export Scheduled job when exporting .csv to XMDrive
    - [ ] manually upload daily report csv

- [ ] Database authorization
    - [source](https://www.grizzlypeaksoftware.com/library/expressjs-middleware-patterns-authentication-and-authorization-e0hbci84) 
- [ ] vue frontend
    - input survey
    - output survey received
    - database page to login and interact with APIs

- [ ] Firebase Setup

- Pyspark valijdation
    - [x] Create responses_synthetic.csv
        - ≥30 rows
        - Include a few duplicates (same response_id twice)
        - Include a few invalid ratings (Gd, Excellent, empty)
        - Realistic mix of Good/OK/Poor

    - [ ] Manual trace of Table 2 (written, in report)
        - List excluded records and why (r11 Gd invalid; r07 duplicate)
        - Map output pairs (rating, 1)
        - Shuffle/grouped values
        - Reduce output: Good=5, OK=3, Poor=2, Total=10
        - Verify totals (12 − 2 excluded = 10)

    - [x] Manual count of the ≥30-row CSV (spreadsheet or by hand)
        - Write down the Good/OK/Poor totals
        - by `analysis.py`

    - [x] Write scripts/ratings_job.py (PySpark local mode)
        - [x] master("local[*]")
        - [x] Filter rating IN ('Good','OK','Poor')
        - [x] dropDuplicates(["response_id"])
        - [x] groupBy("rating").count()

    - [ ] Run the script and capture output (counts.show())

    - [ ] Verify: Spark output == manual count. If not, find why (duplicates? whitespace? case?)

    - [ ] Screenshot/paste code + input excerpt + output + verification into appendix

- [ ] Write the four explanations (~300-400 words):
    - What partitions are
    - Why Spark generally replaced Hadoop MapReduce
    - Why single-machine doesn't show distributed benefit
    - Whether Company A needs distributed processing at Table 1 scale (answer: no, and why

### Learning debt

- error-handling middleware needed to for audit logs in express
- supertest, http api endpoints tests
- requestLogger()
- logger.ts
- app.ts


---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 chch

























