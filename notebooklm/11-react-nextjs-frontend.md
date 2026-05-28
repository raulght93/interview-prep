# React 18 y Next.js — Frontend Avanzado

## Contexto de este documento

Este material cubre React 18, Next.js 14 App Router, Web Components integrados en React,
Design System con separación server/client, y patrones de micro-frontend. Basado en
proyectos reales: shell Next.js con autenticación Keycloak, widget manager que sirve
componentes React compilados como Web Components, y un design system propio con Radix UI.

---

## 1. React 18 — Fundamentos y novedades

### Concurrent Features

React 18 introduce el modo concurrente: el motor puede interrumpir renders para
priorizar actualizaciones urgentes. Esto habilita Suspense, transitions y deferred values.

**useTransition**: marca una actualización de estado como no urgente. React puede
renderizar la UI anterior mientras procesa la transición.

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(input)); // no urgente, puede interrumpirse
```

**useDeferredValue**: versión de "debounce" reactivo — deriva un valor que React
puede posponer para mantener la UI responsiva.

```tsx
const deferredQuery = useDeferredValue(query);
// deferredQuery se actualiza cuando React tiene tiempo libre
```

**Automatic Batching**: en React 18, todas las actualizaciones de estado dentro de
un evento, setTimeout, promesas o fetch se baten automáticamente (antes solo las
de los event handlers síncronos).

### Hooks esenciales

**useState** — estado local del componente. Cada setter dispara un re-render.
El valor inicial solo se usa en el primer render; para inicialización cara, usar
la forma funcional: `useState(() => computeExpensiveValue())`.

**useEffect** — sincroniza el componente con sistemas externos (fetch, subscriptions,
timers). El array de dependencias controla cuándo se ejecuta. Una función de limpieza
evita memory leaks. Regla práctica: si no necesitas el DOM ni sistemas externos, no
uses useEffect.

**useRef** — referencia mutable que no dispara re-renders. Dos usos principales:
referenciar nodos del DOM (`containerRef.current`) y guardar valores entre renders
sin causar actualizaciones (como `isInitializedRef`).

**useMemo** — memoiza el resultado de un cálculo costoso. Solo recalcula cuando
cambian las dependencias.

```tsx
const sortedIds = useMemo(() => [...desktopIds].sort(), [desktopIds]);
```

**useCallback** — memoiza una función para evitar que referencias nuevas rompan
la igualdad referencial en componentes hijo o en arrays de dependencias de useEffect.

```tsx
const sendToWidget = useCallback(
  (widgetId, message) => messenger?.sendToWidget(widgetId, message),
  [messenger]
);
```

**useContext** — consume el valor de un Context sin prop drilling. El componente
re-renderiza cuando el valor del Context cambia. Para optimizar, separar contextos
por frecuencia de cambio o usar selectores con useMemo.

**useReducer** — alternativa a useState para lógica de estado compleja. Recibe
`(state, action) => newState`. Útil cuando el próximo estado depende de múltiples
partes del estado anterior.

**useLayoutEffect** — como useEffect pero se ejecuta síncronamente después del
DOM y antes de que el browser pinte. Necesario para medir nodos del DOM. En Next.js
solo funciona en Client Components.

**useImperativeHandle** — expone métodos imperativos a componentes padre vía refs.
Útil para wrappear librerías imperativas (ej: mapas, editores).

### Reglas de los Hooks

1. Solo llamar Hooks en el nivel más alto (nunca dentro de condiciones, loops o funciones anidadas).
2. Solo llamar Hooks desde componentes React o custom hooks.
3. Los custom hooks deben empezar con "use".

### Custom Hooks

Un custom hook encapsula lógica de estado y efectos reutilizable. Convención:
empieza con `use`. Ejemplo de patrón real del proyecto:

```tsx
// useWidgetMessenger — abstrae el acceso al WidgetMessenger singleton
export function useWidgetMessenger() {
  const context = useContext(WidgetMessengerContext);
  const standaloneRef = useRef(null);
  const [standaloneReady, setStandaloneReady] = useState(false);

  useEffect(() => {
    if (!context.messenger) {
      standaloneRef.current = getMessengerInstance({});
      setStandaloneReady(true);
    }
  }, []);

  const messenger = context.messenger || standaloneRef.current;
  return {
    isReady: context.isReady || standaloneReady,
    sendToWidget: useCallback((id, msg) => messenger?.sendToWidget(id, msg), [messenger]),
    broadcast: useCallback((msg) => messenger?.broadcast(msg), [messenger]),
    on: useCallback((type, handler) => messenger?.on(type, handler), [messenger]),
  };
}
```

---

## 2. React 18 — Rendimiento y patrones

### React.memo

Evita re-renders si las props no cambian (comparación shallow). Para comparación
personalizada, segundo argumento es una función `(prevProps, nextProps) => boolean`.

En el proyecto se usa con `isEqual` de lodash para comparaciones deep en objetos
de configuración de widgets:

```tsx
export const DynamicWebComponent = React.memo(
  function DynamicWebComponent({ name, scriptUrl, properties, persistent }) {
    // ... implementación
  },
  (prevProps, nextProps) =>
    prevProps.name === nextProps.name &&
    prevProps.scriptUrl === nextProps.scriptUrl &&
    isEqual(prevProps.properties, nextProps.properties)
);
```

### Code Splitting y Lazy Loading

`React.lazy` + `Suspense` divide el bundle y carga componentes bajo demanda:

```tsx
const PhaseRegionMap = lazy(() => import('./PhaseRegionMap'));

