// server/utils/logger.js

const obtenerFecha = () => new Date().toISOString();

export const logger = {
    info: (mensaje, contexto = '') => {
        console.log(`[${obtenerFecha()}] [INFO] ${mensaje}`, contexto ? JSON.stringify(contexto) : '');
    },
    error: (mensaje, error = '') => {
        console.error(`[${obtenerFecha()}] [ERROR] ${mensaje}`, error);
    },
    warn: (mensaje, contexto = '') => {
        console.warn(`[${obtenerFecha()}] [WARN] ${mensaje}`, contexto ? JSON.stringify(contexto) : '');
    },
    debug: (mensaje, contexto = '') => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[${obtenerFecha()}] [DEBUG] ${mensaje}`, contexto);
        }
    }
};