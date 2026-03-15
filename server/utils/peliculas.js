import { map, filter, sort, pipe, curry } from './funcional.js';

// --- TYPEDEFS (Documentación) ---
/**
 * @typedef {Object} PeliculaTMDB
 * @property {number} id
 * @property {string} title
 * @property {string} overview
 * @property {string} poster_path
 * @property {number} vote_average
 * @property {string} release_date
 */

/**
 * @typedef {Object} PeliculaLimpia
 * @property {number} id
 * @property {string} titulo
 * @property {string} resumen
 * @property {string} imagen
 * @property {number} rating
 * @property {string} fecha
 * @property {string} fuente
 */

// Transformaciones (MAP)
const normalizarPeliculaTMDB = (peli) => ({
    id: peli.id,
    titulo: peli.title,
    resumen: peli.overview || 'Sin descripción disponible',
    imagen: peli.poster_path
        ? `https://image.tmdb.org/t/p/w500${peli.poster_path}`
        : null,
    rating: peli.vote_average || 0,
    fecha: peli.release_date || 'Fecha desconocida',
    fuente: 'tmdb'
});

export const limpiarPeliculas = map(normalizarPeliculaTMDB);

// Filtros (FILTER)
const tienePosterValido = (peli) =>
    peli.imagen !== null && !peli.imagen.includes('null');

const tieneRatingMinimo = curry((minimo, peli) =>
    peli.rating >= minimo
);

const tieneDescripcion = (peli) =>
    peli.resumen && peli.resumen !== 'Sin descripción disponible';

// Filtros Exportables
export const filtrarConPoster = filter(tienePosterValido);

export const filtrarPorRatingMinimo = (rating) =>
    filter(tieneRatingMinimo(rating));

export const filtrarConDescripcion = filter(tieneDescripcion);

// Ordenamientos (SORT)

const compararPorRating = (a, b) => b.rating - a.rating;

export const ordenarPorRating = sort(compararPorRating);

// Pipelines (COMPOSICIÓN)

/**
 * Pipeline Estándar: Limpiar -> Filtrar Poster -> Ordenar Rating
 */
export const procesarPeliculasEstandar = pipe(
    limpiarPeliculas,
    filtrarConPoster,
    ordenarPorRating
);

/**
 * Pipeline Calidad: Estándar + Filtro Rating + Filtro Descripción
 */
export const procesarPeliculasCalidad = pipe(
    limpiarPeliculas,
    filtrarConPoster,
    filtrarPorRatingMinimo(7.0),
    filtrarConDescripcion,
    ordenarPorRating
);

// --- Normalización de proveedores de streaming ---

/**
 * Normaliza un proveedor de streaming de TMDB
 * @param {{ provider_id: number, provider_name: string, logo_path: string }} proveedor
 * @returns {{ id: number, nombre: string, logo: string }}
 */
export const normalizarProveedor = (proveedor) => ({
    id: proveedor.provider_id,
    nombre: proveedor.provider_name,
    logo: `https://image.tmdb.org/t/p/original${proveedor.logo_path}`
});

/**
 * Deduplica un array de proveedores por id (conserva la primera aparición)
 * @param {Array} proveedores
 * @returns {Array}
 */
const deduplicarPorId = (proveedores) =>
    proveedores.reduce((acc, prov) =>
        acc.some(p => p.id === prov.id) ? acc : [...acc, prov],
    []);

/**
 * Normaliza los datos de streaming de una región de TMDB
 * @param {Object} datosRegion - Objeto de región (ej: data.results.AR)
 * @returns {{ suscripcion: Array, compra: Array }}
 */
export const normalizarStreamingTMDB = (datosRegion) => {
    const suscripcionRaw = (datosRegion?.flatrate || []).map(normalizarProveedor);
    const compraRaw = (datosRegion?.buy || []).map(normalizarProveedor);

    return {
        suscripcion: deduplicarPorId(suscripcionRaw),
        compra: deduplicarPorId(compraRaw)
    };
};