<Suspense fallback={<Skeleton />}>
  <PhaseRegionMap />
</Suspense>
```

En Next.js, `next/dynamic` hace lo mismo con opciones adicionales para SSR:

```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
```

### ErrorBoundary

Captura errores de JavaScript en el árbol de renderizado y muestra un fallback.
Solo funciona en componentes de clase nativamente, pero `react-error-boundary`
(paquete) expone `ErrorBoundary` con `FallbackComponent`.

```tsx
<ErrorBoundary FallbackComponent={MainErrorFallback}>
  {children}
</ErrorBoundary>
```

### Avoiding reconciliation issues

Problemas comunes de rendimiento:
- Crear objetos/arrays en línea en JSX (nueva referencia en cada render).
- Funciones en línea pasadas como props a componentes memoizados.
- Context con objetos no memoizados: todo el árbol re-renderiza.

Herramientas: React DevTools (Profiler), `react-scan` (detecta renders innecesarios
en tiempo real, integrado en el proyecto vía `react-scan.tsx`).

---

## 3. Next.js 14 App Router

### Fundamento: Server vs Client Components

La distinción más importante del App Router:

**Server Components** (SC):
- Se ejecutan en el servidor, el HTML llega al cliente.
- Pueden hacer fetch directo, acceder a BBD, leer archivos.
- No tienen state (`useState`), effects (`useEffect`), ni event handlers.
- Reducen el bundle JS del cliente.
- Por defecto en el App Router.

**Client Components** (CC):
- Marcados con `'use client'` en la primera línea.
- Se hidratan en el cliente (doble render: HTML en servidor + JS en cliente).
- Tienen acceso a browser APIs, hooks, interactividad.
- Pueden importar Server Components (pero no al revés directamente).

Regla práctica: push components as far down the tree as possible; mark as client
only lo que necesita interactividad o browser APIs.

### Estructura del App Router

```
app/
├── layout.tsx         ← Layout raíz (Server Component por defecto)
├── page.tsx           ← Ruta /
├── (pages)/           ← Route group (no afecta la URL)
│   ├── layout.tsx     ← Sub-layout con providers
│   ├── page.tsx       ← Ruta /
│   ├── [id]/
│   │   └── page.tsx   ← Ruta dinámica /cualquier-id
│   └── widget/
│       └── page.tsx   ← Ruta /widget (Client Component con lógica compleja)
└── api/
    └── auth/
        └── [...nextauth]/route.ts  ← Route Handler de next-auth
```

Archivos especiales:
- `loading.tsx` — muestra mientras la página carga (usa Suspense).
- `error.tsx` — error boundary por ruta (debe ser Client Component).
- `not-found.tsx` — página 404.
- `route.ts` — API route handler (GET, POST, etc.).

### Data Fetching y Prefetching

**En Server Components**: fetch directo (React extiende fetch con caching):

```tsx
// Server Component
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // ISR: revalidar cada hora
});
```

**Con TanStack Query (patrón del proyecto)**:

```tsx
// layout.tsx (Server Component)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(getUserQueryOptions(username));
// dehydrate serializa el cache para enviarlo al cliente
return (
  <AppProvider dehydratedState={dehydrate(queryClient)}>
    {children}
  </AppProvider>
);

