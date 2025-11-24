import 'dotenv/config'; // Cargamos las variables de entorno (.env)
import app from './app.js'; // Importamos la app

const PORT = process.env.PORT || 3000;

// Inicializacion del Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'desarrollo'}`);
});