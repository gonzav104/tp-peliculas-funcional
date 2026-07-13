import { planificarMaraton } from './maraton.js';

describe('Fuzzing: Robustez del algoritmo de Maratón', () => {
    test('Fuzzing: no viola límite de películas ni tiempo en 2000 iteraciones aleatorias', () => {
        const iteraciones = 2000;
        let violacionesTiempo = 0;
        let violacionesCupo = 0;

        for (let i = 0; i < iteraciones; i++) {
            // 1. Generar un catálogo aleatorio (entre 1 y 40 películas)
            const cantidadPeliculas = Math.floor(Math.random() * 40) + 1;
            const peliculasAleatorias = Array.from({ length: cantidadPeliculas }, (_, id) => ({
                id: id + 1,
                titulo: `Pelicula de prueba ${id + 1}`,
                rating: Math.floor(Math.random() * 11), // Rating entre 0 y 10
                duracion: Math.floor(Math.random() * 150) + 30, // Duración entre 30 y 180 min
                generos: ['Acción', 'Drama'] // Mock simple
            }));

            // 2. Generar restricciones aleatorias
            const tiempoDisponible = Math.floor(Math.random() * 871) + 30; // Entre 30 y 900 minutos
            const maximoPermitido = Math.floor(Math.random() * 15) + 1; // Cupo entre 1 y 15 películas

            // 3. Ejecutar el algoritmo
            const resultado = planificarMaraton(peliculasAleatorias, tiempoDisponible, {
                maximoPeliculas: maximoPermitido,
                ratingMinimo: 0 // Lo ponemos en 0 para que no filtre y fuerce a la recursión a trabajar
            });

            // 4. Validar las restricciones matemáticas
            if (resultado.tiempoTotal > tiempoDisponible) {
                violacionesTiempo++;
            }
            if (resultado.cantidadPeliculas > maximoPermitido) {
                violacionesCupo++;
            }
        }

        // 5. Asertar que no hubo violaciones
        expect(violacionesCupo).toBe(0);
        expect(violacionesTiempo).toBe(0);
    });
});
