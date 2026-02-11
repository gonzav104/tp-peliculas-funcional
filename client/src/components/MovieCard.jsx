import React, { useState } from 'react';
import styles from './MovieCard.module.css';

export const MovieCard = ({ pelicula }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);

    const formatearRating = (rating) => rating ? rating.toFixed(1) : 'N/A';

    const getRatingClass = (rating) => {
        if (rating >= 8) return styles.ratingExcelente;
        if (rating >= 7) return styles.ratingBueno;
        if (rating >= 5) return styles.ratingRegular;
        return styles.ratingMalo;
    };

    const formatearDinero = (cantidad) => {
        if (!cantidad || cantidad === 0) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(cantidad);
    };

    const tieneTrailer = pelicula.trailer && pelicula.trailer.id;

    // Controladores
    const openDetails = () => setShowDetailsModal(true);
    const closeDetails = (e) => {
        if (e) e.stopPropagation();
        setShowDetailsModal(false);
    };

    const openTrailer = (e) => {
        if (e) e.stopPropagation();
        setShowTrailer(true);
    };
    const closeTrailer = (e) => {
        if (e) e.stopPropagation();
        setShowTrailer(false);
    };

    return (
        <>
            {/* === TARJETA EN LA GRILLA === */}
            <div className={styles.card} onClick={openDetails}>
                <div className={styles.posterContainer}>
                    <img
                        src={pelicula.imagen || 'https://via.placeholder.com/300x450?text=Sin+Imagen'}
                        alt={pelicula.titulo}
                        className={styles.poster}
                        loading="lazy"
                    />
                    <div className={styles.overlay}>
                        <p className={styles.resumen}>
                            {pelicula.resumen || 'Sin descripción disponible'}
                        </p>
                        <button className={styles.btnVerMas}>👁️ Ver Detalles</button>
                    </div>
                </div>

                <div className={styles.info}>
                    <h3 className={styles.titulo}>{pelicula.titulo}</h3>
                    <div className={styles.metadata}>
                        <span className={`${styles.rating} ${getRatingClass(pelicula.rating)}`}>
                            ★ {formatearRating(pelicula.rating)}
                        </span>
                        {pelicula.fecha && (
                            <span className={styles.fecha}>{new Date(pelicula.fecha).getFullYear()}</span>
                        )}
                        {pelicula.duracion && (
                            <span className={styles.duracion}>
                                {Math.floor(pelicula.duracion / 60)}h {pelicula.duracion % 60}m
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* === MODAL DE DETALLES COMPLETO === */}
            {showDetailsModal && (
                <div className={styles.modalDetails} onClick={closeDetails}>
                    <div className={styles.modalDetailsContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={closeDetails}>✕</button>

                        <div className={styles.detailsGrid}>
                            {/* COLUMNA IZQUIERDA: PÓSTER */}
                            <div className={styles.detailsPoster}>
                                <img
                                    src={pelicula.imagen || 'https://via.placeholder.com/300x450?text=Sin+Imagen'}
                                    alt={pelicula.titulo}
                                    className={styles.detailsPosterImg}
                                />
                                {tieneTrailer ? (
                                    <button className={styles.btnTrailerModal} onClick={openTrailer}>
                                        ▶️ Ver Tráiler
                                    </button>
                                ) : (
                                    <button className={styles.btnTrailerModal} disabled style={{opacity: 0.5, cursor: 'not-allowed'}}>
                                        🚫 Sin Tráiler
                                    </button>
                                )}
                            </div>

                            {/* COLUMNA DERECHA: TODA LA INFO */}
                            <div className={styles.detailsInfo}>
                                <div>
                                    <h2 className={styles.detailsTitle}>{pelicula.titulo}</h2>
                                    {pelicula.tagline && (
                                        <p className={styles.detailsTagline}>"{pelicula.tagline}"</p>
                                    )}
                                </div>

                                <div className={styles.detailsMetadata}>
                                    <span className={`${styles.detailsRating} ${getRatingClass(pelicula.rating)}`}>
                                        ★ {formatearRating(pelicula.rating)}
                                    </span>
                                    {pelicula.fecha && <span>📅 {new Date(pelicula.fecha).getFullYear()}</span>}
                                    {pelicula.duracion && <span>⏱️ {Math.floor(pelicula.duracion / 60)}h {pelicula.duracion % 60}m</span>}
                                </div>

                                {pelicula.generos && (
                                    <div className={styles.detailsGenres}>
                                        {pelicula.generos.map((g, i) => (
                                            <span key={i} className={styles.detailsGenre}>{g}</span>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.detailsSection}>
                                    <h3>📄 Sinopsis</h3>
                                    <p className={styles.detailsText}>
                                        {pelicula.resumen || 'Sin descripción disponible.'}
                                    </p>
                                </div>

                                {/* SECCIÓN DIRECTORES */}
                                {pelicula.directores && pelicula.directores.length > 0 && (
                                    <div className={styles.detailsSection}>
                                        <h3>🎬 Dirección</h3>
                                        <p className={styles.detailsText}>
                                            {pelicula.directores.join(', ')}
                                        </p>
                                    </div>
                                )}

                                {/* SECCIÓN REPARTO */}
                                {pelicula.reparto && pelicula.reparto.length > 0 && (
                                    <div className={styles.detailsSection}>
                                        <h3>🎭 Reparto Principal</h3>
                                        <div className={styles.castGrid}>
                                            {pelicula.reparto.slice(0, 6).map((actor, idx) => (
                                                <div key={idx} className={styles.castItem}>
                                                    <img
                                                        src={actor.foto || 'https://via.placeholder.com/100x100?text=?'}
                                                        alt={actor.nombre}
                                                        className={styles.castImg}
                                                    />
                                                    <div className={styles.castInfo}>
                                                        <span className={styles.castName}>{actor.nombre}</span>
                                                        <span className={styles.castChar}>{actor.personaje}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SECCIÓN DATOS TÉCNICOS  */}
                                <div className={styles.detailsSection}>
                                    <h3>ℹ️ Información Técnica</h3>
                                    <div className={styles.detailsInfoGrid}>
                                        {pelicula.idioma_original && (
                                            <div className={styles.detailsInfoItem}>
                                                <strong>Idioma Original</strong>
                                                <span>{pelicula.idioma_original.toUpperCase()}</span>
                                            </div>
                                        )}
                                        {pelicula.fecha && (
                                            <div className={styles.detailsInfoItem}>
                                                <strong>Estreno Completo</strong>
                                                <span>{new Date(pelicula.fecha).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {pelicula.presupuesto > 0 && (
                                            <div className={styles.detailsInfoItem}>
                                                <strong>Presupuesto</strong>
                                                <span>{formatearDinero(pelicula.presupuesto)}</span>
                                            </div>
                                        )}
                                        {pelicula.ingresos > 0 && (
                                            <div className={styles.detailsInfoItem}>
                                                <strong>Ingresos</strong>
                                                <span>{formatearDinero(pelicula.ingresos)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SECCIÓN PRODUCTORAS */}
                                {pelicula.productoras && pelicula.productoras.length > 0 && (
                                    <div className={styles.detailsSection}>
                                        <h3>🏭 Producción</h3>
                                        <p className={styles.detailsText}>
                                            {pelicula.productoras.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL TRÁILER === */}
            {showTrailer && tieneTrailer && (
                <div className={styles.modalTrailer} onClick={closeTrailer}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={closeTrailer}>✕</button>
                        <iframe
                            src={`${pelicula.trailer.urlEmbed}?autoplay=1`}
                            title="Trailer"
                            className={styles.iframe}
                            allowFullScreen
                            allow="autoplay"
                        ></iframe>
                    </div>
                </div>
            )}
        </>
    );
};