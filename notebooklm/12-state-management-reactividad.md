# Gestión de Estado y Reactividad en Frontend

## Introducción: el problema del estado

En aplicaciones modernas hay dos categorías de estado muy distintas:

**Server State** (estado del servidor):
- Vive en el servidor y se sincroniza al cliente.
- Características: asíncrono, puede quedar obsoleto (stale), compartido entre usuarios.
- Ejemplos: listas de entidades, datos de usuario, notificaciones.
- Herramientas: TanStack Query, SWR, RTK Query.

**Client State** (estado del cliente):
- Vive solo en el navegador.
- Características: síncrono, privado del usuario, no persiste sin localStorage.
- Ejemplos: estado de UI (modal abierto/cerrado), selección activa, filtros no guardados.
- Herramientas: useState, useReducer, Context, Zustand, Redux.

Uno de los errores más comunes es mezclar ambos tipos en una misma store de Redux,
gestionando fetches manualmente con loading/error/data cuando TanStack Query
lo hace automáticamente y mejor.

---

## 1. TanStack Query (React Query v5) — Server State

### Por qué TanStack Query

Sin TanStack Query, gestionar server state a mano requiere:
- Estado de loading, error y data por cada fetch.
- Deduplicación de requests (si dos componentes piden lo mismo simultáneamente).
- Invalidación y refresco cuando los datos cambian.
- Cache con TTL.
- Sincronización en background.

TanStack Query hace todo esto out-of-the-box.

### QueryClient y configuración

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // no refetch al volver a la pestaña
      retry: false,                // no reintentar en error
      staleTime: Infinity,         // los datos nunca se consideran obsoletos
      gcTime: 1000 * 60 * 60 * 24 // 24h en cache tras quedar inactivos
    }
  }
});
```

**Aggressive caching (patrón del proyecto shell)**:
`staleTime: Infinity` significa que React Query nunca refetchea automáticamente.
La actualización se hace manualmente con `queryClient.invalidateQueries(key)`.
Ideal para apps enterprise donde los datos no cambian con mucha frecuencia y
el rendimiento es prioritario.

**staleTime vs gcTime**:
- `staleTime`: tiempo que los datos se consideran frescos. Mientras son frescos,
  no se hace refetch automático.
- `gcTime` (antes cacheTime): tiempo que los datos inactivos permanecen en memoria.
  Si el componente se desmonta y los datos no tienen más suscriptores, se guardan
  en cache durante este tiempo. Trascurrido, se eliminan.

### queryOptions pattern (recomendado en v5)

En lugar de pasar `queryKey` y `queryFn` inline, se define en una función separada.
Esto permite reutilizar la misma configuración en `useQuery`, `prefetchQuery` y
`getQueryData`:

```tsx
// get-user.ts
export const getUserQueryOptions = (username: string) => {
  return queryOptions({
    queryKey: ['user', username],
    queryFn: () => fetchUser(username),
  });
};

// En un Server Component (Next.js):
await queryClient.prefetchQuery(getUserQueryOptions(username));

// En un componente:
const { data } = useQuery(getUserQueryOptions(username));

// Para acceder sin suscripción:
const user = queryClient.getQueryData(getUserQueryOptions(username).queryKey);
```

### useQuery

```tsx
const {
  data,          // resultado
  isLoading,     // primera carga sin datos en cache
  isFetching,    // cualquier fetch en curso
  isError,       // hay error
  error,         // el objeto de error
  refetch,       // disparar refetch manual
} = useQuery({
  queryKey: ['notifications', userId],
  queryFn: () => getNotifications(userId),
  enabled: !!userId,          // no hacer fetch si userId es falsy
  staleTime: 5 * 60 * 1000,  // override del default
});
```

**queryKey**: array que identifica el query en el cache. Debe incluir todo lo
que afecta al resultado (params, filtros, userId). Si cambia algún elemento,
React Query hace un nuevo fetch.

### useMutation

Para operaciones que cambian datos en el servidor:

```tsx
const { mutate, isPending } = useMutation({
  mutationFn: (newEntity) => createEntity(newEntity),
  onSuccess: (data) => {
    // Invalida queries relacionados para que se refetcheen
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    toast.success('Creado correctamente');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Uso:
mutate({ name: 'Nueva entidad', type: 'Desktop' });
```

### Optimistic Updates

Actualizar la UI antes de que el servidor confirme, y hacer rollback si falla:

```tsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updateEntity,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['entity', id] });
    const previousData = queryClient.getQueryData(['entity', id]);
    queryClient.setQueryData(['entity', id], (old) => ({ ...old, ...newData }));
    return { previousData }; // contexto para onError
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['entity', id], context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['entity', id] });
  },
});
```

### HydrationBoundary (SSR + CSR)

Patrón clave de Next.js + TanStack Query:

```tsx
// layout.tsx (Server Component)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(getUserQueryOptions(username));
const dehydratedState = dehydrate(queryClient); // serializa el cache

