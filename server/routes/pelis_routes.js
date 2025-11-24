import { Router } from 'express';
import {
    getPopulares,
    getPopularesEnriquecidas,
    buscar,
    buscarEnriquecida,
    planearMaraton,
    planearMaratonTematico,
    planearMaratonDecada,
    getPresetsMaraton,
    getEstado,
    getMejorCalificadas,
    getTrailers,
    getVideoStats
} from '../controllers/peliculas_controller.js';

const router = Router();

// Documentación de la API
router.get('/', (req, res) => {
    res.json({
        nombre: 'API Pipeline Funcional de Películas',
        version: '1.0.0',
        descripcion: 'Sistema declarativo de agregación y optimización de contenido cinematográfico',

        endpoints: {
            basicos: {
                'GET /populares': 'Películas populares (TMDB)',
                'GET /populares-enriquecidas?limite=10': 'Películas con tráilers (TMDB + YouTube)',
                'GET /estado': 'Estado del servicio y configuración'
            },

            busqueda: {
                'GET /buscar?q=inception': 'Búsqueda básica',
                'GET /buscar-enriquecida?q=inception&limite=5': 'Búsqueda con tráilers'
            },

            maraton: {
                'POST /maraton': 'Planificar maratón optimizado',
                'POST /maraton-tematico': 'Maratón por género',
                'GET /maraton/presets': 'Duraciones predefinidas'
            }
        },

        ejemplos: {
            maraton: {
                url: '/maraton',
                metodo: 'POST',
                body: {
                    tiempo: 240,
                    ratingMinimo: 7.0,
                    maximoPeliculas: 10
                }
            },

            maratonTematico: {
                url: '/maraton-tematico',
                metodo: 'POST',
                body: {
                    tiempo: 360,
                    generos: ['Action', 'Sci-Fi']
                }
            }
        },

        paradigma: {
            enfoque: 'Programación Funcional',
            conceptos: [
                'Funciones puras',
                'Composición (pipe)',
                'Inmutabilidad',
                'Transparencia referencial',
                'Recursión',
                'Manejo funcional de errores (Either)'
            ]
        }
    });
});

// Rutas basicas
router.get('/populares', getPopulares);
router.get('/populares-enriquecidas', getPopularesEnriquecidas);
router.get('/estado', getEstado);
router.get('/top-rated', getMejorCalificadas);

// Rutas de busqueda
router.get('/buscar', buscar);
router.get('/buscar-enriquecida', buscarEnriquecida);

// Rutas de maraton
router.post('/maraton', planearMaraton);
router.post('/maraton-tematico', planearMaratonTematico);
router.post('/maraton-decada', planearMaratonDecada);
router.get('/maraton/presets', getPresetsMaraton);

// Rutas de youtube
router.get('/trailers', getTrailers);
router.get('/video-stats', getVideoStats);

export default router;