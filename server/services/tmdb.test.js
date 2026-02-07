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
const { buscarPeliculasMemo } = await import('./tmdb.js');

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