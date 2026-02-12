import React, { useState } from 'react';
import { formatearTiempo, obtenerColorRating} from '../utils/helpers';
import { MovieCard } from './MovieCard';
import styles from './MaratonResult.module.css';

export const MaratonResult = ({ resultado }) => {
    const { plan, analisis, tematica } = resultado;
    const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null);

    if (!plan || !plan.peliculas || plan.peliculas.length === 0) {
        return (
            <div className={styles.empty}>
                <p> No se encontraron películas que cumplan los criterios.</p>
                <p className={styles.hint}>Intenta ajustar el tiempo o los filtros.</p>
            </div>
        );
    }

    const calcularPorcentajeUso = () => {
        return (plan.tiempoTotal / plan.tiempoDisponible) * 100;
    };

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <div className={styles.header}>
                <h2> Tu Maratón Está Listo</h2>
                {tematica && (
                    <p className={styles.tematica}>Temática: {tematica}</p>
                )}
            </div>

            {/* ESTADÍSTICAS PRINCIPALES */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎬</div>
                    <div className={styles.statValue}>{plan.cantidadPeliculas}</div>
                    <div className={styles.statLabel}>Películas</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statValue}>{formatearTiempo(plan.tiempoTotal)}</div>
                    <div className={styles.statLabel}>Duración Total</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statValue}>{plan.ratingPromedio.toFixed(1)}</div>
                    <div className={styles.statLabel}>Rating Promedio</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statValue}>{formatearTiempo(plan.tiempoRestante)}</div>
                    <div className={styles.statLabel}>Tiempo Libre</div>
                </div>
            </div>

            {/* GRÁFICO DE AJUSTE */}
            <div className={styles.grafico}>
                <h3>Optimización del Tiempo</h3>
                <div className={styles.barraContainer}>
                    <div
                        className={styles.barraUsada}
                        style={{ width: `${calcularPorcentajeUso()}%` }}
                    >
                        <span className={styles.barraLabel}>
                            {calcularPorcentajeUso().toFixed(1)}% utilizado
                        </span>
                    </div>
                </div>
                <div className={styles.leyenda}>
                    <span>0</span>
                    <span>{formatearTiempo(plan.tiempoDisponible)}</span>
                </div>
            </div>

            {/* ANÁLISIS DEL ALGORITMO */}
            {analisis && (
                <div className={styles.analisis}>
                    <h3>Análisis del Plan</h3>
                    <div className={styles.analisisGrid}>
                        <div className={styles.analisisItem}>
                            <span className={styles.analisisLabel}>Eficiencia:</span>
                            <span className={styles.analisisValue}>{analisis.eficienciaTemporal}</span>
                        </div>
                        <div className={styles.analisisItem}>
                            <span className={styles.analisisLabel}>Películas Excelentes:</span>
                            <span className={styles.analisisValue}>{analisis.peliculasExcelentes}</span>
                        </div>
                        <div className={styles.analisisItem}>
                            <span className={styles.analisisLabel}>Calidad General:</span>
                            <span className={styles.analisisValue}>{analisis.calidadGeneral}</span>
                        </div>
                        <div className={styles.analisisItem}>
                            <span className={styles.analisisLabel}>Tiempo Libre:</span>
                            <span className={styles.analisisValue}>{analisis.tiempoLibre}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* LÍNEA DE TIEMPO */}
            <div className={styles.timeline}>
                <h3>Secuencia del Maratón</h3>
                <div className={styles.timelineItems}>
                    {plan.peliculas.map((pelicula, index) => (
                        <div key={index} className={styles.timelineItem}>
                            <div className={styles.timelineNumber}>{index + 1}</div>

                            <div
                                className={styles.timelineCard}
                                onClick={() => setPeliculaSeleccionada(pelicula)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.timelineCardHeader}>
                                    <h4>{pelicula.titulo}</h4>
                                    <span
                                        className={styles.timelineRating}
                                        style={{ backgroundColor: obtenerColorRating(pelicula.rating) }}
                                    >
                                         {pelicula.rating.toFixed(1)}
                                    </span>
                                </div>

                                <div className={styles.timelineCardBody}>
                                    <div className={styles.timelineInfo}>
                                        <span className={styles.infoIcon}></span>
                                        <span>{formatearTiempo(pelicula.duracion)}</span>
                                    </div>

                                    {pelicula.generos && pelicula.generos.length > 0 && (
                                        <div className={styles.timelineGeneros}>
                                            {pelicula.generos.slice(0, 3).map((genero, i) => (
                                                <span key={i} className={styles.generoTag}>
                                                    {genero}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={styles.clickHint}>
                                         Click para ver detalles
                                    </div>
                                </div>

                                {pelicula.imagen && (
                                    <img
                                        src={pelicula.imagen}
                                        alt={pelicula.titulo}
                                        className={styles.timelinePoster}
                                        loading="lazy"
                                    />
                                )}
                            </div>

                            {index < plan.peliculas.length - 1 && (
                                <div className={styles.timelineConnector}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className={styles.descripcion}>
                <p>{plan.descripcion}</p>
            </div>

            {/* MODAL DE DETALLES */}
            {peliculaSeleccionada && (
                <div style={{ display: 'none' }}>
                    <MovieCard pelicula={peliculaSeleccionada} />
                </div>
            )}
            {peliculaSeleccionada && (
                <div className={styles.modalOverlay} onClick={() => setPeliculaSeleccionada(null)}>
                    <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setPeliculaSeleccionada(null)}
                        >

                        </button>
                        <MovieCard pelicula={peliculaSeleccionada} />
                    </div>
                </div>
            )}
        </div>
    );
};