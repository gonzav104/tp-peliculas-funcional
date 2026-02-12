import React, { useState, useEffect } from 'react';
import { Star, Calendar, Clock, Eye, Play, Info, VideoOff, DollarSign, Globe, Briefcase, Activity } from 'lucide-react';
import styles from './MovieCard.module.css';

export const MovieCard = ({ pelicula }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);

    // CLEANUP: Detener videos al cerrar modal
    useEffect(() => {
        if (!showTrailer) {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                if (iframe.src.includes('youtube')) {
                    const currentSrc = iframe.src;
                    iframe.src = '';
                    iframe.src = currentSrc;
                }
            });
        }
    }, [showTrailer]);

    const formatearRating = (rating) => rating ? rating.toFixed(1) : 'N/A';

    // Función para formatear dinero en USD
    const formatearDinero = (cantidad) => {
        if (!cantidad || cantidad === 0) return 'No disponible';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cantidad);
    };

    // Colores para el badge de rating
    const getRatingColor = (rating) => {
        if (rating >= 8) return '#10b981'; // Verde éxito
        if (rating >= 7) return '#3b82f6'; // Azul info
        if (rating >= 5) return '#f59e0b'; // Ambar warning
        return '#ef4444'; // Rojo error
    };

    const tieneTrailer = pelicula.trailer && pelicula.trailer.id;

    const openDetails = () => setShowDetailsModal(true);
    const closeDetails = (e) => { if (e) e.stopPropagation(); setShowDetailsModal(false); };
    const openTrailer = (e) => { if (e) e.stopPropagation(); setShowTrailer(true); };
    const closeTrailer = (e) => { if (e) e.stopPropagation(); setShowTrailer(false); };

    // Handler para accesibilidad por teclado (Enter o Space para abrir detalles)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetails();
        }
    };

    return (
        <>
            {/* Tarjeta Principal */}
            <article
                className={styles.card}
                onClick={openDetails}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-label={`Ver detalles de ${pelicula.titulo}`}
            >
                <div className={styles.posterContainer}>
                    <img
                        src={pelicula.imagen || 'https://via.placeholder.com/300x450?text=Sin+Imagen'}
                        alt=""
                        className={styles.poster}
                        loading="lazy"
                    />
                    <div className={styles.overlay}>
                        <p className={styles.resumen}>
                            {pelicula.resumen || 'Sin descripción disponible'}
                        </p>
                        <button className={styles.btnVerMas} tabIndex="-1">
                            <Eye size={16} /> Ver Detalles
                        </button>
                    </div>
                </div>

                <div className={styles.info}>
                    <h3 className={styles.titulo}>{pelicula.titulo}</h3>
                    <div className={styles.metadata}>
                        <div className={styles.ratingBadge} style={{ color: getRatingColor(pelicula.rating) }}>
                            <Star size={14} fill="currentColor" />
                            <span>{formatearRating(pelicula.rating)}</span>
                        </div>
                        {pelicula.fecha && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {new Date(pelicula.fecha).getFullYear()}
                            </span>
                        )}
                    </div>
                </div>
            </article>

            {/* === MODAL DE DETALLES === */}
            {showDetailsModal && (
                <div className={styles.modalDetails} onClick={closeDetails}>
                    <div className={styles.modalDetailsContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={closeDetails}>✕</button>

                        <div className={styles.detailsGrid}>
                            <div className={styles.detailsPoster}>
                                <img
                                    src={pelicula.imagen || 'https://via.placeholder.com/300x450?text=Sin+Imagen'}
                                    alt={pelicula.titulo}
                                    className={styles.detailsPosterImg}
                                />
                                {tieneTrailer ? (
                                    <button className={styles.btnTrailerModal} onClick={openTrailer}>
                                        <Play size={20} fill="currentColor" /> Ver Tráiler
                                    </button>
                                ) : (
                                    <button className={styles.btnTrailerModal} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                        <VideoOff size={20} /> Sin Tráiler
                                    </button>
                                )}
                            </div>

                            <div className={styles.detailsInfo}>
                                <div>
                                    <h2 className={styles.detailsTitle}>{pelicula.titulo}</h2>
                                    {pelicula.tagline && <p className={styles.detailsTagline}>"{pelicula.tagline}"</p>}
                                </div>

                                <div className={styles.detailsMetadata}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: getRatingColor(pelicula.rating), fontWeight: 'bold' }}>
                                        <Star size={18} fill="currentColor" /> {formatearRating(pelicula.rating)}
                                    </span>
                                    {pelicula.fecha && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Calendar size={16} /> {new Date(pelicula.fecha).getFullYear()}
                                        </span>
                                    )}
                                    {pelicula.duracion && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock size={16} /> {Math.floor(pelicula.duracion / 60)}h {pelicula.duracion % 60}m
                                        </span>
                                    )}
                                </div>

                                {pelicula.generos && (
                                    <div className={styles.detailsGenres}>
                                        {pelicula.generos.map((g, i) => (
                                            <span key={i} className={styles.detailsGenre}>{g}</span>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.detailsSection}>
                                    <h3>Sinopsis</h3>
                                    <p className={styles.detailsText}>{pelicula.resumen || 'Sin descripción disponible.'}</p>
                                </div>

                                {pelicula.directores?.length > 0 && (
                                    <div className={styles.detailsSection}>
                                        <h3>Dirección</h3>
                                        <p className={styles.detailsText}>{pelicula.directores.join(', ')}</p>
                                    </div>
                                )}

                                {pelicula.reparto?.length > 0 && (
                                    <div className={styles.detailsSection}>
                                        <h3>Reparto Principal</h3>
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

                                {/* 3. NUEVA SECCIÓN DE INFO DETALLADA */}
                                <div className={styles.detailsSection}>
                                    <h3><Info size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Información Técnica</h3>
                                    <div className={styles.detailsInfoGrid}>

                                        <div className={styles.detailsInfoItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Globe size={14} className="text-secondary" />
                                                <strong>Idioma Original:</strong>
                                            </div>
                                            <span>{pelicula.idioma_original ? pelicula.idioma_original.toUpperCase() : 'N/A'}</span>
                                        </div>

                                        <div className={styles.detailsInfoItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <DollarSign size={14} className="text-secondary" />
                                                <strong>Presupuesto:</strong>
                                            </div>
                                            <span>{formatearDinero(pelicula.presupuesto)}</span>
                                        </div>

                                        <div className={styles.detailsInfoItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <DollarSign size={14} className="text-secondary" />
                                                <strong>Recaudación:</strong>
                                            </div>
                                            <span>{formatearDinero(pelicula.ingresos)}</span>
                                        </div>

                                        <div className={styles.detailsInfoItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Activity size={14} className="text-secondary" />
                                                <strong>Estado:</strong>
                                            </div>
                                            <span>{pelicula.estado || 'Desconocido'}</span>
                                        </div>

                                        {pelicula.productoras && pelicula.productoras.length > 0 && (
                                            <div className={styles.detailsInfoItem} style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <Briefcase size={14} className="text-secondary" />
                                                    <strong>Producción:</strong>
                                                </div>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {pelicula.productoras.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL DE TRÁILER === */}
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