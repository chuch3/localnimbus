import app from "../src/app";
import { db } from "../src/db";
import request from "supertest";
import { createResponse, pingDB } from "../src/index";

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
