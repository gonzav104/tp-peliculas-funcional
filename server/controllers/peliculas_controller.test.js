import { jest } from '@jest/globals';

// MOCKEAMOS TODOS LOS SERVICIOS QUE USA EL CONTROLADOR
// Esto aisla el controlador: no probamos si TMDB funciona, sino si el controlador sabe llamar a TMDB.
jest.unstable_mockModule('../services/tmdb.js', () => ({
    buscarPeliculasMemo: jest.fn(),
    obtenerPeliculasPopulares: jest.fn(),
    obtenerPeliculasCalidad: jest.fn(),
    descubrirPeliculasPorDecada: jest.fn()
}));

jest.unstable_mockModule('../services/unificador.js', () => ({
    obtenerPopularesEnriquecidas: jest.fn(),
    buscarYEnriquecer: jest.fn(),
    analizarUnificacion: jest.fn(),
    enriquecerListaPeliculas: jest.fn()
}));

jest.unstable_mockModule('../services/maraton.js', () => ({
    planificarMaraton: jest.fn(),
    planificarMaratonTematico: jest.fn(),
    analizarPlan: jest.fn(),
    presetsMaraton: {}
}));

jest.unstable_mockModule('../services/youtube.js', () => ({
    buscarTrailersPelicula: jest.fn(),
    obtenerEstadisticasVideo: jest.fn()
}));

// IMPORTAMOS LOS MÓDULOS
const tmdbService = await import('../services/tmdb.js');
const maratonService = await import('../services/maraton.js');
// Importamos las funciones del controlador que vamos a probar
const { buscar, planearMaraton } = await import('./peliculas_controller.js');

// HELPER PARA SIMULAR OBJETOS DE EXPRESS (Req y Res)
const mockReq = (query = {}, body = {}) => ({ query, body });
const mockRes = () => {
    const res = {};
    // Simulamos .status() para que devuelva 'res' y permita encadenar .json()
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Controller de Películas (Validación Zod & Manejo de Errores)', () => {

    // Limpiamos los contadores de los mocks antes de cada test para que no se mezclen resultados
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // PRUEBAS PARA BÚSQUEDA
    describe('Endpoint: buscar (GET)', () => {

        test('Debe fallar (400) si falta el parámetro "q" (Validación Zod)', async () => {
            const req = mockReq({}); // Query vacía, falta 'q'
            const res = mockRes();

            await buscar(req, res);

            // Verificamos que el controlador respondió con error de cliente (400)
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: false,
                error: "Datos inválidos"
            }));
        });

        test('Debe pasar (200) si "q" es válido y devolver datos', async () => {
            const req = mockReq({ q: 'matrix' });
            const res = mockRes();

            // Simulamos que el servicio devuelve datos correctamente
            tmdbService.buscarPeliculasMemo.mockResolvedValue(['peli1', 'peli2']);

            await buscar(req, res);

            // Verificamos que no hubo error 400
            expect(res.status).not.toHaveBeenCalledWith(400);
            // Verificamos que respondió con éxito y los datos del mock
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: true,
                termino: 'matrix',
                datos: ['peli1', 'peli2']
            }));
        });

        // NUEVO TEST: VERIFICACIÓN DE MANEJO DE ERRORES CENTRALIZADO
        test('Debe lanzar el error (throw) si el servicio falla (para que Express lo atrape)', async () => {
            const req = mockReq({ q: 'error_catastrofico' });
            const res = mockRes();

            // Simulamos que el servicio (TMDB) falla y lanza una excepción
            const errorSimulado = new Error('API de TMDB caída');
            tmdbService.buscarPeliculasMemo.mockRejectedValue(errorSimulado);

            // Ejecutamos el controlador.
            // Como quitamos el try/catch, esperamos que la función "explote" (reject).
            await expect(buscar(req, res)).rejects.toThrow('API de TMDB caída');

            // Confirmamos que el controlador NO intentó responder por su cuenta (ej: res.status(500))
            // porque esa ahora es responsabilidad del Middleware.
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    //  PRUEBAS PARA MARATÓN
    describe('Endpoint: planearMaraton (POST)', () => {

        test('Debe fallar (400) si el tiempo es negativo', async () => {
            // Enviamos un tiempo inválido (-120 minutos)
            const req = mockReq({}, { tiempo: -120 });
            const res = mockRes();

            await planearMaraton(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            // Verificamos que Zod haya reportado el campo específico
            const respuestaJson = res.json.mock.calls[0][0];
            expect(respuestaJson.detalles.tiempo).toBeDefined();
        });

        test('Debe fallar (400) si el tiempo excede el límite (24hs)', async () => {
            const req = mockReq({}, { tiempo: 9000 }); // 9000 min > 1440 min
            const res = mockRes();

            await planearMaraton(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Debe pasar (200) con datos correctos', async () => {
            const req = mockReq({}, { tiempo: 120, ratingMinimo: 7 });
            const res = mockRes();

            // Mockeamos éxito en los servicios necesarios
            maratonService.planificarMaraton.mockReturnValue(['peli_planificada']);
            maratonService.analizarPlan.mockReturnValue({ duracion: 110 });

            await planearMaraton(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: true,
                plan: ['peli_planificada']
                plan: expect.objectContaining({ peliculas: ['peli_planificada'] })
            }));
        });
    });
});