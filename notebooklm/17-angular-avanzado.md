# Angular Avanzado — Core, Reactividad y Patrones

## Stack real del proyecto

En Agata, Angular se usó en los proyectos de Dimática (NgRx reactivo) y mercado
mayorista (Angular 15). El stack típico: Angular + NgRx + RxJS + Angular Material
o PrimeNG. Este documento cubre el core de Angular que se pregunta en entrevistas.

---

## 1. Arquitectura de Angular

Angular es un framework opinionado con:
- **Módulos** (NgModule, legacy) o **Standalone Components** (Angular 17+).
- **Dependency Injection** jerarquizado.
- **Change Detection** con Zone.js o Signals.
- **Router** con lazy loading, guards y resolvers.
- **Forms**: Template-driven y Reactive Forms.
- **HTTP**: `HttpClient` con interceptors.

---

## 2. Lifecycle Hooks

El orden de ejecución importa y es pregunta frecuente:

```
constructor()          ← DI. No hacer nada pesado aquí.
ngOnChanges()          ← Se llama cuando cambia un @Input. Antes de ngOnInit.
ngOnInit()             ← Inicialización del componente. Aquí van las subscripciones y fetch.
ngDoCheck()            ← Cada ciclo de detección de cambios. Caro — evitar.
ngAfterContentInit()   ← Después de proyectar <ng-content>.
ngAfterContentChecked()
ngAfterViewInit()      ← DOM disponible. Aquí se accede a @ViewChild.
ngAfterViewChecked()
ngOnDestroy()          ← Limpiar subscripciones, timers, event listeners.
```

### constructor vs ngOnInit

**constructor**: solo inyección de dependencias. No hacer llamadas HTTP,
no acceder a `@Input` (aún no están seteados), no interactuar con el DOM.

**ngOnInit**: aquí va la lógica de inicialización. Los `@Input` ya están disponibles.

```typescript
@Component({ selector: 'app-sensor-detail', template: '...' })
export class SensorDetailComponent implements OnInit, OnDestroy {
    @Input() sensorId!: string;
    sensor$!: Observable<Sensor>;
    private destroy$ = new Subject<void>();

    constructor(private sensorService: SensorService) {} // solo DI

    ngOnInit() {
        // @Input ya disponible aquí
        this.sensor$ = this.sensorService.getById(this.sensorId).pipe(
            takeUntil(this.destroy$)
        );
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete(); // limpia subscripciones
    }
}
```

---

## 3. Change Detection — Default vs OnPush

### Default

Angular verifica TODOS los componentes del árbol en cada evento (click, timer,
HTTP response). Zone.js intercepta las fuentes de cambio y dispara la detección.
Simple pero puede ser lento con muchos componentes.

### OnPush

Angular solo verifica el componente cuando:
1. Una referencia de `@Input` cambia (no el contenido del objeto — la referencia).
2. Un evento del propio componente o sus hijos.
3. Un Observable al que está suscrito emite (con `async` pipe).
4. Se llama `markForCheck()` o `detectChanges()` manualmente.

```typescript
@Component({
    selector: 'app-sensor-card',
    template: '...',
    changeDetection: ChangeDetectionStrategy.OnPush // ← clave
})
export class SensorCardComponent {
    @Input() sensor!: Sensor; // debe ser objeto nuevo, no mutación
}
```

**Regla para OnPush**: los objetos deben ser inmutables. Pasar `{ ...sensor, status: 'active' }`
en lugar de mutar `sensor.status = 'active'`. NgRx + OnPush es la combinación estándar
porque el store nunca muta el estado (siempre devuelve objetos nuevos).

### ChangeDetectorRef

Para control manual:

```typescript
constructor(private cdr: ChangeDetectorRef) {}

// Marca para verificar en el próximo ciclo:
this.cdr.markForCheck();

// Verifica inmediatamente (síncrono):
this.cdr.detectChanges();

// Desconectar del árbol de CD (muy agresivo, raro):
this.cdr.detach();
```

---

## 4. Dependency Injection

Angular tiene un sistema de DI jerárquico con tres niveles de injector:
- **Root** (`providedIn: 'root'`): singleton global. Un único instancia para toda la app.
- **Module** (`providers: [...]` en NgModule o `@Component`): instancia por módulo/componente.
- **Platform**: nivel más alto, compartido entre apps en la misma página.

