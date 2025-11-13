const BASE_URL = 'http://localhost:3000/api';

export const obtenerPeliculasPopulares = async () => {
    try {
        const response = await fetch(`${BASE_URL}/peliculas/populares`);
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return await response.json();
    } catch (error) {
        console.error("Error en apiClient:", error);
        throw error;
    }
};