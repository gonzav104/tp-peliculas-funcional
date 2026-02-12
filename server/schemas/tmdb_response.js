// server/schemas/tmdb_response.js
import { z } from 'zod';

// Esquema base de una película (validamos solo lo crítico)
const MovieItemSchema = z.object({
    id: z.number(),
    title: z.string().optional(),
    original_title: z.string().optional(),
    overview: z.string().optional(),
    poster_path: z.string().nullable().optional(),
    backdrop_path: z.string().nullable().optional(),
    vote_average: z.number().optional(),
    vote_count: z.number().optional(),
    release_date: z.string().optional(),
    genre_ids: z.array(z.number()).optional(),
}).passthrough(); // Permitimos otros campos que no validamos explícitamente

// Esquema para lista de resultados (ej: populares, búsqueda)
export const TMDBListResponseSchema = z.object({
    page: z.number().optional(),
    results: z.array(MovieItemSchema),
    total_pages: z.number().optional(),
    total_results: z.number().optional(),
});

// Esquema para detalles completos (incluyendo créditos)
export const TMDBDetailResponseSchema = MovieItemSchema.extend({
    genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    tagline: z.string().optional(),
    budget: z.number().optional(),
    revenue: z.number().optional(),
    runtime: z.number().nullable().optional(),
    original_language: z.string().optional(),
    production_companies: z.array(z.object({ name: z.string() })).optional(),
    production_countries: z.array(z.object({ name: z.string() })).optional(),

    // Validamos créditos y videos si vienen
    credits: z.object({
        cast: z.array(z.object({
            name: z.string(),
            character: z.string().optional(),
            profile_path: z.string().nullable().optional()
        }).passthrough()).optional(),
        crew: z.array(z.object({
            name: z.string(),
            job: z.string().optional()
        }).passthrough()).optional()
    }).optional(),

    videos: z.object({
        results: z.array(z.object({
            key: z.string(),
            site: z.string(),
            type: z.string()
        }).passthrough()).optional()
    }).optional()
});