```typescript
// Singleton global (más común):
@Injectable({ providedIn: 'root' })
export class SensorService { /* ... */ }

// Por componente (instancia propia + destruida con el componente):
@Component({
    selector: 'app-sensor-list',
    providers: [SensorListStateService] // instancia propia
})
export class SensorListComponent { /* ... */ }
```

### Tokens e interfaces

```typescript
// Token para inyectar valores no-clase:
export const API_URL = new InjectionToken<string>('API_URL');

// En providers:
{ provide: API_URL, useValue: environment.apiUrl }
{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }

// Inyectar:
constructor(@Inject(API_URL) private apiUrl: string) {}
```

### inject() function (Angular 14+)

```typescript
// Fuera del constructor (más flexible, usable en funciones):
const router = inject(Router);
const apiUrl = inject(API_URL);

// En guards modernos:
export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.isAuthenticated() || router.createUrlTree(['/login']);
};
```

---

## 5. Routing — Lazy Loading, Guards y Resolvers

### Configuración moderna (standalone)

```typescript
export const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    {
        path: 'sensores',
        canActivate: [authGuard],
        loadChildren: () => import('./sensores/sensores.routes').then(m => m.SENSOR_ROUTES)
    },
    {
        path: 'sensor/:id',
        resolve: { sensor: sensorResolver },
        component: SensorDetailComponent
    },
    { path: '**', component: NotFoundComponent }
];
```

**Lazy loading**: `loadChildren` con dynamic import. El bundle del módulo solo
se descarga cuando el usuario navega a esa ruta.

### Guards

```typescript
// Guard funcional (Angular 14+, recomendado):
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) return true;
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Guard para evitar perder cambios no guardados:
export const unsavedChangesGuard: CanDeactivateFn<FormComponent> = (component) => {
    if (component.hasUnsavedChanges()) {
        return confirm('¿Salir sin guardar?');
    }
    return true;
};
```

### Resolvers

Precarga datos antes de activar la ruta (el componente no monta hasta que el resolver resuelve):

```typescript
export const sensorResolver: ResolveFn<Sensor> = (route) => {
    const sensorService = inject(SensorService);
    const id = route.paramMap.get('id')!;
    return sensorService.getById(id).pipe(
        catchError(() => EMPTY) // si falla, no navega
    );
};

// En el componente:
export class SensorDetailComponent implements OnInit {
    sensor!: Sensor;
    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.sensor = this.route.snapshot.data['sensor'];
    }
}
```

---

## 6. Reactive Forms

El modelo basado en código (no en la plantilla):

```typescript
@Component({ /* ... */ })
export class SensorFormComponent implements OnInit {
    form!: FormGroup;

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.form = this.fb.group({
            sensorId: ['', [Validators.required, Validators.pattern(/^S-\d{3}$/)]], // validators síncronos
            zona: ['', Validators.required],
            descripcion: ['', [Validators.maxLength(200)]],
            activo: [true],
            coordenadas: this.fb.group({
                latitud: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
                longitud: [null, Validators.required]
            })
        });
    }

    get sensorIdControl() { return this.form.get('sensorId')!; }

    onSubmit() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        const sensor = this.form.getRawValue() as CreateSensorRequest;
        this.sensorService.create(sensor).subscribe();
    }
}
```

### Validators asíncronos (comprobación en servidor)

```typescript
export function uniqueSensorIdValidator(sensorService: SensorService): AsyncValidatorFn {
    return (control) => {
        return timer(400).pipe( // debounce
            switchMap(() => sensorService.existsById(control.value)),
            map(exists => exists ? { sensorIdTaken: true } : null),
            catchError(() => of(null)) // si el API falla, no bloquear
        );
    };
}
```

### Escuchar cambios reactivamente

```typescript
ngOnInit() {
    // Reaccionar a cambios de un campo:
    this.form.get('zona')!.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(zona => this.zonaService.getPermisos(zona)),
        takeUntilDestroyed(this.destroyRef)
    ).subscribe(permisos => this.permisosSugeridos = permisos);
}
```

---

## 7. HTTP Interceptors

