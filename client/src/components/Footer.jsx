import React from 'react';
import styles from './Footer.module.css';

export const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p>Pipeline Funcional | Programación Declarativa | UNSAdA 2026</p>
                <p className={styles.footerTech}>React 19 • Node.js • TMDB API • YouTube API</p>
            </div>
        </footer>
    );
};