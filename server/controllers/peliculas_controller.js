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

// ============================================
// ENDPOINTS BÁSICOS
// ============================================

export const getPopulares = async (req, res) => {
    try {
        const peliculas = await obtenerPeliculasPopulares();
        res.json({ exito: true, cantidad: peliculas.length, datos: peliculas });
    } catch (error) {
        res.status(500).json({ exito: false, error: 'Error al obtener populares' });
    }
};

export const getPopularesEnriquecidas = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 5;
        const peliculas = await obtenerPopularesEnriquecidas(limite);
        const estadisticas = analizarUnificacion(peliculas);
        res.json({ exito: true, cantidad: peliculas.length, estadisticas, datos: peliculas });
    } catch (error) {
        res.status(500).json({ exito: false, error: 'Error al enriquecer' });
    }
};

export const getMejorCalificadas = async (req, res) => {
    try {
        const peliculas = await obtenerPeliculasCalidad();
        res.json({ exito: true, cantidad: peliculas.length, datos: peliculas });
    } catch (error) {
        res.status(500).json({ exito: false, error: 'Error al obtener top rated' });
    }
};

// ============================================
// ENDPOINTS DE BÚSQUEDA
// ============================================

export const buscar = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Falta q' });
        const resultados = await buscarPeliculasMemo(query);
        res.json({ exito: true, termino: query, cantidad: resultados.length, datos: resultados });
    } catch (error) {
        res.status(500).json({ error: 'Error búsqueda' });
    }
};

export const buscarEnriquecida = async (req, res) => {
    try {
        const query = req.query.q;
        const limite = parseInt(req.query.limite) || 3;
        if (!query) return res.status(400).json({ error: 'Falta q' });
        const resultados = await buscarYEnriquecer(query, limite);
        const estadisticas = analizarUnificacion(resultados);
        res.json({ exito: true, termino: query, cantidad: resultados.length, estadisticas, datos: resultados });
    } catch (error) {
        res.status(500).json({ error: 'Error búsqueda enriquecida' });
    }
};

// ============================================
// ENDPOINTS DE MARATÓN
// ============================================

export const planearMaraton = async (req, res) => {
    try {
        const { tiempo, ratingMinimo, maximoPeliculas } = req.body;
        if (!tiempo) return res.status(400).json({ error: 'Falta tiempo' });

        const peliculas = await obtenerPopularesEnriquecidas(5);
        const plan = planificarMaraton(peliculas, tiempo, { ratingMinimo, maximoPeliculas });
        const analisis = analizarPlan(plan);

        res.json({ exito: true, plan, analisis });
    } catch (error) {
        res.status(500).json({ error: 'Error maratón' });
    }
};

export const planearMaratonTematico = async (req, res) => {
    try {
        const { tiempo, generos } = req.body;
        if (!tiempo || !generos) return res.status(400).json({ error: 'Faltan datos' });

        const peliculas = await obtenerPopularesEnriquecidas(10);
        const plan = planificarMaratonTematico(peliculas, tiempo, generos);
        const analisis = analizarPlan(plan);

        res.json({ exito: true, tematica: generos.join(', '), plan, analisis });
    } catch (error) {
        res.status(500).json({ error: 'Error maratón temático' });
    }
};

export const planearMaratonDecada = async (req, res) => {
    try {
        const { tiempo, decada } = req.body;
        if (!tiempo || !decada) return res.status(400).json({ error: 'Faltan datos' });

        // Buscar en API, Enriquecer, Planificar
        const peliculasClasicas = await descubrirPeliculasPorDecada(parseInt(decada));
        const peliculasEnriquecidas = await enriquecerListaPeliculas(peliculasClasicas.slice(0, 15));

        // Usamos la función base planificarMaraton
        const plan = planificarMaraton(peliculasEnriquecidas, tiempo);
        const analisis = analizarPlan(plan);

        res.json({ exito: true, tematica: `Década de ${decada}s`, plan, analisis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error maratón década' });
    }
};

export const getPresetsMaraton = (req, res) => {
    res.json({ exito: true, presets: presetsMaraton });
};

// ============================================
// UTILIDADES
// ============================================

export const getTrailers = async (req, res) => {
    const titulo = req.query.peli;
    if (!titulo) return res.status(400).json({ error: 'Falta peli' });
    const trailers = await buscarTrailersPelicula(titulo);
    res.json({ exito: true, datos: trailers });
};

export const getVideoStats = async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Falta id' });
    const stats = await obtenerEstadisticasVideo(id);
    res.json({ exito: true, datos: stats });
};

export const getEstado = (req, res) => {
    res.json({ servicio: 'Pipeline Funcional', estado: 'OK' });
};