// AppProvider (Client Component)
<QueryClientProvider client={queryClient}>
  <HydrationBoundary state={dehydratedState}>
    {/* Los queries prefetcheados están disponibles inmediatamente */}
    {children}
  </HydrationBoundary>
</QueryClientProvider>
```

`dehydrate` serializa las queries exitosas del cache a un formato JSON plano.
`HydrationBoundary` rehidrata ese cache en el QueryClient del cliente, de forma
que `useQuery` encuentra los datos en cache y no hace un segundo fetch.

### Shared QueryClient para micro-frontends

Cuando múltiples bundles (widgets) usan React Query, cada bundle tiene su propia
instancia del módulo y por tanto su propio QueryClient. Para compartir cache
entre widgets, se usa un QueryClient en `window`:

```tsx
export function getSharedWidgetQueryClient(): QueryClient {
  if (!window.__agataWidgetQueryClient__) {
    window.__agataWidgetQueryClient__ = new QueryClient({ defaultOptions: WIDGET_QUERY_DEFAULTS });
  }
  return window.__agataWidgetQueryClient__;
}
```

Esto permite que un widget que prefetchea datos de entidades lo haga disponible
para otro widget que los necesita, sin peticiones duplicadas.

---

## 2. Context API de React — Client State simple

### Cuándo es suficiente

Context es adecuado para:
- Estado que no cambia frecuentemente (tema, locale, usuario autenticado).
- Estado de UI compartido entre muchos componentes sin prop drilling profundo.
- Configuración de librerías (QueryClientProvider, SessionProvider son Context internamente).

Problemas de Context para estado que cambia frecuentemente:
- Todo el árbol que consume el Context re-renderiza cuando el valor cambia.
- Sin selector, un componente que solo usa `theme.darkMode` re-renderiza si cambia
  cualquier parte del objeto context.

Soluciones: separar contextos por dominio, usar `useMemo` para el valor del provider,
o usar Zustand/Jotai cuando el rendimiento importa.

### Patrón completo

```tsx
const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
```

---

## 3. Redux Toolkit (RTK) — Client State a escala

### Por qué Redux Toolkit sobre Redux vanilla

Redux vanilla requería mucho boilerplate: action types como constantes, action creators
separados, switch/case en reducers, immutable updates manuales. RTK elimina todo esto.

### createSlice

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0, status: 'idle' },
  reducers: {
    // Immer permite "mutaciones" (en realidad crea un nuevo objeto)
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    setAmount: (state, action: PayloadAction<number>) => {
      state.value = action.payload;
    },
  },
});

export const { increment, decrement, setAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

`createSlice` genera automáticamente los action creators y los action types
a partir de los reducers. Usa **Immer** internamente para permitir sintaxis
de "mutación" que en realidad produce immutable updates.

### configureStore

```tsx
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    auth: authSlice.reducer,
    entities: entitiesSlice.reducer,
  },
  // middleware: incluye redux-thunk por defecto + serializability check
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### createAsyncThunk — side effects async

```tsx
export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// En el slice:
extraReducers: (builder) => {
  builder
    .addCase(fetchUserById.pending, (state) => { state.status = 'loading'; })
    .addCase(fetchUserById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload;
    })
    .addCase(fetchUserById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    });
}
```

### Selectors y createSelector

```tsx
import { createSelector } from '@reduxjs/toolkit';

// Selector básico
const selectCounter = (state: RootState) => state.counter.value;

// Selector memoizado con Reselect
const selectActiveEntities = createSelector(
  [(state: RootState) => state.entities.items, (_, filter) => filter],
  (items, filter) => items.filter(item => item.status === filter)
);
```

