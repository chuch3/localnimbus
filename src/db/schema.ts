import { sql } from "drizzle-orm";
import {
    varchar,
    check,
    pgTable,
    serial,
    index,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const surveyTable = pgTable(
    "survey_table",
    {
        survey_id: serial().primaryKey(),
        rating: text().notNull(),
        created_at: timestamp().notNull().defaultNow(),
    },
    (table) => [
        check("rating_check", sql`${table.rating} IN ('Good', 'OK', 'Poor')`),
        index("survey_created_at_idx").on(table.created_at),
    ],
);

export const logTable = pgTable(
    "log_table",
    {
        logId: serial().primaryKey(),
        action: text().notNull(),
        outcome: varchar({ length: 20 }).notNull().default("success"),
        detail: text(),
        createdAt: timestamp().notNull().defaultNow(),
        ipHash: varchar({ length: 64 }),
    },
    (table) => [
        check(
            "action_check",
            sql`${table.action} IN ('SURVEY_CREATED', 'SURVEY_REJECTED', 'SURVEY_LOOKUP', 'CSV_EXPORTED')`,
        ),
        check(
            "outcome_check",
            sql`${table.outcome} IN ('success', 'rejected', 'failure')`,
        ),
        index("log_created_at_idx").on(table.createdAt),
        index("log__idx").on(table.outcome),
    ],
);
