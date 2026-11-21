import "dotenv/config";
import { sql, count, eq } from "drizzle-orm";
import { db } from "./db";
import { surveyTable } from "./db/schema";

// Error handling are done in app.ts

export async function createResponse(rating: string) {
    const [result] = await db
        .insert(surveyTable)
        .values({
            rating: rating, // type checked by constraints
        })
        .returning();
    return result;
}

export async function getAllResponses() {
    const result = await db
        .select()
        .from(surveyTable)
        .orderBy(surveyTable.created_at);
    return result;
}

export async function getResponseByID(idValue: number) {
    const result = await db
        .select()
        .from(surveyTable)
        .where(eq(surveyTable.survey_id, idValue));
    return result;
}

export async function getDailyRatingCounts() {
    return db
        .select({
            day: sql<string>`to_char(date_trunc('day', ${surveyTable.created_at}), 'YYYY-MM-DD')`,
            rating: surveyTable.rating,
            count: count(),
        })
        .from(surveyTable)
        .groupBy(
            sql`date_trunc('day', ${surveyTable.created_at})`,
            surveyTable.rating,
        )
        .orderBy(sql`date_trunc('day', ${surveyTable.created_at})`);
}

export async function pingDB() {
    db.execute(sql`select 1`);
}