`createSelector` memoiza: solo recalcula si cambian los inputs. Evita re-renders
cuando el state.entities cambia pero el resultado filtrado no.

### RTK Query

RTK Query es la capa de server state integrada en RTK (alternativa a TanStack Query):

```tsx
const entitiesApi = createApi({
  reducerPath: 'entitiesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Entity'],
  endpoints: (builder) => ({
    getEntities: builder.query<Entity[], void>({
      query: () => '/entities',
      providesTags: ['Entity'],
    }),
    createEntity: builder.mutation<Entity, Partial<Entity>>({
      query: (body) => ({ url: '/entities', method: 'POST', body }),
      invalidatesTags: ['Entity'], // auto-invalida el cache de getEntities
    }),
  }),
});

export const { useGetEntitiesQuery, useCreateEntityMutation } = entitiesApi;
```

### Redux vs TanStack Query

| Aspecto | Redux | TanStack Query |
|---------|-------|----------------|
| Foco | Client state | Server state |
| Boilerplate | Bajo con RTK | Muy bajo |
| Cache invalidation | Manual | Automática con tags |
| Devtools | Redux DevTools | React Query DevTools |
| Background sync | No | Sí |
| Optimistic updates | Manual | Helpers integrados |

**Recomendación en 2025**: usar TanStack Query para server state y
Redux/Zustand solo para client state complejo. No poner los datos
del servidor en Redux store.

---

## 4. Zustand — Client State minimalista

Zustand es una librería de state management muy ligera (~1KB). Sin boilerplate,
sin providers (excepto si se quiere), sin acciones explícitas.

```tsx
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: () => void;
  reset: () => void;
}

const useStore = create<BearStore>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  reset: () => set({ bears: 0 }),
}));

// Uso — solo re-renderiza si bears cambia
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <div>{bears}</div>;
}
```

**Selectors en Zustand**: el selector `(state) => state.bears` hace que el
componente solo se suscriba a esa parte del estado. Sin selector, re-renderiza
con cualquier cambio (como Context).

**Middleware de Zustand**:
- `persist`: sincroniza el store con localStorage.
- `devtools`: integración con Redux DevTools.
- `immer`: sintaxis de mutación.

```tsx
const useStore = create(
  persist(
    devtools(
      immer((set) => ({ /* ... */ })),
      { name: 'my-store' }
    ),
    { name: 'my-store-local' }
  )
);
```

**Zustand vs Redux**: Zustand no requiere Provider, es más simple y tiene
menos conceptos. Redux tiene un ecosistema mayor (time-travel debugging,
middleware ecosystem, equipo grande). Para apps pequeñas/medianas: Zustand.
Para apps enterprise con muchos desarrolladores: RTK.

---

## 5. Jotai — Estado Atómico

Jotai (del japonés "estado") usa el modelo de átomos: unidades primitivas de estado.
Los componentes se suscriben a átomos individuales, como los Signals de Angular.

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Átomo primitivo
const countAtom = atom(0);

// Átomo derivado (como computed en Vue o selector en Recoil)
const doubledAtom = atom((get) => get(countAtom) * 2);

// Átomo writable derivado
const filteredTodosAtom = atom(
  (get) => get(todosAtom).filter(t => !t.done),
  (get, set, newTodo) => set(todosAtom, [...get(todosAtom), newTodo])
);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom); // solo lectura
  const setCount2 = useSetAtom(countAtom);  // solo escritura (no re-render)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Ventajas de Jotai**:
- Fine-grained reactivity: cada átomo es independiente, sin re-renders globales.
- No hay Provider obligatorio (usa el context por defecto de React).
- Composición de átomos simple.

**Jotai vs Zustand**: Jotai es mejor para estado muy granular (cada campo de un
formulario como átomo). Zustand es mejor para state con lógica de negocio agrupada.

---

## 6. NgRx — Gestión de Estado en Angular

NgRx es el equivalente de Redux en Angular. Sigue el patrón Redux (Store, Actions,
Reducers, Effects) adaptado al ecosistema Angular con Observables (RxJS).

### Arquitectura NgRx

```
Componente → dispatch(Action)
               ↓
           Reducer → actualiza State
               ↓
           Store (Observable)
               ↓
           Selector → Component (via async pipe o subscribe)

Side effects:
Componente → dispatch(Action) → Effects (interceptan) → API call → dispatch(Success/Failure Action)
```

