import React from 'react';
import { Clapperboard, Search, Target } from 'lucide-react';
import styles from './Navbar.module.css';

export const Navbar = ({ seccionActiva, setSeccionActiva }) => {
    return (
        <header className={styles.header}>
            {/* Usamos headerContent para centrar */}
            <div className={styles.headerContent}>

                <div className={styles.logoGroup}>
                    <div className={styles.logoRow}>
                        <Clapperboard size={26} color="var(--accent)" />
                        <h1 className={styles.logo}>CineFuncional</h1>
                    </div>
                    <p className={styles.tagline}>
                        Procesamiento declarativo de datos
                    </p>
                </div>

                <nav className={styles.nav}>
                    <button
                        /* Usamos navBtnActivo como en tu original */
                        className={`${styles.navBtn} ${seccionActiva === 'descubrir' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('descubrir')}
                    >
                        <Search size={18} />
                        <span>Descubrir</span>
                    </button>
                    <button
                        className={`${styles.navBtn} ${seccionActiva === 'maraton' ? styles.navBtnActivo : ''}`}
                        onClick={() => setSeccionActiva('maraton')}
                    >
                        <Target size={18} />
                        <span>Planear Maratón</span>
                    </button>
                </nav>
            </div>
        </header>
    );
};