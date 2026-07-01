import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks';
import styles from './SearchBar.module.css';

export const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 350);
    const isFirstRender = useRef(true);

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    const handleClear = () => {
        setQuery('');
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    return (
        <div className={styles.searchContainer}>
            <div className={styles.inputWrapper}>
                <Search className={styles.searchIcon} size={20} />

                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar películas, actores, géneros..."
                    value={query}
                    onChange={handleChange}
                    aria-label="Buscar películas"
                />

                {query && (
                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={handleClear}
                        aria-label="Limpiar búsqueda"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
