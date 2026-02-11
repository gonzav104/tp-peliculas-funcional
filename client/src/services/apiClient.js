const BASE_URL = 'http://localhost:3000/api';

/**
 * Cliente HTTP centralizado con manejo de errores
 * @param {string} endpoint - Ruta relativa (ej: '/peliculas/populares')
 * @param {object} options - Opciones de fetch
 * @returns {Promise<object>} - Respuesta parseada del backend
 */
const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        // El backend SIEMPRE envuelve las respuestas con { exito: true/false }
        if (!data.exito) {
            throw new Error(data.error || 'Error desconocido del servidor');
        }

        return data;

    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
};

// === ENDPOINTS DE PELÍCULAS ===

/**
 * Obtener películas populares básicas (sin enriquecimiento)
 */
export const obtenerPeliculasPopulares = async () => {
    const response = await apiRequest('/peliculas/populares');
    return response.datos; // Desempaquetamos el array
};

/**
 * Obtener películas populares enriquecidas (con tráilers de YouTube)
 * @param {number} limite - Cantidad de películas (default: 10)
 */
export const obtenerPeliculasEnriquecidas = async (limite = 12) => {
    const response = await apiRequest(`/peliculas/populares-enriquecidas?limite=${limite}`);
    return {
        peliculas: response.datos,
        estadisticas: response.estadisticas,
        cantidad: response.cantidad,
    };
};

/**
 * Buscar películas por término (Básica - Sin trailers)
 * @param {string} termino - Texto de búsqueda
 * @param {number} limite - Límite de resultados
 */
export const buscarPeliculas = async (termino, limite = 10) => {
    const response = await apiRequest(`/peliculas/buscar?q=${encodeURIComponent(termino)}&limite=${limite}`);
    return response.datos;
};

/**
 * NUEVA FUNCIÓN AGREGADA
 * Buscar películas enriquecidas (con tráilers de YouTube) por término
 * @param {string} termino - Texto de búsqueda
 * @param {number} limite - Límite de resultados
 */
export const buscarPeliculasEnriquecidas = async (termino, limite = 10) => {
    const response = await apiRequest(`/peliculas/buscar-enriquecida?q=${encodeURIComponent(termino)}&limite=${limite}`);
    return {
        peliculas: response.datos,
        estadisticas: response.estadisticas || null,
        cantidad: response.cantidad,
    };
};

// === ENDPOINTS DE MARATONES ===

/**
 * Planificar maratón automático (algoritmo optimizado)
 * @param {object} config - { tiempo: number, ratingMinimo?: number, maximoPeliculas?: number }
 */
export const planificarMaraton = async (config) => {
    const response = await apiRequest('/peliculas/maraton', {
        method: 'POST',
        body: JSON.stringify(config),
    });
    return {
        plan: response.plan,
        analisis: response.analisis,
    };
};

/**
 * Planificar maratón temático (por géneros)
 * @param {object} config - { tiempo, generos, ratingMinimo, maximoPeliculas }
 */
export const planificarMaratonTematico = async (config) => {
    const response = await apiRequest('/peliculas/maraton-tematico', {
        method: 'POST',
        body: JSON.stringify(config),
    });
    return {
        plan: response.plan,
        analisis: response.analisis,
        tematica: response.tematica,
    };
};

/**
 * Planificar maratón por década
 * @param {object} config - { tiempo: number, decada: number }
 */
export const planificarMaratonDecada = async (config) => {
    const response = await apiRequest('/peliculas/maraton-decada', {
        method: 'POST',
        body: JSON.stringify(config),
    });
    return {
        plan: response.plan,
        analisis: response.analisis,
        tematica: response.tematica,
    };
};

/**
 * Obtener presets de tiempo predefinidos
 */
export const obtenerPresetsMaraton = async () => {
    const response = await apiRequest('/peliculas/maraton/presets');
    return response.presets;
};