### Elementos principales

**Store**: contenedor de estado global. Es un Observable de RxJS que emite
cuando el estado cambia.

```ts
// Definir estado y reducer
export interface AppState { users: User[]; loading: boolean; }

export const loadUsers = createAction('[Users] Load Users');
export const loadUsersSuccess = createAction('[Users] Load Users Success',
  props<{ users: User[] }>());

export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state) => ({ ...state, loading: true })),
  on(loadUsersSuccess, (state, { users }) => ({ ...state, users, loading: false }))
);
```

**Effects** — side effects async (equivale a createAsyncThunk):

```ts
@Injectable()
export class UsersEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() => this.usersService.getAll().pipe(
        map(users => loadUsersSuccess({ users })),
        catchError(error => of(loadUsersFailed({ error })))
      ))
    )
  );

  constructor(private actions$: Actions, private usersService: UsersService) {}
}
```

**Selectors** — consultar porciones del estado:

```ts
export const selectUsers = (state: AppState) => state.users;
export const selectActiveUsers = createSelector(
  selectUsers,
  (users) => users.filter(u => u.active)
);

// En componente:
users$ = this.store.select(selectActiveUsers);

// En template:
<li *ngFor="let user of users$ | async">{{ user.name }}</li>
```

**`async` pipe**: subscribe y unsubscribe automático en templates Angular. Evita
memory leaks. Equivale a `useQuery` de TanStack Query en cuanto a gestión del ciclo de vida.

### RxJS Observables vs React State

| Concepto RxJS/NgRx | Equivalente React |
|--------------------|-------------------|
| Observable | useState / useQuery |
| Subject | useState setter |
| BehaviorSubject | useState (tiene valor inicial) |
| async pipe | hook de React Query |
| Effects | useMutation / useEffect |
| Selectors | useMemo / createSelector (RTK) |
| Actions + Reducer | dispatch + useReducer / Redux slice |

### Signals en Angular (Angular 17+)

Angular introdujo Signals como alternativa reactiva más simple a Observables
para estado local/compartido. Similar a los Signals de SolidJS y Preact:

```ts
// Crear un signal
count = signal(0);

// Leer (en template o computed)
currentCount = this.count(); // devuelve el valor actual

// Actualizar
this.count.set(5);
this.count.update(val => val + 1);

// Computed (equivale a createSelector)
doubled = computed(() => this.count() * 2);

// Effect (equivale a useEffect)
effect(() => {
  console.log('Count changed:', this.count());
});
```

**Ventajas de Signals sobre Observables**:
- Más simple (sin pipe, subscribe, unsubscribe).
- Granular: solo re-renderiza lo que depende del signal.
- Interopera con RxJS: `toObservable()`, `toSignal()`.

### NgRx Signal Store (NgRx v17+)

La versión moderna de NgRx usa Signals en lugar de Observables:

```ts
export const UsersStore = signalStore(
  withState({ users: [] as User[], loading: false }),
  withComputed(({ users }) => ({
    activeUsers: computed(() => users().filter(u => u.active))
  })),
  withMethods((store, usersService = inject(UsersService)) => ({
    async loadUsers() {
      patchState(store, { loading: true });
      const users = await usersService.getAll();
      patchState(store, { users, loading: false });
    }
  }))
);

// En componente:
store = inject(UsersStore);
// template: {{ store.activeUsers() }}
```

---

## 7. Comparativa de herramientas de estado

### Árbol de decisión

```
¿Es estado del servidor (async, API)?
  → SÍ: TanStack Query / SWR / RTK Query
  → NO: ¿Es estado global de UI compartido?
      → SÍ: ¿Equipo grande, muchos features?
          → SÍ: Redux Toolkit
          → NO: Zustand (simple) / Jotai (granular)
      → NO: ¿Estado local del componente?
          → useState / useReducer
          → ¿Se necesita en varios componentes sin prop drilling?
              → Context (si no cambia frecuente) / Zustand
```

### Tabla comparativa

