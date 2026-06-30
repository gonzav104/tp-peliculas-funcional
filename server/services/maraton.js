// Algoritmo de maraton - optimizacion recursiva y funciones puras

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

const calcularTiempoTotal = (peliculas) =>
    peliculas.reduce((acc, p) => acc + (p.duracion || 120), 0);

const formatearTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
};

const esPeliculaValida = (pelicula) =>
    Boolean(
        pelicula.id &&
        pelicula.titulo &&
        pelicula.rating !== undefined &&
        pelicula.duracion && pelicula.duracion > 0
    );

const filtrarPeliculasValidas = (peliculas) => peliculas.filter(esPeliculaValida);

const calcularValorPelicula = (pelicula) =>
    pelicula.rating / (pelicula.duracion || 120);

const ordenarPorValor = (peliculas) =>
    [...peliculas].sort((a, b) => calcularValorPelicula(b) - calcularValorPelicula(a));

const ordenarPorFechaDesc = (peliculas) =>
    [...peliculas].sort((a, b) => {
        const fechaA = new Date(a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha || 0).getTime();
        return fechaB - fechaA;
    });

const limitarPeliculas = (peliculas, maximo) => peliculas.slice(0, maximo);

const generarDescripcion = (peliculas, tiempoTotal, ratingPromedio) => {
    if (peliculas.length === 0) {
        return 'No se encontraron películas compatibles con tus criterios.';
    }

    const titulos = peliculas.map(p => `"${p.titulo}"`).join(', ');
    return `Maratón de ${peliculas.length} película(s) [${formatearTiempo(tiempoTotal)}] ` +
        `con rating promedio de ${ratingPromedio.toFixed(1)}: ${titulos}`;
};

const generarHash = (peliculas, tiempo) => {
    const ids = [...peliculas]
        .map(p => p.id)
        .sort((a, b) => a - b)
        .join(',');

    return crypto.createHash('md5').update(`${ids}|${tiempo}`).digest('hex');
};

const crearOptimizadorMaraton = () => {
    const memo = new Map();

    const optimizar = (peliculas, tiempoDisponible) => {
        if (peliculas.length === 0 || tiempoDisponible <= 0) {
            return [];
        }

        const key = generarHash(peliculas, tiempoDisponible);
        if (memo.has(key)) return memo.get(key);

        const [actual, ...resto] = peliculas;
        const duracionActual = actual.duracion || 120;

        const resultado = duracionActual <= tiempoDisponible
            ? (() => {
                const conActual = optimizar(resto, tiempoDisponible - duracionActual);
                const sinActual = optimizar(resto, tiempoDisponible);

                const ratingCon = conActual.reduce((acc, p) => acc + p.rating, 0) + actual.rating;
                const ratingSin = sinActual.reduce((acc, p) => acc + p.rating, 0);

                return ratingCon >= ratingSin ? [actual, ...conActual] : sinActual;
            })()
            : optimizar(resto, tiempoDisponible);

        memo.set(key, resultado);
        return resultado;
    };

    return optimizar;
};

const tieneGeneroBuscado = (pelicula, generosBuscados) =>
    Array.isArray(pelicula.generos) &&
    pelicula.generos.some(g => generosBuscados.includes(g.toLowerCase()));

export const planificarMaraton = (peliculas, tiempoDisponibleMinutos, opciones = {}) => {
    const { ratingMinimo = 6.0, maximoPeliculas = 10, preferirRecientes = false } = opciones;

    const filtradasPorValidez = filtrarPeliculasValidas(peliculas);
    const candidatas = filtradasPorValidez.filter(p => p.rating >= ratingMinimo);
    const candidatasOrdenadas = preferirRecientes
        ? ordenarPorFechaDesc(candidatas)
        : candidatas;

    const ordenadasPorValor = ordenarPorValor(candidatasOrdenadas);

    // Limitamos el input del algoritmo para evitar Stack Overflow en casos extremos
    const candidatasFinales = limitarPeliculas(ordenadasPorValor, 60);

    const optimizarMaratonRecursivo = crearOptimizadorMaraton();
    const seleccionadasBase = optimizarMaratonRecursivo(candidatasFinales, tiempoDisponibleMinutos);
    const seleccionadas = limitarPeliculas(seleccionadasBase, maximoPeliculas);

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

    const filtradas = peliculas.filter(p => tieneGeneroBuscado(p, generosBuscados));

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