import { z } from 'zod';

// Esquema para búsquedas por texto (ej: ?q=matrix&limite=5)
export const buscarSchema = z.object({
    q: z.string({
        required_error: "Debes proporcionar un término de búsqueda ('q')",
    }).min(1, "La búsqueda no puede estar vacía"),

    limite: z.coerce.number().min(1).max(50).default(5).optional()
    // z.coerce transforma "5" (string) a 5 (number) automáticamente
});

// Esquema para Maratón Automático
export const maratonSchema = z.object({
    tiempo: z.number({
        required_error: "El tiempo disponible es obligatorio",
        invalid_type_error: "El tiempo debe ser un número (minutos)"
    }).int().positive("El tiempo debe ser positivo").max(1440, "El máximo es 24 horas (1440 min)"),

    ratingMinimo: z.number().min(0).max(10).default(0).optional(),

    maximoPeliculas: z.number().int().positive().optional()
});

// Esquema para Maratón Temático
export const maratonTematicoSchema = z.object({
    tiempo: z.number().int().positive().max(1440),

    generos: z.array(z.string(), {
        required_error: "Debes enviar una lista de géneros",
        invalid_type_error: "Los géneros deben ser un array de textos"
    }).nonempty("Debes elegir al menos un género"),

    // Campos nuevos para control fino
    ratingMinimo: z.number().min(0).max(10).default(5.0).optional(),
    maximoPeliculas: z.number().int().positive().default(10).optional()
});

// Esquema para Maratón por Década
export const maratonDecadaSchema = z.object({
    tiempo: z.number().int().positive(),

    decada: z.number().int()
        .min(1900, "Muy antiguo para nuestro catálogo")
        .max(2030, "No podemos predecir el futuro")
        .refine(val => val % 10 === 0, "Debe ser una década (ej: 1980, 1990)")
});

// Esquema simple para utilidades (Youtube)
export const youtubeSchema = z.object({
    peli: z.string().min(1),
    id: z.string().min(1) // Para video stats
});