import { createHash } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { db, schema } from "./db";

export const IP_SALT = process.env.IP_SALT ?? "change-me-in-production";

export function hashIp(req: Request): string {
    const raw = req.ip ?? req.socket.remoteAddress ?? "unknown";
    return createHash("sha256")
        .update(raw + IP_SALT)
        .digest("hex");
}

type LogParams = {
    action: string;
    outcome?: "success" | "rejected" | "failure";
    detail?: string;
    ipHash?: string;
};

export async function logEvent({
    action,
    outcome = "success",
    detail,
    ipHash,
}: LogParams): Promise<void> {
    // Stdout logging sentence to user
    console.log(
        `[${new Date().toISOString()}] ${action} outcome=${outcome} ${detail ?? ""}`.trim(),
    );

    try {
        await db.insert(schema.logTable).values({
            action,
            outcome,
            detail,
            ipHash: ipHash ?? null,
        });
    } catch (err) {
        // Never let logging failure crash the request path
        console.error("Failed to write log row:", err);
    }
}

export function outcomeFromStatus(status: number) {
    if (status >= 500) return "failure" as const;
    if (status >= 400) return "rejected" as const;
    return "success" as const;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();
    const ipHash = hashIp(req);

    res.on("finish", () => {
        const ms = Math.round(performance.now() - start);
        void logEvent({
            action: "HTTP_REQUEST",
            outcome: outcomeFromStatus(res.statusCode),
            detail: `${req.method} ${req.path} -> ${res.statusCode} ${ms}ms`,
            ipHash,
        });
    });

    next();
}
