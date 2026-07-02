# CineFuncional — Frontend

Aplicación React SPA para explorar películas populares, buscar contenido enriquecido (con tráilers de YouTube y datos de streaming) y planificar maratones de cine usando algoritmos de programación funcional.

---

## 1. Arquitectura del Frontend

El frontend es una **Single Page Application (SPA)** construida con:

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19.2 | Biblioteca de UI con componentes funcionales y hooks |
| **Vite** | 7.2 | Bundler y dev server con HMR |
| **CSS Modules** | nativo en Vite | Estilos con scope local por componente |
| **lucide-react** | 0.563 | Iconografía SVG (Star, Search, Play, etc.) |

No se utiliza router (toda la navegación es interna mediante estado `seccionActiva`), ni gestores de estado globales. El estado se gestiona con `useState` y `useCallback` en el componente `Home`, que actúa como contenedor principal.

La comunicación con el backend se centraliza en `apiClient.js`, un módulo con funciones `async` que encapsulan `fetch` y desempaquetan la respuesta estandarizada del servidor (`{ exito, datos, ... }`).

---

## 2. Estructura de Carpetas

```
client/
├── index.html                     # Entry point HTML (SPA)
├── package.json                   # Dependencias y scripts
├── vite.config.js                 # Configuración Vite + Vitest
└── src/
    ├── main.jsx                   # Punto de entrada React (StrictMode)
    ├── App.jsx                    # Componente raíz (renderiza Home)
    ├── index.css                  # Variables CSS globales y reset
    ├── assets/
    │   └── react.svg
    ├── components/
    │   ├── MovieCard.jsx          # Tarjeta de película + modal detalles + modal tráiler
    │   ├── MovieCard.module.css
    │   ├── StreamingBadge.jsx     # Badges de plataformas de streaming
    │   ├── StreamingBadge.module.css
    │   ├── StreamingBadge.test.jsx
    │   ├── NavBar.jsx             # Barra de navegación sticky
    │   ├── NavBar.module.css
    │   ├── SearchBar.jsx          # Input de búsqueda con clear
    │   ├── SearchBar.module.css
    │   ├── MaratonPlanner.jsx     # Planificador de maratones (tabs)
    │   ├── MaratonPlanner.module.css
    │   ├── MaratonResult.jsx      # Resultado de maratón (timeline + stats)
    │   ├── MaratonResult.module.css
    │   ├── Footer.jsx             # Pie de página
    │   ├── Footer.module.css
    │   ├── Utilities.jsx          # Componentes utilitarios (skeleton, error, empty)
    │   └── Utilities.module.css
    ├── pages/
    │   ├── Home.jsx               # Página principal (orquesta todo)
    │   └── Home.module.css
    ├── hooks/
    │   └── index.js               # Hooks: useApi, useForm, useDebounce, useLocalStorage, useIntersectionObserver
    ├── services/
    │   └── apiClient.js           # Cliente HTTP centralizado
    ├── utils/
    │   ├── constants.js           # Constantes (colores, límites, mensajes)
    │   └── helpers.js             # Funciones puras de formateo y utilidad
    └── test/
        └── setup.js               # Setup de Vitest (jest-dom matchers)
```

---

## 3. Jerarquía de Componentes

```
<StrictMode>
└── <App>
    └── <Home>                          ← Estado central: seccionActiva, searchQuery, peliculas
        ├── <NavBar>                    ← Props: seccionActiva, setSeccionActiva
        │
        ├── [seccionActiva === 'descubrir']
        │   ├── <SearchBar>             ← Props: onSearch (callback)
        │   ├── <MovieGridSkeleton>     ← Mientras carga
        │   ├── <ErrorMessage>          ← Si hay error, con onRetry
        │   ├── <EmptyState>            ← Si no hay resultados
        │   └── <MovieCard>[]           ← Props: pelicula (objeto completo)
        │       └── <StreamingBadge>    ← Props: streaming, compacto=true (en tarjeta)
        │       └── <StreamingBadge>    ← Props: streaming (completo, en modal)
        │
        ├── [seccionActiva === 'maraton']
        │   └── <MaratonPlanner>        ← Estado interno: tabs, formularios
        │       └── <MaratonResult>     ← Props: resultado (plan + analisis)
        │           └── <MovieCard>[]   ← Reutilizado en modal de detalle
        │
        └── <Footer>
```

