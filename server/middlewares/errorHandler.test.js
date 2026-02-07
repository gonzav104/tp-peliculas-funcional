import { jest } from '@jest/globals';
import { errorHandler } from './errorHandler.js';

describe('Middleware de Errores', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            // Simulamos funciones encadenables: res.status().json()
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        // Silenciamos el console.error para que no ensucie el reporte del test
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Debe responder con status 500 y mensaje genérico por defecto', () => {
        const err = new Error('Algo explotó en la base de datos');

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            exito: false,
            error: 'Error Interno del Servidor',
            mensaje: 'Algo explotó en la base de datos'
        }));
    });

    test('Debe respetar el statusCode si el error lo trae', () => {
        const err = new Error('Recurso no encontrado');
        err.statusCode = 404; // Simulamos un error custom
        err.name = 'NotFoundError';

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'NotFoundError',
            mensaje: 'Recurso no encontrado'
        }));
    });
});