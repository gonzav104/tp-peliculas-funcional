// server/index.js
import 'dotenv/config';
import app from './app.js';

const requiredEnvVars = ['TMDB_API_KEY', 'PORT']; // YOUTUBE_API_KEY opcional si usas fallback
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error(`ERROR CRÍTICO: Faltan variables de entorno: ${missing.join(', ')}`);
    console.error('Por favor crea un archivo .env en la carpeta server/ con estas variables.');
    process.exit(1); // Matar proceso
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
});