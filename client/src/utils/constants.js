/**
 * Constantes y configuración de la aplicación
 */

// === API CONFIGURATION ===
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3
};

// === GÉNEROS DISPONIBLES ===
export const GENEROS = [
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'History',
    'Horror',
    'Music',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Sci-Fi',
    'Thriller',
    'TV Movie',
    'War',
    'Western'
];

// === DÉCADAS ===
export const DECADAS = [
    { label: '1970s', value: 1970 },
    { label: '1980s', value: 1980 },
    { label: '1990s', value: 1990 },
    { label: '2000s', value: 2000 },
    { label: '2010s', value: 2010 },
    { label: '2020s', value: 2020 }
];

// === PRESETS DE TIEMPO ===
export const PRESETS_TIEMPO = {
    CORTITO: 90,        // 1.5 horas
    TARDE: 240,         // 4 horas
    NOCHE: 360,         // 6 horas
    FIN_DE_SEMANA: 720, // 12 horas
    DIA_COMPLETO: 960   // 16 horas
};

// === RATING THRESHOLDS ===
export const RATING_THRESHOLDS = {
    EXCELENTE: 8.0,
    BUENO: 7.0,
    REGULAR: 5.0,
    MALO: 0
};

// === BREAKPOINTS ===
export const BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1440
};

// === COLORES ===
export const COLORS = {
    PRIMARY: '#e10050',
    PRIMARY_DARK: '#c70039',
    SECONDARY: '#ff6b9d',
    BG_DARK: '#0a0a0f',
    BG_CARD: '#1a1a2e',
    BG_CARD_HOVER: '#16213e',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a0a0a0',
    SUCCESS: '#00d084',
    WARNING: '#ffd700',
    ERROR: '#ff4d4d'
};

// === LÍMITES ===
export const LIMITS = {
    MIN_TIEMPO: 60,           // 1 hora
    MAX_TIEMPO: 1440,         // 24 horas
    MIN_RATING: 0,
    MAX_RATING: 10,
    MIN_PELICULAS: 1,
    MAX_PELICULAS: 20,
    PELICULAS_POR_PAGINA: 12
};

// === MENSAJES ===
export const MESSAGES = {
    LOADING_DEFAULT: 'Cargando datos...',
    LOADING_PELICULAS: 'Agregando datos de múltiples fuentes...',
    LOADING_MARATON: 'Optimizando tu maratón con algoritmos funcionales...',
    ERROR_NETWORK: 'Error de conexión. Verifica tu internet.',
    ERROR_SERVER: 'El servidor no responde. Intenta más tarde.',
    ERROR_UNKNOWN: 'Ocurrió un error inesperado.',
    EMPTY_PELICULAS: 'No se encontraron películas.',
    EMPTY_MARATON: 'No hay películas que cumplan los criterios.'
};

// === LOCAL STORAGE KEYS ===
export const STORAGE_KEYS = {
    FAVORITOS: 'cine_funcional_favoritos',
    HISTORIAL_MARATONES: 'cine_funcional_maratones',
    PREFERENCIAS: 'cine_funcional_preferencias'
};