| Librería | Tamaño | Curva | Devtools | Reactivos | Mejor para |
|----------|--------|-------|----------|-----------|------------|
| useState/useReducer | 0KB | Baja | React DevTools | No | Estado local |
| Context | 0KB | Media | React DevTools | No | Config, tema |
| TanStack Query | ~13KB | Media | RQ DevTools | No | Server state |
| Zustand | ~1KB | Baja | Redux DevTools | No | Client state simple |
| Jotai | ~3KB | Baja | Jotai DevTools | Sí (átomos) | Estado granular |
| RTK + Redux | ~25KB | Alta | Redux DevTools | No | Apps enterprise |
| NgRx (Angular) | ~45KB | Alta | Redux DevTools | Sí (Signals v17) | Angular enterprise |

---

## 8. Reactividad: Signals, Observables y el futuro

### ¿Qué es la reactividad fina (fine-grained reactivity)?

React usa reconciliación de componentes: cuando el estado cambia, React re-renderiza
el componente y sus hijos, luego compara Virtual DOMs para actualizar el DOM real.
Es eficiente pero no "fine-grained": todo el árbol del componente se ejecuta.

Los sistemas reactivos finos (Signals, MobX, SolidJS, Vue Composition API)
rastrean exactamente qué parte del DOM depende de qué estado. Solo actualiza
exactamente lo que cambió, sin recorrer el árbol.

### Signals en el ecosistema frontend

**SolidJS**: el pionero del modelo de Signals en el mundo de los componentes.
Sin Virtual DOM; compila a actualizaciones de DOM finas.

**Preact Signals**: librería de Signals para React/Preact. Al acceder a `.value`
en un componente, ese componente se suscribe automáticamente.

```tsx
import { signal, computed } from "@preact/signals-react";

const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  // Solo este componente re-renderiza cuando count cambia
  return <button onClick={() => count.value++}>{count.value}</button>;
}
```

**Vue Composition API**: `ref()` y `reactive()` son Signals por otro nombre.
`computed()` y `watch()` son equivalentes a los selectors/effects reactivos.

**React Compiler (React Forget)**: la apuesta de React. En lugar de Signals,
el compilador analiza el código y añade memoización automáticamente donde sea
necesario. No cambia el modelo mental: sigue siendo estado + render.

### MobX — Reactividad transparente

MobX usa decoradores y proxies para hacer el estado observable sin cambiar la
sintaxis de JavaScript. Cualquier acceso a un observable en un componente crea
una suscripción automática:

```tsx
class CounterStore {
  @observable count = 0;
  @computed get doubled() { return this.count * 2; }
  @action increment() { this.count++; }
}

const store = new CounterStore();

const Counter = observer(() => (
  <button onClick={() => store.increment()}>{store.count}</button>
));
```

`observer` (HOC de mobx-react-lite) hace el componente reactivo. Similar a
`computed` de Vue: solo re-renderiza si los observables accedidos cambian.

### RxJS y reactividad en Angular

RxJS es la librería de programación reactiva de Angular. Usa Observables (streams
de datos en el tiempo) y operadores funcionales para transformarlos.

```ts
// Ejemplo: búsqueda con debounce, cancelación y caché
searchResults$ = this.searchInput.valueChanges.pipe(
  debounceTime(300),      // espera 300ms de inactividad
  distinctUntilChanged(), // no busca si el valor no cambió
  switchMap(query => this.searchService.search(query)), // cancela petición anterior
  catchError(() => of([]))
);
```

Operadores RxJS más comunes en frontend:
- `debounceTime` / `throttleTime`: rate limiting de eventos.
- `switchMap`: cancela la suscripción anterior (búsquedas, navegaciones).
- `mergeMap`: ejecuta todas las peticiones en paralelo.
- `concatMap`: ejecuta en serie, respeta orden.
- `shareReplay(1)`: multicast + cache del último valor (como `staleTime`).
- `takeUntil` / `takeUntilDestroyed`: unsubscribe automático.
- `combineLatest` / `zip` / `forkJoin`: combinar múltiples streams.

---

## 9. Patrones de comunicación en Micro-Frontends

### postMessage — shell ↔ widget

El canal de comunicación entre el shell y los widgets Web Components.

```tsx
// Widget envía al padre (shell)
window.parent.postMessage({ type: 'widget:data-change', data: formData }, '*');

// Shell escucha de todos los iframes/widgets
window.addEventListener('message', (event) => {
  if (!allowedOrigins.includes(event.origin)) return;
  const { type, data } = event.data;
  if (type === 'widget:data-change') handleDataChange(data);
});
```