// AppProvider (Client Component)
export const AppProvider = ({ children, dehydratedState }) => {
  const [queryClient] = useState(getQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
};
```

`HydrationBoundary` hidrata el cache del servidor en el QueryClient del cliente,
evitando un fetch redundante al montar el componente.

### Middleware

`middleware.ts` en la raíz intercepta requests antes de servir la respuesta.
Usos comunes: auth, i18n, A/B testing, redirects.

```tsx
// middleware.ts
export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/api/auth/signin/keycloak', req.url));
  }
  if (req.auth?.error === 'RefreshAccessTokenError') {
    return NextResponse.redirect(/* ... */);
  }
  return NextResponse.next();
});

export const config = {
  // Excluir rutas de auth, assets estáticos, etc.
  matcher: ['/((?!api/auth|_next|favicon.ico).*)'],
};
```

### next-auth v5 (Auth.js) con Keycloak

Flujo completo:
1. Usuario no autenticado → middleware redirige a `/api/auth/signin/keycloak`.
2. next-auth redirige al servidor Keycloak (OAuth2 Authorization Code Flow).
3. Keycloak devuelve code → next-auth lo intercambia por access_token + refresh_token.
4. next-auth crea sesión JWT con el access_token.
5. JWT callback guarda `expiresAt` y renueva el token con refresh_token cuando caduca.

```tsx
// auth.ts - JWT callback con refresh
async jwt({ token, account }) {
  if (account) {
    return { ...token, accessToken: account.access_token,
             refreshToken: account.refresh_token,
             expiresAt: account.expires_at * 1000 };
  }
  if (Date.now() < token.expiresAt) return token; // aún válido

  // Refresh: llamada al endpoint /token de Keycloak
  const refreshedTokens = await fetch(`${keycloakIssuer}/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
      client_id: keycloakClientId,
      client_secret: keycloakClientSecret,
    }),
  });
  return { ...token, accessToken: newToken.access_token,
           expiresAt: Date.now() + newToken.expires_in * 1000 };
}
```

El `session callback` extrae solo lo necesario del JWT y lo expone a los componentes.

### Next.js Performance

**Fuentes de Google**: `next/font` descarga, auto-optimiza y serve las fuentes
desde el mismo dominio. Sin layout shift gracias al `size-adjust`.

```tsx
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500'],
});
```

**Imágenes**: `next/image` optimiza formatos (WebP/AVIF), lazy load y evita CLS
con `width`/`height` obligatorios.

**SVG como React Components**: `@svgr/webpack` convierte SVGs a componentes React.
El `next.config.mjs` separa SVGs normales de los importados como URL (`?url`).

---

## 4. Arquitectura Micro-Frontend con Web Components

### El patrón del proyecto: Widget Manager + Shell

El sistema tiene tres capas:

1. **Widget Manager** (servidor Bun + Hono): servidor de assets que compila widgets
React con Bun.build, los cachea y los sirve como JS bundles.

2. **Shell Next.js** (`agata-front-next`): aplicación host que carga widgets
dinámicamente desde el Widget Manager. Cada widget es un Custom Element que
se inyecta en el DOM.

3. **Widgets** (`agata-front-widget-manager/src/widgets/`): componentes React
compilados a Web Components vía `@r2wc/react-to-web-component`. Cada widget
se convierte en un Custom Element registrado con `customElements.define()`.

### @r2wc/react-to-web-component

Convierte un componente React en un Web Component (Custom Element):

```tsx
import r2wc from '@r2wc/react-to-web-component';
import { MyWidget } from './MyWidget';

const MyWidgetElement = r2wc(MyWidget, {
  props: { userId: 'string', config: 'json' }
});
customElements.define('my-widget', MyWidgetElement);
```

Las props se pasan como atributos HTML (strings JSON para objetos):
```html
<my-widget user-id="123" config='{"mode":"edit"}'></my-widget>
```

### DynamicWebComponent — carga dinámica con caché multinivel

El shell usa `DynamicWebComponent` para cargar widgets con una estrategia de caché
en cascada: servidor → blob client → red.

```
1. getWidget(name, url) → busca en el server-side cache (API /api/cache)
2. Si no está → loadWidgetFromNetwork() → fetch el script JS desde Widget Manager
3. El script se ejecuta: customElements.whenDefined(name) → crea el elemento
4. Si el elemento ya está defined (cargado antes) → render instantáneo
5. URL revocadas después de ejecutar para liberar memoria
```

Atributos se convierten camelCase→kebab-case antes de `setAttribute()`:
```tsx
const camelCaseToDash = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase();
```

Props se actualizan comparando con `isEqual` para evitar re-renders innecesarios
en el Web Component.

### Widget Messaging — comunicación shell ↔ widget

Los widgets viven en `window` diferente (iframe o mismo window según configuración).
La comunicación usa `window.postMessage`:

**Tipos de mensajes** (MessageTypes enum):
- `widget:data-change` — el widget notifica cambios en sus datos al shell.
- `widget:validation-change` — validación OK/KO.
- `widget:request-submit` — el shell pide al widget que haga submit.
- `widget:notification` — el widget pide mostrar un toast al shell.
- `widget:detail-call` — navegar al detalle de una entidad.
- `widget:breadcrumb-update` / `widget:breadcrumb-click` — gestión de migas.

**Shell side** (`WidgetMessenger`):
```tsx
// Registra el widget por ID con su window
messenger.registerWidget('my-widget', iframeEl.contentWindow);

// Escucha cambios
messenger.on(MessageTypes.DATA_CHANGE, (msg) => setFormData(msg.data));

// Pide submit
messenger.sendToWidget('my-widget', { type: MessageTypes.REQUEST_SUBMIT });
```

**Widget side** (`WidgetClientMessenger`):
```tsx
const messenger = new WidgetClientMessenger();
messenger.emitDataChange({ field: 'value' });
messenger.emitValidationChange(isValid);

// Reacciona al REQUEST_SUBMIT del shell
messenger.onRequestSubmit((msg) => handleSubmit());
```

**HOC `withMessaging`**: envuelve cualquier widget en un HoC que gestiona
el ciclo de vida del messenger (inicialización en mount, cleanup en unmount)
y expone las funciones emit como props al componente.

### Singleton pattern del Messenger

El WidgetMessenger usa singleton via módulo:
```tsx
let messengerInstance: WidgetMessenger | null = null;

export function getMessengerInstance(options) {
  if (!messengerInstance) {
    messengerInstance = new WidgetMessenger(options.allowedOrigins, options.debug);
  }
  return messengerInstance;
}
```

Esto garantiza que todos los componentes del shell compartan el mismo messenger
y los handlers registrados persistan entre navegaciones.

---

## 5. Design System: Server/Client Split

El design system (`agata-design-system`) separa componentes en dos grupos:

**Server Components** (sin estado, sin hooks):
- Button, Input, Textarea, Skeleton, Surface, Breadcrumb, ScrollArea, Pagination
- Se importan desde `@agata/cuarzo-ds/server`
- Pueden usarse directamente en Server Components de Next.js

**Client Components** (interactivos, con estado):
- Dialog, Popover, Select, Tabs, Toast, Drawer (Vaul), Checkbox, DatePicker
- Se importan desde `@agata/cuarzo-ds/client`
- Marcados con `'use client'`

Esta separación evita el error "Server Component importing client-only code"
y reduce el bundle JS del cliente.

### CVA — Class Variance Authority

Patrón para definir variantes de estilos con Tailwind:

```tsx
const buttonVariants = cva(
  'base-classes...', // clases base
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-gray-100 text-gray-800',
      },
      size: {
        s: 'h-8 px-3 text-sm',
        m: 'h-10 px-4 text-base',
        l: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'm' },
  }
);
```

`VariantProps<typeof buttonVariants>` extrae los tipos de las variantes automáticamente.

### Radix UI — Componentes accesibles sin estilos

Radix UI proporciona la lógica y accesibilidad (ARIA, keyboard nav, focus management)
sin opinar sobre los estilos. Se compone con clases Tailwind encima.

Primitivos usados: Checkbox, Dialog, DropdownMenu, Popover, Progress, ScrollArea,
Select, Separator, Slot, Tabs.

**`Slot`** es especialmente útil: renderiza el hijo como si fuera el componente,
pasándole todas las props. Permite el patrón `asChild`:

```tsx
<Button asChild>
  <Link href="/dashboard">Ir al dashboard</Link>
</Button>
// → renderiza un <a> con los estilos del Button, no un <button> + <a>
```

### `cn` utility — clsx + tailwind-merge

```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

`clsx` une clases condicionalmente. `tailwind-merge` resuelve conflictos
(ej: `p-4 p-2` → `p-2`; `text-red-500 text-blue-600` → `text-blue-600`).

---

## 6. Testing en el ecosistema React/Next.js

### Vitest + Testing Library

**Vitest**: test runner compatible con Vite, API compatible con Jest. Más rápido
por usar la misma pipeline de Vite (sin transformación doble).

**@testing-library/react**: filosofía "test behavior, not implementation".
Renderiza componentes y los consulta como lo haría un usuario (por texto,
roles ARIA, labels). No uses IDs de test ni refs internas.

```tsx
it('shows error when form is invalid', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

  expect(screen.getByRole('alert')).toHaveTextContent('Email requerido');
});
```

### MSW — Mock Service Worker

Intercepta fetch/XHR a nivel de Service Worker (en browser) o nodo (`@mswjs/http-middleware`
en Node). El handler se define una vez y funciona en tests y en desarrollo:

```tsx
const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test User' });
  }),
];
```

En el proyecto se usa `@mswjs/data` para crear una "base de datos" en memoria
que simula relaciones entre entidades, facilitando tests complejos.

### Testing de React Query

Para testear componentes que usan React Query hay que envolver en `QueryClientProvider`
con un `QueryClient` limpio por test (sin cache compartido):

```tsx
const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useNotifications({ userId: '1' }), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

