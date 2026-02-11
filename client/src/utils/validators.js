import { LIMITS } from './constants';

/**
 * Validadores para formularios del planificador de maratones
 */

/**
 * Valida configuración de maratón automático
 * @param {Object} config
 * @returns {Object} - { isValid, errors }
 */
export const validarMaratonAutomatico = (config) => {
    const errors = {};

    // Validar tiempo
    if (!config.tiempo) {
        errors.tiempo = 'El tiempo es requerido';
    } else if (config.tiempo < LIMITS.MIN_TIEMPO) {
        errors.tiempo = `El tiempo mínimo es ${LIMITS.MIN_TIEMPO} minutos`;
    } else if (config.tiempo > LIMITS.MAX_TIEMPO) {
        errors.tiempo = `El tiempo máximo es ${LIMITS.MAX_TIEMPO} minutos`;
    }

    // Validar rating mínimo
    if (config.ratingMinimo !== undefined) {
        if (config.ratingMinimo < LIMITS.MIN_RATING) {
            errors.ratingMinimo = `El rating mínimo es ${LIMITS.MIN_RATING}`;
        } else if (config.ratingMinimo > LIMITS.MAX_RATING) {
            errors.ratingMinimo = `El rating máximo es ${LIMITS.MAX_RATING}`;
        }
    }

    // Validar máximo de películas
    if (config.maximoPeliculas !== undefined) {
        if (config.maximoPeliculas < LIMITS.MIN_PELICULAS) {
            errors.maximoPeliculas = `Mínimo ${LIMITS.MIN_PELICULAS} película`;
        } else if (config.maximoPeliculas > LIMITS.MAX_PELICULAS) {
            errors.maximoPeliculas = `Máximo ${LIMITS.MAX_PELICULAS} películas`;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida configuración de maratón temático
 * @param {Object} config
 * @returns {Object}
 */
export const validarMaratonTematico = (config) => {
    const errors = {};

    // Validar tiempo
    if (!config.tiempo) {
        errors.tiempo = 'El tiempo es requerido';
    } else if (config.tiempo < LIMITS.MIN_TIEMPO) {
        errors.tiempo = `El tiempo mínimo es ${LIMITS.MIN_TIEMPO} minutos`;
    } else if (config.tiempo > LIMITS.MAX_TIEMPO) {
        errors.tiempo = `El tiempo máximo es ${LIMITS.MAX_TIEMPO} minutos`;
    }

    // Validar géneros
    if (!config.generos || !Array.isArray(config.generos)) {
        errors.generos = 'Debes seleccionar géneros';
    } else if (config.generos.length === 0) {
        errors.generos = 'Selecciona al menos un género';
    } else if (config.generos.length > 5) {
        errors.generos = 'Selecciona máximo 5 géneros';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida configuración de maratón por década
 * @param {Object} config
 * @returns {Object}
 */
export const validarMaratonDecada = (config) => {
    const errors = {};

    // Validar tiempo
    if (!config.tiempo) {
        errors.tiempo = 'El tiempo es requerido';
    } else if (config.tiempo < LIMITS.MIN_TIEMPO) {
        errors.tiempo = `El tiempo mínimo es ${LIMITS.MIN_TIEMPO} minutos`;
    } else if (config.tiempo > LIMITS.MAX_TIEMPO) {
        errors.tiempo = `El tiempo máximo es ${LIMITS.MAX_TIEMPO} minutos`;
    }

    // Validar década
    if (!config.decada) {
        errors.decada = 'Debes seleccionar una década';
    } else if (config.decada < 1900) {
        errors.decada = 'Década muy antigua';
    } else if (config.decada > 2030) {
        errors.decada = 'Década muy futura';
    } else if (config.decada % 10 !== 0) {
        errors.decada = 'Debe ser una década válida (ej: 1990, 2000)';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valida una búsqueda de películas
 * @param {string} termino
 * @returns {Object}
 */
export const validarBusqueda = (termino) => {
    const errors = {};

    if (!termino || termino.trim().length === 0) {
        errors.termino = 'Ingresa un término de búsqueda';
    } else if (termino.length < 2) {
        errors.termino = 'Mínimo 2 caracteres';
    } else if (termino.length > 100) {
        errors.termino = 'Máximo 100 caracteres';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Sanitiza entrada de usuario
 * @param {string} input
 * @returns {string}
 */
export const sanitizarInput = (input) => {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[<>]/g, '') // Eliminar tags HTML básicos
        .substring(0, 500);    // Limitar longitud
};

/**
 * Valida formato de email (si se necesita)
 * @param {string} email
 * @returns {boolean}
 */
export const esEmailValido = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Valida que un número esté en rango
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const estaEnRango = (value, min, max) => {
    return value >= min && value <= max;
};