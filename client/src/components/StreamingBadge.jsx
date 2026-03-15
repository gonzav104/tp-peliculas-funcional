import React from 'react';
import styles from './StreamingBadge.module.css';

// Deduplica proveedores por id
const deduplicarProveedores = (proveedores) => {
    if (!Array.isArray(proveedores)) return [];
    const vistos = new Set();
    return proveedores.filter((p) => {
        if (!p || vistos.has(p.id)) return false;
        vistos.add(p.id);
        return true;
    });
};

// Versión completa con labels de grupo (para el modal de detalles)
const StreamingCompleto = ({ suscripcion, compra }) => (
    <div className={styles.contenedor}>
        <p className={styles.tituloSeccion}>Disponible en</p>

        {suscripcion.length > 0 && (
            <div className={styles.grupo}>
                <p className={styles.grupoLabel}>Suscripción</p>
                <div className={styles.badgesLista}>
                    {suscripcion.map((p) => (
                        <span key={p.id} className={styles.badge}>
                            <img
                                src={p.logo}
                                alt={p.nombre}
                                className={styles.logo}
                                loading="lazy"
                            />
                            <span className={styles.nombre}>{p.nombre}</span>
                        </span>
                    ))}
                </div>
            </div>
        )}

        {compra.length > 0 && (
            <div className={styles.grupo}>
                <p className={styles.grupoLabel}>Compra</p>
                <div className={styles.badgesLista}>
                    {compra.map((p) => (
                        <span key={p.id} className={styles.badgeCompra}>
                            <img
                                src={p.logo}
                                alt={p.nombre}
                                className={styles.logo}
                                loading="lazy"
                            />
                            <span className={styles.nombre}>{p.nombre}</span>
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// Versión compacta sin labels (para la tarjeta principal)
const StreamingCompacto = ({ proveedores }) => (
    <div className={styles.compacto}>
        {proveedores.map((p) => (
            <span key={p.id} className={styles.badgeCompacto} title={p.nombre}>
                <img
                    src={p.logo}
                    alt={p.nombre}
                    className={styles.logoCompacto}
                    loading="lazy"
                />
            </span>
        ))}
    </div>
);

/**
 * Componente que muestra badges de plataformas de streaming.
 *
 * @param {Object} props
 * @param {Object|null|undefined} props.streaming - Datos de streaming { suscripcion: [], compra: [] }
 * @param {boolean} [props.compacto=false] - Si true, muestra solo logos sin labels de grupo
 */
export const StreamingBadge = ({ streaming, compacto = false }) => {
    // Manejo defensivo de datos nulos/indefinidos
    if (!streaming) return null;

    const suscripcion = deduplicarProveedores(streaming.suscripcion);
    const compra = deduplicarProveedores(streaming.compra);

    // Si no hay proveedores en ningún grupo, no renderizar nada
    if (suscripcion.length === 0 && compra.length === 0) return null;

    if (compacto) {
        // En modo compacto combinamos todos los proveedores (sin repetir)
        const todos = deduplicarProveedores([...suscripcion, ...compra]);
        return <StreamingCompacto proveedores={todos} />;
    }

    return <StreamingCompleto suscripcion={suscripcion} compra={compra} />;
};