---

## 7. Patrones avanzados de React

### Compound Components

Un patrón donde el padre comparte estado con los hijos vía Context. Los hijos
son subcomponentes del padre:

```tsx
const TabsContext = createContext(null);

function Tabs({ children }) {
  const [active, setActive] = useState(0);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = function TabsList({ children }) { return <div role="tablist">{children}</div>; };
Tabs.Panel = function TabsPanel({ index, children }) {
  const { active } = useContext(TabsContext);
  return active === index ? children : null;
};
```

### Render Props y HOCs (patrones legacy, conocerlos para entrevistas)

**Render prop**: pasa una función como prop que el componente llama para renderizar.
```tsx
<DataFetcher url="/api/data" render={(data) => <DataView data={data} />} />
```

**HOC (Higher Order Component)**: función que recibe un componente y devuelve uno nuevo
con funcionalidad adicional. `withMessaging` en el proyecto es un ejemplo real.
Problema: wrapper hell, props implícitas. Hooks los reemplazaron en la mayoría de casos.

### Portals

`ReactDOM.createPortal(children, domNode)` renderiza fuera del árbol del componente
(ej: modales, tooltips que necesitan estar al nivel del body para no tener overflow:hidden).
Radix UI lo usa internamente en Dialog, Popover, etc.

### Concurrent Mode Patterns

