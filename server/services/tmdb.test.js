import { jest } from '@jest/globals';

// Definimos el mock
// "Cuando alguien pida 'axios', dale este objeto falso"
jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn(), // Solo simulamos el método .get()
    },
}));

// Importamos el mock de axios para poder controlarlo
const { default: axiosMock } = await import('axios');

// Importamos la función que queremos probar
const { buscarPeliculasMemo, obtenerProveedoresStreaming } = await import('./tmdb.js');

describe('Pruebas de Caché en TMDB', () => {

    // Limpiamos los contadores antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe consultar a la API (axios) la primera vez (MISS)', async () => {
        // Configuramos la respuesta falsa: lista vacía
        axiosMock.get.mockResolvedValue({
            data: { results: [] }
        });

        // Ejecutamos
        await buscarPeliculasMemo('avatar');

        // Verificamos que se llamó a la API real
        expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });

    test('NO debe consultar a la API la segunda vez (HIT)', async () => {
        // Configuramos respuesta falsa
        axiosMock.get.mockResolvedValue({
            data: { results: [] }
        });

        // Primera llamada = API + Guardar
        await buscarPeliculasMemo('titanic');

        // Segunda llamada = Leer de Memoria
        await buscarPeliculasMemo('titanic');

        // Verificación CLAVE: Solo 1 llamada a axios en total
        expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });
});

describe('Proveedores de Streaming', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe retornar proveedores para Argentina (AR) como prioridad', async () => {
        axiosMock.get.mockResolvedValue({
            data: {
                results: {
                    AR: {
                        flatrate: [
                            { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }
                        ],
                        buy: [
                            { provider_id: 3, provider_name: 'Google Play', logo_path: '/gplay.png' }
                        ]
                    },
                    US: {
                        flatrate: [
                            { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/disney.png' }
                        ]
                    }
                }
            }
        });

        const resultado = await obtenerProveedoresStreaming(999);

        // Debe tomar AR (prioridad) y no US
        expect(resultado.suscripcion).toHaveLength(1);
        expect(resultado.suscripcion[0].nombre).toBe('Netflix');
        expect(resultado.suscripcion[0].id).toBe(8);
        expect(resultado.suscripcion[0].logo).toBe('https://image.tmdb.org/t/p/original/netflix.png');
        expect(resultado.compra).toHaveLength(1);
        expect(resultado.compra[0].nombre).toBe('Google Play');
    });

    test('Debe usar fallback a ES si AR no está disponible', async () => {
        axiosMock.get.mockResolvedValue({
            data: {
                results: {
                    ES: {
                        flatrate: [
                            { provider_id: 149, provider_name: 'Movistar Plus', logo_path: '/movistar.png' }
                        ]
                    },
                    US: {
                        flatrate: [
                            { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/disney.png' }
                        ]
                    }
                }
            }
        });

        const resultado = await obtenerProveedoresStreaming(888);

        // AR no existe, debe usar ES como fallback
        expect(resultado.suscripcion).toHaveLength(1);
        expect(resultado.suscripcion[0].nombre).toBe('Movistar Plus');
    });

    test('Debe retornar null si no hay proveedores para ninguna región', async () => {
        axiosMock.get.mockResolvedValue({
            data: {
                results: {
                    FR: {
                        flatrate: [
                            { provider_id: 100, provider_name: 'Canal Plus', logo_path: '/canal.png' }
                        ]
                    }
                }
            }
        });

        const resultado = await obtenerProveedoresStreaming(777);

        // Ninguna región del fallback (AR, ES, US) está disponible
        expect(resultado).toBeNull();
    });

    test('Debe manejar error de API sin romper', async () => {
        axiosMock.get.mockRejectedValue(new Error('Network Error'));

        const resultado = await obtenerProveedoresStreaming(666);

        // Debe retornar null (graceful degradation)
        expect(resultado).toBeNull();
    });
});