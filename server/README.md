# Backend — TP Películas Funcional

Backend construido con **Express 5** y **Node.js (ESM)** que aplica principios de **programación funcional** para consumir la API de TMDB y YouTube, unificar datos de múltiples fuentes y planificar maratones de películas con un algoritmo de optimización recursivo.

---

## 1. Arquitectura del Backend

El servidor sigue una arquitectura en capas bien definida:

```
Routes  →  Controllers  →  Services  →  Utils
```

| Capa | Responsabilidad | Archivos |
|------|----------------|----------|
| **Routes** | Define los endpoints HTTP y los conecta con controllers | `routes/pelis_routes.js` |
| **Controllers** | Valida input (Zod), orquesta llamadas a services, formatea respuestas | `controllers/peliculas_controller.js` |
| **Services** | Lógica de negocio: consultar APIs externas, unificar datos, planificar maratones | `services/tmdb.js`, `services/unificador.js`, `services/youtube.js`, `services/maraton.js` |
| **Utils** | Funciones puras reutilizables, constantes, helpers de respuesta | `utils/funcional.js`, `utils/peliculas.js`, `utils/constants.js`, `utils/response.js`, `utils/logger.js` |
| **Schemas** | Validación de datos con Zod | `schemas/peliculas.js`, `schemas/tmdb_response.js` |
| **Middlewares** | Manejo centralizado de errores | `middlewares/errorHandler.js` |

### Flujo de una petición típica

```
Cliente HTTP
  → Express (helmet, cors, rateLimit)
    → Router (/api/peliculas/...)
      → Controller (valida con Zod)
        → Service (consulta TMDB/YouTube)
          → Utils (pipe, Either, transformaciones)
        ← Respuesta estandarizada (success/error)
      ← JSON al cliente
```

### Seguridad y Rate Limiting

La aplicación configura seguridad desde `app.js`:

```js
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,                  // máx 100 peticiones por ventana
    message: {
        exito: false,
        error: 'Demasiadas peticiones, por favor intenta más tarde.'
    }
});

app.use('/api', limiter);
```

---

## 2. Programación Funcional

Este proyecto aplica programación funcional como paradigma central. Todas las utilidades funcionales están en `utils/funcional.js`.

### 2.1 Either (Mónada para manejo de errores)

El patrón **Either** reemplaza los bloques `try/catch` tradicionales con un flujo declarativo. `Left` representa un error y `Right` un éxito:

```js
// utils/funcional.js
export const Either = {
    Left: (error) => ({
        isLeft: true,
        map: () => Either.Left(error),
        fold: (leftFn, _rightFn) => leftFn(error)
    }),

    Right: (valor) => ({
        isLeft: false,
        map: (fn) => Either.Right(fn(valor)),
        fold: (_leftFn, rightFn) => rightFn(valor)
    })
};
```

**Uso real en `services/tmdb.js`** — el wrapper `fetchTMDB` retorna `Either.Right` si la API responde bien, o `Either.Left` si hay error HTTP o falla la validación Zod:

```js
const fetchTMDB = async (endpoint, params = {}, schema = null) => {
    try {
        const respuesta = await axios.get(url, config);

        if (schema) {
            const validacion = schema.safeParse(respuesta.data);
            if (!validacion.success) {
                return Either.Left({
                    mensaje: 'Estructura de respuesta inválida de TMDB',
                    detalle: validacion.error.issues
                });
            }
            return Either.Right(validacion.data);
        }

        return Either.Right(respuesta.data);
    } catch (error) {
        return Either.Left({
            mensaje: 'Error al consultar TMDB',
            detalle: error.message,
            endpoint
        });
    }
};
```

Luego, cada función que consume `fetchTMDB` resuelve el resultado con `.fold()`:

```js
export const obtenerPeliculasPopulares = async () => {
    const resultado = await fetchTMDB('/movie/popular', {page: randomPage}, TMDBListResponseSchema);

    return resultado.fold(
        (error) => {                            // Left: error
            logger.warn('Retornando lista vacía por error en populares', error);
            return [];
        },
        (data) => procesarPeliculasEstandar(data.results || [])  // Right: éxito
    );
};
```

### 2.2 Pipe (composición de izquierda a derecha)

`pipe` encadena funciones donde la salida de una es la entrada de la siguiente:

