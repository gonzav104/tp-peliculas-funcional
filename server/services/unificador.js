// Este módulo implementa el CORE del paradigma funcional aplicado al problema de integración de datos heterogéneos.

import { obtenerDetallesPelicula } from './tmdb.js';
import { buscarTrailerPelicula } from './youtube.js';


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
    // Retornamos directamente con casting para evitar variable redundante
    return /** @type {PeliculaEnriquecida} */ ({
        ...datosTMDB,

        // Enriquecimiento con YouTube
        trailer: datosYouTube ? {
            id: datosYouTube.id,
            titulo: datosYouTube.titulo,
            url: datosYouTube.url,
            urlEmbed: datosYouTube.urlEmbed,
            thumbnail: datosYouTube.thumbnail,
            canal: datosYouTube.canal
        } : null,

        // Metadata de unificación
        fuentes: datosYouTube ? ['tmdb', 'youtube'] : ['tmdb'],
        fechaUnificacion: new Date().toISOString(),

        // Flag de completitud
        estaCompleta: datosYouTube !== null
    });
};

/**
 * VALIDAR DATOS UNIFICADOS
 * Verifica que los campos críticos existan
 * PURA: Solo valida, no modifica
 * @param {PeliculaEnriquecida} pelicula
 */
const esUnificacionValida = (pelicula) => {
    return Boolean(
        pelicula.id &&
        pelicula.titulo &&
        pelicula.imagen &&
        pelicula.rating !== undefined
    );
};

// Operaciones de enriquecimiento
/**
 * ENRIQUECER UNA PELÍCULA
 * Combina datos de TMDB y YouTube de forma concurrente
 *
 * @param {number} idPelicula - ID de TMDB
 * @returns {Promise<PeliculaEnriquecida|null>}
 */
export const enriquecerPelicula = async (idPelicula) => {
    try {
        // Obtener datos de TMDB
        const datosTMDB = await obtenerDetallesPelicula(idPelicula);

        if (!datosTMDB) {
            console.warn(`No se encontró película con ID ${idPelicula} en TMDB`);
            return null;
        }

        // Extraer info para busqueda en YouTube
        const anio = datosTMDB.fecha
            ? parseInt(datosTMDB.fecha.split('-')[0])
            : null;

        // Buscar trailer
        const datosYouTube = await buscarTrailerPelicula(datosTMDB.titulo, anio)
            .catch(error => {
                console.warn(`YouTube falló para "${datosTMDB.titulo}":`, error);
                return null; // No romper el flujo si YouTube falla
            });

        // Combinar (función pura)
        const peliculaUnificada = combinarFuentes(datosTMDB, datosYouTube);

        // Validar
        if (!esUnificacionValida(peliculaUnificada)) {
            console.error('Unificación inválida:', peliculaUnificada);
            return null;
        }

        return peliculaUnificada;

    } catch (error) {
        console.error(`Error al enriquecer película ${idPelicula}:`, error);
        return null;
    }
};

/**
 * ENRIQUECER MÚLTIPLES PELÍCULAS (CONCURRENTE)
 * Procesa varias películas en paralelo usando Promise.all
 *
 * CONCEPTO CLAVE:
 * Promise.all actúa como un COMBINADOR FUNCIONAL:
 * Toma un array de Promises y retorna una Promise del array de resultados
 *
 * @param {Array<number>} idsPeliculas - Array de identificadores
 * @returns {Promise<Array<PeliculaEnriquecida>>}
 */
export const enriquecerPeliculasLote = async (idsPeliculas) => {
    console.log(`🔄 Enriqueciendo ${idsPeliculas.length} películas en paralelo...`);

    // Lanzar todas las peticiones en paralelo
    const promesas = idsPeliculas.map(id => enriquecerPelicula(id));

    // Esperar a que todas terminen
    const resultados = await Promise.all(promesas);

    // Filtrar nulls (peliculas que fallaron)
    const peliculasValidas = resultados.filter(p => p !== null);

    console.log(`✅ ${peliculasValidas.length}/${idsPeliculas.length} películas enriquecidas exitosamente`);

    return peliculasValidas;
};

/**
 * ENRIQUECER LISTA DE PELÍCULAS SIMPLES
 * Toma el output del pipeline básico y lo enriquece
 *
 * @param {Array<Object>} peliculasSimples - Output de TMDB básico
 * @returns {Promise<Array<PeliculaEnriquecida>>}
 */
export const enriquecerListaPeliculas = async (peliculasSimples) => {
    if (!peliculasSimples || peliculasSimples.length === 0) {
        return [];
    }

    // Extraer IDs
    const ids = peliculasSimples.map(p => p.id);

    // Enriquecer en lote
    return await enriquecerPeliculasLote(ids);
};

// Pipelines completos
/**
 * OBTENER PELÍCULAS POPULARES ENRIQUECIDAS
 * Pipeline completo: TMDB -> Enriquecer con YouTube
 *
 * @param {number} limite - Cantidad de películas
 * @returns {Promise<Array<PeliculaEnriquecida>>}
 */
export const obtenerPopularesEnriquecidas = async (limite = 10) => {
    // Importar aca para evitar dependencias circulares
    const { obtenerPeliculasPopulares } = await import('./tmdb.js');

    const peliculasBasicas = await obtenerPeliculasPopulares();
    const top = peliculasBasicas.slice(0, limite);

    return await enriquecerListaPeliculas(top);
};

/**
 * BUSCAR Y ENRIQUECER
 * Caso de uso: búsqueda del usuario con máximo detalle
 *
 * @param {string} termino - Término de búsqueda
 * @param {number} limite - Cantidad máxima
 * @returns {Promise<Array<PeliculaEnriquecida>>}
 */
export const buscarYEnriquecer = async (termino, limite = 5) => {
    const { buscarPeliculas } = await import('./tmdb.js');

    const resultados = await buscarPeliculas(termino);
    const top = resultados.slice(0, limite);

    return await enriquecerListaPeliculas(top);
};

// Análisis de unificación
/**
 * CALCULAR ESTADÍSTICAS DE UNIFICACIÓN
 * Analiza qué tan completa está la información
 * PURA: Solo calcula, no modifica
 *
 * @param {Array<PeliculaEnriquecida>} peliculas
 * @returns {Object} - Estadísticas
 */
export const analizarUnificacion = (peliculas) => {
    const total = peliculas.length;

    if (total === 0) {
        return { total: 0, tasaExito: 0 };
    }

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