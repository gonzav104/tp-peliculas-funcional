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

const TABS = [
    { id: 'automatico', label: 'Maratón Automático' },
    { id: 'tematico', label: 'Por Género' },
    { id: 'decada', label: 'Viaje en el Tiempo' }
];

const crearManejadorNumero = (setter) => (e) => setter(Number(e.target.value));

const crearManejadorSeleccion = (accion) => (valor) => () => accion(valor);

const obtenerMensajeError = (error) => error?.message || 'Error desconocido';

const obtenerErrorTematico = (generosSeleccionados) => (
    generosSeleccionados.length > 0 ? null : 'Selecciona al menos un género'
);

const ejecutarPlanificacion = ({
    setLoading,
    setError,
    setResultado,
    tipo,
    solicitud,
    validar = null
}) => {
    const errorValidacion = validar ? validar() : null;

    if (errorValidacion) {
        setError(errorValidacion);
        return Promise.resolve(false);
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    return Promise.resolve()
        .then(solicitud)
        .then((data) => {
            setResultado({ ...data, tipo });
            return true;
        })
        .catch((error) => {
            setError(obtenerMensajeError(error));
            return false;
        })
        .finally(() => {
            setLoading(false);
        });
};

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
    const [maximoTematico, setMaximoTematico] = useState(10);

    // Estados para Tab 3: Década
    const [tiempoDecada, setTiempoDecada] = useState(150);
    const [decadaSeleccionada, setDecadaSeleccionada] = useState(1990);
    const [ratingDecada, setRatingDecada] = useState(6.0);
    const [maximoDecada, setMaximoDecada] = useState(10);

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

    const ejecutarSolicitud = (solicitud, tipo, validar = null) => {
        return ejecutarPlanificacion({
            setLoading,
            setError,
            setResultado,
            tipo,
            solicitud,
            validar
        });
    };

    const handleSubmitAutomatico = (e) => {
        e.preventDefault();
        return ejecutarSolicitud(
            () => planificarMaraton({
                tiempo,
                ratingMinimo,
                maximoPeliculas
            }),
            'automatico'
        );
    };

    const handleSubmitTematico = (e) => {
        e.preventDefault();
        return ejecutarSolicitud(
            () => planificarMaratonTematico({
                tiempo: tiempoTematico,
                generos: generosSeleccionados,
                ratingMinimo: ratingTematico,
                maximoPeliculas: maximoTematico
            }),
            'tematico',
            () => obtenerErrorTematico(generosSeleccionados)
        );
    };

    const handleSubmitDecada = (e) => {
        e.preventDefault();
        return ejecutarSolicitud(
            () => planificarMaratonDecada({
                tiempo: tiempoDecada,
                decada: decadaSeleccionada,
                ratingMinimo: ratingDecada,
                maximoPeliculas: maximoDecada
            }),
            'decada'
        );
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
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        className={`${styles.tab} ${tabActiva === id ? styles.tabActiva : ''}`}
                        onClick={crearManejadorSeleccion(setTabActiva)(id)}
                    >
                        {label}
                    </button>
                ))}
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
                                 max="1440"
                                 step="30"
                                 value={tiempo}
                                 onChange={crearManejadorNumero(setTiempo)}
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
                                onChange={crearManejadorNumero(setRatingMinimo)}
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
                                onChange={crearManejadorNumero(setMaximoPeliculas)}
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
                                 <span className={styles.badge}>{tiempoTematico} min ({Math.floor(tiempoTematico / 60)}h {tiempoTematico % 60}m)</span>
                             </label>
                             <input
                                 type="range"
                                 min="60"
                                 max="1440"
                                 step="30"
                                 value={tiempoTematico}
                                 onChange={crearManejadorNumero(setTiempoTematico)}
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
                                        onClick={crearManejadorSeleccion(toggleGenero)(genero)}
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
                                onChange={crearManejadorNumero(setRatingTematico)}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Máximo de películas
                                <span className={styles.badge}>{maximoTematico}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={maximoTematico}
                                onChange={crearManejadorNumero(setMaximoTematico)}
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
                                 <span className={styles.badge}>{tiempoDecada} min ({Math.floor(tiempoDecada / 60)}h {tiempoDecada % 60}m)</span>
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="1440"
                                step="30"
                                value={tiempoDecada}
                                onChange={crearManejadorNumero(setTiempoDecada)}
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
                                        onClick={crearManejadorSeleccion(setDecadaSeleccionada)(value)}
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
                                onChange={crearManejadorNumero(setRatingDecada)}
                                className={styles.slider}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Máximo de películas
                                <span className={styles.badge}>{maximoDecada}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={maximoDecada}
                                onChange={crearManejadorNumero(setMaximoDecada)}
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