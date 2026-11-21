import "dotenv/config";
import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "./db";

type AuditFilters = {
    action?: string;
    outcome?: "success" | "rejected" | "failure";
    logId?: number;
    limit?: number;
    offset?: number;
};

export async function auditLogs({
    action,
    outcome,
    logId,
    limit = 100,
    offset = 0,
}: AuditFilters = {}) {
    return db
        .select()
        .from(schema.logTable)
        .where(
            and(
                action ? eq(schema.logTable.action, action) : undefined,
                outcome ? eq(schema.logTable.outcome, outcome) : undefined,
                logId ? eq(schema.logTable.logId, logId) : undefined,
            ),
        )
        .orderBy(desc(schema.logTable.createdAt))
        .limit(limit)
        .offset(offset);
}
