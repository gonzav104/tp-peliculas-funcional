import React, { useState } from 'react';
import { useDebounce } from '../hooks';
import styles from './SearchBar.module.css';

export const SearchBar = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    React.useEffect(() => {
        if (debouncedQuery.trim().length >= 2) {
            onSearch(debouncedQuery);
        } else if (debouncedQuery.trim().length === 0) {
            onSearch(''); // Reset search
        }
    }, [debouncedQuery, onSearch]);

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar películas por título..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <button
                        className={styles.clearButton}
                        onClick={handleClear}
                        type="button"
                    >
                        ✕
                    </button>
                )}
                {loading && <span className={styles.searchLoading}>⏳</span>}
            </div>
            {query.trim().length > 0 && query.trim().length < 2 && (
                <p className={styles.searchHint}>Escribe al menos 2 caracteres</p>
            )}
        </div>
    );
};