```js
// utils/funcional.js
export const pipe = (...fns) =>
    (valorInicial) =>
        fns.reduce((valor, fn) => fn(valor), valorInicial);
```

**Uso real en `utils/peliculas.js`** — pipelines de procesamiento de películas:

```js
// Pipeline Estándar: Limpiar → Filtrar Poster → Ordenar por Rating
export const procesarPeliculasEstandar = pipe(
    limpiarPeliculas,
    filtrarConPoster,
    ordenarPorRating
);

// Pipeline Calidad: Estándar + Rating mínimo 7.0 + Con descripción
export const procesarPeliculasCalidad = pipe(
    limpiarPeliculas,
    filtrarConPoster,
    filtrarPorRatingMinimo(7.0),
    filtrarConDescripcion,
    ordenarPorRating
);
```

**Uso en `services/youtube.js`** — pipeline de procesamiento de videos:

```js
const procesarVideosYouTube = pipe(
    map(normalizarVideoYouTube),
    filter(pareceTrailerOficial)
);
```

### 2.3 Curry (aplicación parcial)

`curry` transforma una función de múltiples argumentos en una secuencia de funciones de un argumento:

```js
// utils/funcional.js
export const curry = (fn) => {
    const arity = fn.length;

    return function curried(...args) {
        if (args.length >= arity) {
            return fn(...args);
        }
        return (...moreArgs) => curried(...args, ...moreArgs);
    };
};
```

Se usa para crear versiones currificadas de `map`, `filter` y `sort`:

```js
export const map = curry((fn, array) => array.map(fn));
export const filter = curry((predicado, array) => array.filter(predicado));
export const sort = curry((comparador, array) => [...array].sort(comparador));
```

Esto permite aplicación parcial como:

```js
const tieneRatingMinimo = curry((minimo, peli) => peli.rating >= minimo);

export const filtrarPorRatingMinimo = (rating) =>
    filter(tieneRatingMinimo(rating));
```

### 2.4 Memoize (caché funcional)

La función `memoize` en `services/tmdb.js` usa `NodeCache` para evitar llamadas duplicadas a la API:

```js
const memoize = (fn) => {
    return async (...args) => {
        const key = JSON.stringify(args);
        const valorGuardado = tmdbCache.get(key);
        if (valorGuardado !== undefined) {
            logger.debug(`Cache HIT: ${key}`);
            return valorGuardado;
        }

        const resultado = await fn(...args);
        logger.debug(`Cache MISS: ${key}`);
        tmdbCache.set(key, resultado);
        return resultado;
    };
};

export const buscarPeliculasMemo = memoize(buscarPeliculas);
export const obtenerProveedoresStreamingMemo = memoize(obtenerProveedoresStreaming);
```

El caché tiene TTL de 1 hora (`stdTTL: 3600`) y limpieza cada 10 minutos (`checkperiod: 600`).

### 2.5 Funciones Puras e Inmutabilidad

El servicio de maratón (`services/maraton.js`) es un ejemplo de funciones puras: sin efectos secundarios, sin mutación de datos:

```js
const calcularRatingPromedio = (peliculas) => {
    if (peliculas.length === 0) return 0;
    const suma = peliculas.reduce((acc, p) => acc + p.rating, 0);
    return suma / peliculas.length;
};

// Sort inmutable — crea copia antes de ordenar
export const sort = curry((comparador, array) => [...array].sort(comparador));
```

---

## 3. Servicios

### 3.1 `services/tmdb.js` — Servicio TMDB

Capa de acceso a The Movie Database. Todas las funciones retornan datos ya procesados a través de pipelines funcionales.

| Función | Descripción |
|---------|-------------|
| `fetchTMDB(endpoint, params, schema)` | Wrapper interno. Llama a la API, valida con Zod si se pasa un schema, retorna `Either` |
| `obtenerPeliculasPopulares()` | Películas populares (página aleatoria 1-5 para variedad) |
| `obtenerPeliculasCalidad()` | Top rated con rating ≥ 7.0 y descripción |
| `descubrirPeliculasPorDecada(decada)` | Películas de una década específica (`/discover/movie`), rating ≥ 6.0, ≥ 100 votos |
| `buscarPeliculas(query)` | Búsqueda por texto libre |
| `buscarPeliculasMemo(query)` | Versión memoizada de `buscarPeliculas` |
| `obtenerDetallesPelicula(id)` | Detalle completo: créditos, videos, géneros, productoras, países |
| `obtenerProveedoresStreaming(id)` | Proveedores de streaming con fallback regional AR→ES→US |
| `obtenerProveedoresStreamingMemo(id)` | Versión memoizada de `obtenerProveedoresStreaming` |

