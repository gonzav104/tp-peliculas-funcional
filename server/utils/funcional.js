// Este módulo centraliza las herramientas funcionales que se usan activamente en el proyecto.

/**
 * PIPE (composición de izquierda a derecha)
 * @param {...Function} fns - Funciones a encadenar
 * @returns {Function} - Función encadenada
 */
export const pipe = (...fns) =>
    (valorInicial) =>
        fns.reduce((valor, fn) => fn(valor), valorInicial);

/**
 * CURRY - Transforma función de múltiples args en secuencia de funciones
 * @param {Function} fn - Función a currificar
 * @returns {Function} - Función currificada
 */
export const curry = (fn) => {
    const arity = fn.length;

    return function curried(...args) {
        if (args.length >= arity) {
            return fn(...args);
        }
        return (...moreArgs) => curried(...args, ...moreArgs);
    };
};

/**
 * MAP currificado
 * @param {Function} fn - Función transformadora
 * @returns {Function} - Función que espera el array
 */
export const map = curry((fn, array) => array.map(fn));

/**
 * FILTER currificado
 * @param {Function} predicado - Función booleana
 * @returns {Function} - Función que espera el array
 */
export const filter = curry((predicado, array) => array.filter(predicado));

/**
 * SORT inmutable
 * @param {Function} comparador - Función de comparación
 * @returns {Function} - Función que espera el array
 */
export const sort = curry((comparador, array) => [...array].sort(comparador));

// --- DEFINICIÓN DE TIPOS PARA EITHER ---

/**
 * Definimos la interfaz de la Mónada Either para que el IDE reconozca 'fold'
 * @template L, R
 * @typedef {Object} EitherMonad
 * @property {boolean} isLeft
 * @property {function(function(R): any): EitherMonad<L, any>} map
 * @property {function(function(L): any, function(R): any): any} fold
 */

/**
 * EITHER - Para manejo de errores funcional (Left = Error, Right = Éxito)
 */
export const Either = {
    /**
     * Constructor del caso Fallido
     * @template L
     * @param {L} error
     * @returns {EitherMonad<L, any>}
     */
    Left: (error) => ({
        isLeft: true,
        map: () => Either.Left(error),
        // Usamos guion bajo para parámetros ignorados
        fold: (leftFn, _rightFn) => leftFn(error)
    }),

    /**
     * Constructor del caso Exitoso
     * @template R
     * @param {R} valor
     * @returns {EitherMonad<any, R>}
     */
    Right: (valor) => ({
        isLeft: false,
        map: (fn) => Either.Right(fn(valor)),
        // Usamos guion bajo para parámetros ignorados
        fold: (_leftFn, rightFn) => rightFn(valor)
    })
};