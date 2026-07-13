import {
    obtenerPeliculasPopulares,
    buscarPeliculasMemo,
    obtenerPeliculasCalidad,
    descubrirPeliculasPorDecada,
    descubrirPeliculasPorGenero
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
const MODO_AHORRO = process.env.MODO_AHORRO === 'true';

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
     const datos = resultados.slice(0, input.limite);
     success(res, { termino: input.q, cantidad: datos.length, datos });
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

    // Bug Fix 2: Usar endpoint discover/movie de TMDB con with_genres
    // en lugar de filtrar localmente sobre películas populares
    const paginasDescubrimiento = [1, 2, 3];
    const resultadosPaginas = await Promise.all(
        paginasDescubrimiento.map(pagina => descubrirPeliculasPorGenero(input.generos, pagina))
    );
    const peliculasDescubiertas = resultadosPaginas.flat();

    if (peliculasDescubiertas.length === 0) {
        const planVacio = { peliculas: [], tiempoTotal: 0, cantidadPeliculas: 0, tiempoDisponible: input.tiempo, tiempoRestante: input.tiempo, ratingPromedio: 0, descripcion: "No se encontraron películas con estos criterios." };

        return success(res, {
            tematica: input.generos.join(', '),
            plan: planVacio,
            analisis: {
                eficienciaTemporal: "0%",
                peliculasExcelentes: 0,
                tiempoLibre: input.tiempo,
                calidadGeneral: "N/A"
            }
        });
    }

    // Enriquecer las películas descubiertas
    const cantidadAEnriquecer = MODO_AHORRO
        ? LIMITES.MARATON_AHORRO
        : Math.min(peliculasDescubiertas.length, LIMITES.MARATON_PROD);
    const peliculasEnriquecidas = await enriquecerListaPeliculas(peliculasDescubiertas.slice(0, cantidadAEnriquecer));

    const plan = planificarMaratonTematico(
        peliculasEnriquecidas,
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

    // Bug Fix 3: Si no hay películas, retornar un objeto válido que respete el contrato del frontend
    // NUNCA retornar un array vacío. El frontend espera siempre { peliculas: [], tiempoTotal: 0, ... }
    if (peliculasClasicas.length === 0) {
        const planVacio = { peliculas: [], tiempoTotal: 0, cantidadPeliculas: 0, tiempoDisponible: input.tiempo, tiempoRestante: input.tiempo, ratingPromedio: 0, descripcion: "No se encontraron películas con estos criterios." };
        return success(res, {
            tematica: `Década de ${input.decada}s`,
            plan: planVacio,
            analisis: {
                eficienciaTemporal: "0%",
                peliculasExcelentes: 0,
                tiempoLibre: input.tiempo,
                calidadGeneral: "N/A"
            }
        });
    }

    const cantidadAEnriquecer = MODO_AHORRO ? LIMITES.MARATON_AHORRO : LIMITES.MARATON_PROD;
    const peliculasEnriquecidas = await enriquecerListaPeliculas(peliculasClasicas.slice(0, cantidadAEnriquecer));

    const plan = planificarMaraton(peliculasEnriquecidas, input.tiempo, {
        ratingMinimo: typeof input.ratingMinimo === 'number' ? input.ratingMinimo : undefined,
        maximoPeliculas: input.maximoPeliculas
    });

    // Asegurar que el plan sea un objeto válido, nunca un array
    // Si planificarMaraton retorna algo inválido, usar plan vacío
    const planValido = (
        plan && typeof plan === 'object' && !Array.isArray(plan) && plan.peliculas
    ) ? plan : { peliculas: [], tiempoTotal: 0, cantidadPeliculas: 0, tiempoDisponible: input.tiempo, tiempoRestante: input.tiempo, ratingPromedio: 0, descripcion: "No se encontraron películas con estos criterios." };

    const analisis = analizarPlan(planValido);

    success(res, { tematica: `Década de ${input.decada}s`, plan: planValido, analisis });
};

export const getPresetsMaraton = (req, res) => {
    success(res, { presets: presetsMaraton });
};

// --- UTILIDADES ---

export const getTrailers = async (req, res) => {
    if (!req.query.peli) {
        return error(res, 'Falta parámetro "peli"', 400);
    }

    try {
        const trailers = await buscarTrailersPelicula(req.query.peli);
        return success(res, { datos: trailers });
    } catch (err) {
        return error(res, err.message || 'Error en la solicitud', 500);
    }
};

export const getVideoStats = async (req, res) => {
    if (!req.query.id) {
        return error(res, 'Falta parámetro "id"', 400);
    }

    try {
        const stats = await obtenerEstadisticasVideo(req.query.id);
        return success(res, { datos: stats });
    } catch (err) {
        return error(res, err.message || 'Error en la solicitud', 500);
    }
};

export const getEstado = (req, res) => {
    success(res, { servicio: 'Pipeline Funcional', estado: 'OK', modo: MODO_AHORRO ? 'Ahorro' : 'Producción' });
};