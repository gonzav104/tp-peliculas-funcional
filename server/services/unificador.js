// Este módulo implementa el CORE del paradigma funcional aplicado al problema de integración de datos heterogéneos.

import { obtenerDetallesPelicula } from './tmdb.js';
import { buscarTrailerPelicula } from './youtube.js';
import { logger } from '../utils/logger.js';

// Tipo unificado de datos enriquecidos
/**
 * @typedef {Object} PeliculaEnriquecida
 * @property {number} id - ID de TMDB
 * @property {string} titulo
 * @property {string} [tituloOriginal]
 * @property {string} resumen
 * @property {string} imagen
 * @property {string} [imagenGrande]
 * @property {number} rating
 * @property {number} [cantidadVotos]
 * @property {string} fecha
 * @property {number} duracion
 * @property {Array<string>} generos
 * @property {Array<Object>} [reparto]
 * @property {Array<Object>} [videos]
 * @property {string} [fuente]
 * @property {Object|null} trailer - Datos de YouTube
 * @property {Array<string>} fuentes - ['tmdb', 'youtube']
 * @property {string} fechaUnificacion - Timestamp de procesamiento
 * @property {boolean} estaCompleta
 */

// Funciones puras de unificacion
/**
 * COMBINAR DATOS DE TMDB Y YOUTUBE
 * Funcion pura que merge dos estructuras
 *
 * @param {Object} datosTMDB - Info de TMDB
 * @param {Object|null} datosYouTube - Info de YouTube
 * @returns {PeliculaEnriquecida}
 */
const combinarFuentes = (datosTMDB, datosYouTube) => {
    return {
        ...datosTMDB,
        trailer: datosYouTube ? {
            id: datosYouTube.id,
            titulo: datosYouTube.titulo,
            url: datosYouTube.url,
            urlEmbed: datosYouTube.urlEmbed,
            thumbnail: datosYouTube.thumbnail,
            canal: datosYouTube.canal
        } : null,
        fuentes: datosYouTube ? ['tmdb', 'youtube'] : ['tmdb'],
        fechaUnificacion: new Date().toISOString(),
        estaCompleta: datosYouTube !== null
    };
};

const esUnificacionValida = (pelicula) => {
    return Boolean(
        pelicula.id &&
        pelicula.titulo &&
        pelicula.imagen &&
        pelicula.rating !== undefined
    );
};

export const enriquecerPelicula = async (idPelicula) => {
    try {
        const datosTMDB = await obtenerDetallesPelicula(idPelicula);

        // Validación crítica
        if (!datosTMDB || !datosTMDB.titulo) return null;

        let datosYouTube = null;

        // 1. INTENTO GRATIS: Buscar si TMDB ya nos dio el video
        const videoTMDB = datosTMDB.videos?.find(v =>
            v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );

        if (videoTMDB) {
            // Log limpio sin emojis
            logger.debug(`Trailer encontrado en TMDB para "${datosTMDB.titulo}" (Ahorro de cuota)`);
            datosYouTube = {
                id: videoTMDB.key,
                titulo: `Trailer: ${datosTMDB.titulo}`,
                url: `https://www.youtube.com/watch?v=${videoTMDB.key}`,
                urlEmbed: `https://www.youtube.com/embed/${videoTMDB.key}`,
                thumbnail: `https://img.youtube.com/vi/${videoTMDB.key}/hqdefault.jpg`,
                canal: 'TMDB Oficial'
            };
        } else {
            // 2. SOLO SI NO HAY EN TMDB: Buscamos en YouTube
            try {
                const anio = datosTMDB.fecha ? parseInt(datosTMDB.fecha.split('-')[0]) : null;
                datosYouTube = await buscarTrailerPelicula(datosTMDB.titulo, anio);
            } catch (ytError) {
                // Log de advertencia limpio
                logger.warn(`YouTube fallo para "${datosTMDB.titulo}": ${ytError.message}`);
            }
        }

        const peliculaUnificada = combinarFuentes(datosTMDB, datosYouTube);

        if (!esUnificacionValida(peliculaUnificada)) return null;

        return peliculaUnificada;

    } catch (error) {
        logger.error(`Error al enriquecer pelicula ${idPelicula}:`, error.message);
        return null;
    }
};

export const enriquecerPeliculasLote = async (idsPeliculas) => {
    logger.info(`Enriqueciendo ${idsPeliculas.length} peliculas en paralelo...`);

    const promesas = idsPeliculas.map(id => enriquecerPelicula(id));
    const resultadosRaw = await Promise.allSettled(promesas);

    const peliculasValidas = resultadosRaw
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

    const fallidos = resultadosRaw.filter(r => r.status === 'rejected').length;
    if (fallidos > 0) logger.warn(`Hubo ${fallidos} errores en el procesamiento del lote.`);

    logger.info(`${peliculasValidas.length}/${idsPeliculas.length} peliculas enriquecidas exitosamente`);

    return peliculasValidas;
};

export const enriquecerListaPeliculas = async (peliculasSimples) => {
    if (!peliculasSimples || peliculasSimples.length === 0) {
        return [];
    }
    const ids = peliculasSimples.map(p => p.id);
    return await enriquecerPeliculasLote(ids);
};

export const obtenerPopularesEnriquecidas = async (limite = 10) => {
    const { obtenerPeliculasPopulares } = await import('./tmdb.js');
    const peliculasBasicas = await obtenerPeliculasPopulares();
    const top = peliculasBasicas.slice(0, limite);
    return await enriquecerListaPeliculas(top);
};

export const buscarYEnriquecer = async (termino, limite = 5) => {
    const { buscarPeliculas } = await import('./tmdb.js');
    const resultados = await buscarPeliculas(termino);
    const top = resultados.slice(0, limite);
    return await enriquecerListaPeliculas(top);
};

export const analizarUnificacion = (peliculas) => {
    const total = peliculas.length;
    if (total === 0) return { total: 0, tasaExito: 0 };

    const conTrailer = peliculas.filter(p => p.trailer !== null).length;
    const conDescripcion = peliculas.filter(p =>
        p.resumen && p.resumen !== 'Sin descripción disponible'
    ).length;
    const conGeneros = peliculas.filter(p =>
        p.generos && p.generos.length > 0
    ).length;

    return {
        total,
        conTrailer,
        conDescripcion,
        conGeneros,
        tasaTrailers: ((conTrailer / total) * 100).toFixed(1) + '%',
        tasaDescripciones: ((conDescripcion / total) * 100).toFixed(1) + '%',
        tasaGeneros: ((conGeneros / total) * 100).toFixed(1) + '%',
        completitud: (((conTrailer + conDescripcion + conGeneros) / (total * 3)) * 100).toFixed(1) + '%'
    };
};