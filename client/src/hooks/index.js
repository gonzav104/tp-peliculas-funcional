import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para manejar peticiones a la API
 * Implementa el patrón Loading/Error/Success de forma declarativa
 *
 * @param {Function} apiFunction - Función que retorna una Promise
 * @param {boolean} immediate - Si debe ejecutarse inmediatamente
 * @returns {Object} - Estado y funciones de control
 */
export const useApi = (apiFunction, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...params) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction(...params);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || 'Error desconocido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        reset
    };
};

/**
 * Hook para manejar formularios con validación
 *
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Function} onSubmit - Callback al hacer submit
 * @returns {Object} - Estado y handlers del formulario
 */
export const useForm = (initialValues, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Limpiar error del campo al modificarlo
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            await onSubmit(values);
        } catch (err) {
            if (err.validationErrors) {
                setErrors(err.validationErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [values, onSubmit]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
    }, [initialValues]);

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        reset,
        setValues
    };
};

/**
 * Hook para detectar si un elemento está visible en el viewport
 * Útil para lazy loading de imágenes
 *
 * @param {Object} options - Opciones de IntersectionObserver
 * @returns {Array} - [ref, isVisible]
 */
export const useIntersectionObserver = (options = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [ref, setRef] = useState(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        }, {
            threshold: 0.1,
            ...options
        });

        observer.observe(ref);

        return () => {
            if (ref) {
                observer.unobserve(ref);
            }
        };
    }, [ref, options]);

    return [setRef, isVisible];
};

/**
 * Hook para debouncing de valores
 * Útil para búsquedas en tiempo real
 *
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en ms
 * @returns {any} - Valor debounced
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook para almacenamiento local persistente
 *
 * @param {string} key - Clave en localStorage
 * @param {any} initialValue - Valor inicial
 * @returns {Array} - [value, setValue, remove]
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const remove = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, remove];
};