### 3.2 `services/unificador.js` — Unificador de Fuentes

Combina datos de TMDB, YouTube y proveedores de streaming en un único objeto enriquecido.

**`combinarFuentes(datosTMDB, datosYouTube, datosStreaming)`** — Mezcla los datos y registra las fuentes utilizadas:

```js
const combinarFuentes = (datosTMDB, datosYouTube, datosStreaming = null) => {
    const fuentes = ['tmdb'];
    if (datosYouTube) fuentes.push('youtube');
    if (datosStreaming) fuentes.push('streaming');

    return {
        ...datosTMDB,
        trailer: datosYouTube ? { id, titulo, url, urlEmbed, thumbnail, canal } : null,
        streaming: datosStreaming || null,
        fuentes,
        fechaUnificacion: new Date().toISOString(),
        estaCompleta: datosYouTube !== null
    };
};
```

**`enriquecerPelicula(id)`** — Orquesta el enriquecimiento:
1. Obtiene detalles de TMDB
2. Busca trailer (primero en los videos de TMDB, si no lo encuentra usa YouTube API — ahorro de cuota)
3. Obtiene proveedores de streaming
4. Usa `Promise.allSettled` para que un fallo en YouTube o Streaming no bloquee la respuesta

```js
const [trailerResult, streamingResult] = await Promise.allSettled([
    buscarTrailer(),
    obtenerProveedoresStreamingMemo(idPelicula)
]);
```

**`enriquecerPeliculasLote(ids)`** — Procesa múltiples películas con control de concurrencia usando `p-limit`:

```js
const LIMIT_CONCURRENCY = 5;
const limit = pLimit(LIMIT_CONCURRENCY);

const promesas = idsPeliculas.map(id => limit(() => enriquecerPelicula(id)));
const resultadosRaw = await Promise.allSettled(promesas);
```

Otras funciones exportadas: `enriquecerListaPeliculas`, `obtenerPopularesEnriquecidas`, `buscarYEnriquecer`, `analizarUnificacion`.

### 3.3 `services/youtube.js` — Servicio YouTube

Busca tráilers en la API de YouTube Data v3.

| Función | Descripción |
|---------|-------------|
| `buscarTrailerPelicula(titulo, anio)` | Busca un tráiler oficial. Si la cuota está excedida (HTTP 403), retorna `FALLBACK_VIDEO` |
| `buscarTrailersPelicula(titulo, limite)` | Busca múltiples tráilers |
| `obtenerEstadisticasVideo(videoId)` | Vistas, likes, comentarios y duración |
| `parsearDuracionISO(duracion)` | Convierte duración ISO 8601 (`PT1H30M`) a segundos |

Usa `pipe`, `map` y `filter` para procesar videos:

```js
const procesarVideosYouTube = pipe(
    map(normalizarVideoYouTube),
    filter(pareceTrailerOficial)
);
```

El filtro `pareceTrailerOficial` busca keywords como `trailer`, `official`, `tráiler`, `oficial`, `teaser`, `hd`, `4k` en el título.

### 3.4 `services/maraton.js` — Planificador de Maratones

Algoritmo de optimización recursivo con memoización que maximiza el rating total de películas dentro de un tiempo disponible (problema tipo Knapsack).

| Función | Descripción |
|---------|-------------|
| `planificarMaraton(peliculas, tiempo, opciones)` | Plan óptimo considerando `ratingMinimo`, `maximoPeliculas`, `preferirRecientes` |
| `planificarMaratonTematico(peliculas, tiempo, generos, opciones)` | Filtra por géneros antes de optimizar |
| `analizarPlan(plan)` | Calcula eficiencia temporal, películas excelentes (≥ 8), tiempo libre |
| `presetsMaraton` | Tiempos predefinidos: `tarde: 240`, `noche: 360`, `finDeSemana: 720`, `diaCompleto: 960` |

El algoritmo recursivo usa **memoización con hash MD5** para evitar recomputar subproblemas:

