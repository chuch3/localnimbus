import "dotenv/config";
import express, { Request, Response } from "express";
import {
    createResponse,
    getDailyRatingCounts,
    getResponseByID,
    getAllResponses,
    pingDB,
} from "./index";
import { createSurveySchema, idSchema } from "./survey";
import { requestLogger, hashIp, logEvent } from "./logger";

const app = express();
app.use(requestLogger);
app.use(express.json());

app.post("/api/survey", async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    const parsed = createSurveySchema.safeParse(req.body);

    // Reject invalid rating
    if (!parsed.success) {
        const badValue = JSON.stringify(req.body?.rating ?? null);

        await logEvent({
            action: "SURVEY_REJECTED",
            outcome: "rejected",
            detail: `Rejected invalid rating value=${badValue}`,
            ipHash,
        });
        return res.status(400).json({
            error: "Rating must be one of: Good, OK, Poor",
            received: req.body?.rating ?? null,
        });
    }

    try {
        const row = await createResponse(parsed.data.rating);

        await logEvent({
            action: "SURVEY_CREATED",
            outcome: "success",
            detail: `Saved rating="${parsed.data.rating}" id=${row?.survey_id}`,
            ipHash,
        });

        return res
            .status(201)
            .json({ survey_id: row?.survey_id, rating: parsed.data.rating });
    } catch (err) {
        // DB check constraint alert here if Zod is ever bypassed
        await logEvent({
            action: "SURVEY_CREATED",
            outcome: "failure",
            detail: `DB insert failed: ${(err as Error).message}`,
            ipHash,
        });
        return res.status(500).json({ error: "Failed to save response" });
    }
});

function escapeCsv(value: unknown) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

app.get("/api/export", async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    try {
        const rows = await getAllResponses();
        const header = "survey_id,rating,created_at";
        const lines = rows.map((r) =>
            [r.survey_id, r.rating, r.created_at.toISOString()]
                .map(escapeCsv)
                .join(","),
        );
        const csv = [header, ...lines].join("\n");

        await logEvent({
            action: "CSV_EXPORTED",
            outcome: "success",
            detail: `Exported ${rows.length} survey rows`,
            ipHash,
        });

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="survey-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        );
        return res.send(csv);
    } catch (err) {
        await logEvent({
            action: "CSV_EXPORTED",
            outcome: "failure",
            detail: `CSV export failed: ${(err as Error).message}`,
            ipHash,
        });
        return res.status(500).json({ error: "Failed to export .csv" });
    }
});

// Takes a reponse of requested survey ID
app.get("/api/survey/:id", async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    const parsed = idSchema.safeParse(req.params.id);

    // Rejects invalid IDs
    if (!parsed.success) {
        await logEvent({
            action: "SURVEY_LOOKUP",
            outcome: "rejected",
            detail: `Invalid id=${req.params.id}`,
            ipHash,
        });
        return res.status(400).json({
            error: "Invalid id: Survey ID be positive integer",
        });
    }

    try {
        const rows = await getResponseByID(parsed.data);

        if (rows.length === 0) {
            await logEvent({
                action: "SURVEY_LOOKUP",
                outcome: "rejected",
                detail: `Survey ID=${parsed.data} not found`,
                ipHash,
            });
            return res.status(404).json({ error: "Survey not found" });
        }

        await logEvent({
            action: "SURVEY_LOOKUP",
            outcome: "success",
            detail: `Found survey ID=${parsed.data}`,
            ipHash,
        });

        return res.json(rows[0]);
    } catch (err) {
        await logEvent({
            action: "SURVEY_LOOKUP",
            outcome: "failure",
            detail: `DB lookup failed: ${(err as Error).message}`,
            ipHash,
        });
        return res.status(500).json({ error: "Failed to lookup reponse" });
    }
});

app.get("/api/stats", async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    try {
        const rows = await getDailyRatingCounts();
        const days = new Map<
            string,
            {
                date: string;
                Good: number;
                OK: number;
                Poor: number;
                total: number;
            }
        >();

        for (const row of rows) {
            const day = days.get(row.day) ?? {
                date: row.day,
                Good: 0,
                OK: 0,
                Poor: 0,
                total: 0,
            };
            day[row.rating as "Good" | "OK" | "Poor"] = Number(row.count);
            day.total += Number(row.count);
            days.set(row.day, day);
        }

        return res.json({ days: [...days.values()] });
    } catch (err) {
        await logEvent({
            action: "STATS_VIEWED",
            outcome: "failure",
            detail: `Stats lookout failed: ${(err as Error).message}`,
            ipHash,
        });
        return res.status(500).json({ error: "Failed to get stats" });
    }
});

app.get("/api/health", async (_req, res) => {
    try {
        await pingDB();
        res.json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    } catch {
        res.status(503).json({
            status: "degraded",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    }
});

export default app;
