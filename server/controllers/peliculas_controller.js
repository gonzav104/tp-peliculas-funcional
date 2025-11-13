import { obtenerPeliculasPopulares } from '../services/tmdb.js';

export const getPopulares = async (req, res) => {
    try {
        // Llama al servicio para obtener películas populares
        const peliculas = await obtenerPeliculasPopulares();

        // Manda la respuesta
        res.json(peliculas);
    } catch (error) {
        // Maneja errores HTTP
        res.status(500).json({ error: 'Error interno al obtener películas' });
    }
};