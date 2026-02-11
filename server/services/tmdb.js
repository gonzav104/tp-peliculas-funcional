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
const tmdbCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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

            // CAMPOS DE DETALLE
            tagline: data.tagline,
            presupuesto: data.budget,
            ingresos: data.revenue,
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

// Implementacion de memoización
const memoize = (fn) => {
    return async (...args) => {
        const key = JSON.stringify(args);

        const valorGuardado = tmdbCache.get(key);
        if (valorGuardado !== undefined) {
            console.log(`⚡ Cache HIT: ${key}`);
            return valorGuardado;
        }

        const resultado = await fn(...args);

        console.log(`💾 Cache MISS: ${key}`);
        tmdbCache.set(key, resultado);

        return resultado;
    };
};

export const buscarPeliculasMemo = memoize(buscarPeliculas);

