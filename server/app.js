import express from 'express';
import cors from 'cors';

// Importamos las rutas
import peliculasRoutes from './routes/pelis_routes.js';

const app = express();

// Middlewares (Configuración Global)
app.use(cors());           // Permite peticiones desde React
app.use(express.json());   // Permite recibir JSON en POSTs

// Rutas
app.use('/api/peliculas', peliculasRoutes);

// Ruta de Health Check
app.get('/api/status', (req, res) => {
    res.json({ estado: 'OK', mensaje: 'App configurada correctamente' });
});

// Exportamos la app configurada (pero no la iniciamos aca)
export default app;