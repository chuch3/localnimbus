import app from "../src/app";
import { db } from "../src/db";
import request from "supertest";
import {
    getDailyRatingCounts,
    getAllResponses,
    getResponseByID,
    createResponse,
    pingDB,
} from "../src/index";

jest.mock("../src/db", () => ({
    db: { insert: jest.fn() },
    schema: { logTable: {} },
}));

jest.mock("../src/index", () => ({
    createResponse: jest.fn(),
    getAllResponses: jest.fn(),
    getDailyRatingCounts: jest.fn(),
    getResponseByID: jest.fn(),
    pingDB: jest.fn(),
}));

const mockInsert = db.insert as jest.Mock;
const mockValues = jest.fn();

const mockCreateResponse = jest.mocked(createResponse);
const mockGetAllResponses = jest.mocked(getAllResponses);
const mockGetDailyRatingCounts = jest.mocked(getDailyRatingCounts);
const mockGetResponseByID = jest.mocked(getResponseByID);
const mockPingDB = jest.mocked(pingDB);

beforeEach(() => {
    jest.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    mockPingDB.mockResolvedValue(undefined);
});

function loggedRows(): Array<Record<string, unknown>> {
    return mockValues.mock.calls.map(([row]) => row as Record<string, unknown>);
}
const auditRows = () => loggedRows().filter((r) => r.action !== "HTTP_REQUEST");
const accessRows = () =>
    loggedRows().filter((r) => r.action === "HTTP_REQUEST");

describe("POST /api/survey", () => {
    it("accepts a valid rating and logs SURVEY_CREATED", async () => {
        mockCreateResponse.mockResolvedValue({
            survey_id: 1,
            rating: "Good",
            created_at: new Date(),
        });

        const res = await request(app)
            .post("/api/survey")
            .send({ rating: "Good" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ survey_id: 1, rating: "Good" });
        expect(mockCreateResponse).toHaveBeenCalledWith("Good");
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_CREATED",
                outcome: "success",
                detail: expect.stringContaining('rating="Good"'),
            }),
        ]);
        expect(accessRows()).toHaveLength(1);
    });

    it("rejects an invalid rating and logs SURVEY_REJECTED", async () => {
        const res = await request(app)
            .post("/api/survey")
            .send({ rating: "Excellent" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: "Rating must be one of: Good, OK, Poor",
            received: "Excellent",
        });
        expect(mockCreateResponse).not.toHaveBeenCalled();
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_REJECTED",
                outcome: "rejected",
            }),
        ]);
    });

    it("rejects a missing rating", async () => {
        const res = await request(app).post("/api/survey").send({});
        expect(res.status).toBe(400);
        expect(res.body.received).toBeNull();
    });

    it("returns 500 and logs SURVEY_CREATED failure when insert fails", async () => {
        mockCreateResponse.mockRejectedValue(new Error("insert failed"));

        const res = await request(app)
            .post("/api/survey")
            .send({ rating: "OK" });

        expect(res.status).toBe(500);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_CREATED",
                outcome: "failure",
                detail: expect.stringContaining("insert failed"),
            }),
        ]);
    });
});

describe("GET /api/survey:id", () => {
    it("returns a survey and logs SURVEY_LOOKOUT", async () => {
        mockGetResponseByID.mockResolvedValue([
            {
                survey_id: 7,
                rating: "Good",
                created_at: new Date("2026-11-21T00:00:00.000Z"),
            },
        ]);

        const res = await request(app).get("/api/survey/7");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            survey_id: 7,
            rating: "Good",
            created_at: "2026-11-21T00:00:00.000Z",
        });

        expect(mockGetResponseByID).toHaveBeenCalledWith(7);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_LOOKUP",
                outcome: "success",
            }),
        ]);
    });

    it("returns 404 and logs SURVEY_LOOKUP rejected when missing", async () => {
        mockGetResponseByID.mockResolvedValue([]);

        const res = await request(app).get("/api/survey/999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Survey not found" });
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_LOOKUP",
                outcome: "rejected",
            }),
        ]);
    });

    it.each(["abc", "0", "-1", "1.5"])("rejects invalid id %s", async (id) => {
        const res = await request(app).get(`/api/survey/${id}`);

        expect(res.status).toBe(400);
        expect(mockGetResponseByID).not.toHaveBeenCalled();
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_LOOKUP",
                outcome: "rejected",
            }),
        ]);
    });

    it("returns 500 and logs SURVEY_LOOKUP failure when query fails", async () => {
        mockGetResponseByID.mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/survey/1");

        expect(res.status).toBe(500);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "SURVEY_LOOKUP",
                outcome: "failure",
            }),
        ]);
    });
});

describe("GET /api/export", () => {
    it("returns CSV and logs CSV_EXPORTED success", async () => {
        mockGetAllResponses.mockResolvedValue([
            {
                survey_id: 1,
                rating: "Good",
                created_at: new Date("2026-11-21T01:02:03.000Z"),
            },
            {
                survey_id: 2,
                rating: "Poor",
                created_at: new Date("2026-11-21T04:05:06.000Z"),
            },
        ]);

        const res = await request(app).get("/api/export");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("attachment");
        expect(res.text.split("\n")).toEqual([
            "survey_id,rating,created_at",
            '"1","Good","2026-11-21T01:02:03.000Z"',
            '"2","Poor","2026-11-21T04:05:06.000Z"',
        ]);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "CSV_EXPORTED",
                outcome: "success",
                detail: "Exported 2 survey rows",
            }),
        ]);
    });

    it("returns a header-only CSV when there are no responses", async () => {
        mockGetAllResponses.mockResolvedValue([]);

        const res = await request(app).get("/api/export");

        expect(res.status).toBe(200);
        expect(res.text).toBe("survey_id,rating,created_at");
    });

    it("returns 500 and logs CSV_EXPORTED failure when query fails", async () => {
        mockGetAllResponses.mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/export");

        expect(res.status).toBe(500);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "CSV_EXPORTED",
                outcome: "failure",
            }),
        ]);
    });
});

describe("GET /api/stats", () => {
    it("pivots daily rating counts", async () => {
        mockGetDailyRatingCounts.mockResolvedValue([
            { day: "2026-11-20", rating: "Good", count: 2 },
            { day: "2026-11-20", rating: "OK", count: 1 },
            { day: "2026-11-21", rating: "Poor", count: 4 },
        ]);

        const res = await request(app).get("/api/stats");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            days: [
                { date: "2026-11-20", Good: 2, OK: 1, Poor: 0, total: 3 },
                { date: "2026-11-21", Good: 0, OK: 0, Poor: 4, total: 4 },
            ],
        });
    });

    it("returns empty days when there is no data", async () => {
        mockGetDailyRatingCounts.mockResolvedValue([]);

        const res = await request(app).get("/api/stats");

        expect(res.body).toEqual({ days: [] });
    });

    it("returns 500 and logs STATS_VIEWED failure when query fails", async () => {
        mockGetDailyRatingCounts.mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/stats");

        expect(res.status).toBe(500);
        expect(auditRows()).toEqual([
            expect.objectContaining({
                action: "STATS_VIEWED",
                outcome: "failure",
            }),
        ]);
    });
});

describe("GET /api/health", () => {
    it("returns ok when the DB responds", async () => {
        const res = await request(app).get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({ status: "ok" }));
    });

    it("returns 503 when the DB is down", async () => {
        mockPingDB.mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/health");

        expect(res.status).toBe(503);
        expect(res.body).toEqual(
            expect.objectContaining({ status: "degraded" }),
        );
    });
});
