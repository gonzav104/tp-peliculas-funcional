import React, { useState } from 'react';
import {
    planificarMaraton,
    planificarMaratonTematico,
    planificarMaratonDecada
} from '../services/apiClient';
import { MaratonResult } from './MaratonResult';
import styles from './MaratonPlanner.module.css';

const GENEROS_DISPONIBLES = [
    'Acción', 'Aventura', 'Animación', 'Comedia', 'Crimen',
    'Drama', 'Fantasía', 'Terror', 'Misterio', 'Romance',
    'Ciencia ficción', 'Suspense', 'Bélica'
];

const DECADAS = [
    { label: '1980s', value: 1980 },
    { label: '1990s', value: 1990 },
    { label: '2000s', value: 2000 },
    { label: '2010s', value: 2010 },
    { label: '2020s', value: 2020 }
];

export const MaratonPlanner = () => {
    const [tabActiva, setTabActiva] = useState('automatico');

    // Estados para Tab 1: Automático
    const [tiempo, setTiempo] = useState(240);
    const [ratingMinimo, setRatingMinimo] = useState(7.0);
    const [maximoPeliculas, setMaximoPeliculas] = useState(10);

    // Estados para Tab 2: Temático
    const [tiempoTematico, setTiempoTematico] = useState(180);
    const [generosSeleccionados, setGenerosSeleccionados] = useState([]);
    const [ratingTematico, setRatingTematico] = useState(6.0);

    // Estados para Tab 3: Década
    const [tiempoDecada, setTiempoDecada] = useState(150);
    const [decadaSeleccionada, setDecadaSeleccionada] = useState(1990);
    const [ratingDecada, setRatingDecada] = useState(6.0);

    // Estado global
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // === HANDLERS ===
    const toggleGenero = (genero) => {
        setGenerosSeleccionados(prev =>
            prev.includes(genero)
                ? prev.filter(g => g !== genero)
                : [...prev, genero]
        );
    };

    const handleSubmitAutomatico = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const data = await planificarMaraton({
                tiempo,
                ratingMinimo,
                maximoPeliculas
            });
            setResultado({ ...data, tipo: 'automatico' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTematico = async (e) => {
        e.preventDefault();

        if (generosSeleccionados.length === 0) {
            setError('Selecciona al menos un género');
            return;
        }

        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const data = await planificarMaratonTematico({
                tiempo: tiempoTematico,
                generos: generosSeleccionados,
                ratingMinimo: ratingTematico
            });
            setResultado({ ...data, tipo: 'tematico' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDecada = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const data = await planificarMaratonDecada({
                tiempo: tiempoDecada,
                decada: decadaSeleccionada,
                ratingMinimo: ratingDecada
            });
            setResultado({ ...data, tipo: 'decada' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // === RENDER ===

    return (
        <div className={styles.container}>
            <h1 className={styles.titulo}> Planificador de Maratones</h1>
            <p className={styles.subtitulo}>
                Optimiza tu tiempo con nuestros algoritmos de programación funcional
            </p>

            {/* TABS */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tabActiva === 'automatico' ? styles.tabActiva : ''}`}
                    onClick={() => setTabActiva('automatico')}
                >
                     Maratón Automático
                </button>
                <button
                    className={`${styles.tab} ${tabActiva === 'tematico' ? styles.tabActiva : ''}`}
                    onClick={() => setTabActiva('tematico')}
                >
                     Por Género
                </button>
                <button
                    className={`${styles.tab} ${tabActiva === 'decada' ? styles.tabActiva : ''}`}
                    onClick={() => setTabActiva('decada')}
                >
                     Viaje en el Tiempo
                </button>
            </div>

            {/* CONTENIDO DE TABS */}
            <div className={styles.tabContent}>
                {/* TAB 1: AUTOMÁTICO */}
                {tabActiva === 'automatico' && (
                    <form onSubmit={handleSubmitAutomatico} className={styles.form}>
                        <h3>Optimización Automática</h3>
                        <p className={styles.descripcion}>
                            Nuestro algoritmo recursivo selecciona las mejores películas según tu tiempo y preferencias.
                        </p>

                        <div className={styles.inputGroup}>
                            <label>
                                Tiempo disponible (minutos)
                                <span className={styles.badge}>{tiempo} min ({Math.floor(tiempo / 60)}h {tiempo % 60}m)</span>
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="720"
                                step="30"
                                value={tiempo}
                                onChange={(e) => setTiempo(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Rating mínimo
                                <span className={styles.badge}>★ {ratingMinimo.toFixed(1)}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={ratingMinimo}
                                onChange={(e) => setRatingMinimo(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Máximo de películas
                                <span className={styles.badge}>{maximoPeliculas}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={maximoPeliculas}
                                onChange={(e) => setMaximoPeliculas(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading ? 'Calculando...' : 'Generar Maratón'}
                        </button>
                    </form>
                )}

                {/* TAB 2: TEMÁTICO */}
                {tabActiva === 'tematico' && (
                    <form onSubmit={handleSubmitTematico} className={styles.form}>
                        <h3>Maratón Temático</h3>
                        <p className={styles.descripcion}>
                            Filtra películas por géneros específicos para una experiencia cohesiva.
                        </p>

                        <div className={styles.inputGroup}>
                            <label>
                                Tiempo disponible
                                <span className={styles.badge}>{tiempoTematico} min</span>
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="720"
                                step="30"
                                value={tiempoTematico}
                                onChange={(e) => setTiempoTematico(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Selecciona géneros ({generosSeleccionados.length} elegidos)</label>
                            <div className={styles.generoGrid}>
                                {GENEROS_DISPONIBLES.map(genero => (
                                    <button
                                        key={genero}
                                        type="button"
                                        className={`${styles.generoBtn} ${
                                            generosSeleccionados.includes(genero) ? styles.generoActivo : ''
                                        }`}
                                        onClick={() => toggleGenero(genero)}
                                    >
                                        {genero}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Rating mínimo
                                <span className={styles.badge}>{ratingTematico.toFixed(1)} ⭐</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={ratingTematico}
                                onChange={(e) => setRatingTematico(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading ? 'Calculando...' : 'Generar Maratón'}
                        </button>
                    </form>
                )}

                {/* TAB 3: DÉCADA */}
                {tabActiva === 'decada' && (
                    <form onSubmit={handleSubmitDecada} className={styles.form}>
                        <h3>Viaje en el Tiempo</h3>
                        <p className={styles.descripcion}>
                            Revive clásicos de tu década favorita.
                        </p>

                        <div className={styles.inputGroup}>
                            <label>
                                Tiempo disponible
                                <span className={styles.badge}>{tiempoDecada} min</span>
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="720"
                                step="30"
                                value={tiempoDecada}
                                onChange={(e) => setTiempoDecada(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Selecciona una década</label>
                            <div className={styles.decadaGrid}>
                                {DECADAS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`${styles.decadaBtn} ${
                                            decadaSeleccionada === value ? styles.decadaActiva : ''
                                        }`}
                                        onClick={() => setDecadaSeleccionada(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Rating mínimo
                                <span className={styles.badge}>{ratingDecada.toFixed(1)} ⭐</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={ratingDecada}
                                onChange={(e) => setRatingDecada(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>

                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading ? 'Calculando...' : 'Generar Maratón'}
                        </button>
                    </form>
                )}
            </div>

            {/* ESTADOS DE ERROR Y LOADING */}
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Optimizando tu maratón con algoritmos funcionales...</p>
                </div>
            )}

            {/* RESULTADO */}
            {resultado && !loading && (
                <MaratonResult resultado={resultado} />
            )}
        </div>
    );
};