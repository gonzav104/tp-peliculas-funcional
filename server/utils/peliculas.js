// FUNCIONES PURAS

/**
 * Define la estructura de la película que viene de la API (para que IntelliJ entienda)
 * @typedef {Object} PeliculaTMDB
 * @property {number} id
 * @property {string} title
 * @property {string} overview
 * @property {string} poster_path
 * @property {number} vote_average
 * @property {string} release_date
 */

/**
 * Transforma los datos crudos de la API en formato limpio.
 * @param {PeliculaTMDB[]} peliculasBrutas
 */

// Transformación (Map): Limpia el JSON sucio de la API
export const limpiarPeliculas = (peliculasBrutas) => {
    return peliculasBrutas.map(peli => ({
        id: peli.id,
        titulo: peli.title,
        resumen: peli.overview,
        imagen: `https://image.tmdb.org/t/p/w500${peli.poster_path}`,
        rating: peli.vote_average,
        fecha: peli.release_date
    }));
};

// Filtrado (Filter): Ejemplo, solo las que tienen poster
export const filtrarConPoster = (peliculas) => {
    return peliculas.filter(peli => peli.imagen && !peli.imagen.includes('null'));
};

// Ordenamiento (Sort): Ordenar por rating (creando copia para no mutar)
export const ordenarPorRating = (peliculas) => {
    return [...peliculas].sort((a, b) => b.rating - a.rating);
};