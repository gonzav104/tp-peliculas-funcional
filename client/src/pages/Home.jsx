import { useEffect, useState } from 'react';
// Importamos el servicio
import { obtenerPeliculasPopulares } from '../services/apiClient';
// Importamos el componente visual
import { MovieCard } from '../components/peliCard';

export const Home = () => {
    const [peliculas, setPeliculas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarPeliculas = async () => {
            try {
                const datos = await obtenerPeliculasPopulares();
                setPeliculas(datos);
            } catch (error) {
                console.error(error);
            } finally {
                setCargando(false);
            }
        };
        void cargarPeliculas();
    }, []);

    if (cargando) return <h2 style={{textAlign: 'center', color: 'white'}}>Cargando cartelera...</h2>;

    return (
        <div className="container">
            <h1 className="titulo-principal">🎬 Cartelera Funcional</h1>

            <div className="grilla-peliculas">
                {peliculas.map(peli => (
                    // Usamos el componente peliCard para cada item
                    <MovieCard key={peli.id} peli={peli} />
                ))}
            </div>
        </div>
    );
};