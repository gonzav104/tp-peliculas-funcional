# 🎬 CineFuncional — Pipeline Funcional de Películas

> **Trabajo Final Integrador — Programación Declarativa**  
> Universidad Nacional de San Antonio de Areco (UNSAdA) — Ing. Emanuel Lazzari (2020)

Aplicación full-stack que consume, transforma y enriquece datos cinematográficos de **múltiples APIs externas** aplicando principios de **programación funcional pura**: composición con `pipe`, transformaciones con `curry`, manejo de errores con la mónada `Either`, y optimización recursiva para planificación de maratones.

---

## 📋 Tabla de Contenidos

- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Cómo Levantar el Proyecto](#-cómo-levantar-el-proyecto)
- [Testing](#-testing)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Conceptos Funcionales Implementados](#-conceptos-funcionales-implementados)

---

## 🛠 Tecnologías Utilizadas

### Backend
| Tecnología | Uso |
|---|---|
| **Node.js 20** | Runtime de JavaScript |
| **Express 5** | Framework web REST |
| **Zod 4** | Validación de esquemas de respuesta (TMDB) |
| **NodeCache** | Caché en memoria con TTL (1 hora) |
| **p-limit** | Control de concurrencia (máx. 5 peticiones simultáneas) |
| **Axios** | Cliente HTTP para APIs externas |
| **Helmet** | Headers de seguridad HTTP |
| **express-rate-limit** | Limitador de peticiones (100 req / 15 min) |
| **Jest 30** | Framework de testing |

### Frontend
| Tecnología | Uso |
|---|---|
| **React 19** | Biblioteca de interfaz de usuario |
| **Vite 7** | Bundler y servidor de desarrollo |
| **CSS Modules** | Estilos encapsulados por componente |
| **Lucide React** | Iconografía SVG |
| **Vitest 4** | Testing con jsdom |
| **Testing Library** | Utilidades de testing para React |

### APIs Externas
| API | Función |
|---|---|
| **TMDB** (The Movie Database) | Datos de películas, detalles, proveedores de streaming |
| **YouTube Data API v3** | Búsqueda de tráilers oficiales |

### CI/CD
| Herramienta | Función |
|---|---|
| **GitHub Actions** | Pipeline automático en cada Pull Request a `main` |
| **CodeQL** | Análisis estático de seguridad del código |

---

## 🏗 Arquitectura del Proyecto

La aplicación sigue una arquitectura **cliente-servidor desacoplada**:

```
┌─────────────────────────┐       ┌──────────────────────────────────┐
│   FRONTEND (React/Vite) │◄─────►│     BACKEND (Node.js/Express)    │
│   Puerto 5173           │  API  │     Puerto 3000                  │
└─────────────────────────┘  REST └──────┬───────────┬───────────────┘
                                         │           │
                                    ┌────▼────┐ ┌────▼─────┐
                                    │ TMDB API│ │YouTube API│
                                    └─────────┘ └──────────┘
```

### Núcleo Funcional

El backend implementa un **pipeline funcional puro** para el procesamiento de datos:

- **`pipe`** — Composición de funciones de izquierda a derecha
- **`curry`** — Aplicación parcial para crear funciones especializadas
- **`Either` (Left/Right)** — Manejo de errores sin try/catch anidados
- **`map` / `filter` / `sort` currificados** — Transformaciones inmutables
- **Memoización** — Caché funcional con transparencia referencial
- **Recursión pura** — Algoritmo de optimización tipo knapsack para maratones

### Flujo de Datos

```
Datos Crudos TMDB
       ↓
  [limpiarPeliculas]         ← MAP: Normaliza estructura
       ↓
  [filtrarConPoster]         ← FILTER: Descarta sin imagen
       ↓
  [filtrarPorRating(7.0)]   ← FILTER: Solo alta calidad
       ↓
  [ordenarPorRating]         ← SORT: Mejor primero
       ↓
  Películas Procesadas
       ↓
  [enriquecerPelicula]      ← TMDB Detalles + YouTube Tráiler + Streaming
       ↓
  [combinarFuentes]          ← Función PURA de unificación
       ↓
  Película Enriquecida Completa
```

---

## 📌 Requisitos Previos

- **Node.js** >= 20.x
- **npm** >= 9.x
- Una **API Key de TMDB** — [Obtener aquí](https://www.themoviedb.org/settings/api)
- Una **API Key de YouTube Data API v3** *(opcional, el sistema tiene fallback)* — [Obtener aquí](https://console.cloud.google.com/)

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd tp-peliculas-funcional
```

### 2. Instalar todas las dependencias

```bash
# Desde la raíz: instala dependencias raíz + server + client
npm install
npm run install-all
```

O manualmente:

```bash
npm install                     # Raíz (concurrently)
npm install --prefix server     # Dependencias del servidor
npm install --prefix client     # Dependencias del cliente
```

### 3. Configurar variables de entorno

Crear el archivo **`server/.env`** con el siguiente contenido:

```env
# === REQUERIDAS ===
PORT=3000
TMDB_API_KEY=tu_api_key_de_tmdb

# === OPCIONALES ===
YOUTUBE_API_KEY=tu_api_key_de_youtube
NODE_ENV=development
```

> **Nota:** Si no se configura `YOUTUBE_API_KEY`, el sistema usa tráilers de TMDB como fuente primaria y muestra un video de respaldo cuando no encuentra resultado. Si falta `TMDB_API_KEY` o `PORT`, el servidor **no arranca** (validación obligatoria).

**Variable del cliente** *(opcional)*: Si el backend corre en un puerto diferente, crear `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Por defecto apunta a `http://localhost:3000/api`.

---

## 🚀 Cómo Levantar el Proyecto

### Opción 1: Ambos servicios simultáneamente (recomendado)

```bash
npm run dev
```

Esto utiliza `concurrently` para levantar backend y frontend en paralelo.

### Opción 2: Por separado

**Backend:**
```bash
cd server
npm run dev      # Con hot-reload (nodemon)
# o
npm start        # Sin hot-reload
```
> Servidor disponible en **http://localhost:3000**

**Frontend:**
```bash
cd client
npm run dev
```
> Aplicación disponible en **http://localhost:5173** (se abre automáticamente en el navegador)

---

## 🧪 Testing

### Tests del Backend (Jest)

```bash
cd server
npm test
```

Archivos de test:
- `services/tmdb.test.js` — Tests del servicio TMDB
- `services/unificador.test.js` — Tests del unificador de fuentes
- `services/maraton.test.js` — Tests del algoritmo de maratón
- `controllers/peliculas_controller.test.js` — Tests del controlador
- `middlewares/errorHandler.test.js` — Tests del middleware de errores

### Tests del Frontend (Vitest)

```bash
cd client
npm test
```

Archivos de test:
- `src/components/StreamingBadge.test.jsx` — Tests del componente de streaming

### Pipeline CI/CD

El proyecto cuenta con un pipeline de **GitHub Actions** (`ci_cd_pipeline.yml`) que se ejecuta en cada **Pull Request** a `main`:

1. **Pruebas Unitarias** — Ejecuta `npm test` tanto en `server/` como en `client/` con Node.js 20
2. **Análisis de Seguridad** — Ejecuta CodeQL para detectar vulnerabilidades en el código JavaScript

---

## 📁 Estructura de Carpetas

```
tp-peliculas-funcional/
├── .github/
│   └── workflows/
│       └── ci_cd_pipeline.yml      # Pipeline CI/CD (tests + CodeQL)
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.jsx           # Pie de página
│   │   │   ├── MaratonPlanner.jsx   # Planificador de maratones (3 modos)
│   │   │   ├── MaratonResult.jsx    # Resultados del maratón
│   │   │   ├── MovieCard.jsx        # Tarjeta de película con modal de detalles
│   │   │   ├── NavBar.jsx           # Barra de navegación
│   │   │   ├── SearchBar.jsx        # Buscador de películas
│   │   │   ├── StreamingBadge.jsx   # Badges de plataformas de streaming
│   │   │   └── Utilities.jsx        # Componentes utilitarios (skeleton, error, empty)
│   │   ├── hooks/
│   │   │   └── index.js             # Hooks: useApi, useForm, useDebounce, useLocalStorage
│   │   ├── pages/
│   │   │   └── Home.jsx             # Página principal (descubrir + maratón)
│   │   ├── services/
│   │   │   └── apiClient.js         # Cliente HTTP centralizado
│   │   ├── utils/
│   │   │   ├── constants.js         # Constantes del frontend
│   │   │   ├── helpers.js           # Funciones auxiliares
│   │   │   └── validators.js        # Validaciones
│   │   ├── App.jsx                  # Componente raíz
│   │   └── main.jsx                 # Punto de entrada React
│   ├── package.json
│   └── vite.config.js               # Configuración de Vite + Vitest
├── server/                           # Backend Node.js
│   ├── controllers/
│   │   └── peliculas_controller.js   # Orquestación de servicios
│   ├── middlewares/
│   │   └── errorHandler.js           # Manejo centralizado de errores
│   ├── routes/
│   │   └── pelis_routes.js           # Definición de endpoints REST
│   ├── schemas/
│   │   ├── peliculas.js              # Esquemas Zod de entrada
│   │   └── tmdb_response.js          # Esquemas Zod de respuesta TMDB
│   ├── services/
│   │   ├── tmdb.js                   # Servicio TMDB (ingesta + caché + Either)
│   │   ├── youtube.js                # Servicio YouTube (tráilers + fallback)
│   │   ├── unificador.js             # Combinador de fuentes (TMDB + YouTube + Streaming)
│   │   └── maraton.js                # Algoritmo recursivo de optimización
│   ├── utils/
│   │   ├── funcional.js              # Herramientas FP: pipe, curry, map, filter, sort, Either
│   │   ├── peliculas.js              # Pipelines de transformación de películas
│   │   ├── constants.js              # Constantes y configuración
│   │   ├── logger.js                 # Logger con niveles
│   │   └── response.js              # Helpers de respuesta HTTP
│   ├── app.js                        # Configuración de Express (CORS, Helmet, Rate Limit)
│   ├── index.js                      # Punto de entrada (validación de env + listen)
│   ├── .env                          # Variables de entorno (no versionado)
│   └── package.json
├── package.json                      # Scripts raíz (dev, install-all)
└── README.md
```

---

## ✨ Funcionalidades Principales

### 🎥 Catálogo de Películas Populares
- Visualización de películas populares obtenidas de TMDB
- Datos enriquecidos con tráilers de YouTube y proveedores de streaming
- Estadísticas de completitud del pipeline (tasa de tráilers, completitud general)

### 🔍 Búsqueda de Películas
- Búsqueda por texto con resultados enriquecidos (detalles + tráilers + streaming)
- Debounce en el frontend para evitar peticiones excesivas

### 🎞 Detalles Completos de Películas
- Modal con información extendida: sinopsis, reparto, directores, géneros
- Información técnica: presupuesto, recaudación, idioma original, productoras
- Reproducción de tráiler embebido desde YouTube
- Tagline de la película

### 📺 Plataformas de Streaming
- Badges visuales con logos de plataformas donde ver cada película
- Diferenciación entre **suscripción** (Netflix, Disney+, etc.) y **compra** (Apple TV, Google Play, etc.)
- Soporte para múltiples regiones con fallback: AR → ES → US

### 🎯 Planificador de Maratones
Tres modos de planificación que utilizan un **algoritmo recursivo de optimización** (problema de la mochila / knapsack):

1. **Automático** — Maximiza rating acumulado dado un tiempo disponible y rating mínimo
2. **Temático** — Filtra por géneros específicos (Acción, Drama, Sci-Fi, etc.)
3. **Viaje en el Tiempo** — Películas de una década específica (1980s–2020s)

Incluye análisis del plan: eficiencia temporal, tiempo libre, calidad general.

### ⚡ Optimización y Seguridad
- **Caché en memoria** con TTL de 1 hora (NodeCache) para reducir llamadas a APIs
- **Memoización funcional** de búsquedas y proveedores de streaming
- **Control de concurrencia** con p-limit (máx. 5 peticiones paralelas)
- **Rate limiting** (100 peticiones cada 15 minutos por IP)
- **Helmet** para headers de seguridad HTTP
- **Validación de esquemas** con Zod en las respuestas de TMDB

---

## 📡 Endpoints de la API

Base URL: `http://localhost:3000/api/peliculas`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Documentación interactiva de la API |
| `GET` | `/populares` | Películas populares (pipeline básico) |
| `GET` | `/populares-enriquecidas?limite=10` | Películas con tráilers y streaming |
| `GET` | `/top-rated` | Películas mejor calificadas |
| `GET` | `/buscar?q=inception` | Búsqueda básica |
| `GET` | `/buscar-enriquecida?q=inception&limite=5` | Búsqueda con tráilers |
| `POST` | `/maraton` | Planificar maratón optimizado |
| `POST` | `/maraton-tematico` | Maratón filtrado por géneros |
| `POST` | `/maraton-decada` | Maratón por década |
| `GET` | `/maraton/presets` | Duraciones predefinidas |
| `GET` | `/trailers` | Búsqueda de tráilers |
| `GET` | `/video-stats` | Estadísticas de un video |
| `GET` | `/estado` | Estado del servicio |

### Ejemplo: Planificar Maratón

```bash
curl -X POST http://localhost:3000/api/peliculas/maraton \
  -H "Content-Type: application/json" \
  -d '{"tiempo": 240, "ratingMinimo": 7.0, "maximoPeliculas": 5}'
```

---

## 🔬 Conceptos Funcionales Implementados

| Concepto | Ubicación | Uso en el Proyecto |
|----------|-----------|-------------------|
| **Pipe** (composición) | `server/utils/funcional.js` | Pipelines de procesamiento: `procesarPeliculasEstandar`, `procesarPeliculasCalidad` |
| **Curry** (aplicación parcial) | `server/utils/funcional.js` | `map`, `filter`, `sort` currificados para crear funciones reutilizables |
| **Either** (mónada) | `server/utils/funcional.js` | Manejo de errores en `tmdb.js` y `youtube.js` sin try/catch anidados |
| **Map / Filter** inmutables | `server/utils/peliculas.js` | `limpiarPeliculas`, `filtrarConPoster`, `filtrarPorRatingMinimo` |
| **Recursión pura** | `server/services/maraton.js` | Algoritmo de optimización de maratones (knapsack con memoización) |
| **Memoización** | `server/services/tmdb.js` | `buscarPeliculasMemo`, `obtenerProveedoresStreamingMemo` |
| **Promise.all** | `server/services/unificador.js` | Enriquecimiento paralelo de múltiples películas |
| **Funciones puras** | Todo el proyecto | Transformaciones que no mutan datos ni dependen de estado externo |

---

## 📄 Licencia

ISC
