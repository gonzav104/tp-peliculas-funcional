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
 * Agrupa array por key
 * @param {Array} array
 * @param {string} key
 * @returns {Object}
 */
export const agruparPor = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        const existingGroup = result[groupKey] || [];
        return {
            ...result,
            [groupKey]: [...existingGroup, item]
        };
    }, {});
};