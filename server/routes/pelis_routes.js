import { Router } from 'express';
// Importamos el controlador
import { getPopulares } from '../controllers/peliculas_controller.js';

const router = Router();

// Definimos la ruta para obtener películas populares
router.get('/populares', getPopulares);

export default router;