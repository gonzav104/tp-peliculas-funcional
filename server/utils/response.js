// server/utils/response.js

/**
 * Envía una respuesta de éxito estandarizada.
 * @param {Object} res - Objeto response de Express
 * @param {Object} data - Datos a enviar
 * @param {number} status - Código HTTP (default 200)
 */
export const success = (res, data, status = 200) => {
    res.status(status).json({
        exito: true,
        ...data
    });
};

/**
 * Envía una respuesta de error estandarizada.
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} status - Código HTTP (default 500)
 * @param {Object|null} details - Detalles técnicos opcionales
 */
export const error = (res, message, status = 500, details = null) => {
    res.status(status).json({
        exito: false,
        error: message,
        detalles: details
    });
};