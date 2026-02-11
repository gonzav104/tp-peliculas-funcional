import React from 'react';
import styles from './Utilities.module.css';

/**
 * Componente de Loading reutilizable
 */
export const Loading = ({ message = 'Cargando...', size = 'medium' }) => {
    return (
        <div className={styles.loadingContainer}>
            <div className={`${styles.spinner} ${styles[size]}`}></div>
            <p className={styles.loadingMessage}>{message}</p>
        </div>
    );
};

/**
 * Componente de Error reutilizable
 */
export const ErrorMessage = ({ error, onRetry }) => {
    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Algo salió mal</h3>
            <p className={styles.errorMessage}>{error}</p>
            {onRetry && (
                <button onClick={onRetry} className={styles.retryButton}>
                    🔄 Reintentar
                </button>
            )}
        </div>
    );
};

/**
 * Componente de Estado Vacío
 */
export const EmptyState = ({
                               icon = '🎬',
                               title = 'No hay resultados',
                               message,
                               action
                           }) => {
    return (
        <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>{icon}</div>
            <h3 className={styles.emptyTitle}>{title}</h3>
            {message && <p className={styles.emptyMessage}>{message}</p>}
            {action && (
                <button onClick={action.onClick} className={styles.emptyAction}>
                    {action.label}
                </button>
            )}
        </div>
    );
};

/**
 * Componente de Badge
 */
export const Badge = ({ children, variant = 'default', size = 'medium' }) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${styles[`size-${size}`]}`}>
            {children}
        </span>
    );
};

/**
 * Componente de Tooltip
 */
export const Tooltip = ({ children, text, position = 'top' }) => {
    return (
        <div className={styles.tooltipContainer}>
            {children}
            <span className={`${styles.tooltipText} ${styles[`tooltip-${position}`]}`}>
                {text}
            </span>
        </div>
    );
};

/**
 * Componente de Skeleton Loader
 */
export const Skeleton = ({ width = '100%', height = '20px', variant = 'text' }) => {
    return (
        <div
            className={`${styles.skeleton} ${styles[`skeleton-${variant}`]}`}
            style={{ width, height }}
        />
    );
};

/**
 * Grid de Skeleton para MovieCards
 */
export const MovieGridSkeleton = ({ count = 12 }) => {
    return (
        <div className={styles.movieGridSkeleton}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={styles.movieCardSkeleton}>
                    <Skeleton variant="rectangular" height="450px" />
                    <div className={styles.skeletonInfo}>
                        <Skeleton height="24px" width="80%" />
                        <Skeleton height="16px" width="60%" />
                        <Skeleton height="16px" width="40%" />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Componente de Modal genérico
 */
export const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className={styles.modalClose}>
                        ✕
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.errorBoundary}>
                    <h2>😢 Algo salió mal</h2>
                    <p>La aplicación encontró un error inesperado.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className={styles.retryButton}
                    >
                        🔄 Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}