### Flujo de datos

```
Home (useApi → obtenerPeliculasEnriquecidas)
  │
  ├── peliculas[] ──→ MovieCard[] ──→ StreamingBadge (compacto)
  │                        │
  │                        └── [click] ──→ Modal Detalles ──→ StreamingBadge (completo)
  │                                            │
  │                                            └── [click] ──→ Modal Tráiler (YouTube iframe)
  │
  └── handleSearch (callback) ──→ SearchBar
          │
          └── buscarPeliculasEnriquecidas() ──→ searchResults ──→ MovieCard[]
```

---

## 4. Componentes Principales

### `Home` (`src/pages/Home.jsx`)

Página principal y orquestador de la aplicación. Gestiona:

- **`seccionActiva`**: alterna entre `'descubrir'` y `'maraton'`
- **`searchQuery` / `searchResults`**: estado de búsqueda
- Usa el hook `useApi` para cargar películas populares al montar

```jsx
const { data, loading, error, execute: recargarPeliculas } = useApi(fetchPopularesStatic, true);
const peliculas = data?.peliculas || [];
const peliculasAMostrar = searchQuery ? searchResults : peliculas;
```

### `MovieCard` (`src/components/MovieCard.jsx`)

Componente central que tiene **tres estados visuales**:

1. **Tarjeta** — Muestra póster, título, rating con color dinámico, año y `StreamingBadge` compacto. Al hacer hover aparece un overlay con resumen y botón "Ver Detalles".
2. **Modal de Detalles** — Grid de dos columnas (póster + info). Muestra sinopsis, géneros, reparto (hasta 6 actores con foto), información técnica (idioma, presupuesto, recaudación, estado, productoras) y `StreamingBadge` completo.
3. **Modal de Tráiler** — Iframe de YouTube con autoplay, aspect-ratio 16:9.

**Props:**
| Prop | Tipo | Descripción |
|---|---|---|
| `pelicula` | `Object` | Objeto completo de película del backend |

**Propiedades del objeto `pelicula`:**
`id`, `titulo`, `imagen`, `resumen`, `rating`, `fecha`, `duracion`, `generos[]`, `tagline`, `directores[]`, `reparto[]`, `streaming`, `trailer`, `idioma_original`, `presupuesto`, `ingresos`, `estado`, `productoras[]`

**Comportamiento clave:**
- Rating con color dinámico según umbral:
```jsx
const getRatingColor = (rating) => {
    if (rating >= 8) return '#10b981'; // Verde
    if (rating >= 7) return '#3b82f6'; // Azul
    if (rating >= 5) return '#f59e0b'; // Ambar
    return '#ef4444';                  // Rojo
};
```
- Limpieza de iframes de YouTube al cerrar el modal de tráiler (reset de `src`)
- Accesibilidad: `role="button"`, `tabIndex="0"`, `onKeyDown` (Enter/Space)
- Lazy loading de imágenes con `loading="lazy"`

### `StreamingBadge` (`src/components/StreamingBadge.jsx`)

Muestra las plataformas de streaming donde una película está disponible. Dos modos de renderizado:

| Modo | Prop | Uso | Componente interno |
|---|---|---|---|
| **Compacto** | `compacto={true}` | En la tarjeta de película | `StreamingCompacto` |
| **Completo** | `compacto={false}` (default) | En el modal de detalles | `StreamingCompleto` |

**Props:**
| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `streaming` | `Object \| null` | — | `{ suscripcion: [], compra: [] }` |
| `compacto` | `boolean` | `false` | Activa modo compacto (solo logos) |

**Deduplicación:** Usa `deduplicarProveedores()` basado en `Set` por `id`:
```jsx
const deduplicarProveedores = (proveedores) => {
    if (!Array.isArray(proveedores)) return [];
    const vistos = new Set();
    return proveedores.filter((p) => {
        if (!p || vistos.has(p.id)) return false;
        vistos.add(p.id);
        return true;
    });
};
```

