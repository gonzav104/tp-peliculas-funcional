import axios from 'axios';
import NodeCache from 'node-cache';
import {
    procesarPeliculasEstandar,
    procesarPeliculasCalidad,
} from '../utils/peliculas.js';
import { Either } from '../utils/funcional.js';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// CONFIGURACIÓN DE CACHÉ
// stdTTL: 3600 segundos = 1 hora de duración para los datos
// checkperiod: 600 segundos = Revisa cada 10 minutos para borrar datos viejos
const tmdbCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// --- DEFINICIONES DE TIPOS PARA INTELLIJ ---

/**
 * @typedef {Object} CastMember
 * @property {string} name
 * @property {string} character
 */

/**
 * @typedef {Object} TMDBResponse
 * @property {Array} results
 * @property {number} id
 * @property {string} title
 * @property {string} original_title
 * @property {string} overview
 * @property {string} poster_path
 * @property {string} backdrop_path
 * @property {number} vote_average
 * @property {number} vote_count
 * @property {string} release_date
 * @property {number} runtime
 * @property {Array<{name: string}>} genres
 * @property {{ cast: CastMember[] }} credits
 * @property {{ results: Array }} videos
 */

/**
 * @template T
 * @typedef {Object} EitherType
 * @property {boolean} isLeft
 * @property {function(function(T): any): EitherType} map
 * @property {function(function(any): any, function(T): any): any} fold
 */

// Capa de acceso a TMDB
const fetchTMDB = async (endpoint, params = {}) => {
    try {
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            params: {
                api_key: API_KEY,
                language: 'es-ES',
                ...params
            }
        };

        const respuesta = await axios.get(url, config);
        // @ts-ignore
        return Either.Right(respuesta.data);

    } catch (error) {
        console.error(`Error TMDB [${endpoint}]:`, error.message);
        // @ts-ignore
        return Either.Left({
            mensaje: 'Error al consultar TMDB',
            detalle: error.message,
            endpoint
        });
    }
};

// Funciones de negocio
export const obtenerPeliculasPopulares = async () => {
    const resultado = await fetchTMDB('/movie/popular');

    return resultado.fold(
        (error) => {
            console.warn('Retornando lista vacía por error:', error.mensaje);
            return [];
        },
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const obtenerPeliculasCalidad = async () => {
    const resultado = await fetchTMDB('/movie/top_rated', { page: 1 });

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasCalidad(data.results || [])
    );
};

// Esta funcion es necesaria para el endpoint POST /maraton-decada
export const descubrirPeliculasPorDecada = async (decada) => {
    const inicio = `${decada}-01-01`;
    const fin = `${decada + 9}-12-31`;

    const resultado = await fetchTMDB('/discover/movie', {
        'primary_release_date.gte': inicio,
        'primary_release_date.lte': fin,
        'sort_by': 'popularity.desc',
        'vote_average.gte': 6.0,
        'vote_count.gte': 100
    });

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const buscarPeliculas = async (query) => {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const resultado = await fetchTMDB('/search/movie', { query });

    return resultado.fold(
        () => [],
        (data) => procesarPeliculasEstandar(data.results || [])
    );
};

export const obtenerDetallesPelicula = async (id) => {
    const resultado = await fetchTMDB(`/movie/${id}`, {
        append_to_response: 'credits,videos'
    });

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
            reparto: data.credits?.cast?.slice(0, 10).map(actor => ({
                nombre: actor.name,
                personaje: actor.character
            })) || [],
            videos: data.videos?.results || [],
            fuente: 'tmdb'
        })
    );
};

// Implementacion de memoización
const memoize = (fn) => {
    return async (...args) => {
        const key = JSON.stringify(args); // Se crea una clave única basada en los argumentos

        // Intentar obtener de la caché
        const valorGuardado = tmdbCache.get(key);
        if (valorGuardado !== undefined) {
            console.log(`⚡ Cache HIT: ${key}`);
            return valorGuardado;
        }

        // Si no existe, ejecutar la función real (API call)
        const resultado = await fn(...args);

        // Guardar en caché
        console.log(`💾 Cache MISS: ${key}`);
        tmdbCache.set(key, resultado);

        return resultado;
    };
};

export const buscarPeliculasMemo = memoize(buscarPeliculas);