Los interceptors procesan cada request HTTP. Casos de uso: auth header,
logging, error handling global, retry automático.

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (!token) return next(req);

    const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

    return next(authReq).pipe(
        catchError(error => {
            if (error.status === 401) {
                // Token expirado: refrescar y reintentar
                return authService.refreshToken().pipe(
                    switchMap(newToken => {
                        const retryReq = req.clone({
                            headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                        });
                        return next(retryReq);
                    }),
                    catchError(() => {
                        authService.logout();
                        return throwError(() => error);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};

// Registrar en appConfig:
export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))
    ]
};
```

---

## 8. RxJS en Angular — Patrones y antipatrones

### takeUntilDestroyed (Angular 16+)

Reemplaza al patrón `destroy$ + takeUntil`:

```typescript
private destroyRef = inject(DestroyRef);

ngOnInit() {
    this.data$.pipe(
        takeUntilDestroyed(this.destroyRef) // se unsuscribe automáticamente
    ).subscribe(data => this.data = data);
}
```

### async pipe — el más seguro

```html
<!-- Gestiona subscribe + unsubscribe automáticamente -->
<div *ngIf="sensor$ | async as sensor">
    <h2>{{ sensor.name }}</h2>
    <span [class.online]="sensor.active">{{ sensor.status }}</span>
</div>

<!-- Con OnPush: solo re-renderiza cuando sensor$ emite -->
```

### Antipatrones comunes

```typescript
// ❌ MAL — suscripción sin cleanup
ngOnInit() {
    this.service.getData().subscribe(data => this.data = data);
    // Memory leak si el componente se destruye
}

// ❌ MAL — subscribe dentro de subscribe
this.userService.getUser().subscribe(user => {
    this.orderService.getOrders(user.id).subscribe(orders => {
        this.orders = orders; // callback hell
    });
});

// ✅ BIEN — flatMap/switchMap y takeUntilDestroyed
this.userService.getUser().pipe(
    switchMap(user => this.orderService.getOrders(user.id)),
    takeUntilDestroyed(this.destroyRef)
).subscribe(orders => this.orders = orders);
```

---

## 9. Standalone Components (Angular 17+)

Elimina la necesidad de NgModule:

```typescript
@Component({
    selector: 'app-sensor-card',
    standalone: true,
    imports: [CommonModule, RouterLink, AsyncPipe], // imports directos
    template: `
        <div>{{ sensor.name }}</div>
        <a [routerLink]="['/sensors', sensor.id]">Ver detalle</a>
    `
})
export class SensorCardComponent {
    @Input() sensor!: Sensor;
}
```

Las apps nuevas en Angular 17+ son standalone por defecto.

---

## 10. Signals en Angular (Angular 17+)

```typescript
@Component({
    selector: 'app-counter',
    standalone: true,
    template: `
        <button (click)="increment()">{{ count() }}</button>
        <p>Doble: {{ doubled() }}</p>
    `
})
export class CounterComponent {
    count = signal(0);
    doubled = computed(() => this.count() * 2);

    increment() { this.count.update(v => v + 1); }
}
```

Con Signals, la Change Detection solo actualiza los bindings que dependen
del signal que cambió. No necesita OnPush.

---

## 11. Preguntas de entrevista — Angular

¿Cuál es la diferencia entre ngOnInit y constructor?
> Constructor: solo DI, no tocar lógica de negocio ni `@Input`. ngOnInit:
> los `@Input` ya están disponibles, hacer fetch, suscripciones, inicialización.
> Además, el constructor puede ejecutarse en contextos donde el DOM no existe.

¿Qué es OnPush y cuándo usarlo?
> Estrategia de change detection que solo verifica el componente cuando cambia
> una referencia de @Input, hay un evento local, o el async pipe emite. Mejora
> el rendimiento con muchos componentes. Requiere objetos inmutables: en lugar
> de mutar, crear objetos nuevos. NgRx + OnPush es la combinación estándar.

¿Cómo evitas memory leaks en Angular?
> Opciones: `takeUntilDestroyed(destroyRef)` (Angular 16+), `async pipe` en
> la plantilla (gestiona el ciclo automáticamente), o el patrón clásico
> `destroy$ = new Subject<void>()` + `takeUntil(this.destroy$)` + `ngOnDestroy`.
> El async pipe es el más seguro porque no requiere código manual.

¿Cómo funciona el lazy loading de módulos?
> Con `loadChildren` en el router usando dynamic import. El bundle del módulo
> o conjunto de rutas solo se descarga cuando el usuario navega a esa ruta.
> Reduce el bundle inicial. Se combina con `canMatch` o `canActivate` para
> proteger rutas.

¿Qué es providedIn: 'root' vs providers en el componente?
> `providedIn: 'root'`: singleton global, una única instancia para toda la app,
> tree-shakeable (si no se usa, no va al bundle). `providers` en el componente:
> una instancia nueva por cada instancia del componente, se destruye con él.
> Útil para servicios de estado local del componente.
