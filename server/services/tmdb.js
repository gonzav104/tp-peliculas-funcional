import axios from 'axios';
import { limpiarPeliculas, filtrarConPoster, ordenarPorRating } from '../utils/peliculas.js';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const obtenerPeliculasPopulares = async () => {
    try {
        // Obtener datos (Impuro)
        const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`;
        const respuesta = await axios.get(url);
        const datosCrudos = respuesta.data.results;

        // Pipeline Funcional (Composición de funciones)
        // Flujo: Crudos -> Limpios -> Filtrados -> Ordenados
        const peliculasLimpias = limpiarPeliculas(datosCrudos);
        const peliculasFiltradas = filtrarConPoster(peliculasLimpias);
        const resultadoFinal = ordenarPorRating(peliculasFiltradas);

        return resultadoFinal;

    } catch (error) {
        console.error("Error en Service TMDB:", error.message);
        throw error; // Le tiramos el error al Route para que lo maneje
    }
};