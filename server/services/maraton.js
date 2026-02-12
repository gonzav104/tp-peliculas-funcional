// Algoritmo de maraton - optimizacion recurisiva y funciones puras

import crypto from 'crypto';

/**
 * @typedef {Object} Pelicula
 * @property {number} id
 * @property {string} titulo
 * @property {number} rating
 * @property {number} duracion
 * @property {string} [fecha]
 * @property {Array<string>} [generos]
 */

/**
 * @typedef {Object} PlanMaraton
 * @property {Array<Pelicula>} peliculas
 * @property {number} tiempoTotal
 * @property {number} ratingPromedio
 * @property {number} cantidadPeliculas
 * @property {string} descripcion
 */

// Funciones auxiliares puras
const calcularRatingPromedio = (peliculas) => {
    if (peliculas.length === 0) return 0;
    const suma = peliculas.reduce((acc, p) => acc + p.rating, 0);
    return suma / peliculas.length;
};

const calcularTiempoTotal = (peliculas) => {
    return peliculas.reduce((acc, p) => acc + (p.duracion || 120), 0);
};

const formatearTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
};

const esPeliculaValida = (pelicula) => {
    return Boolean(
        pelicula.id &&
        pelicula.titulo &&
        pelicula.rating !== undefined &&
        pelicula.duracion && pelicula.duracion > 0
    );
};

const filtrarPeliculasValidas = (peliculas) => {
    return peliculas.filter(esPeliculaValida);
};

// Generador de Hash para Memoización (Optimización)
const generarHash = (peliculas, tiempo) => {
    // Ordenamos IDs para asegurar consistencia (A,B es igual a B,A)
    const ids = peliculas.map(p => p.id).sort().join(',');
    return crypto.createHash('md5').update(`${ids}|${tiempo}`).digest('hex');
};

// Algoritmo con Memoización Robusta
const optimizarMaratonRecursivo = (peliculas, tiempoDisponible, memo = {}) => {
    if (peliculas.length === 0 || tiempoDisponible <= 0) {
        return [];
    }

    const key = generarHash(peliculas, tiempoDisponible);
    if (memo[key]) return memo[key];

    const [actual, ...resto] = peliculas;
    let resultado;

    // Asumimos 120 min si no tiene duración, por seguridad
    const duracionActual = actual.duracion || 120;

    if (duracionActual <= tiempoDisponible) {
        const conActual = optimizarMaratonRecursivo(resto, tiempoDisponible - duracionActual, memo);
        const sinActual = optimizarMaratonRecursivo(resto, tiempoDisponible, memo);

        const ratingCon = conActual.reduce((acc, p) => acc + p.rating, 0) + actual.rating;
        const ratingSin = sinActual.reduce((acc, p) => acc + p.rating, 0);

        resultado = ratingCon >= ratingSin ? [actual, ...conActual] : sinActual;
    } else {
        resultado = optimizarMaratonRecursivo(resto, tiempoDisponible, memo);
    }

    memo[key] = resultado;
    return resultado;
};

const calcularValorPelicula = (pelicula) => {
    return pelicula.rating / (pelicula.duracion || 120);
};

const ordenarPorValor = (peliculas) => {
    return [...peliculas].sort((a, b) => calcularValorPelicula(b) - calcularValorPelicula(a));
};

const generarDescripcion = (peliculas, tiempoTotal, ratingPromedio) => {
    if (peliculas.length === 0) return 'No se encontraron películas compatibles con tus criterios.';
    const titulos = peliculas.map(p => `"${p.titulo}"`).join(', ');
    return `Maratón de ${peliculas.length} película(s) [${formatearTiempo(tiempoTotal)}] ` +
        `con rating promedio de ${ratingPromedio.toFixed(1)}: ${titulos}`;
};

export const planificarMaraton = (peliculas, tiempoDisponibleMinutos, opciones = {}) => {
    const { ratingMinimo = 6.0, maximoPeliculas = 10, preferirRecientes = false } = opciones;

    let candidatas = filtrarPeliculasValidas(peliculas);
    candidatas = candidatas.filter(p => p.rating >= ratingMinimo);

    if (preferirRecientes) {
        candidatas.sort((a, b) => {
            const fechaA = new Date(a.fecha || 0).getTime();
            const fechaB = new Date(b.fecha || 0).getTime();
            return fechaB - fechaA;
        });
    }

    const ordenadas = ordenarPorValor(candidatas);
    // Limitamos el input del algoritmo para evitar Stack Overflow en casos extremos
    const candidatasFinales = ordenadas.slice(0, 60);

    let seleccionadas = optimizarMaratonRecursivo(candidatasFinales, tiempoDisponibleMinutos, {});

    if (seleccionadas.length > maximoPeliculas) {
        seleccionadas = seleccionadas.slice(0, maximoPeliculas);
    }

    const tiempoTotal = calcularTiempoTotal(seleccionadas);
    const ratingPromedio = calcularRatingPromedio(seleccionadas);

    return {
        peliculas: seleccionadas,
        tiempoTotal,
        tiempoDisponible: tiempoDisponibleMinutos,
        tiempoRestante: tiempoDisponibleMinutos - tiempoTotal,
        ratingPromedio: parseFloat(ratingPromedio.toFixed(2)),
        cantidadPeliculas: seleccionadas.length,
        descripcion: generarDescripcion(seleccionadas, tiempoTotal, ratingPromedio)
    };
};

export const planificarMaratonTematico = (peliculas, tiempo, generos, opciones = {}) => {
    const generosBuscados = generos.map(g => g.toLowerCase());

    const filtradas = peliculas.filter(p => {
        if (!p.generos || !Array.isArray(p.generos)) return false;
        return p.generos.some(g => generosBuscados.includes(g.toLowerCase()));
    });

    if (filtradas.length === 0) {
        return {
            peliculas: [],
            tiempoTotal: 0,
            tiempoDisponible: tiempo,
            tiempoRestante: tiempo,
            ratingPromedio: 0,
            cantidadPeliculas: 0,
            descripcion: `No pudimos encontrar películas de los géneros: ${generos.join(', ')}.`
        };
    }

    return planificarMaraton(filtradas, tiempo, opciones);
};

export const presetsMaraton = {
    tarde: 240,
    noche: 360,
    finDeSemana: 720,
    diaCompleto: 960
};

export const analizarPlan = (plan) => {
    const { tiempoTotal, tiempoDisponible, ratingPromedio, peliculas } = plan;
    const eficiencia = tiempoDisponible > 0 ? (tiempoTotal / tiempoDisponible) * 100 : 0;

    return {
        eficienciaTemporal: `${eficiencia.toFixed(1)}%`,
        peliculasExcelentes: peliculas.filter(p => p.rating >= 8).length,
        tiempoLibre: formatearTiempo(tiempoDisponible - tiempoTotal),
        calidadGeneral: ratingPromedio >= 7.5 ? 'Excelente' : 'Buena'
    };
};