import { createResponse } from "../src/index";

// WARN: Learn how this mock is built (jest can't read .env)
jest.mock("../src/db", () => ({
    db: {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest
            .fn()
            .mockResolvedValue([
                { survey_id: 1, rating: "Good", created_at: new Date() },
            ]),
    },
}));

describe("testing index file", () => {
    test("createResponse returns the inserted row", async () => {
        const result = await createResponse("Good");
        expect(result).toEqual(expect.objectContaining({ rating: "Good" }));
        console.log("Inserted row:", result);
    });
});