```js
const generarHash = (peliculas, tiempo) => {
    const ids = peliculas.map(p => p.id).sort().join(',');
    return crypto.createHash('md5').update(`${ids}|${tiempo}`).digest('hex');
};

const optimizarMaratonRecursivo = (peliculas, tiempoDisponible, memo = {}) => {
    if (peliculas.length === 0 || tiempoDisponible <= 0) return [];

    const key = generarHash(peliculas, tiempoDisponible);
    if (memo[key]) return memo[key];

    const [actual, ...resto] = peliculas;
    // ... decisión: incluir o excluir la película actual
};
```

---

## 4. Endpoints / API

Todos los endpoints están bajo el prefijo `/api/peliculas`.

### Endpoints Básicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/peliculas/` | Documentación interactiva de la API (JSON) |
| `GET` | `/api/peliculas/populares` | Películas populares de TMDB (página aleatoria) |
| `GET` | `/api/peliculas/populares-enriquecidas?limite=10` | Populares con tráilers y streaming (TMDB + YouTube) |
| `GET` | `/api/peliculas/top-rated` | Películas mejor calificadas (rating ≥ 7.0) |
| `GET` | `/api/peliculas/estado` | Estado del servicio y modo (Ahorro/Producción) |

### Endpoints de Búsqueda

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/peliculas/buscar?q=inception` | Búsqueda básica por texto |
| `GET` | `/api/peliculas/buscar-enriquecida?q=inception&limite=5` | Búsqueda con tráilers y streaming |

### Endpoints de Maratón

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/peliculas/maraton` | Planificar maratón optimizado. Body: `{ tiempo, ratingMinimo?, maximoPeliculas? }` |
| `POST` | `/api/peliculas/maraton-tematico` | Maratón por género. Body: `{ tiempo, generos, ratingMinimo?, maximoPeliculas? }` |
| `POST` | `/api/peliculas/maraton-decada` | Maratón por década. Body: `{ tiempo, decada }` |
| `GET` | `/api/peliculas/maraton/presets` | Presets de tiempo: tarde, noche, finDeSemana, diaCompleto |

### Endpoints de YouTube

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/peliculas/trailers?peli=inception` | Buscar tráilers de una película |
| `GET` | `/api/peliculas/video-stats?id=videoId` | Estadísticas de un video de YouTube |

### Otros Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/status` | Estado general de la aplicación |

---

## 5. Integración con TMDB

### Wrapper `fetchTMDB`

Todas las llamadas a TMDB pasan por `fetchTMDB`, que centraliza:
- **Autenticación**: Inyecta `api_key` automáticamente
- **Idioma**: Fuerza `language: 'es-ES'` para respuestas en español
- **Validación**: Si se pasa un schema Zod, valida la estructura de la respuesta
- **Errores**: Retorna `Either.Left` en lugar de lanzar excepciones

```js
const fetchTMDB = async (endpoint, params = {}, schema = null) => {
    const config = {
        params: {
            api_key: API_KEY,
            language: 'es-ES',
            ...params
        }
    };

    const respuesta = await axios.get(`${BASE_URL}${endpoint}`, config);

    if (schema) {
        const validacion = schema.safeParse(respuesta.data);
        if (!validacion.success) {
            return Either.Left({ mensaje: 'Estructura de respuesta inválida de TMDB', ... });
        }
        return Either.Right(validacion.data);
    }

    return Either.Right(respuesta.data);
};
```

### Transformación de datos

Las películas crudas de TMDB se normalizan a un formato limpio en español:

```js
const normalizarPeliculaTMDB = (peli) => ({
    id: peli.id,
    titulo: peli.title,
    resumen: peli.overview || 'Sin descripción disponible',
    imagen: peli.poster_path
        ? `https://image.tmdb.org/t/p/w500${peli.poster_path}`
        : null,
    rating: peli.vote_average || 0,
    fecha: peli.release_date || 'Fecha desconocida',
    fuente: 'tmdb'
});
```

---

## 6. Plataformas de Streaming

### Obtención de proveedores

La función `obtenerProveedoresStreaming(idPelicula)` en `services/tmdb.js` consulta el endpoint `/movie/{id}/watch/providers` de TMDB.

### Fallback regional: AR → ES → US

La constante `STREAMING_REGIONES_FALLBACK` define el orden de prioridad:

```js
// utils/constants.js
export const STREAMING_REGIONES_FALLBACK = ['AR', 'ES', 'US'];
```

La lógica busca la primera región disponible:

```js
const regiones = data.results || {};
const regionDisponible = STREAMING_REGIONES_FALLBACK.find(
    (region) => regiones[region]
);