**Manejo defensivo:** Retorna `null` si `streaming` es `null`, `undefined`, o ambos arrays están vacíos.

### `NavBar` (`src/components/NavBar.jsx`)

Barra de navegación sticky con:
- Logo "CineFuncional" con gradiente de texto blanco a gris
- Tagline "Procesamiento declarativo de datos"
- Dos botones de navegación: "Descubrir" y "Planear Maratón"
- En mobile: oculta tagline y texto de botones (solo iconos)

**Props:** `seccionActiva`, `setSeccionActiva`

### `SearchBar` (`src/components/SearchBar.jsx`)

Input de búsqueda con icono y botón de limpiar (X). Llama a `onSearch` en cada cambio de texto (búsqueda en tiempo real).

**Props:** `onSearch` (callback que recibe el string de búsqueda)

### `MaratonPlanner` (`src/components/MaratonPlanner.jsx`)

Planificador con **tres tabs**:

| Tab | Endpoint | Parámetros |
|---|---|---|
| Automático | `planificarMaraton` | `tiempo`, `ratingMinimo`, `maximoPeliculas` |
| Por Género | `planificarMaratonTematico` | `tiempo`, `generos[]`, `ratingMinimo` |
| Viaje en el Tiempo | `planificarMaratonDecada` | `tiempo`, `decada`, `ratingMinimo` |

Todos los inputs son range sliders. Los géneros son botones toggle de una lista predefinida. Las décadas son: 1980s, 1990s, 2000s, 2010s, 2020s.

### `MaratonResult` (`src/components/MaratonResult.jsx`)

Muestra el resultado de un maratón planificado:
- **Estadísticas**: cantidad de películas, duración total, rating promedio, tiempo libre
- **Barra de optimización**: porcentaje de tiempo utilizado (visual)
- **Análisis del algoritmo**: eficiencia temporal, películas excelentes, calidad general
- **Timeline**: secuencia ordenada con número, título, rating con color, duración, géneros
- Cada item del timeline es clickeable y abre un `MovieCard` en modal

**Props:** `resultado` — `{ plan, analisis, tematica }`

### `Utilities` (`src/components/Utilities.jsx`)

Componentes de estado reutilizables:

| Componente | Props | Descripción |
|---|---|---|
| `MovieGridSkeleton` | `count=8` | Grid de placeholders animados durante carga |
| `Loading` | — | Spinner simple |
| `ErrorMessage` | `error`, `onRetry` | Mensaje de error con botón de reintento |
| `EmptyState` | `icon`, `title`, `message`, `action` | Estado vacío configurable |

---

## 5. Gestión de Llamadas a la API

### `apiClient.js` (`src/services/apiClient.js`)

Cliente HTTP centralizado basado en `fetch`. La URL base se configura con la variable de entorno `VITE_API_URL` (default: `http://localhost:3000/api`).

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Función base `apiRequest`:**
- Agrega header `Content-Type: application/json` automáticamente
- Valida que la respuesta tenga `exito: true` (convención del backend)
- Loguea errores con `[API Error]` en consola

### Endpoints disponibles

| Función | Método | Endpoint | Retorna |
|---|---|---|---|
| `obtenerPeliculasPopulares()` | GET | `/peliculas/populares` | `datos[]` |
| `obtenerPeliculasEnriquecidas(limite)` | GET | `/peliculas/populares-enriquecidas?limite=N` | `{ peliculas, estadisticas, cantidad }` |
| `buscarPeliculas(termino, limite)` | GET | `/peliculas/buscar?q=...&limite=N` | `datos[]` |
| `buscarPeliculasEnriquecidas(termino, limite)` | GET | `/peliculas/buscar-enriquecida?q=...&limite=N` | `{ peliculas, estadisticas, cantidad }` |
| `planificarMaraton(config)` | POST | `/peliculas/maraton` | `{ plan, analisis }` |
| `planificarMaratonTematico(config)` | POST | `/peliculas/maraton-tematico` | `{ plan, analisis, tematica }` |
| `planificarMaratonDecada(config)` | POST | `/peliculas/maraton-decada` | `{ plan, analisis, tematica }` |
| `obtenerPresetsMaraton()` | GET | `/peliculas/maraton/presets` | `presets` |

