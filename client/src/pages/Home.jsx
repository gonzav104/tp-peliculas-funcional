import React, { useState, useCallback } from 'react';
import { obtenerPeliculasEnriquecidas, buscarPeliculasEnriquecidas } from '../services/apiClient';
import { MovieCard } from '../components/MovieCard';
import { MaratonPlanner } from '../components/MaratonPlanner';
import { SearchBar } from '../components/SearchBar';
import { Loading, ErrorMessage, EmptyState, MovieGridSkeleton } from '../components/Utilities';
import { useApi } from '../hooks';
import styles from './Home.module.css';

// CAMBIO CLAVE: Definir la función FUERA del componente.
// Al estar afuera, React sabe que esta función JAMÁS cambia,
// garantizando que useApi se ejecute exactamente una sola vez.
const fetchPopularesStatic = () => obtenerPeliculasEnriquecidas(12);

export const Home = () => {
    const [seccionActiva, setSeccionActiva] = useState('descubrir');

    // Estados para la búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Pasamos la función memorizada al hook
    const {
        data,
        loading,
        error,
        execute: recargarPeliculas
    } = useApi(fetchPopularesStatic, true);

    const peliculas = data?.peliculas || [];
    const estadisticas = data?.estadisticas;

    // Función de búsqueda
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
            // Usamos la versión enriquecida para que traiga trailers
            const response = await buscarPeliculasEnriquecidas(query, 20);
            setSearchResults(response.peliculas || []);
        } catch (err) {
            setSearchError(err.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Lógica de visualización
    const peliculasAMostrar = searchQuery ? searchResults : peliculas;
    const cargando = searchQuery ? isSearching : loading;
    const errorActual = searchQuery ? searchError : error;

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.logo}>🎬 CineFuncional</h1>
                    <p className={styles.tagline}>
                        Procesamiento declarativo de datos cinematográficos
                    </p>
                </div>

                {/* NAVEGACIÓN */}
                <nav className={styles.nav}>
                    <button
                        className={`${styles.navBtn} ${seccionActiva === 'descubrir' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('descubrir')}
                    >
                        🔍 Descubrir
                    </button>
                    <button
                        className={`${styles.navBtn} ${seccionActiva === 'maraton' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('maraton')}
                    >
                        🎯 Planear Maratón
                    </button>
                </nav>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className={styles.main}>
                {/* SECCIÓN: DESCUBRIR */}
                {seccionActiva === 'descubrir' && (
                    <section className={styles.seccionDescubrir}>
                        <div className={styles.seccionHeader}>
                            <h2>{searchQuery ? '🔍 Resultados de Búsqueda' : 'Películas Populares (Enriquecidas)'}</h2>
                            <p className={styles.seccionSubtitulo}>
                                {searchQuery
                                    ? `Mostrando resultados para "${searchQuery}"`
                                    : 'Datos agregados de TMDB + YouTube mediante pipeline funcional'}
                            </p>
                        </div>


                        <SearchBar onSearch={handleSearch} />

                        {/* ESTADÍSTICAS */}
                        {!searchQuery && estadisticas && (
                            <div className={styles.estadisticas}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Total:</span>
                                    <span className={styles.statValue}>{estadisticas.total}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Con Tráiler:</span>
                                    <span className={styles.statValue}>{estadisticas.tasaTrailers}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Completitud:</span>
                                    <span className={styles.statValue}>{estadisticas.completitud}</span>
                                </div>
                            </div>
                        )}

                        {/* LOADING */}
                        {cargando && (
                            <MovieGridSkeleton count={12} />
                        )}

                        {/* ERROR */}
                        {errorActual && !cargando && (
                            <ErrorMessage
                                error={errorActual}
                                onRetry={searchQuery ? () => handleSearch(searchQuery) : recargarPeliculas}
                            />
                        )}

                        {/* GRID DE PELÍCULAS */}
                        {!cargando && !errorActual && peliculasAMostrar.length > 0 && (
                            <div className={styles.movieGrid}>
                                {peliculasAMostrar.map(pelicula => (
                                    <MovieCard key={pelicula.id} pelicula={pelicula} />
                                ))}
                            </div>
                        )}

                        {/* VACÍO */}
                        {!cargando && !errorActual && peliculasAMostrar.length === 0 && (
                            <EmptyState
                                icon="🎬"
                                title={searchQuery ? 'No se encontraron resultados' : 'No se encontraron películas'}
                                message={searchQuery
                                    ? `No hay resultados para "${searchQuery}".`
                                    : 'Intenta recargar la página.'}
                                action={{
                                    label: searchQuery ? '🔄 Limpiar búsqueda' : '🔄 Reintentar',
                                    onClick: searchQuery ? () => handleSearch('') : recargarPeliculas
                                }}
                            />
                        )}
                    </section>
                )}

                {/* SECCIÓN: MARATÓN */}
                {seccionActiva === 'maraton' && (
                    <section className={styles.seccionMaraton}>
                        <MaratonPlanner />
                    </section>
                )}
            </main>

            <footer className={styles.footer}>
                <p>Pipeline Funcional | Programación Declarativa | UNSAdA 2024</p>
                <p className={styles.footerTech}>React 19 • Node.js • TMDB API • YouTube API</p>
            </footer>
        </div>
    );
};