if (!regionDisponible) return null;

return normalizarStreamingTMDB(regiones[regionDisponible]);
```

### Normalización y deduplicación

Cada proveedor se normaliza y se deduplican por ID:

```js
// utils/peliculas.js
export const normalizarProveedor = (proveedor) => ({
    id: proveedor.provider_id,
    nombre: proveedor.provider_name,
    logo: `https://image.tmdb.org/t/p/original${proveedor.logo_path}`
});

export const normalizarStreamingTMDB = (datosRegion) => {
    const suscripcionRaw = (datosRegion?.flatrate || []).map(normalizarProveedor);
    const compraRaw = (datosRegion?.buy || []).map(normalizarProveedor);

    return {
        suscripcion: deduplicarPorId(suscripcionRaw),
        compra: deduplicarPorId(compraRaw)
    };
};
```

### Estructura JSON de respuesta

```json
{
  "streaming": {
    "suscripcion": [
      { "id": 8, "nombre": "Netflix", "logo": "https://image.tmdb.org/t/p/original/netflix.png" }
    ],
    "compra": [
      { "id": 3, "nombre": "Google Play", "logo": "https://image.tmdb.org/t/p/original/gplay.png" }
    ]
  }
}
```

---

## 7. Validación con Zod

### Schemas de entrada (`schemas/peliculas.js`)

**Búsqueda:**
```js
export const buscarSchema = z.object({
    q: z.string({ required_error: "Debes proporcionar un término de búsqueda ('q')" })
        .min(1, "La búsqueda no puede estar vacía"),
    limite: z.coerce.number().min(1).max(50).default(5).optional()
});
```

**Maratón:**
```js
export const maratonSchema = z.object({
    tiempo: z.number({ required_error: "El tiempo disponible es obligatorio" })
        .int().positive().max(1440, "El máximo es 24 horas (1440 min)"),
    ratingMinimo: z.number().min(0).max(10).default(0).optional(),
    maximoPeliculas: z.number().int().positive().optional()
});
```

**Maratón Temático:**
```js
export const maratonTematicoSchema = z.object({
    tiempo: z.number().int().positive().max(1440),
    generos: z.array(z.string()).nonempty("Debes elegir al menos un género"),
    ratingMinimo: z.number().min(0).max(10).default(5.0).optional(),
    maximoPeliculas: z.number().int().positive().default(10).optional()
});
```

**Maratón por Década:**
```js
export const maratonDecadaSchema = z.object({
    tiempo: z.number().int().positive(),
    decada: z.number().int()
        .min(1900, "Muy antiguo para nuestro catálogo")
        .max(2030, "No podemos predecir el futuro")
        .refine(val => val % 10 === 0, "Debe ser una década (ej: 1980, 1990)")
});
```

### Schemas de respuesta TMDB (`schemas/tmdb_response.js`)

Se validan las respuestas de TMDB con dos schemas:

- **`TMDBListResponseSchema`** — Para endpoints que devuelven listas (`/movie/popular`, `/search/movie`, `/discover/movie`)
- **`TMDBDetailResponseSchema`** — Para detalles de película, incluyendo créditos (`cast`, `crew`) y videos. Usa `.passthrough()` para permitir campos extra no validados.

### Helper de validación en el controller

```js
const validar = (schema, data, res) => {
    const resultado = schema.safeParse(data);
    if (!resultado.success) {
        error(res, ERRORES.VALIDACION, 400, resultado.error.format());
        return null;
    }
    return resultado.data;
};
```

---

## 8. Manejo de Errores

### Flujo Either

El patrón Either evita excepciones no controladas. Las funciones de servicio retornan `Either.Left` (error) o `Either.Right` (éxito), y el consumidor decide qué hacer con `.fold()`:

```js
// Ejemplo: si falla TMDB, retornar array vacío en vez de lanzar excepción
resultado.fold(
    (error) => [],                                    // Left → fallback
    (data) => procesarPeliculasEstandar(data.results)  // Right → procesar
);
```

### Middleware de errores

`middlewares/errorHandler.js` captura cualquier error no manejado:

```js
export const errorHandler = (err, req, res, next) => {
    console.error("Error detectado:", err.message);
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        exito: false,
        error: statusCode === 500 ? "Error Interno del Servidor" : err.name,
        mensaje: err.message,
    });
};
```

### Helpers de respuesta (`utils/response.js`)

Estandarizan el formato JSON de todas las respuestas:

```js
export const success = (res, data, status = 200) => {
    res.status(status).json({ exito: true, ...data });
};

