import { z } from "zod";

export const ratingSchema = z.enum(["Good", "OK", "Poor"]);

export const createSurveySchema = z.object({
    rating: ratingSchema,
});

export const idSchema = z.coerce.number().int().positive();

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type idParam = z.infer<typeof idSchema>;
