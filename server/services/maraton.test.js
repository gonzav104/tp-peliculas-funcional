import { planificarMaraton, planificarMaratonTematico, analizarPlan, presetsMaraton } from './maraton.js';

describe('Servicio de Maratón', () => {

    const peliculasBase = [
        { id: 1, titulo: 'Peli A', rating: 8.0, duracion: 90 },
        { id: 2, titulo: 'Peli B', rating: 7.5, duracion: 120 },
        { id: 3, titulo: 'Peli C', rating: 6.5, duracion: 60 },
        { id: 4, titulo: 'Peli D', rating: 9.0, duracion: 100 },
        { id: 5, titulo: 'Peli E', rating: 5.0, duracion: 80 },
    ];

    test('Planifica maratón respetando tiempo y rating mínimo', () => {
        const plan = planificarMaraton(peliculasBase, 200, { ratingMinimo: 6.0 });

        expect(plan).toHaveProperty('peliculas');
        // Todas las películas del plan deben cumplir rating >= 6.0
        expect(plan.peliculas.every(p => p.rating >= 6.0)).toBe(true);
        // tiempoTotal no debe exceder el tiempo disponible
        expect(plan.tiempoTotal).toBeLessThanOrEqual(200);
    });

    test('Aplica maximoPeliculas', () => {
        const peliculas = Array.from({ length: 20 }).map((_, i) => ({ id: i + 1, titulo: `P${i + 1}`, rating: 7.0 + (i % 3), duracion: 90 }));
        const plan = planificarMaraton(peliculas, 1000, { maximoPeliculas: 5 });
        expect(plan.peliculas.length).toBeLessThanOrEqual(5);
    });

    test('Retorna plan vacío si no hay películas válidas', () => {
        const plan = planificarMaraton([], 200);
        expect(plan.peliculas).toEqual([]);
        expect(plan.tiempoTotal).toBe(0);
        expect(plan.cantidadPeliculas).toBe(0);
    });

    test('Filtra películas con rating bajo', () => {
        const plan = planificarMaraton(peliculasBase, 500, { ratingMinimo: 8.0 });
        // Solo Peli A (8.0) y Peli D (9.0) cumplen rating >= 8.0
        expect(plan.peliculas.every(p => p.rating >= 8.0)).toBe(true);
    });

    test('analizarPlan devuelve estadísticas del plan', () => {
        const plan = planificarMaraton(peliculasBase, 300, { ratingMinimo: 6.0 });
        const analisis = analizarPlan(plan);

        expect(analisis).toHaveProperty('eficienciaTemporal');
        expect(analisis).toHaveProperty('peliculasExcelentes');
        expect(analisis).toHaveProperty('tiempoLibre');
        expect(analisis).toHaveProperty('calidadGeneral');
    });

    test('planificarMaratonTematico planifica con las películas recibidas', () => {
        const peliculasConGenero = [
            { id: 1, titulo: 'Acción 1', rating: 7.5, duracion: 100, generos: ['Acción'] },
            { id: 2, titulo: 'Drama 1', rating: 8.0, duracion: 90, generos: ['Drama'] },
            { id: 3, titulo: 'Acción 2', rating: 7.0, duracion: 110, generos: ['Acción', 'Thriller'] },
        ];

        const plan = planificarMaratonTematico(peliculasConGenero, 300, ['Acción']);
        expect(plan.peliculas.length).toBeGreaterThan(0);
        expect(plan.tiempoTotal).toBeLessThanOrEqual(300);
    });

    test('presetsMaraton tiene duraciones esperadas', () => {
        expect(presetsMaraton.tarde).toBe(240);
        expect(presetsMaraton.noche).toBe(360);
        expect(presetsMaraton.finDeSemana).toBe(720);
        expect(presetsMaraton.diaCompleto).toBe(960);
    });
});