export const error = (res, message, status = 500, details = null) => {
    res.status(status).json({ exito: false, error: message, detalles: details });
};
```

### Graceful Degradation

El unificador usa `Promise.allSettled` para que un fallo en YouTube o Streaming no bloquee toda la respuesta:

```js
const [trailerResult, streamingResult] = await Promise.allSettled([
    buscarTrailer(),
    obtenerProveedoresStreamingMemo(idPelicula)
]);

const datosYouTube = trailerResult.status === 'fulfilled' ? trailerResult.value : null;
const datosStreaming = streamingResult.status === 'fulfilled' ? streamingResult.value : null;
```

### Constantes de errores

```js
// utils/constants.js
export const ERRORES = {
    TMDB_CONNECTION: 'Error al conectar con el servicio de películas (TMDB)',
    YOUTUBE_QUOTA: 'Cuota de YouTube excedida o error de conexión',
    VALIDACION: 'Los datos enviados no tienen el formato correcto',
    NO_RESULTADOS: 'No se encontraron resultados para tu búsqueda'
};
```

---

## 9. Testing

### Stack de testing

- **Jest 30** con soporte ESM (flag `--experimental-vm-modules`)
- Mocks con `jest.unstable_mockModule` para ESM
- Los tests están ubicados junto a los servicios: `services/*.test.js`

### Cómo ejecutar

```bash
npm test
# Ejecuta: node --experimental-vm-modules node_modules/jest/bin/jest.js
```

### Qué se testea

**`tmdb.test.js`** — Caché y proveedores de streaming:
- Caché MISS: primera llamada consulta la API (axios)
- Caché HIT: segunda llamada con mismo término NO consulta la API
- Proveedores streaming con prioridad AR
- Fallback a ES si AR no está disponible
- Retorna `null` si ninguna región del fallback está disponible (AR, ES, US)
- Manejo de error de red sin romper (graceful degradation)

**`unificador.test.js`** — Unificación y concurrencia:
- Procesar un lote mayor al límite de concurrencia (7 items con límite 5)
- Manejo de errores individuales sin detener todo el lote
- Inclusión del campo `streaming` en película enriquecida
- Graceful degradation si streaming falla
- Verificación de que `fuentes` contiene las 3 fuentes cuando están disponibles

### Ejemplo de mock ESM

```js
jest.unstable_mockModule('./tmdb.js', () => ({
    obtenerDetallesPelicula: jest.fn(),
    obtenerPeliculasPopulares: jest.fn(),
    buscarPeliculas: jest.fn(),
    obtenerProveedoresStreamingMemo: jest.fn()
}));

const tmdbMock = await import('./tmdb.js');
```

---

## 10. Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `TMDB_API_KEY` | Sí | API key de [The Movie Database](https://www.themoviedb.org/documentation/api) |
| `YOUTUBE_API_KEY` | Sí | API key de [YouTube Data API v3](https://developers.google.com/youtube/v3) |
| `NODE_ENV` | No | Si es `production`, desactiva logs de nivel `debug` |
| `PORT` | No | Puerto del servidor (definido en `index.js`) |

### Configuración

Crear un archivo `.env` en la raíz de `server/`:

```env
TMDB_API_KEY=tu_api_key_de_tmdb
YOUTUBE_API_KEY=tu_api_key_de_youtube
NODE_ENV=development
PORT=3000
```

---

## Dependencias principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | 5.1.0 | Framework HTTP |
| `axios` | 1.13.2 | Cliente HTTP para APIs externas |
| `zod` | 4.3.6 | Validación de schemas |
| `node-cache` | 5.1.2 | Caché en memoria (memoize) |
| `p-limit` | 7.3.0 | Control de concurrencia |
| `helmet` | 8.1.0 | Headers de seguridad HTTP |
| `express-rate-limit` | 8.2.1 | Rate limiting |
| `cors` | 2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | 17.2.3 | Variables de entorno desde `.env` |

---

## Scripts

```bash
npm start      # Inicia el servidor (node index.js)
npm run dev    # Inicia con hot-reload (nodemon index.js)
npm test       # Ejecuta tests con Jest ESM
```
