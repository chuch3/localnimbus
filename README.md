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
        - [ ] GET /api/survey/:id (lookup survey by ID)
        - [ ] GET /api/export (get .csv to send to XMDrive)
        - [ ] GET /api/stats (daily reports)
        - [ ] GET /api/health (for providers)
    - [x] error-handling middleware needed to for audit logs in express

    - [ ] Supertest for app.ts, asserting access-log per requests with 
    correct audit events (valid/invalid)
    - [ ] Logger.test, select mocks for auditlogs

- [ ] pyspark valijdation
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
