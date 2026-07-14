import axios from 'axios';
import NodeCache from 'node-cache';
import {
    procesarPeliculasEstandar,
    procesarPeliculasCalidad,
    normalizarStreamingTMDB,
} from '../utils/peliculas.js';
import { Either } from '../utils/funcional.js';
import { logger } from '../utils/logger.js';
import { STREAMING_REGIONES_FALLBACK } from '../utils/constants.js';
import {
    TMDBListResponseSchema,
    TMDBDetailResponseSchema
} from '../schemas/tmdb_response.js';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const tmdbCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Capa de acceso a TMDB mejorada
const fetchTMDB = async (endpoint, params = {}, schema = null) => {
    try {
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            params: {
                api_key: API_KEY,
                language: 'es-ES',
                ...params
            }
        };

        logger.debug(`Fetching TMDB: ${endpoint}`, params); // LOG

        const respuesta = await axios.get(url, config);

        // Validación de estructura
        if (schema) {
            const validacion = schema.safeParse(respuesta.data);
            if (!validacion.success) {
                logger.error(`Error de validación en TMDB [${endpoint}]`, validacion.error.format());
                // En producción, decidir si fallar o retornar datos parciales.
                // Aquí optamos por fallar para detectar cambios en la API rápido.
                return Either.Left({
                    mensaje: 'Estructura de respuesta inválida de TMDB',
                    detalle: validacion.error.issues
                });
            }
            return Either.Right(validacion.data);
        }

        return Either.Right(respuesta.data);

    } catch (error) {
        logger.error(`Error HTTP TMDB [${endpoint}]:`, error.message);
        return Either.Left({
            mensaje: 'Error al consultar TMDB',
            detalle: error.message,
            endpoint
        });
    }
};

