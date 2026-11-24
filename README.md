# Cloud Fullstack Typescript Project

> Database first, then API endpoints

### TODO

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

    - [ ] Write scripts/ratings_job.py (PySpark local mode)
        - [x] master("local[*]")
        - [x] Filter rating IN ('Good','OK','Poor')
        - dropDuplicates(["response_id"])
        - groupBy("rating").count()

    - Run the script and capture output (counts.show())

    - Verify: Spark output == manual count. If not, find why (duplicates? whitespace? case?)

    - Screenshot/paste code + input excerpt + output + verification into appendix

- Write the four explanations (~300-400 words):
    - What partitions are
    - Why Spark generally replaced Hadoop MapReduce
    - Why single-machine doesn't show distributed benefit
    - Whether Company A needs distributed processing at Table 1 scale (answer: no, and why

- [ ] vue frontend
    - input survey

- [ ] /api/export scheduled job to upload to XMDrive

### Learning debt

- error-handling middleware needed to for audit logs in express
- supertest, http api endpoints tests
- requestLogger()
- logger.ts
- app.ts

### Issues


### Future 

- Authorization/database
- Cloud proivder/solutions

### Requirements

- [x]  Accept rating (Good, ok, poor), reject other value 
- Saved valid response still present after app stopped and restarted (SQLite database / csv)
    - Just store locally on the user database
- Record request / application logs in 1/2 sentence (ex: python logging module)
- export stored response to .csv and upload to XMDrive or box.xmu.edu.my as shared copy for daily report

### Architecture

- Survey 
    - rating 
    - name
    - date created
    - id

- Log 
    - action "SENT, etc"
    - details "sending cum" 
    - date created
    - id

Layer 1: database
Layer 2: express backend 
Layer 3: frontend

### Tooling 

- Dataset PSQL  

- Drizzle ORM 

- Typescript backend, 
    - GET 	
    - POST 	
    - PUT 
    - DELETE 

- Typescript frontend
    - Vue framework 

- PySpark data preprocessing

> GFS, MapReduce, Bigquery


- Write a cloud deployment plan for the platform you recommended in Part B-I, identifying the proposed hosting service, storage service, configuration steps, access controls, and monitoring approach, and how the service would handle the campaign peak in Table 1. 

- Explain what would replace your local storage and the manual XMDrive upload in the cloud design. Clearly distinguish the features you demonstrated locally from those you only propose for the cloud.
