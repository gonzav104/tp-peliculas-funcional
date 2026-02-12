// server/utils/constants.js

export const CONFIG_TMDB = {
    BASE_URL: 'https://api.themoviedb.org/3',
    LANGUAGE: 'es-ES',
    TIMEOUT: 5000 // 5 segundos
};

export const LIMITES = {
    // Modo Ahorro vs Producción
    BUSQUEDA_AHORRO: 2,
    BUSQUEDA_PROD: 60,
    MARATON_AHORRO: 3,
    MARATON_PROD: 15,
    RESULTADOS_POR_PAGINA: 20
};

export const ERRORES = {
    TMDB_CONNECTION: 'Error al conectar con el servicio de películas (TMDB)',
    YOUTUBE_QUOTA: 'Cuota de YouTube excedida o error de conexión',
    VALIDACION: 'Los datos enviados no tienen el formato correcto',
    NO_RESULTADOS: 'No se encontraron resultados para tu búsqueda'
};