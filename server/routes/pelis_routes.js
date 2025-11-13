import { Router } from 'express';
// Solo importamos el servicio
import { obtenerPeliculasPopulares } from '../services/tmdb.js';

const router = Router();

router.get('/populares', async (req, res) => {
    try {
        // Llamamos al servicio que ya nos devuelve los datos procesados
        const peliculas = await obtenerPeliculasPopulares();
        res.json(peliculas);
    } catch (error) {
        res.status(500).json({ error: 'Ocurrió un error al obtener las películas' });
    }
});

export default router;