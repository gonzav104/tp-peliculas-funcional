// Algoritmo de maraton - optimizacion recurisiva y funciones puras

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
    // @ts-ignore
    return peliculas.filter(esPeliculaValida);
};

// Algortimo de optimización recursiva
const optimizarMaratonRecursivo = (peliculas, tiempoDisponible, seleccionadas = []) => {
    if (peliculas.length === 0 || tiempoDisponible <= 0) {
        return seleccionadas;
    }

    const [actual, ...resto] = peliculas;

    if (actual.duracion <= tiempoDisponible) {
        const conActual = optimizarMaratonRecursivo(
            resto,
            tiempoDisponible - actual.duracion,
            [...seleccionadas, actual]
        );

        const sinActual = optimizarMaratonRecursivo(
            resto,
            tiempoDisponible,
            seleccionadas
        );

        const sumaCon = conActual.reduce((acc, p) => acc + p.rating, 0);
        const sumaSin = sinActual.reduce((acc, p) => acc + p.rating, 0);

        return sumaCon >= sumaSin ? conActual : sinActual;
    }

    return optimizarMaratonRecursivo(resto, tiempoDisponible, seleccionadas);
};

const calcularValorPelicula = (pelicula) => {
    return pelicula.rating / (pelicula.duracion || 120);
};

const ordenarPorValor = (peliculas) => {
    return [...peliculas].sort((a, b) =>
        calcularValorPelicula(b) - calcularValorPelicula(a)
    );
};

// Función principal de planificación de maratón
export const planificarMaraton = (
    peliculas,
    tiempoDisponibleMinutos,
    opciones = {}
) => {
    const {
        ratingMinimo = 6.0,
        maximoPeliculas = 10,
        preferirRecientes = false
    } = opciones;

    let candidatas = filtrarPeliculasValidas(peliculas);
    candidatas = candidatas.filter(p => p.rating >= ratingMinimo);

    if (preferirRecientes) {
        candidatas.sort((a, b) => {
            const fechaA = new Date(a.fecha || 0).getTime();
            const fechaB = new Date(b.fecha || 0).getTime();
            return fechaB - fechaA;
        });
    }

    if (candidatas.length > maximoPeliculas) {
        candidatas = candidatas.slice(0, maximoPeliculas);
    }

    const ordenadas = ordenarPorValor(candidatas);

    const seleccionadas = optimizarMaratonRecursivo(
        ordenadas,
        tiempoDisponibleMinutos,
        []
    );

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

const generarDescripcion = (peliculas, tiempoTotal, ratingPromedio) => {
    if (peliculas.length === 0) return 'No se encontraron películas compatibles.';
    const titulos = peliculas.map(p => `"${p.titulo}"`).join(', ');
    return `Maratón de ${peliculas.length} película(s) [${formatearTiempo(tiempoTotal)}] ` +
        `con rating promedio de ${ratingPromedio.toFixed(1)}★: ${titulos}`;
};

export const planificarMaratonTematico = (peliculas, tiempo, generos) => {
    const filtradas = peliculas.filter(p =>
        p.generos && p.generos.some(g => generos.includes(g))
    );
    return planificarMaraton(filtradas, tiempo);
};

export const presetsMaraton = {
    tarde: 240,
    noche: 360,
    finDeSemana: 720,
    diaCompleto: 960
};

export const analizarPlan = (plan) => {
    const { tiempoTotal, tiempoDisponible, ratingPromedio, peliculas } = plan;
    const eficiencia = (tiempoTotal / tiempoDisponible) * 100;

    return {
        eficienciaTemporal: `${eficiencia.toFixed(1)}%`,
        peliculasExcelentes: peliculas.filter(p => p.rating >= 8).length,
        tiempoLibre: formatearTiempo(tiempoDisponible - tiempoTotal),
        calidadGeneral: ratingPromedio >= 7.5 ? 'Excelente' : 'Buena'
    };
};