export const obtenerPeliculasPopulares = async () => {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    logger.info(`Fetching TMDB Populares (Page ${randomPage}) para variedad`);
    // Validamos que sea una lista
    const resultado = await fetchTMDB('/movie/popular', {page: randomPage}, TMDBListResponseSchema);

    return resultado.fold(
        (error) => {
            logger.warn('Retornando lista vacía por error en populares', error);
            return [];
        },
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const obtenerPeliculasCalidad = async () => {
    const resultado = await fetchTMDB('/movie/top_rated', { page: 1 }, TMDBListResponseSchema);

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasCalidad(data.results || [])
    );
};

export const descubrirPeliculasPorDecada = async (decada, pagina = 1) => {
    const inicio = `${decada}-01-01`;
    const fin = `${decada + 9}-12-31`;

    const resultado = await fetchTMDB('/discover/movie', {
        'primary_release_date.gte': inicio,
        'primary_release_date.lte': fin,
        'sort_by': 'popularity.desc',
        'page': pagina,
        'vote_average.gte': 6.0,
        'vote_count.gte': 100
    }, TMDBListResponseSchema);

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

// Bug Fix 2: Función para descubrir películas por género usando el endpoint discover/movie
// Reemplaza el filtrado local sobre películas populares por una búsqueda directa en TMDB
export const descubrirPeliculasPorGenero = async (generos = [], pagina = 1) => {
    if (!generos || generos.length === 0) return [];

    // TMDB espera IDs de género, pero si recibimos nombres, los mapeamos a IDs conocidos
    // Mapping básico de géneros comunes (estos son IDs reales en TMDB)
    const generoMap = {
        // Español (normalizado en minúsculas) y variantes en inglés
        'acción': 28,
        'accion': 28,
        'action': 28,
        'aventura': 12,
        'adventure': 12,
        'animación': 16,
        'animacion': 16,
        'animation': 16,
        'comedia': 35,
        'comedy': 35,
        'crimen': 80,
        'crime': 80,
        'documental': 99,
        'documentary': 99,
        'drama': 18,
        'familia': 10751,
        'family': 10751,
        'fantasía': 14,
        'fantasia': 14,
        'fantasy': 14,
        'historia': 36,
        'history': 36,
        'terror': 27,
        'horror': 27,
        'música': 10402,
        'musica': 10402,
        'music': 10402,
        'misterio': 9648,
        'mystery': 9648,
        'romance': 10749,
        'suspense': 53,
        'thriller': 53,
        'bélica': 10752,
        'belica': 10752,
        'guerra': 10752,
        'war': 10752,
        'ciencia ficción': 878,
        'ciencia ficcion': 878,
        'science fiction': 878,
        'sci-fi': 878,
        'occidental': 37,
        'western': 37
    };

    // Convertir nombres de género a IDs (si aplica), manteniendo IDs numéricos que ya sean válidos
    const generoIds = generos.map(g => {
        const lower = String(g).toLowerCase();
        return generoMap[lower] || (typeof g === 'number' ? g : null);
    }).filter(id => id !== null);

    if (generoIds.length === 0) return [];

    const resultado = await fetchTMDB('/discover/movie', {
        'with_genres': generoIds.join('|'),
        'sort_by': 'popularity.desc',
        'page': pagina,
        'vote_average.gte': 5.0,
        'vote_count.gte': 50
    }, TMDBListResponseSchema);

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const buscarPeliculas = async (query) => {
    if (!query || query.trim().length === 0) return [];

    const resultado = await fetchTMDB('/search/movie', { query }, TMDBListResponseSchema);

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const obtenerDetallesPelicula = async (id) => {
    // Validamos con el esquema detallado
    const resultado = await fetchTMDB(`/movie/${id}`, {
        append_to_response: 'credits,videos'
    }, TMDBDetailResponseSchema);

    return resultado.fold(
        () => null,
        (data) => ({
            id: data.id,
            titulo: data.title,
            tituloOriginal: data.original_title,
            resumen: data.overview,
            imagen: data.poster_path
                ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
                : null,
            imagenGrande: data.backdrop_path
                ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
                : null,
            rating: data.vote_average,
            cantidadVotos: data.vote_count,
            fecha: data.release_date,
            duracion: data.runtime,
            generos: data.genres?.map(g => g.name) || [],
            tagline: data.tagline,
            presupuesto: data.budget,
            ingresos: data.revenue,
            estado: data.status,
            idioma_original: data.original_language,
            fecha_estreno: data.release_date,
            productoras: data.production_companies?.map(p => p.name) || [],
            paises: data.production_countries?.map(p => p.name) || [],
            reparto: data.credits?.cast?.slice(0, 10).map(actor => ({
                nombre: actor.name,
                personaje: actor.character,
                foto: actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : null
            })) || [],
            directores: data.credits?.crew
                ?.filter(crew => crew.job === 'Director')
                .map(d => d.name) || [],
            videos: data.videos?.results || [],
            fuente: 'tmdb'
        })
    );
};

const memoize = (fn) => {
    return async (...args) => {
        const key = JSON.stringify(args);
        const valorGuardado = tmdbCache.get(key);
        if (valorGuardado !== undefined) {
            logger.debug(`Cache HIT: ${key}`);
            return valorGuardado;
        }

        const resultado = await fn(...args);

        logger.debug(`Cache MISS: ${key}`);
        tmdbCache.set(key, resultado);
        return resultado;
    };
};

export const buscarPeliculasMemo = memoize(buscarPeliculas);

export const obtenerProveedoresStreaming = async (idPelicula) => {
    const resultado = await fetchTMDB(`/movie/${idPelicula}/watch/providers`);

    return resultado.fold(
        (error) => {
            logger.warn(`Sin proveedores de streaming para película ${idPelicula}`, error);
            return null;
        },
        (data) => {
            const regiones = data.results || {};
            const regionDisponible = STREAMING_REGIONES_FALLBACK.find(
                (region) => regiones[region]
            );

            if (!regionDisponible) return null;

            return normalizarStreamingTMDB(regiones[regionDisponible]);
        }
    );
};

export const obtenerProveedoresStreamingMemo = memoize(obtenerProveedoresStreaming);