### Flujo de datos completo

```
Usuario interactúa
       │
       ▼
Home.jsx (useApi / handleSearch)
       │
       ▼
apiClient.js → fetch(BASE_URL + endpoint)
       │
       ▼
Backend (Node.js) → TMDB API + YouTube API
       │
       ▼
Respuesta: { exito: true, datos: [...], estadisticas: {...} }
       │
       ▼
apiClient desempaqueta → retorna datos limpios
       │
       ▼
Componentes React renderizan
```

### Hook `useApi`

Hook personalizado que envuelve cualquier función async y maneja el ciclo loading/error/data:

```js
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
    // ...
    return { data, loading, error, execute, reset };
};
```

---

## 6. Streaming Badges

### Estructura de datos

El backend envía los datos de streaming en cada película con esta estructura:

```json
{
  "streaming": {
    "suscripcion": [
      { "id": 8, "nombre": "Netflix", "logo": "https://image.tmdb.org/t/p/original/..." }
    ],
    "compra": [
      { "id": 350, "nombre": "Apple TV", "logo": "https://image.tmdb.org/t/p/original/..." }
    ]
  }
}
```

### Modo Compacto vs Completo

**Compacto** (en la tarjeta `MovieCard`):
- Combina suscripción + compra en una sola lista
- Muestra solo los logos (18x18px) sin nombres ni labels de grupo
- Se usa con `<StreamingBadge streaming={pelicula.streaming} compacto />`

**Completo** (en el modal de detalles):
- Separa visualmente en dos grupos: "Suscripción" y "Compra"
- Muestra logos (20x20px) + nombre del proveedor
- Los badges de compra tienen un estilo visual distinto (tono ambar)
- Se usa con `<StreamingBadge streaming={pelicula.streaming} />`

### Deduplicación

La función `deduplicarProveedores` se aplica a **cada grupo individualmente** y también al combinar grupos en modo compacto:

```jsx
// En modo completo: deduplica cada grupo por separado
const suscripcion = deduplicarProveedores(streaming.suscripcion);
const compra = deduplicarProveedores(streaming.compra);

// En modo compacto: combina y deduplica todo junto
const todos = deduplicarProveedores([...suscripcion, ...compra]);
```

### Responsive

En pantallas menores a 480px, los badges se apilan verticalmente (CSS `flex-direction: column`).

---

## 7. Estilos y Diseño

### Patrón CSS Modules

Cada componente tiene su archivo `.module.css` asociado. Las clases se importan como objetos JavaScript:

```jsx
import styles from './MovieCard.module.css';
// Uso: className={styles.card}
// Condicional: className={`${styles.navBtn} ${activo ? styles.navBtnActivo : ''}`}
```

Vite genera nombres de clase únicos en build (ej: `_card_1a2b3`), eliminando conflictos de scope.

### Variables CSS globales (`index.css`)

Definidas en `:root`:

