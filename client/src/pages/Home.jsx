import React, { useState, useCallback } from 'react';
import { LayoutGrid, Clapperboard, Target, Film } from 'lucide-react';
import { obtenerPeliculasEnriquecidas, buscarPeliculasEnriquecidas } from '../services/apiClient';
import { MovieCard } from '../components/MovieCard';
import { MaratonPlanner } from '../components/MaratonPlanner';
import { SearchBar } from '../components/SearchBar';
import { ErrorMessage, EmptyState, MovieGridSkeleton } from '../components/Utilities';
// CORRECCIÓN AQUÍ ABAJO: Cambié 'NavBar' por 'Navbar' para que coincida con la etiqueta <Navbar /> de abajo
import { Navbar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { useApi } from '../hooks';
import styles from './Home.module.css';

const fetchPopularesStatic = () => obtenerPeliculasEnriquecidas(12);

export const Home = () => {
    const [seccionActiva, setSeccionActiva] = useState('descubrir');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const {
        data,
        loading,
        error,
        execute: recargarPeliculas
    } = useApi(fetchPopularesStatic, true);

    const peliculas = data?.peliculas || [];
    const estadisticas = data?.estadisticas;

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (!query || query.trim().length === 0) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }
        try {
            setIsSearching(true);
            setSearchError(null);
            const response = await buscarPeliculasEnriquecidas(query, 20);
            setSearchResults(response.peliculas || []);
        } catch (err) {
            setSearchError(err.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const peliculasAMostrar = searchQuery ? searchResults : peliculas;
    const cargando = searchQuery ? isSearching : loading;
    const errorActual = searchQuery ? searchError : error;

    return (
        <div className={styles.pageWrapper}>
            {/* Ahora este componente coincide con el import de arriba */}
            <Navbar seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva} />

            <main className={styles.mainContent}>

                {seccionActiva === 'descubrir' && (
                    <section className={styles.fadeIn}>

                        {/* TITULO Y SUBTITULO */}
                        <div className={styles.sectionHeader}>
                            <h2>
                                {/* Icono sutil en el título */}
                                {!searchQuery && <Film className={styles.titleIcon} size={28} style={{marginRight: '10px'}} />}
                                {searchQuery ? 'Resultados de Búsqueda' : 'Películas Populares'}
                            </h2>
                            <p className={styles.sectionSub}>
                                {searchQuery
                                    ? `Mostrando resultados para "${searchQuery}"`
                                    : 'Datos agregados de TMDB + YouTube mediante pipeline funcional'}
                            </p>
                        </div>

                        {/* BUSCADOR (Envuelto para controlar ancho) */}
                        <div className={styles.searchWrapper}>
                            <SearchBar onSearch={handleSearch} />
                        </div>

                        {/* ESTADÍSTICAS (Diseño Limpio) */}
                        {!searchQuery && estadisticas && (
                            <div className={styles.statsContainer}>
                                <div className={styles.statBadge}>
                                    <LayoutGrid size={18} />
                                    <span>Total: <strong>{estadisticas.total}</strong></span>
                                </div>
                                <div className={styles.statBadge}>
                                    <Clapperboard size={18} />
                                    <span>Con Tráiler: <strong>{estadisticas.tasaTrailers}</strong></span>
                                </div>
                                <div className={styles.statBadge}>
                                    <Target size={18} />
                                    <span>Completitud: <strong>{estadisticas.completitud}</strong></span>
                                </div>
                            </div>
                        )}

                        {/* GRID / CARGA / ERROR */}
                        {cargando && <MovieGridSkeleton count={12} />}

                        {errorActual && !cargando && (
                            <ErrorMessage
                                error={errorActual}
                                onRetry={recargarPeliculas}
                            />
                        )}

                        {!cargando && !errorActual && peliculasAMostrar.length > 0 && (
                            <div className={styles.movieGrid}>
                                {peliculasAMostrar.map(p => (
                                    <MovieCard key={p.id} pelicula={p} />
                                ))}
                            </div>
                        )}

                        {!cargando && !errorActual && peliculasAMostrar.length === 0 && (
                            <EmptyState
                                title="No se encontraron películas"
                                message="Intenta con otro término."
                                action={{ label: 'Recargar', onClick: recargarPeliculas }}
                            />
                        )}
                    </section>
                )}

                {seccionActiva === 'maraton' && (
                    <section className={styles.fadeIn}>
                        <MaratonPlanner />
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};