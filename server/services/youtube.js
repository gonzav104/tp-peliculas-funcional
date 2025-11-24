import axios from 'axios';
import { Either } from '../utils/funcional.js';
import { map, filter, pipe } from '../utils/funcional.js';

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- DEFINICIONES DE TIPOS PARA INTELLIJ ---

/**
 * @typedef {Object} YouTubeSnippet
 * @property {string} title
 * @property {string} description
 * @property {string} channelTitle
 * @property {string} publishedAt
 * @property {{high: {url: string}, default: {url: string}}} thumbnails
 */

/**
 * @typedef {Object} YouTubeVideoItem
 * @property {{videoId: string}} id
 * @property {YouTubeSnippet} snippet
 * @property {Object} [statistics]
 * @property {string} statistics.viewCount
 * @property {string} statistics.likeCount
 * @property {string} statistics.commentCount
 * @property {Object} [contentDetails]
 * @property {string} contentDetails.duration
 */

/**
 * @typedef {Object} YouTubeResponse
 * @property {Array<YouTubeVideoItem>} items
 */

/**
 * @template T
 * @typedef {Object} EitherType
 * @property {boolean} isLeft
 * @property {function(function(T): any): EitherType} map
 * @property {function(function(any): any, function(T): any): any} fold
 */

// Capa de acceso a YouTube
/**
 * FETCHER GENÉRICO
 * @param {string} endpoint
 * @param {Object} params
 * @returns {Promise<EitherType<YouTubeResponse>>}
 */
const fetchYouTube = async (endpoint, params = {}) => {
    try {
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            params: {
                key: API_KEY,
                part: 'snippet',
                maxResults: 5,
                type: 'video',
                ...params
            }
        };

        const respuesta = await axios.get(url, config);
        // @ts-ignore
        return Either.Right(respuesta.data);

    } catch (error) {
        console.error(`Error YouTube [${endpoint}]:`, error.message);
        // @ts-ignore
        return Either.Left({
            mensaje: 'Error al consultar YouTube',
            detalle: error.message,
            endpoint
        });
    }
};

// Transformaciones y filtros
/**
 * NORMALIZA un video crudo
 * @param {YouTubeVideoItem} video
 */
const normalizarVideoYouTube = (video) => ({
    id: video.id.videoId,
    titulo: video.snippet.title,
    descripcion: video.snippet.description,
    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    canal: video.snippet.channelTitle,
    fechaPublicacion: video.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    urlEmbed: `https://www.youtube.com/embed/${video.id.videoId}`,
    fuente: 'youtube'
});

const pareceTrailerOficial = (video) => {
    const titulo = video.titulo.toLowerCase();
    const keywords = ['trailer', 'official', 'tráiler', 'oficial', 'teaser', 'hd', '4k'];
    return keywords.some(keyword => titulo.includes(keyword));
};

/**
 * PIPELINE DE LIMPIEZA
 * Definimos explícitamente que devuelve un Array para evitar errores de inferencia
 * @type {function(Array<YouTubeVideoItem>): Array<Object>}
 */
const procesarVideosYouTube = pipe(
    map(normalizarVideoYouTube),
    filter(pareceTrailerOficial)
);

// Utilidades
/**
 * PARSEAR DURACIÓN ISO 8601 a segundos
 * @param {string} duracion
 * @returns {number}
 */
export const parsearDuracionISO = (duracion) => {
    if (!duracion) return 0;
    const match = duracion.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const horas = parseInt(match[1]) || 0;
    const minutos = parseInt(match[2]) || 0;
    const segundos = parseInt(match[3]) || 0;
    return horas * 3600 + minutos * 60 + segundos;
};

// Funciones principales exportadas
/**
 * BUSCAR TRÁILER DE PELÍCULA
 * @param {string} tituloPelicula
 * @param {number|null} anio
 */
export const buscarTrailerPelicula = async (tituloPelicula, anio = null) => {
    if (!tituloPelicula) return null;

    const query = anio
        ? `${tituloPelicula} ${anio} official trailer`
        : `${tituloPelicula} official trailer`;

    const resultado = await fetchYouTube('/search', {
        q: query,
        maxResults: 5,
        order: 'relevance'
    });

    return resultado.fold(
        () => null,
        (data) => {
            const videos = procesarVideosYouTube(data.items || []);
            return videos.length > 0 ? videos[0] : null;
        }
    );
};

/**
 * BUSCAR MÚLTIPLES TRÁILERS
 * @param {string} tituloPelicula
 * @param {number} limite
 */
export const buscarTrailersPelicula = async (tituloPelicula, limite = 3) => {
    if (!tituloPelicula) return [];

    const query = `${tituloPelicula} official trailer`;
    const resultado = await fetchYouTube('/search', {
        q: query,
        maxResults: Math.min(limite * 2, 10)
    });

    return resultado.fold(
        () => [],
        (data) => {
            // Ya no necesitamos el casting manual porque procesarVideosYouTube está tipado
            const videos = procesarVideosYouTube(data.items || []);
            return videos.slice(0, limite);
        }
    );
};

/**
 * ENRIQUECER VIDEO CON ESTADÍSTICAS
 * @param {string} videoId
 */
export const obtenerEstadisticasVideo = async (videoId) => {
    if (!videoId) return null;

    const resultado = await fetchYouTube('/videos', {
        id: videoId,
        part: 'statistics,contentDetails'
    });

    return resultado.fold(
        () => null,
        (data) => {
            if (!data.items || data.items.length === 0) return null;
            const video = data.items[0];

            const segundos = parsearDuracionISO(video.contentDetails?.duration);

            return {
                vistas: parseInt(video.statistics?.viewCount || '0'),
                likes: parseInt(video.statistics?.likeCount || '0'),
                comentarios: parseInt(video.statistics?.commentCount || '0'),
                duracionISO: video.contentDetails?.duration,
                duracionSegundos: segundos
            };
        }
    );
};