```css
/* Paleta de colores (tema oscuro "Cine Dark") */
--bg-app: #0f172a;          /* Fondo principal (Slate 900) */
--bg-card: #1e293b;         /* Fondo tarjetas (Slate 800) */
--bg-card-hover: #334155;   /* Hover */
--bg-elevated: #1e293b;     /* Modales */

--text-primary: #f8fafc;    /* Blanco casi puro */
--text-secondary: #94a3b8;  /* Gris azulado */
--text-muted: #64748b;      /* Gris oscuro */

--accent: #e11d48;          /* Rojo Cine (Rose 600) */
--accent-hover: #be123c;    /* Rojo oscuro */
--success: #10b981;         /* Verde */
--warning: #f59e0b;         /* Ambar */
--error: #ef4444;           /* Rojo */

/* Bordes y sombras */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.15);
--radius-lg: 16px;
--radius-md: 12px;
--radius-sm: 8px;
--radius-full: 9999px;      /* Pill shape */
--shadow-brand: 0 0 20px -5px rgba(225, 29, 72, 0.4);  /* Glow rojo */

/* Tipografía */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', 'Consolas', monospace;

/* Transiciones */
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Diseño responsive

| Breakpoint | Cambios |
|---|---|
| `< 480px` | Streaming badges se apilan verticalmente |
| `< 600px` | NavBar: oculta tagline y texto de botones (solo iconos) |
| `< 640px` | Grid de películas: 2 columnas fijas, padding reducido |
| `< 768px` | Modal de detalles: grid de una columna |

### Efectos visuales destacados

- **Hover en tarjetas**: `translateY(-6px)` + sombra con glow rojo (`--shadow-brand`)
- **Overlay del póster**: gradiente oscuro + `backdrop-filter: blur(2px)`, se revela con `opacity: 1`
- **Zoom de póster**: `transform: scale(1.08)` en hover
- **Modales**: fondo `rgba(0,0,0,0.85)` con `backdrop-filter: blur(8px)`, animación `fadeIn`
- **Focus visible**: outline rojo (`--accent`) de 2px para accesibilidad
- **Scrollbar personalizada**: estilizada para el tema oscuro

---

## 8. Testing

### Stack de testing

| Herramienta | Rol |
|---|---|
| **Vitest** 4.1 | Test runner (compatible con API de Jest) |
| **jsdom** 28.1 | Entorno DOM simulado |
| **@testing-library/react** 16.3 | Renderizado y queries de componentes |
| **@testing-library/jest-dom** 6.9 | Matchers adicionales (`toBeInTheDocument`, etc.) |
| **@testing-library/user-event** 14.6 | Simulación de eventos de usuario |

### Configuración

En `vite.config.js`:
```js
test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
}
```

El archivo `setup.js` importa los matchers de jest-dom:
```js
import '@testing-library/jest-dom';
```

### Ejecutar tests

```bash
# Dentro de client/
npm test          # Ejecuta vitest run (una sola vez)
```

### Tests existentes — `StreamingBadge.test.jsx`

Se testean 6 escenarios del componente `StreamingBadge`:

| Test | Qué verifica |
|---|---|
| `streaming === null` | No renderiza nada |
| `streaming === undefined` | No renderiza nada |
| Arrays vacíos | No renderiza nada |
| Badges de suscripción | Muestra nombre, logo, label "Suscripción" |
| Badges de compra | Muestra nombre, label "Compra" |
| Sin duplicados | Proveedores con mismo `id` aparecen una sola vez |
| Ambos grupos | Muestra "Suscripción" y "Compra" simultáneamente |

Ejemplo de test:
```jsx
it('No muestra duplicados', () => {
    const streaming = {
        suscripcion: [
            { id: 8, nombre: 'Netflix', logo: '...' },
            { id: 8, nombre: 'Netflix', logo: '...' }
        ],
        compra: []
    };
    render(<StreamingBadge streaming={streaming} />);
    const badges = screen.getAllByText('Netflix');
    expect(badges).toHaveLength(1);
});
```

---

## 9. Configuración de Desarrollo

### Requisitos previos

- Node.js (recomendado v18+)
- npm

### Instalación

```bash
cd client
npm install
```

### Dev server

```bash
npm run dev
```

Inicia Vite en `http://localhost:5173` con apertura automática del navegador (`open: true`).

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | URL base del backend |

Para cambiarla, crear un archivo `.env` en `client/`:
```
VITE_API_URL=http://localhost:3000/api
```

### Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `vite` | Servidor de desarrollo con HMR |
| `build` | `vite build` | Build de producción en `dist/` (con sourcemaps) |
| `preview` | `vite preview` | Previsualizar build de producción |
| `lint` | `eslint .` | Linting del código |
| `test` | `vitest run` | Ejecutar tests una vez |

### Build de producción

```bash
npm run build
```

Genera archivos optimizados en `client/dist/` con sourcemaps habilitados.
