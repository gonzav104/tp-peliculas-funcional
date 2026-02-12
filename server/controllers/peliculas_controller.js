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

// Nuevas importaciones
import { LIMITES, ERRORES } from '../utils/constants.js';
import { success, error } from '../utils/response.js';

// === CONFIGURACIÓN ===
// true = Ahorra cuota (pocas peticiones)
// false = Producción (muchas peticiones, mejores resultados)
const MODO_AHORRO = false;

// Helper de validación local
const validar = (schema, data, res) => {
    const resultado = schema.safeParse(data);
    if (!resultado.success) {
        error(res, ERRORES.VALIDACION, 400, resultado.error.format());
        return null;
    }
    return resultado.data;
};

export const getPopulares = async (req, res) => {
    const peliculas = await obtenerPeliculasPopulares();
    success(res, { cantidad: peliculas.length, datos: peliculas });
};

export const getPopularesEnriquecidas = async (req, res) => {
    const input = validar(buscarSchema.pick({ limite: true }), req.query, res);
    if (!input) return;

    const peliculas = await obtenerPopularesEnriquecidas(input.limite);
    const estadisticas = analizarUnificacion(peliculas);

    success(res, { cantidad: peliculas.length, estadisticas, datos: peliculas });
};

export const getMejorCalificadas = async (req, res) => {
    const peliculas = await obtenerPeliculasCalidad();
    success(res, { cantidad: peliculas.length, datos: peliculas });
};

export const buscar = async (req, res) => {
    const input = validar(buscarSchema, req.query, res);
    if (!input) return;

    const resultados = await buscarPeliculasMemo(input.q);
    success(res, { termino: input.q, cantidad: resultados.length, datos: resultados });
};

export const buscarEnriquecida = async (req, res) => {
    const input = validar(buscarSchema, req.query, res);
    if (!input) return;

    const resultados = await buscarYEnriquecer(input.q, input.limite);
    const estadisticas = analizarUnificacion(resultados);

    success(res, { termino: input.q, cantidad: resultados.length, estadisticas, datos: resultados });
};

// --- MARATONES ---

export const planearMaraton = async (req, res) => {
    const input = validar(maratonSchema, req.body, res);
    if (!input) return;

    // Lógica dinámica según modo
    const cantidadAObtener = MODO_AHORRO ? 5 : 20;

    const peliculas = await obtenerPopularesEnriquecidas(cantidadAObtener);
    const plan = planificarMaraton(peliculas, input.tiempo, {
        ratingMinimo: input.ratingMinimo,
        maximoPeliculas: input.maximoPeliculas
    });

    const analisis = analizarPlan(plan);
    success(res, { plan, analisis });
};

export const planearMaratonTematico = async (req, res) => {
    const input = validar(maratonTematicoSchema, req.body, res);
    if (!input) return;

    // Lógica dinámica según modo
    const cantidadPeliculas = MODO_AHORRO ? LIMITES.MARATON_AHORRO : LIMITES.BUSQUEDA_PROD;

    const peliculas = await obtenerPopularesEnriquecidas(cantidadPeliculas);

    const plan = planificarMaratonTematico(
        peliculas,
        input.tiempo,
        input.generos,
        {
            ratingMinimo: MODO_AHORRO ? 0 : input.ratingMinimo,
            maximoPeliculas: input.maximoPeliculas
        }
    );

    const analisis = analizarPlan(plan);

    success(res, { tematica: input.generos.join(', '), plan, analisis });
};

export const planearMaratonDecada = async (req, res) => {
    const input = validar(maratonDecadaSchema, req.body, res);
    if (!input) return;

    const peliculasClasicas = await descubrirPeliculasPorDecada(input.decada);

    if (peliculasClasicas.length === 0) {
        return success(res, { mensaje: ERRORES.NO_RESULTADOS, plan: [] });
    }

    const cantidadAEnriquecer = MODO_AHORRO ? LIMITES.MARATON_AHORRO : LIMITES.MARATON_PROD;
    const peliculasEnriquecidas = await enriquecerListaPeliculas(peliculasClasicas.slice(0, cantidadAEnriquecer));

    const plan = planificarMaraton(peliculasEnriquecidas, input.tiempo);
    const analisis = analizarPlan(plan);

    success(res, { tematica: `Década de ${input.decada}s`, plan, analisis });
};

export const getPresetsMaraton = (req, res) => {
    success(res, { presets: presetsMaraton });
};

// --- UTILIDADES ---

export const getTrailers = async (req, res) => {
    if (!req.query.peli) throw new Error("Falta parámetro peli");
    const trailers = await buscarTrailersPelicula(req.query.peli);
    success(res, { datos: trailers });
};

export const getVideoStats = async (req, res) => {
    if (!req.query.id) throw new Error("Falta parámetro id");
    const stats = await obtenerEstadisticasVideo(req.query.id);
    success(res, { datos: stats });
};

export const getEstado = (req, res) => {
    success(res, { servicio: 'Pipeline Funcional', estado: 'OK', modo: MODO_AHORRO ? 'Ahorro' : 'Producción' });
};