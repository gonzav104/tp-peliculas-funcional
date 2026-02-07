import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // 1. Seguridad HTTP
import rateLimit from 'express-rate-limit'; // 2. Protección contra abuso

import peliculasRoutes from './routes/pelis_routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD ---

// A. Helmet: Protege cabeceras HTTP (oculta que usas Express, bloquea scripts maliciosos, etc)
app.use(helmet());

// B. Rate Limit: Solo permite 100 peticiones por IP cada 15 minutos
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite por IP
    message: {
        exito: false,
        error: 'Demasiadas peticiones, por favor intenta más tarde.'
    }
});
// Aplicamos el límite a todas las rutas que empiecen con /api
app.use('/api', limiter);

// --- MIDDLEWARES ESTÁNDAR ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.use('/api/peliculas', peliculasRoutes);

app.get('/api/status', (req, res) => {
    res.json({ estado: 'OK', mensaje: 'App segura y optimizada' });
});

// --- MANEJO DE ERRORES ---
app.use((req, res) => {
    res.status(404).json({ exito: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

app.use(errorHandler);

export default app;