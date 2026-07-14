import { jest } from '@jest/globals';

// MOCKEAMOS TODOS LOS SERVICIOS QUE USA EL CONTROLADOR
// Esto aisla el controlador: no probamos si TMDB funciona, sino si el controlador sabe llamar a TMDB.
jest.unstable_mockModule('../services/tmdb.js', () => ({
    buscarPeliculasMemo: jest.fn(),
    obtenerPeliculasPopulares: jest.fn(),
    obtenerPeliculasCalidad: jest.fn(),
    descubrirPeliculasPorDecada: jest.fn(),
    descubrirPeliculasPorGenero: jest.fn()
}));

jest.unstable_mockModule('../services/unificador.js', () => ({
    obtenerPopularesEnriquecidas: jest.fn(),
    buscarYEnriquecer: jest.fn(),
    analizarUnificacion: jest.fn(),
    enriquecerListaPeliculas: jest.fn()
}));

jest.unstable_mockModule('../services/maraton.js', () => ({
    planificarMaraton: jest.fn(),
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
                error: "Los datos enviados no tienen el formato correcto"
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
            const planMock = { peliculas: ['peli_planificada'], tiempoTotal: 110, ratingPromedio: 7.5, cantidadPeliculas: 1 };
            maratonService.planificarMaraton.mockReturnValue(planMock);
            maratonService.analizarPlan.mockReturnValue({ duracion: 110 });

            await planearMaraton(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: true,
                plan: expect.objectContaining({ peliculas: ['peli_planificada'] })
            }));
        });

        test('Debe consultar 3 páginas en maratón temático, enriquecer y planificar', async () => {
            const { planearMaratonTematico } = await import('./peliculas_controller.js');
            const req = mockReq({}, { tiempo: 180, generos: ['Acción'], ratingMinimo: 6, maximoPeliculas: 10 });
            const res = mockRes();

            // Mock: 3 páginas devuelven distintas películas
            tmdbService.descubrirPeliculasPorGenero
                .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
                .mockResolvedValueOnce([{ id: 3 }])
                .mockResolvedValueOnce([{ id: 4 }, { id: 5 }, { id: 6 }]);

            // Mock: enriquecimiento devuelve las películas con datos completos
            const unificador = await import('../services/unificador.js');
            unificador.enriquecerListaPeliculas.mockResolvedValue([
                { id: 1, titulo: 'Peli 1', rating: 8.0, duracion: 90, generos: ['Acción'] },
                { id: 4, titulo: 'Peli 4', rating: 7.0, duracion: 120, generos: ['Acción'] }
            ]);

            const planMock = { peliculas: ['peli_tematica'], tiempoTotal: 100, ratingPromedio: 7.2, cantidadPeliculas: 1 };
            maratonService.planificarMaraton.mockReturnValue(planMock);
            maratonService.analizarPlan.mockReturnValue({ eficienciaTemporal: '55.6%', peliculasExcelentes: 1, tiempoLibre: '1h 20m', calidadGeneral: 'Buena' });

            await planearMaratonTematico(req, res);

            expect(tmdbService.descubrirPeliculasPorGenero).toHaveBeenCalledTimes(3);
            expect(tmdbService.descubrirPeliculasPorGenero).toHaveBeenNthCalledWith(1, ['Acción'], 1);
            expect(tmdbService.descubrirPeliculasPorGenero).toHaveBeenNthCalledWith(2, ['Acción'], 2);
            expect(tmdbService.descubrirPeliculasPorGenero).toHaveBeenNthCalledWith(3, ['Acción'], 3);
            // Ahora usa planificarMaraton en vez de planificarMaratonTematico
            expect(maratonService.planificarMaraton).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ id: 1 })]),
                180,
                expect.objectContaining({ maximoPeliculas: 10 })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: true,
                plan: expect.objectContaining({ peliculas: ['peli_tematica'] })
            }));
        });
        
        test('Debe consultar 3 páginas en maratón por década y enriquecer', async () => {
            const { planearMaratonDecada } = await import('./peliculas_controller.js');
            const req = mockReq({}, { tiempo: 240, decada: 1990, ratingMinimo: 6 });
            const res = mockRes();

            // Mock: 3 páginas con películas de la década
            tmdbService.descubrirPeliculasPorDecada
                .mockResolvedValueOnce([{ id: 10 }, { id: 11 }])
                .mockResolvedValueOnce([{ id: 12 }])
                .mockResolvedValueOnce([{ id: 13 }, { id: 14 }]);

            const unificador = await import('../services/unificador.js');
            unificador.enriquecerListaPeliculas.mockResolvedValue([
                { id: 10, titulo: 'Clásico 1', rating: 8.5, duracion: 110, generos: ['Drama'] }
            ]);

            const planMock = { peliculas: ['peli_decada'], tiempoTotal: 110, ratingPromedio: 8.5, cantidadPeliculas: 1 };
            maratonService.planificarMaraton.mockReturnValue(planMock);
            maratonService.analizarPlan.mockReturnValue({ eficienciaTemporal: '45.8%', peliculasExcelentes: 1, tiempoLibre: '2h 10m', calidadGeneral: 'Excelente' });

            await planearMaratonDecada(req, res);

            expect(tmdbService.descubrirPeliculasPorDecada).toHaveBeenCalledTimes(3);
            expect(tmdbService.descubrirPeliculasPorDecada).toHaveBeenNthCalledWith(1, 1990, 1);
            expect(tmdbService.descubrirPeliculasPorDecada).toHaveBeenNthCalledWith(2, 1990, 2);
            expect(tmdbService.descubrirPeliculasPorDecada).toHaveBeenNthCalledWith(3, 1990, 3);
            expect(unificador.enriquecerListaPeliculas).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                exito: true,
                plan: expect.objectContaining({ peliculas: ['peli_decada'] })
            }));
        });
    });
});