
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
});
