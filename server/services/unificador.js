// server/services/unificador.js
import pLimit from 'p-limit';
import { obtenerDetallesPelicula, obtenerProveedoresStreamingMemo } from './tmdb.js';
import { buscarTrailerPelicula } from './youtube.js';
import { logger } from '../utils/logger.js';

// Configuración de concurrencia: Máximo 5 peticiones simultáneas
const LIMIT_CONCURRENCY = 5;
const limit = pLimit(LIMIT_CONCURRENCY);

const obtenerValorSettled = (resultado) =>
    resultado.status === 'fulfilled' ? resultado.value : null;

const priorizarTrailer = (videos) => {
    const trailers = videos.filter(v =>
        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailers.length === 0) return null;

    // Prioridad: inglés official > inglés cualquier > otro idioma official > cualquier otro
    const enOficial = trailers.find(v => v.iso_639_1 === 'en' && v.official === true);
    if (enOficial) return enOficial;

    const enNoOficial = trailers.find(v => v.iso_639_1 === 'en');
    if (enNoOficial) return enNoOficial;

    const otroOficial = trailers.find(v => v.official === true);
    if (otroOficial) return otroOficial;

    return trailers[0];
};

const extraerTrailerDesdeTMDB = (datosTMDB) => {
    if (!datosTMDB.videos?.length) return null;

    const videoTMDB = priorizarTrailer(datosTMDB.videos);
    if (!videoTMDB) return null;

    const idioma = videoTMDB.iso_639_1?.toUpperCase() || 'desconocido';
    logger.debug(`Trailer encontrado en TMDB para "${datosTMDB.titulo}" (${idioma}) (Ahorro de cuota)`);
    return {
        id: videoTMDB.key,
        titulo: `Trailer: ${datosTMDB.titulo}`,
        url: `https://www.youtube.com/watch?v=${videoTMDB.key}`,
        urlEmbed: `https://www.youtube.com/embed/${videoTMDB.key}`,
        thumbnail: `https://img.youtube.com/vi/${videoTMDB.key}/hqdefault.jpg`,
        canal: 'TMDB Oficial'
    };
};

const buscarTrailerExterno = async (datosTMDB) => {
    try {
        const anio = datosTMDB.fecha ? parseInt(datosTMDB.fecha.split('-')[0]) : null;
        return await buscarTrailerPelicula(datosTMDB.titulo, anio);
    } catch (ytError) {
        logger.warn(`YouTube fallo para "${datosTMDB.titulo}": ${ytError.message}`);
        return null;
    }
};

const obtenerTrailer = async (datosTMDB) => {
    const trailerTMDB = extraerTrailerDesdeTMDB(datosTMDB);
    return trailerTMDB ?? await buscarTrailerExterno(datosTMDB);
};

const combinarFuentes = (datosTMDB, datosYouTube, datosStreaming = null, fechaUnificacion = new Date().toISOString()) => ({
    ...datosTMDB,
    trailer: datosYouTube ? {
        id: datosYouTube.id,
        titulo: datosYouTube.titulo,
        url: datosYouTube.url,
        urlEmbed: datosYouTube.urlEmbed,
        thumbnail: datosYouTube.thumbnail,
        canal: datosYouTube.canal
    } : null,
    streaming: datosStreaming || null,
    fuentes: [
        'tmdb',
        ...(datosYouTube ? ['youtube'] : []),
        ...(datosStreaming ? ['streaming'] : [])
    ],
    fechaUnificacion,
    estaCompleta: datosYouTube !== null
});

const esUnificacionValida = (pelicula) =>
    Boolean(
        typeof pelicula.id === 'number' &&
        pelicula.titulo &&
        pelicula.imagen &&
        pelicula.rating !== undefined
    );

export const enriquecerPelicula = async (idPelicula) => {
    try {
        const datosTMDB = await obtenerDetallesPelicula(idPelicula);

        if (!datosTMDB || !datosTMDB.titulo) return null;

        // Lanzamos streaming y trailer en paralelo
        const [trailerResult, streamingResult] = await Promise.allSettled([
            obtenerTrailer(datosTMDB),
            obtenerProveedoresStreamingMemo(idPelicula)
        ]);

        const datosYouTube = obtenerValorSettled(trailerResult);
        const datosStreaming = obtenerValorSettled(streamingResult);

        const peliculaUnificada = combinarFuentes(datosTMDB, datosYouTube, datosStreaming);

        if (!esUnificacionValida(peliculaUnificada)) return null;

        return peliculaUnificada;
    } catch (error) {
        logger.error(`Error al enriquecer pelicula ${idPelicula}:`, error.message);
        return null;
    }
};

export const enriquecerPeliculasLote = async (idsPeliculas) => {
    logger.info(`Enriqueciendo ${idsPeliculas.length} peliculas (max ${LIMIT_CONCURRENCY} concurrentes)...`);

    const promesas = idsPeliculas.map(id => limit(() => enriquecerPelicula(id)));
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
    if (!peliculasSimples || peliculasSimples.length === 0) return [];
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
    const conDescripcion = peliculas.filter(p => p.resumen && p.resumen !== 'Sin descripción disponible').length;
    const conGeneros = peliculas.filter(p => p.generos && p.generos.length > 0).length;

    return {
        total,
        conTrailer,
        tasaTrailers: ((conTrailer / total) * 100).toFixed(1) + '%',
        completitud: (((conTrailer + conDescripcion + conGeneros) / (total * 3)) * 100).toFixed(1) + '%'
    };
};