**Streaming SSR**: Next.js usa `<Suspense>` para enviar HTML incrementalmente.
Los componentes suspendidos muestran el fallback mientras se resuelve la promesa.

**useOptimistic** (React 19): actualización optimista del estado antes de que
la mutación del servidor confirme.

```tsx
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem) => [...state, { ...newItem, pending: true }]
);
```

---

## 8. Preguntas de entrevista — React y Next.js

¿Cuándo usar useState vs useReducer?
> useState para estado simple e independiente. useReducer cuando hay múltiples
> sub-valores relacionados o cuando el próximo estado depende del anterior de forma
> compleja. También facilita testing porque el reducer es una función pura.

¿Qué es el reconciliation de React?
> El algoritmo que compara el Virtual DOM anterior con el nuevo para determinar
> los cambios mínimos a aplicar al DOM real. Usa el tipo del elemento y la key
> como heurísticas. Si el tipo cambia, React destruye y recrea el subárbol completo.

¿Qué problema resuelven las keys en listas?
> Sin keys, React reusa elementos por posición, lo que causa bugs cuando se
> reordena/elimina. Con keys estables (IDs, no índices), React puede reasignar
> correctamente state e instancias DOM al reordenar.

¿Server Component vs Client Component en Next.js?
> Server: corre en el servidor, accede a datos directamente, sin state/effects.
> Client: `'use client'`, necesita interactividad o browser APIs, se hidrata.
> Regla: server por defecto, marcar cliente solo lo necesario para minimizar bundle.

¿Qué es la hidratación?
> El proceso de conectar el HTML estático enviado por el servidor con los handlers
> de eventos y state de React en el cliente. `HydrationBoundary` de TanStack Query
> hidrata el cache del servidor en el cliente para evitar re-fetches innecesarios.

¿Cómo funciona next-auth con Keycloak?
> next-auth implementa OAuth2/OIDC. Con Keycloak: el proveedor redirige al servidor
> Keycloak, que tras login devuelve un code, que next-auth intercambia por tokens.
> El JWT callback guarda access_token y refresh_token; cuando caduca, hace refresh
> automático. La sesión se propaga vía SessionProvider.

¿Qué es el patrón de micro-frontend con Web Components?
> Cada feature se compila como un bundle JS independiente que registra un Custom Element.
> El shell (host) carga estos bundles bajo demanda, crea los elementos en el DOM y
> se comunica con ellos via postMessage (WidgetMessenger). Ventajas: despliegue
> independiente, tecnología heterogénea posible. Retos: compartir dependencias
> (React debe ser singleton), estado compartido, testing de integración.
