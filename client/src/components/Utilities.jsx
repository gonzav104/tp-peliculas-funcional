import React from 'react';
import { AlertTriangle, RefreshCw, Film, SearchX } from 'lucide-react';
import styles from './Utilities.module.css';

// Componente de Carga Tipo Skeleton
export const MovieGridSkeleton = ({ count = 8 }) => {
    return (
        <div className={styles.skeletonGrid}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={styles.skeletonCard} />
            ))}
        </div>
    );
};

// Spinner simple (opcional, para cargas pequeñas)
export const Loading = () => (
    <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
    </div>
);

// Mensaje de Error
export const ErrorMessage = ({ error, onRetry }) => (
    <div className={`${styles.stateContainer} ${styles.error}`}>
        <div className={styles.iconWrapper}>
            <AlertTriangle size={48} />
        </div>
        <h3 className={styles.title}>Ocurrió un error</h3>
        <p className={styles.message}>{error || 'No pudimos cargar los datos. Por favor, intenta nuevamente.'}</p>
        {onRetry && (
            <button onClick={onRetry} className={styles.actionBtn}>
                <RefreshCw size={18} /> Reintentar
            </button>
        )}
    </div>
);

// Estado Vacío (Sin resultados)
export const EmptyState = ({ icon, title, message, action }) => (
    <div className={styles.stateContainer}>
        <div className={styles.iconWrapper}>
            {icon || <SearchX size={48} />}
        </div>
        <h3 className={styles.title}>{title || 'No hay resultados'}</h3>
        <p className={styles.message}>{message || 'Intenta ajustar tus filtros o búsqueda.'}</p>
        {action && (
            <button onClick={action.onClick} className={styles.actionBtn}>
                {action.label}
            </button>
        )}
    </div>
);