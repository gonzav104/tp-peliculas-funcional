import React, { useState, useCallback } from 'react';
import { Clapperboard, Search, Target, Film, BarChart2 } from 'lucide-react';
import { obtenerPeliculasEnriquecidas, buscarPeliculasEnriquecidas } from '../services/apiClient';
import { MovieCard } from '../components/MovieCard';
import { MaratonPlanner } from '../components/MaratonPlanner';
import { SearchBar } from '../components/SearchBar';
import { ErrorMessage, EmptyState, MovieGridSkeleton } from '../components/Utilities';
import { useApi } from '../hooks';
import styles from './Home.module.css';

// Función estática para evitar recreación en renders y loops infinitos
const fetchPopularesStatic = () => obtenerPeliculasEnriquecidas(12);

export const Home = () => {
    const [seccionActiva, setSeccionActiva] = useState('descubrir');

    // Estados para la búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Hook personalizado para carga inicial
    const {
        data,
        loading,
        error,
        execute: recargarPeliculas
    } = useApi(fetchPopularesStatic, true);

    const peliculas = data?.peliculas || [];
    const estadisticas = data?.estadisticas;

    // Función de búsqueda optimizada
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

    // Lógica de visualización
    const peliculasAMostrar = searchQuery ? searchResults : peliculas;
    const cargando = searchQuery ? isSearching : loading;
    const errorActual = searchQuery ? searchError : error;

    return (
        <div className={styles.container}>
            {/* HEADER TIPO NAVBAR (Compacto y Sticky) */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    {/* Logotipo con Icono */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clapperboard size={26} color="var(--accent)" />
                        <h1 className={styles.logo}>CineFuncional</h1>
                    </div>
                    <p className={styles.tagline}>
                        Procesamiento declarativo de datos
                    </p>
                </div>

                {/* NAVEGACIÓN */}
                <nav className={styles.nav}>
                    <button
                        className={`${styles.navBtn} ${seccionActiva === 'descubrir' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('descubrir')}
                    >
                        <Search size={18} /> Descubrir
                    </button>
                    <button
                        className={`${styles.navBtn} ${seccionActiva === 'maraton' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('maraton')}
                    >
                        <Target size={18} /> Planear Maratón
                    </button>
                </nav>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className={styles.main}>
                {/* SECCIÓN: DESCUBRIR */}
                {seccionActiva === 'descubrir' && (
                    <section className={styles.seccionDescubrir}>
                        <div className={styles.seccionHeader}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {searchQuery ? <Search size={24} /> : <Film size={24} />}
                                {searchQuery ? 'Resultados de Búsqueda' : 'Películas Populares'}
                            </h2>
                            <p className={styles.seccionSubtitulo}>
                                {searchQuery
                                    ? `Mostrando resultados para "${searchQuery}"`
                                    : 'Datos agregados de TMDB + YouTube mediante pipeline funcional'}
                            </p>
                        </div>

                        <SearchBar onSearch={handleSearch} />

                        {/* ESTADÍSTICAS (Solo visibles en populares) */}
                        {!searchQuery && estadisticas && (
                            <div className={styles.estadisticas}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}><Film size={16} /> Total:</span>
                                    <span className={styles.statValue}>{estadisticas.total}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}><BarChart2 size={16} /> Con Tráiler:</span>
                                    <span className={styles.statValue}>{estadisticas.tasaTrailers}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}><Target size={16} /> Completitud:</span>
                                    <span className={styles.statValue}>{estadisticas.completitud}</span>
                                </div>
                            </div>
                        )}

                        {/* LOADING STATE */}
                        {cargando && (
                            <MovieGridSkeleton count={12} />
                        )}

                        {/* ERROR STATE */}
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

                        {/* EMPTY STATE */}
                        {!cargando && !errorActual && peliculasAMostrar.length === 0 && (
                            <EmptyState
                                icon={<Film size={48} color="var(--text-muted)" />}
                                title={searchQuery ? 'No se encontraron resultados' : 'No se encontraron películas'}
                                message={searchQuery
                                    ? `No hay resultados para "${searchQuery}". Intenta con otro término.`
                                    : 'Parece que hubo un problema al cargar el catálogo inicial.'}
                                action={{
                                    label: searchQuery ? 'Limpiar búsqueda' : 'Recargar',
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
                <p>Pipeline Funcional | Programación Declarativa | UNSAdA 2026</p>
                <p className={styles.footerTech}>React 19 • Node.js • TMDB API • YouTube API</p>
            </footer>
        </div>
    );
};