Consideraciones de seguridad:
- Siempre validar `event.origin` contra whitelist (nunca usar `'*'` en producción).
- Sanitizar `event.data` antes de usarlo.
- Filtrar mensajes de herramientas del browser (React DevTools emite mensajes con `source: 'react-devtools-*'`).

### Custom Events — comunicación entre componentes sin árbol común

Para widgets en el mismo document (no iframes) sin relación de parentesco:

```tsx
// Emitir
window.dispatchEvent(new CustomEvent('entity:selected', {
  detail: { entityId: '123', type: 'Desktop' },
  bubbles: true,
  composed: true, // atraviesa Shadow DOM boundaries
}));

// Escuchar
window.addEventListener('entity:selected', (e: CustomEvent) => {
  setSelectedEntity(e.detail);
});
```

`composed: true` es necesario para que el evento atraviese Shadow DOM boundaries
(cada Web Component tiene su propio Shadow DOM).

### BroadcastChannel API

Para comunicación entre pestañas del mismo origen sin servidor:

```tsx
const channel = new BroadcastChannel('app-updates');
channel.postMessage({ type: 'entity:updated', id: '123' });
channel.onmessage = (e) => handleUpdate(e.data);
```

Útil para: logout sincronizado entre pestañas, actualización de datos en todas
las vistas abiertas, PWA con múltiples tabs.

### Module Federation (Webpack/Rspack)

Alternativa a Web Components para micro-frontends: los bundles comparten módulos
en tiempo de ejecución. El shell carga componentes React de otros bundles como si
fueran imports normales.

```tsx
// webpack.config.js del shell
new ModuleFederationPlugin({
  remotes: {
    'entities-app': 'entitiesApp@http://localhost:3001/remoteEntry.js',
  }
});

// Uso en shell
const EntitiesList = lazy(() => import('entities-app/EntitiesList'));
```

Ventaja sobre Web Components: los componentes remotos siguen siendo React,
comparten el árbol de contexto, tienen tipado.

---

## 10. Preguntas de entrevista — Estado y Reactividad

¿Cuál es la diferencia entre server state y client state?
> Server state es asíncrono, vive en el servidor y puede quedar obsoleto (stale).
> Client state es síncrono, privado del navegador. TanStack Query gestiona server
> state; useState/Zustand/Redux gestionan client state. Error común: mezclarlos
> en Redux con loading/error/data manuales.

¿Qué es staleTime en React Query y cómo afecta al comportamiento?
> El tiempo que los datos se consideran frescos. Con staleTime: 0, React Query
> refetchea en background al montar o al recuperar el foco. Con staleTime: Infinity,
> nunca refetchea automáticamente; la actualización debe dispararse manualmente
> con invalidateQueries. Se elige según la frecuencia de cambio de los datos.

¿Cuándo usar Zustand vs Redux Toolkit?
> RTK para apps grandes con muchos desarrolladores, donde la disciplina de Actions
> explícitas y el time-travel debugging son valiosos. Zustand para proyectos
> medianos o donde el boilerplate de Redux es un freno. Ambos con TanStack Query
> para server state.

¿Qué son los Signals y cómo difieren del modelo de React?
> Signals son primitivos reactivos que rastrean suscriptores y solo actualizan
> exactamente lo que cambió (fine-grained reactivity). React usa reconciliación
> de componentes: re-renderiza el componente entero y compara Virtual DOMs.
> Angular los adoptó en v17 como alternativa a Observables. React Compiler
> intenta conseguir rendimiento similar sin cambiar el modelo mental.

¿Cómo se comunican los micro-frontends entre sí?
> Opciones: postMessage (universal, funciona entre iframes y windows),
> Custom Events (mismo document), BroadcastChannel (entre pestañas),
> shared state via window (QueryClient compartido), Module Federation
> (imports remotos, comparte contexto React), event bus global.

¿Diferencias entre NgRx y Redux Toolkit?
> Conceptualmente similares (Store, Actions, Reducers, Effects/Thunks, Selectors).
> NgRx usa RxJS: los Effects son streams de Observables con operadores como
> switchMap/mergeMap para cancelación. RTK usa promesas/async-await.
> NgRx integrado con DI de Angular; RTK con el ecosistema React/JS.
> NgRx Signal Store (v17) moderniza con Signals, más similar a Zustand.
