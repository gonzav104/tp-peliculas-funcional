import axios from 'axios';
import { Either } from '../utils/funcional.js';
import { map, filter, pipe } from '../utils/funcional.js';

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- CONSTANTE: VIDEO DE RESPALDO (CUOTA EXCEDIDA) ---
// Usamos un video genérico (ej. intro de cine o cuenta regresiva) para no romper el frontend
const FALLBACK_VIDEO = {
    id: 'fallback_quota',
    titulo: 'Trailer no disponible (Cuota YouTube Agotada)',
    descripcion: 'Lo sentimos, se ha alcanzado el límite diario de peticiones a YouTube.',
    thumbnail: 'https://via.placeholder.com/640x360?text=Trailer+No+Disponible',
    canal: 'Sistema CineFuncional',
    fechaPublicacion: new Date().toISOString(),
    url: 'https://www.youtube.com/watch?v=EngW7tLk6R8', // Intro genérica
    urlEmbed: 'https://www.youtube.com/embed/EngW7tLk6R8',
    fuente: 'youtube'
};

// --- DEFINICIONES DE TIPOS (Igual que antes) ---
/**
 * @template T
 * @typedef {Object} EitherType
 * @property {boolean} isLeft
 * @property {function(function(T): any): EitherType} map
 * @property {function(function(any): any, function(T): any): any} fold
 */

// Capa de acceso a YouTube
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
        // Capturamos el status para saber si es un bloqueo por cuota (403)
        const status = error.response ? error.response.status : 500;

        if (status !== 403) {
            console.error(`Error YouTube [${endpoint}]:`, error.message);
        } else {
            console.warn(`⚠️ YouTube Quota Excedida [${endpoint}]`);
        }

        // @ts-ignore
        return Either.Left({
            mensaje: 'Error al consultar YouTube',
            detalle: error.message,
            endpoint,
            status: status // <--- IMPORTANTE: Pasamos el status
        });
    }
};

// Transformaciones y filtros
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

const procesarVideosYouTube = pipe(
    map(normalizarVideoYouTube),
    filter(pareceTrailerOficial)
);

// Utilidades
export const parsearDuracionISO = (duracion) => {
    if (!duracion) return 0;
    const match = duracion.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const horas = parseInt(match[1]) || 0;
    const minutos = parseInt(match[2]) || 0;
    const segundos = parseInt(match[3]) || 0;
    return horas * 3600 + minutos * 60 + segundos;
};

// --- FUNCIONES PRINCIPALES ---

/**
 * BUSCAR TRÁILER DE PELÍCULA (CON FALLBACK)
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
        // CASO ERROR (Left)
        (err) => {
            // Si el error es por cuota (403), devolvemos el video de respaldo
            if (err.status === 403) {
                return FALLBACK_VIDEO;
            }
            return null; // Otro error, devolvemos null
        },
        // CASO ÉXITO (Right)
        (data) => {
            const videos = procesarVideosYouTube(data.items || []);
            return videos.length > 0 ? videos[0] : null;
        }
    );
};

/**
 * BUSCAR MÚLTIPLES TRÁILERS
 */
export const buscarTrailersPelicula = async (tituloPelicula, limite = 3) => {
    if (!tituloPelicula) return [];

    const query = `${tituloPelicula} official trailer`;
    const resultado = await fetchYouTube('/search', {
        q: query,
        maxResults: Math.min(limite * 2, 10)
    });

    return resultado.fold(
        (err) => {
            // En plural, si hay error de cuota, podríamos devolver un array con el fallback
            if (err.status === 403) return [FALLBACK_VIDEO];
            return [];
        },
        (data) => {
            const videos = procesarVideosYouTube(data.items || []);
            return videos.slice(0, limite);
        }
    );
};

/**
 * ENRIQUECER VIDEO CON ESTADÍSTICAS
 */
export const obtenerEstadisticasVideo = async (videoId) => {
    if (!videoId) return null;
    if (videoId === FALLBACK_VIDEO.id) return null; // No buscar stats del video fake

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