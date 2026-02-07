import { jest } from '@jest/globals';

// MOCKEAMOS LAS DEPENDENCIAS
// Le decimos a Jest: "Cuando unificador.js pida estos archivos, dale versiones falsas"
jest.unstable_mockModule('./tmdb.js', () => ({
    obtenerDetallesPelicula: jest.fn(),
    obtenerPeliculasPopulares: jest.fn(),
    buscarPeliculas: jest.fn()
}));

jest.unstable_mockModule('./youtube.js', () => ({
    buscarTrailerPelicula: jest.fn()
}));

// IMPORTAMOS LOS MÓDULOS
const tmdbMock = await import('./tmdb.js');
const youtubeMock = await import('./youtube.js');
const { enriquecerPeliculasLote } = await import('./unificador.js');

describe('Pruebas de Unificación con Concurrencia', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe procesar un lote mayor al límite de concurrencia (ej: 7 items)', async () => {

        // Simulamos que TMDB siempre responde con éxito
        tmdbMock.obtenerDetallesPelicula.mockResolvedValue({
            id: 123,
            titulo: 'Pelicula Test',
            fecha: '2023-01-01',
            imagen: 'img.jpg',
            rating: 8.5
        });

        // Simulamos que YouTube encuentra el trailer
        youtubeMock.buscarTrailerPelicula.mockResolvedValue({
            id: 'video_id',
            url: 'https://youtube.com/v/video_id'
        });

        // Creamos una lista de 7 IDs (El límite es 5, así probamos que encole las otras 2)
        const idsInput = [1, 2, 3, 4, 5, 6, 7];

        // --- EJECUCIÓN ---
        const resultados = await enriquecerPeliculasLote(idsInput);

        // --- VERIFICACIONES ---

        // Debe devolver 7 resultados
        expect(resultados).toHaveLength(7);

        // Debe haber llamado a TMDB 7 veces
        expect(tmdbMock.obtenerDetallesPelicula).toHaveBeenCalledTimes(7);

        // Verificamos que los objetos resultantes tengan la estructura unificada
        expect(resultados[0]).toHaveProperty('trailer'); // Viene de YouTube
        expect(resultados[0]).toHaveProperty('estaCompleta', true);
        expect(resultados[0].fuentes).toContain('youtube');
    });

    test('Debe manejar errores individuales sin detener todo el lote', async () => {
        // Simulamos que la película 1 funciona y la 2 falla en TMDB
        tmdbMock.obtenerDetallesPelicula
            .mockResolvedValueOnce({ id: 1, titulo: 'Exito', imagen: 'x', rating: 10 }) // 1ra llamada
            .mockResolvedValueOnce(null); // 2da llamada (Falla o no existe)

        youtubeMock.buscarTrailerPelicula.mockResolvedValue({}); // Default

        const idsInput = [1, 2];

        const resultados = await enriquecerPeliculasLote(idsInput);

        // Solo debería devolver la película 1, porque la 2 falló (es null) y se filtró
        expect(resultados).toHaveLength(1);
        expect(resultados[0].titulo).toBe('Exito');
    });
});