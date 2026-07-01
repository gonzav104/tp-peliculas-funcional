import { RATING_THRESHOLDS, COLORS } from './constants';

/**
 * Formatea minutos a formato "Xh Ym"
 * @param {number} minutos
 * @returns {string}
 */
export const formatearTiempo = (minutos) => {
    if (!minutos || minutos < 0) return '0h 0m';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
};

/**
 * Formatea rating a un decimal
 * @param {number} rating
 * @returns {string}
 */
export const formatearRating = (rating) => {
    if (typeof rating !== 'number') return 'N/A';
    return rating.toFixed(1);
};

/**
 * Obtiene el color según el rating
 * @param {number} rating
 * @returns {string} - Color hex
 */
export const obtenerColorRating = (rating) => {
    if (rating >= RATING_THRESHOLDS.EXCELENTE) return COLORS.SUCCESS;
    if (rating >= RATING_THRESHOLDS.BUENO) return COLORS.WARNING;
    if (rating >= RATING_THRESHOLDS.REGULAR) return '#ff9500';
    return COLORS.ERROR;
};

/**
 * Obtiene la clase CSS según el rating
 * @param {number} rating
 * @returns {string} - Nombre de clase
 */
export const obtenerClaseRating = (rating) => {
    if (rating >= RATING_THRESHOLDS.EXCELENTE) return 'ratingExcelente';
    if (rating >= RATING_THRESHOLDS.BUENO) return 'ratingBueno';
    if (rating >= RATING_THRESHOLDS.REGULAR) return 'ratingRegular';
    return 'ratingMalo';
};

/**
 * Trunca texto a una longitud específica
 * @param {string} texto
 * @param {number} maxLength
 * @returns {string}
 */
export const truncarTexto = (texto, maxLength = 150) => {
    if (!texto || texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength).trim() + '...';
};

/**
 * Formatea fecha a formato legible
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string}
 */
export const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha desconocida';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Extrae el año de una fecha
 * @param {string} fecha
 * @returns {number|string}
 */
export const obtenerAnio = (fecha) => {
    if (!fecha) return 'N/A';
    const anio = parseInt(fecha.split('-')[0]);
    return isNaN(anio) ? 'N/A' : anio;
};

/**
 * Valida si una URL es válida
 * @param {string} url
 * @returns {boolean}
 */
export const esUrlValida = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Genera ID único simple
 * @returns {string}
 */
export const generarId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calcula porcentaje
 * @param {number} parte
 * @param {number} total
 * @returns {number}
 */
export const calcularPorcentaje = (parte, total) => {
    if (!total || total === 0) return 0;
    return (parte / total) * 100;
};

/**
 * Clamp de un valor entre min y max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Debounce de una función
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Formatea número grande (1000 -> 1K)
 * @param {number} num
 * @returns {string}
 */
export const formatearNumeroGrande = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

/**
 * Agrupa array por key
 * @param {Array} array
 * @param {string} key
 * @returns {Object}
 */
export const agruparPor = (array, key) => {
    // Reducir de forma inmutable: en cada iteración retornamos un nuevo objeto
    return array.reduce((result, item) => {
        const groupKey = item[key];
        const existingGroup = result[groupKey] || [];
        return {
            ...result,
            [groupKey]: [...existingGroup, item]
        };
    }, {});
};

/**
 * Ordena array por key
 * @param {Array} array
 * @param {string} key
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array}
 */
export const ordenarPor = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

/**
 * Elimina duplicados de array
 * @param {Array} array
 * @param {string} key - Opcional: key para comparar objetos
 * @returns {Array}
 */
export const eliminarDuplicados = (array, key = null) => {
    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) {
            return false;
        }
        seen.add(val);
        return true;
    });
};

/**
 * Extrae query params de URL
 * @param {string} url
 * @returns {Object}
 */
export const obtenerQueryParams = (url) => {
    const params = {};
    const searchParams = new URLSearchParams(url.split('?')[1]);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
};

/**
 * Copia texto al portapapeles
 * @param {string} texto
 * @returns {Promise<boolean>}
 */
export const copiarAlPortapapeles = async (texto) => {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (error) {
        console.error('Error al copiar:', error);
        return false;
    }
};

/**
 * Descarga un archivo
 * @param {string} contenido
 * @param {string} nombreArchivo
 * @param {string} mimeType
 */
export const descargarArchivo = (contenido, nombreArchivo, mimeType = 'text/plain') => {
    const blob = new Blob([contenido], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Genera texto de maratón para exportar
 * @param {Object} plan
 * @returns {string}
 */
export const exportarMaraton = (plan) => {
    if (!plan || !plan.peliculas) return '';

    let texto = `🎬 MI MARATÓN DE PELÍCULAS\n\n`;
    texto += `⏱️ Duración total: ${formatearTiempo(plan.tiempoTotal)}\n`;
    texto += `⭐ Rating promedio: ${formatearRating(plan.ratingPromedio)}\n`;
    texto += `🎯 Películas: ${plan.cantidadPeliculas}\n\n`;
    texto += `SECUENCIA:\n`;
    texto += `${'='.repeat(50)}\n\n`;

    plan.peliculas.forEach((peli, index) => {
        texto += `${index + 1}. ${peli.titulo}\n`;
        texto += `   ⏱️ ${formatearTiempo(peli.duracion)}\n`;
        texto += `   ⭐ ${formatearRating(peli.rating)}\n`;
        if (peli.generos && peli.generos.length > 0) {
            texto += `   🎭 ${peli.generos.slice(0, 3).join(', ')}\n`;
        }
        texto += `\n`;
    });

    texto += `${'='.repeat(50)}\n`;
    texto += `\nGenerado por CineFuncional - Pipeline Funcional de Películas`;

    return texto;
};