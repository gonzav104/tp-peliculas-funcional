import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


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

// --- MIDDLEWARES ESTANDAR ---
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://lemon-pebble-0059f490f.7.azurestaticapps.net'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// --- RUTAS ---
// Aplicamos el limitador a todo lo que sea /api
app.use('/api', limiter);

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