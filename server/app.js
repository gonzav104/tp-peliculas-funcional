import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Importamos las rutas (esto ya lo tenías bien)
import peliculasRoutes from './routes/pelis_routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD ---
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        exito: false,
        error: 'Demasiadas peticiones, por favor intenta más tarde.'
    }
});

// --- MIDDLEWARES ESTÁNDAR ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
// Aplicamos el limitador a todo lo que sea /api
app.use('/api', limiter);

// ✅ AQUÍ ESTABA EL ERROR: FALTABA MONTAR LAS RUTAS DE PELÍCULAS
// Esto conecta '/api/peliculas/populares...' con tu archivo de rutas
app.use('/api/peliculas', peliculasRoutes);

// Ruta de estado general
app.get('/api/status', (req, res) => {
    res.json({ estado: 'OK', mensaje: 'App segura y optimizada' });
});

// --- MANEJO DE ERRORES ---
app.use((req, res) => {
    res.status(404).json({ exito: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

app.use(errorHandler);

export default app;