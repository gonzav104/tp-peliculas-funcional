# 🎬 Pipeline Funcional para el Procesamiento de Datos de APIs

> **Trabajo Final Integrador - Programación Declarativa**  
> Universidad Nacional de San Antonio de Areco (UNSAdA)  
> Ing. Emanuel Lazzari (2020)

---

## 📋 Tabla de Contenidos

- [Resumen Ejecutivo](#-resumen-ejecutivo)
- [Fundamentación del Paradigma](#-fundamentación-del-paradigma)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Conceptos Funcionales Implementados](#-conceptos-funcionales-implementados)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Documentación de la API](#-documentación-de-la-api)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estado del Arte](#-estado-del-arte)
- [Conclusiones](#-conclusiones)

---

## 🎯 Resumen Ejecutivo

Este proyecto implementa un **pipeline funcional declarativo** para la agregación, transformación y optimización de datos cinematográficos provenientes de múltiples fuentes heterogéneas (TMDB y YouTube).

### El Problema

Las aplicaciones modernas consumen datos de servicios de terceros que entregan información en formatos crudos, voluminosos e inconsistentes. El desafío es procesarlos de manera **eficiente, confiable y mantenible**.

### La Solución

Sistema **stateless** (sin base de datos) que procesa datos "en vuelo" (in-memory) mediante un pipeline funcional puro que:

1. **Ingesta**: Consume API de TMDB (películas)
2. **Enriquecimiento**: Integra datos de YouTube (tráilers)
3. **Transformación**: Normaliza estructuras heterogéneas
4. **Filtrado**: Aplica criterios de negocio declarativos
5. **Optimización**: Genera planes de maratones mediante recursión pura

---

## 🧠 Fundamentación del Paradigma

### ¿Por qué Programación Funcional?

#### El Contraste: Enfoque Imperativo (El Problema)

```javascript
// ❌ Código imperativo con efectos secundarios
let peliculasFiltradas = [];
for (let i = 0; i < peliculas.length; i++) {
    if (peliculas[i].rating >= 7.0) {
        peliculasFiltradas.push(peliculas[i]);
    }
}
peliculasFiltradas.sort((a, b) => b.rating - a.rating);
```

**Problemas:**
- Variables mutables (`let`, `.push()`)
- Lógica imperativa (cómo hacer)
- Difícil de testear y razonar
- Propenso a errores de estado

#### La Solución: Enfoque Funcional (La Elección)

```javascript
// ✅ Código declarativo funcional
const peliculasTop = pipe(
    filter(p => p.rating >= 7.0),
    sort((a, b) => b.rating - a.rating)
)(peliculas);
```

**Ventajas:**
- Inmutabilidad garantizada
- Declarativo (qué queremos, no cómo)
- Funciones puras → fácil testing
- Composición elegante

### Los 3 Pilares del Proyecto

#### 1. **Inmutabilidad**
Los datos nunca se modifican. Cada transformación retorna una **nueva estructura**.

```javascript
// Las funciones de filtrado/mapeo NUNCA mutan el array original
const peliculasLimpias = limpiarPeliculas(datosCrudos); // Nueva lista
```

#### 2. **Funciones Puras**
Sin efectos secundarios. Misma entrada → misma salida, siempre.

```javascript
// Función pura: no depende de estado externo
const calcularRatingPromedio = (peliculas) => {
    const suma = peliculas.reduce((acc, p) => acc + p.rating, 0);
    return suma / peliculas.length;
};
```

#### 3. **Composición (Pipelines)**
El flujo se **ensambla** componiendo funciones, no escribiendo bucles.

```javascript
// Declaramos el "flujo", no los "pasos"
const procesarPeliculasCalidad = pipe(
    limpiarPeliculas,        // Step 1: Normalizar estructura
    filtrarConPoster,        // Step 2: Descartar sin imagen
    filtrarPorRating(7.0),   // Step 3: Solo calidad alta
    ordenarPorRating         // Step 4: Mejor primero
);
```

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│                    (Express REST API)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE CONTROLADORES                     │
│          (peliculas_controller.js - Orquestación)           │
└────────┬────────────────────────┬──────────────────┬────────┘
         │                        │                  │
         ▼                        ▼                  ▼
┌────────────────┐      ┌──────────────────┐  ┌──────────────┐
│  TMDB Service  │      │ YouTube Service  │  │   Maratón    │
│   (Ingesta)    │◄────►│ (Enriquecimiento)│  │ (Optimizador)│
└────────┬───────┘      └────────┬─────────┘  └──────┬───────┘
         │                       │                    │
         └───────────────┬───────┘                    │
                         ▼                            │
                ┌──────────────────┐                  │
                │  UNIFICADOR      │◄─────────────────┘
                │ (Combina Fuentes)│
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ UTILIDADES       │
                │ (Funcional.js    │
                │  Peliculas.js)   │
                └──────────────────┘
```

### Flujo de un Request Típico

```
Usuario → GET /api/peliculas/populares-enriquecidas?limite=5
    │
    ├─→ Controller: getPopularesEnriquecidas()
    │
    ├─→ TMDB Service: obtenerPeliculasPopulares()
    │   └─→ Pipeline: procesarPeliculasEstandar()
    │       └─→ limpiar → filtrar → ordenar
    │
    ├─→ Unificador: enriquecerListaPeliculas()
    │   ├─→ Promise.all([...ids])
    │   ├─→ TMDB: obtenerDetallesPelicula(id)
    │   ├─→ YouTube: buscarTrailerPelicula(titulo)
    │   └─→ combinarFuentes() [PURA]
    │
    └─→ Response: JSON con datos unificados
```

---

## 🔬 Conceptos Funcionales Implementados

### 1. **Pipe (Composición de Funciones)**

**Ubicación**: `server/utils/funcional.js`

```javascript
export const pipe = (...fns) =>
    (valorInicial) =>
        fns.reduce((valor, fn) => fn(valor), valorInicial);

// Uso real en el proyecto:
const procesarPeliculasCalidad = pipe(
    limpiarPeliculas,
    filtrarConPoster,
    filtrarPorRatingMinimo(7.0),
    filtrarConDescripcion,
    ordenarPorRating
);
```

**Ventaja**: Legibilidad. Leemos de arriba hacia abajo, como prosa.

---

### 2. **Curry (Aplicación Parcial)**

**Ubicación**: `server/utils/funcional.js`

```javascript
export const curry = (fn) => {
    const arity = fn.length;
    return function curried(...args) {
        if (args.length >= arity) {
            return fn(...args);
        }
        return (...moreArgs) => curried(...args, ...moreArgs);
    };
};

// Uso real:
export const map = curry((fn, array) => array.map(fn));
export const filter = curry((predicado, array) => array.filter(predicado));

// Ahora podemos hacer:
const filtrarPorRating = filter(p => p.rating >= 7.0);
// filtrarPorRating es una función que espera el array
```

**Ventaja**: Reutilización. Creamos funciones especializadas sin repetir código.

---

### 3. **Map / Filter (Transformación y Filtrado Funcional)**

**Ubicación**: `server/utils/peliculas.js`

```javascript
// Transformación (MAP): convertir estructura A → estructura B
const normalizarPeliculaTMDB = (peli) => ({
    id: peli.id,
    titulo: peli.title,
    resumen: peli.overview || 'Sin descripción',
    imagen: peli.poster_path 
        ? `https://image.tmdb.org/t/p/w500${peli.poster_path}` 
        : null,
    rating: peli.vote_average || 0,
    fecha: peli.release_date || 'Fecha desconocida'
});

export const limpiarPeliculas = map(normalizarPeliculaTMDB);

// Filtrado (FILTER): descartar elementos que no cumplen criterio
const tienePosterValido = (peli) =>
    peli.imagen !== null && !peli.imagen.includes('null');

export const filtrarConPoster = filter(tienePosterValido);
```

**Ventaja**: Inmutabilidad. El array original nunca se toca.

---

### 4. **Either (Manejo de Errores Funcional)**

**Ubicación**: `server/utils/funcional.js`

```javascript
export const Either = {
    Left: (error) => ({
        isLeft: true,
        map: () => Either.Left(error),
        fold: (leftFn, _) => leftFn(error)
    }),
    Right: (valor) => ({
        isLeft: false,
        map: (fn) => Either.Right(fn(valor)),
        fold: (_, rightFn) => rightFn(valor)
    })
};

// Uso real en TMDB Service:
const fetchTMDB = async (endpoint, params) => {
    try {
        const respuesta = await axios.get(url, config);
        return Either.Right(respuesta.data); // ✅ Éxito
    } catch (error) {
        return Either.Left({ mensaje: 'Error TMDB' }); // ❌ Error
    }
};

// Consumo elegante:
resultado.fold(
    (error) => console.error(error),  // Caso fallo
    (data) => procesarDatos(data)     // Caso éxito
);
```

**Ventaja**: Sin `try-catch` anidados. Manejo explícito y declarativo de errores.

---

### 5. **Recursión Pura (Algoritmo de Maratón)**

**Ubicación**: `server/services/maraton.js`

```javascript
const optimizarMaratonRecursivo = (
    peliculas, 
    tiempoDisponible, 
    seleccionadas = []
) => {
    // Caso base
    if (peliculas.length === 0 || tiempoDisponible <= 0) {
        return seleccionadas;
    }

    const [actual, ...resto] = peliculas;

    if (actual.duracion <= tiempoDisponible) {
        // Probar CON la película actual
        const conActual = optimizarMaratonRecursivo(
            resto,
            tiempoDisponible - actual.duracion,
            [...seleccionadas, actual]
        );

        // Probar SIN la película actual
        const sinActual = optimizarMaratonRecursivo(
            resto,
            tiempoDisponible,
            seleccionadas
        );

        // Retornar la mejor opción (máximo rating acumulado)
        const sumaCon = conActual.reduce((acc, p) => acc + p.rating, 0);
        const sumaSin = sinActual.reduce((acc, p) => acc + p.rating, 0);

        return sumaCon >= sumaSin ? conActual : sinActual;
    }

    return optimizarMaratonRecursivo(resto, tiempoDisponible, seleccionadas);
};
```

**Ventaja**: Sin bucles. Sin estado mutable. Solución elegante al problema de la mochila (knapsack).

---

### 6. **Memoización (Optimización de Búsquedas)**

**Ubicación**: `server/services/tmdb.js`

```javascript
const memoize = (fn) => {
    const cache = new Map();
    return async (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key); // ✅ Cache hit
        }
        const resultado = await fn(...args);
        cache.set(key, resultado);
        return resultado;
    };
};

export const buscarPeliculasMemo = memoize(buscarPeliculas);
```

**Ventaja**: Transparencia referencial. Función pura → resultado cacheable.

---

### 7. **Promise.all (Paralelismo Funcional)**

**Ubicación**: `server/services/unificador.js`

```javascript
export const enriquecerPeliculasLote = async (idsPeliculas) => {
    // Lanzar TODAS las peticiones en paralelo
    const promesas = idsPeliculas.map(id => enriquecerPelicula(id));
    
    // Esperar a que TODAS terminen
    const resultados = await Promise.all(promesas);
    
    // Filtrar nulls (fallos)
    return resultados.filter(p => p !== null);
};
```

**Ventaja**: Eficiencia. 10 películas en ~2s vs ~20s secuencial.

---

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- Cuentas en:
  - [TMDB API](https://www.themoviedb.org/settings/api)
  - [YouTube Data API v3](https://console.cloud.google.com/)

### Paso 1: Clonar e Instalar

```bash
# Clonar repositorio
git clone <repo-url>
cd tp_peliculas_funcional

# Instalar dependencias raíz (concurrently)
npm install

# Instalar dependencias del servidor
npm run install-all
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `server/.env`:

```env
# Puerto del servidor
PORT=3000
NODE_ENV=development

# TMDB API Key
TMDB_API_KEY=tu_api_key_aqui

# YouTube Data API v3 Key
YOUTUBE_API_KEY=tu_api_key_aqui
```

### Paso 3: Ejecutar en Modo Desarrollo

```bash
# Desde la raíz del proyecto
npm run dev

# O solo el servidor:
cd server
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## 📚 Documentación de la API

### Endpoints Principales

#### 🎬 **GET** `/api/peliculas/`
Documentación interactiva de la API

**Response:**
```json
{
    "nombre": "API Pipeline Funcional de Películas",
    "version": "1.0.0",
    "endpoints": { ... },
    "paradigma": {
        "enfoque": "Programación Funcional",
        "conceptos": [...]
    }
}
```

---

#### 🔥 **GET** `/api/peliculas/populares`
Películas populares (pipeline básico)

**Query Params:** Ninguno

**Response:**
```json
{
    "exito": true,
    "cantidad": 20,
    "datos": [
        {
            "id": 123,
            "titulo": "Inception",
            "resumen": "Dom Cobb es un ladrón...",
            "imagen": "https://image.tmdb.org/t/p/w500/...",
            "rating": 8.8,
            "fecha": "2010-07-16",
            "fuente": "tmdb"
        }
    ]
}
```

---

#### ⭐ **GET** `/api/peliculas/populares-enriquecidas?limite=5`
Películas con tráilers de YouTube (pipeline completo)

**Query Params:**
- `limite` (opcional): Número de películas (default: 5)

**Response:**
```json
{
    "exito": true,
    "cantidad": 5,
    "estadisticas": {
        "total": 5,
        "conTrailer": 4,
        "tasaTrailers": "80.0%"
    },
    "datos": [
        {
            "id": 123,
            "titulo": "Inception",
            "resumen": "...",
            "rating": 8.8,
            "duracion": 148,
            "generos": ["Action", "Sci-Fi"],
            "trailer": {
                "id": "YoHD9XEInc0",
                "titulo": "Inception Official Trailer",
                "url": "https://youtube.com/watch?v=...",
                "thumbnail": "https://i.ytimg.com/...",
                "canal": "Warner Bros"
            },
            "fuentes": ["tmdb", "youtube"],
            "estaCompleta": true
        }
    ]
}
```

---

#### 🔍 **GET** `/api/peliculas/buscar?q=matrix`
Búsqueda básica de películas

**Query Params:**
- `q` (requerido): Término de búsqueda

**Response:**
```json
{
    "exito": true,
    "termino": "matrix",
    "cantidad": 15,
    "datos": [...]
}
```

---

#### 🎯 **POST** `/api/peliculas/maraton`
Planificador de maratón optimizado (algoritmo recursivo)

**Body:**
```json
{
    "tiempo": 360,
    "ratingMinimo": 7.0,
    "maximoPeliculas": 10
}
```

**Response:**
```json
{
    "exito": true,
    "plan": {
        "peliculas": [
            {
                "titulo": "The Shawshank Redemption",
                "duracion": 142,
                "rating": 9.3
            },
            {
                "titulo": "The Dark Knight",
                "duracion": 152,
                "rating": 9.0
            }
        ],
        "tiempoTotal": 294,
        "tiempoDisponible": 360,
        "tiempoRestante": 66,
        "ratingPromedio": 9.15,
        "cantidadPeliculas": 2,
        "descripcion": "Maratón de 2 película(s) [4h 54m] con rating promedio de 9.2★"
    },
    "analisis": {
        "eficienciaTemporal": "81.7%",
        "peliculasExcelentes": 2,
        "tiempoLibre": "1h 6m",
        "calidadGeneral": "Excelente"
    }
}
```

---

#### 🎭 **POST** `/api/peliculas/maraton-tematico`
Maratón filtrado por géneros

**Body:**
```json
{
    "tiempo": 480,
    "generos": ["Action", "Sci-Fi"]
}
```

---

#### 📅 **POST** `/api/peliculas/maraton-decada`
Maratón de películas clásicas por década

**Body:**
```json
{
    "tiempo": 360,
    "decada": 1990
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Pipeline Básico (Película Popular)

```bash
curl http://localhost:3000/api/peliculas/populares
```

**Flujo interno:**
```
1. TMDB API: GET /movie/popular
2. Pipeline: limpiarPeliculas()
   - Normaliza estructura TMDB → estructura propia
3. Pipeline: filtrarConPoster()
   - Descarta películas sin imagen
4. Pipeline: ordenarPorRating()
   - Ordena por calificación descendente
5. Response: JSON con 20 películas limpias
```

---

### Ejemplo 2: Pipeline Completo (Enriquecimiento Multi-Fuente)

```bash
curl "http://localhost:3000/api/peliculas/populares-enriquecidas?limite=3"
```

**Flujo interno:**
```
1. TMDB: obtenerPeliculasPopulares() → [peli1, peli2, peli3]
2. Unificador: enriquecerListaPeliculas([ids])
   - Lanzar Promise.all([
       enriquecerPelicula(id1),
       enriquecerPelicula(id2),
       enriquecerPelicula(id3)
     ])
3. Para cada ID (en paralelo):
   - TMDB: obtenerDetallesPelicula(id)
   - YouTube: buscarTrailerPelicula(titulo, año)
   - combinarFuentes(tmdb, youtube) [FUNCIÓN PURA]
4. Filtrar nulls
5. Response: Array unificado con tráilers
```

---

### Ejemplo 3: Planificador de Maratón (Recursión)

```bash
curl -X POST http://localhost:3000/api/peliculas/maraton \
  -H "Content-Type: application/json" \
  -d '{
    "tiempo": 240,
    "ratingMinimo": 8.0,
    "maximoPeliculas": 5
  }'
```

**Flujo interno:**
```
1. Obtener candidatas (películas populares enriquecidas)
2. Filtrar por rating >= 8.0
3. Ordenar por "valor" (rating/duracion)
4. Algoritmo recursivo:
   - Para cada película:
     * Probar CON ella (restar duración)
     * Probar SIN ella (mantener tiempo)
     * Elegir rama con mayor rating acumulado
5. Retornar plan óptimo
```

---

## 📁 Estructura del Proyecto

```
tp_peliculas_funcional/
├── server/
│   ├── controllers/
│   │   └── peliculas_controller.js    # Orquestación de servicios
│   ├── services/
│   │   ├── tmdb.js                    # Ingesta de datos (TMDB)
│   │   ├── youtube.js                 # Enriquecimiento (YouTube)
│   │   ├── unificador.js              # Combina múltiples fuentes
│   │   └── maraton.js                 # Optimizador recursivo
│   ├── routes/
│   │   └── pelis_routes.js            # Definición de endpoints
│   ├── utils/
│   │   ├── funcional.js               # Herramientas FP (pipe, curry, Either)
│   │   └── peliculas.js               # Transformadores específicos
│   ├── app.js                         # Configuración de Express
│   ├── index.js                       # Punto de entrada
│   ├── .env                           # Variables de entorno
│   └── package.json
├── docs/
│   ├── Declarativa1 - Teoría.pdf      # Material teórico
│   ├── Declarativa2.pdf               # Lógica de predicados
│   ├── Declarativa3.pdf               # Normalización
│   └── ...
├── package.json                       # Scripts raíz
└── README.md                          # Este archivo
```

---

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js 18+**: Runtime JavaScript
- **Express 5**: Framework web minimalista
- **Axios 1.13**: Cliente HTTP funcional

### Paradigma
- **Programación Funcional Pura**:
  - Inmutabilidad
  - Funciones puras
  - Composición (pipe)
  - Currying
  - Recursión
  - Either monad (manejo de errores)

### APIs Externas
- **TMDB API**: Base de datos cinematográfica
- **YouTube Data API v3**: Búsqueda y metadata de vídeos

### Herramientas de Desarrollo
- **Nodemon**: Hot-reload en desarrollo
- **Concurrently**: Ejecución paralela de scripts
- **Dotenv**: Gestión de variables de entorno

---

## 🌐 Estado del Arte

### Soluciones Existentes

#### 1. **IMDb Watchlist**
- **Enfoque**: Imperativo, orientado a objetos
- **Limitación**: No permite optimización automática de maratones
- **Diferenciación**: Nuestro sistema usa **recursión pura** para encontrar combinaciones óptimas

#### 2. **Trakt.tv**
- **Enfoque**: Híbrido con base de datos relacional
- **Limitación**: Requiere cuenta y sincronización
- **Diferenciación**: Nuestro sistema es **stateless** y procesa datos en memoria

#### 3. **JustWatch**
- **Enfoque**: Agregador de plataformas de streaming
- **Limitación**: No unifica datos de múltiples APIs en un solo modelo
- **Diferenciación**: Implementamos **unificación declarativa** con validación de consistencia

### Aportes Originales

1. **Pipeline Funcional de Unificación**:
   - Combina TMDB + YouTube de forma declarativa
   - Manejo de errores con Either monad
   - Procesamiento paralelo con `Promise.all`

2. **Algoritmo de Optimización Recursiva**:
   - Resuelve el problema de la mochila (knapsack) para maratones
   - Sin bucles ni estado mutable
   - Maximiza rating acumulado respetando restricción temporal

3. **Arquitectura Stateless Pura**:
   - Sin base de datos
   - Datos procesados "en vuelo"
   - Fácil escalabilidad horizontal

---

## 📊 Diagramas Técnicos

### Diagrama de Composición Funcional

```
Pipeline de Procesamiento de Películas:

    Datos Crudos TMDB
           ↓
    [limpiarPeliculas]        ← MAP: Normaliza estructura
           ↓
    [filtrarConPoster]        ← FILTER: Descarta sin imagen
           ↓
    [filtrarPorRating(7.0)]   ← FILTER: Solo alta calidad
           ↓
    [ordenarPorRating]        ← SORT: Mejor primero
           ↓
    Películas Limpias


Pipeline de Enriquecimiento:

    [Película TMDB] → obtenerDetalles() → TMDB Details
                              ↓
                    buscarTrailer(titulo, año)
                              ↓
                        YouTube Trailer
                              ↓
                    combinarFuentes() [PURA]
                              ↓
                    Película Enriquecida
```

---

### Árbol de Recursión (Maratón)

```
optimizarMaraton([A,B,C], 300min)
├── CON A (140min)
│   └── optimizarMaraton([B,C], 160min)
│       ├── CON B (80min)
│       │   └── optimizarMaraton([C], 80min)
│       │       └── CON C (70min) → [A,B,C] rating=25
│       └── SIN B
│           └── optimizarMaraton([C], 160min)
│               └── CON C → [A,C] rating=19
└── SIN A
    └── optimizarMaraton([B,C], 300min)
        └── CON B y CON C → [B,C] rating=16

Resultado: [A,B,C] con rating acumulado 25 (mejor rama)
```

---

## 🎓 Conceptos de Programación Declarativa Aplicados

### Unidad 1: Lógica Proposicional
- **Aplicación**: Validaciones booleanas (`esPeliculaValida`, `pareceTrailerOficial`)
- **Código**: `server/services/maraton.js`, `server/services/youtube.js`

### Unidad 2: Lógica de Predicados
- **Aplicación**: Filtros con cuantificadores (`filter`, `some`, `every`)
- **Código**: `server/utils/peliculas.js`

### Unidad 3: Normalización
- **Aplicación**: Transformación de estructuras heterogéneas a formato unificado
- **Código**: `server/services/unificador.js` (`combinarFuentes`)

### Unidad 7: Programación Funcional (Scheme)
- **Aplicación**: Todo el proyecto está basado en conceptos de LISP/Scheme:
  - **map**: `limpiarPeliculas`
  - **filter**: `filtrarConPoster`
  - **fold/reduce**: `calcularRatingPromedio`
  - **recursión**: `optimizarMaratonRecursivo`
  - **composición**: `pipe`

---
