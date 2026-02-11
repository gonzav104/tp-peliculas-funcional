import {
    obtenerPeliculasPopulares,
    buscarPeliculasMemo,
    obtenerPeliculasCalidad,
    descubrirPeliculasPorDecada
} from '../services/tmdb.js';

import {
    obtenerPopularesEnriquecidas,
    buscarYEnriquecer,
    analizarUnificacion,
    enriquecerListaPeliculas
} from '../services/unificador.js';

import {
    planificarMaraton,
    planificarMaratonTematico,
    analizarPlan,
    presetsMaraton
} from '../services/maraton.js';

import {
    buscarTrailersPelicula,
    obtenerEstadisticasVideo
} from '../services/youtube.js';

import {
    buscarSchema,
    maratonSchema,
    maratonTematicoSchema,
    maratonDecadaSchema
} from '../schemas/peliculas.js';

// Helper de validación
const validar = (schema, data, res) => {
    const resultado = schema.safeParse(data);
    if (!resultado.success) {
        res.status(400).json({
            exito: false,
            error: "Datos inválidos",
            detalles: resultado.error.format()
        });
        return null;
    }
    return resultado.data;
};

export const getPopulares = async (req, res) => {
    const peliculas = await obtenerPeliculasPopulares();
    res.json({ exito: true, cantidad: peliculas.length, datos: peliculas });
};

export const getPopularesEnriquecidas = async (req, res) => {
    const input = validar(buscarSchema.pick({ limite: true }), req.query, res);
    if (!input) return;

    const peliculas = await obtenerPopularesEnriquecidas(input.limite);
    const estadisticas = analizarUnificacion(peliculas);
    res.json({ exito: true, cantidad: peliculas.length, estadisticas, datos: peliculas });
};

export const getMejorCalificadas = async (req, res) => {
    const peliculas = await obtenerPeliculasCalidad();
    res.json({ exito: true, cantidad: peliculas.length, datos: peliculas });
};

export const buscar = async (req, res) => {
    const input = validar(buscarSchema, req.query, res);
    if (!input) return;

    const resultados = await buscarPeliculasMemo(input.q);
    res.json({ exito: true, termino: input.q, cantidad: resultados.length, datos: resultados });
};

export const buscarEnriquecida = async (req, res) => {
    const input = validar(buscarSchema, req.query, res);
    if (!input) return;

    const resultados = await buscarYEnriquecer(input.q, input.limite);
    const estadisticas = analizarUnificacion(resultados);
    res.json({ exito: true, termino: input.q, cantidad: resultados.length, estadisticas, datos: resultados });
};

// --- MARATONES ---

export const planearMaraton = async (req, res) => {
    const input = validar(maratonSchema, req.body, res);
    if (!input) return;

    const peliculas = await obtenerPopularesEnriquecidas(10);
    const plan = planificarMaraton(peliculas, input.tiempo, {
        ratingMinimo: input.ratingMinimo,
        maximoPeliculas: input.maximoPeliculas
    });

    const analisis = analizarPlan(plan);
    res.json({ exito: true, plan, analisis });
};

export const planearMaratonTematico = async (req, res) => {
    const input = validar(maratonTematicoSchema, req.body, res);
    if (!input) return;

    const peliculas = await obtenerPopularesEnriquecidas(50);
    const plan = planificarMaratonTematico(
        peliculas,
        input.tiempo,
        input.generos,
        {
            ratingMinimo: input.ratingMinimo,
            maximoPeliculas: input.maximoPeliculas
        }
    );
    const analisis = analizarPlan(plan);

    res.json({ exito: true, tematica: input.generos.join(', '), plan, analisis });
};

export const planearMaratonDecada = async (req, res) => {
    const input = validar(maratonDecadaSchema, req.body, res);
    if (!input) return;

    const peliculasClasicas = await descubrirPeliculasPorDecada(input.decada);

    if (peliculasClasicas.length === 0) {
        return res.json({ exito: true, mensaje: "No se encontraron películas", plan: [] });
    }

    const peliculasEnriquecidas = await enriquecerListaPeliculas(peliculasClasicas.slice(0, 15));
    const plan = planificarMaraton(peliculasEnriquecidas, input.tiempo);
    const analisis = analizarPlan(plan);

    res.json({ exito: true, tematica: `Década de ${input.decada}s`, plan, analisis });
};

export const getPresetsMaraton = (req, res) => {
    res.json({ exito: true, presets: presetsMaraton });
};

// --- UTILIDADES ---

export const getTrailers = async (req, res) => {
    if (!req.query.peli) throw new Error("Falta parámetro peli");
    // Al lanzar este error, Express 5 lo atrapa y lo manda a errorHandler.js

    const trailers = await buscarTrailersPelicula(req.query.peli);
    res.json({ exito: true, datos: trailers });
};

export const getVideoStats = async (req, res) => {
    if (!req.query.id) throw new Error("Falta parámetro id");
    const stats = await obtenerEstadisticasVideo(req.query.id);
    res.json({ exito: true, datos: stats });
};

export const getEstado = (req, res) => {
    res.json({ servicio: 'Pipeline Funcional', estado: 'OK' });
};