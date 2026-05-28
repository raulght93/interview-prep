# Spring WebFlux y Project Reactor

## Por qué existe el modelo reactivo

El modelo de threading tradicional (Spring MVC, JDBC) funciona así:
un request entra → un thread del pool se asigna → el thread bloquea
esperando I/O (base de datos, servicio externo) → el thread no hace nada útil
durante ese tiempo → con mucha concurrencia, el pool se agota.

Un pool de 200 threads satura si cada request espera 500ms en BBDD.
Solo puede atender 400 req/s en ese caso (200 threads / 0.5s cada uno).

**Solución clásica**: escalar horizontalmente (más instancias).
**Solución reactiva**: non-blocking I/O con event loop. Pocos threads del OS
gestionan miles de conexiones porque nunca quedan bloqueados esperando.
Cuando el I/O completa, el event loop notifica y el procesamiento continúa.

**Spring WebFlux** es el framework reactive de Spring. Se ejecuta sobre
**Netty** (event loop) o Servlet 3.1+ non-blocking. La base es **Project Reactor**
con `Mono<T>` (0 o 1 elemento) y `Flux<T>` (0 a N elementos).

> **Nota 2024-2025**: Java 21 Virtual Threads ofrecen rendimiento similar
> con código síncrono. La elección entre WebFlux y VTs ya no es obvia.
> WebFlux sigue siendo relevante cuando se necesita backpressure real.

---

## 1. Mono y Flux — Los publishers

**Mono<T>**: publisher que emite 0 o 1 elemento, luego completa o emite error.
Equivalente reactivo de `CompletableFuture<T>` o `Optional<T>` async.

**Flux<T>**: publisher que emite 0 a N elementos, luego completa o emite error.
Equivalente reactivo de `List<T>` o `Stream<T>` async.

```java
// Crear publishers:
Mono<String> mono = Mono.just("hola");
Mono<String> empty = Mono.empty();
Mono<String> error = Mono.error(new RuntimeException("fallo"));

Flux<Integer> flux = Flux.just(1, 2, 3, 4, 5);
Flux<Integer> range = Flux.range(1, 100);
Flux<String> fromList = Flux.fromIterable(List.of("a", "b", "c"));

// Desde código asíncrono:
Mono<Usuario> usuario = Mono.fromCallable(() -> userRepository.findById(id));
    // fromCallable = código potencialmente bloqueante (usar con cuidado — ver sección Schedulers)
```

**Nada ocurre hasta que alguien se suscribe**. Los publishers son lazy (cold):

```java
Mono<String> greeting = Mono.just("hola")
    .doOnNext(s -> System.out.println("Emitiendo: " + s));
// No imprime nada aún

greeting.subscribe(); // Ahora sí: "Emitiendo: hola"
```

---

## 2. Operadores esenciales

### Transformación

```java
// map: transformación síncrona 1:1
Mono<UserDto> dto = userMono.map(u -> new UserDto(u.getId(), u.getName()));

// flatMap: transformación async (devuelve Mono/Flux)
Mono<Order> order = userMono.flatMap(u -> orderRepository.findByUserId(u.getId()));
// flatMap "aplana" el Mono<Mono<Order>> a Mono<Order>

// flatMapMany: de Mono a Flux
Flux<Permission> permissions = userMono.flatMapMany(u -> permissionService.getAll(u.getId()));

// switchMap: como flatMap pero cancela la suscripción anterior
// Útil para búsquedas: si llega nueva petición, cancela la anterior
Flux<Result> results = searchTermFlux.switchMap(term -> search(term));
```

**map vs flatMap**: la diferencia más preguntada.
- `map`: función síncrona `T → R`. La envoltura (`Mono<T>`) no cambia.
- `flatMap`: función que devuelve `Mono<R>`. Se "aplana" para no tener `Mono<Mono<R>>`.
- Regla: si la transformación hace I/O o devuelve Mono/Flux → `flatMap`.

### Filtrado

```java
Flux<Integer> pares = Flux.range(1, 10).filter(n -> n % 2 == 0);

Mono<Usuario> activo = userMono.filter(u -> u.isActive());
// Si el filtro no pasa → Mono.empty()

Mono<Usuario> withDefault = userMono
    .filter(u -> u.isActive())
    .switchIfEmpty(Mono.error(new UserNotActiveException()));
    // switchIfEmpty: qué hacer cuando el Mono está vacío
```

### Valores por defecto y fallback

```java
Mono<String> result = userMono
    .map(User::getName)
    .defaultIfEmpty("Anónimo")           // valor si Mono.empty()
    .switchIfEmpty(Mono.just("Anónimo")) // igual pero devuelve publisher
    .onErrorReturn("Error al cargar")    // valor si hay error
    .onErrorResume(ex -> fallbackMono(ex)); // publisher alternativo en error
```

### Combinación

```java
// zip: combina dos publishers, emite cuando ambos tienen valor
Mono<Tuple2<Usuario, Permisos>> combined =
    Mono.zip(userMono, permissionsMono);

// zipWith: combina con función
Mono<UserProfile> profile = userMono.zipWith(
    permissionsMono,
    (user, perms) -> new UserProfile(user, perms)
);

// merge: combina Flux en paralelo (no garantiza orden)
Flux<Evento> eventos = Flux.merge(sensoresFlux, cctv Flux, accesosFlux);

// concat: combina Flux en secuencia (respeta orden)
Flux<Evento> todos = Flux.concat(eventosHoy, eventosAyer);

// combineLatest: emite cuando cualquiera de los dos actualiza
Flux<Estado> estado = Flux.combineLatest(
    filtroFlux, dataFlux,
    (filtro, data) -> aplicarFiltro(data, filtro)
);
```

### Manejo de errores

```java
Mono<Response> result = callExternalService()
    .onErrorReturn(fallbackResponse)                    // valor fijo en error
    .onErrorResume(ex -> callAlternativeService())      // publisher alternativo
    .onErrorMap(HttpException.class, ex -> new ServiceException(ex.getMessage()))
    // convierte tipo de excepción
    .retry(3)                                           // reintentar 3 veces
    .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))) // con backoff exponencial
    .timeout(Duration.ofSeconds(5));                    // timeout
```

### Efectos secundarios (sin transformar)

```java
Mono<User> withLogging = userMono
    .doOnNext(u -> log.info("Usuario encontrado: {}", u.getId()))
    .doOnError(ex -> log.error("Error buscando usuario", ex))
    .doOnComplete(() -> log.info("Completado"))
    .doFinally(signal -> log.info("Signal: {}", signal)); // siempre, con el tipo de señal
```

---

## 3. Schedulers — Threading en Reactor

Por defecto, el trabajo ocurre en el thread que hace la suscripción.
Los Schedulers controlan en qué thread pool se ejecuta cada operación.

```java
// Tipos de schedulers:
Schedulers.boundedElastic() // pool elástico para I/O bloqueante (JDBC, llamadas bloqueantes)
Schedulers.parallel()       // pool fijo (CPU * 2) para CPU-intensive
Schedulers.single()         // un único thread (serialización)
Schedulers.immediate()      // el thread actual
```

**publishOn** vs **subscribeOn**:

```java
// publishOn: cambia el thread para los operadores DESPUÉS de él
Flux.just(1, 2, 3)
    .map(n -> n * 2)           // ejecuta en thread original
    .publishOn(Schedulers.parallel())
    .map(n -> heavyCpuWork(n)) // ejecuta en parallel pool
    .subscribe(System.out::println); // ejecuta en parallel pool

// subscribeOn: cambia el thread desde el inicio (afecta al source)
Mono.fromCallable(() -> blockingDbCall())
    .subscribeOn(Schedulers.boundedElastic()); // el fromCallable corre aquí
```

**Regla de oro**: **nunca bloquear en el event loop**. Si necesitas código bloqueante
(JDBC, Hibernate, llamada bloqueante), envuélvelo:

```java
// ❌ MAL — bloquea el event loop
Mono<User> bad = Mono.just(userRepository.findById(id)); // findById bloquea

// ✅ BIEN — mueve el bloqueo a boundedElastic
Mono<User> good = Mono.fromCallable(() -> userRepository.findById(id))
    .subscribeOn(Schedulers.boundedElastic());
```

---

## 4. Backpressure

Backpressure es el mecanismo por el cual el consumidor señala al productor
la velocidad a la que puede procesar datos. Evita que el productor sature al consumidor.

```java
Flux.range(1, 1_000_000)
    .onBackpressureBuffer(100) // buffer de 100 elementos
    .onBackpressureDrop()      // descarta si el consumer no puede seguir
    .onBackpressureLatest()    // solo el último valor si hay overflow
    .subscribe(
        data -> process(data),
        error -> log.error("Error", error),
        () -> log.info("Completado"),
        sub -> sub.request(10) // el consumer pide solo 10 a la vez
    );
```

En la práctica, backpressure se gestiona automáticamente en la mayoría de casos
(WebFlux + R2DBC, WebFlux + Kafka). Para código custom, usar `FluxSink` o `Sinks`.

---

## 5. WebFlux — Controllers y WebClient

### Anotation-based (idéntico a MVC)

```java
@RestController
@RequestMapping("/api/entities")
public class EntityController {

    @GetMapping
    public Flux<EntityDto> getAll() {
        return entityService.findAll(); // devuelve Flux
    }

    @GetMapping("/{id}")
    public Mono<EntityDto> getById(@PathVariable String id) {
        return entityService.findById(id)
            .switchIfEmpty(Mono.error(new EntityNotFoundException(id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<EntityDto> create(@RequestBody Mono<CreateEntityRequest> request) {
        return request.flatMap(entityService::create);
    }
}
```

### WebClient — cliente HTTP reactivo

```java
@Service
public class ExternalServiceClient {

    private final WebClient webClient;

    public ExternalServiceClient(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("https://external-api.example.com")
            .defaultHeader("X-API-KEY", "secret")
            .build();
    }

    public Mono<ExternalResponse> getData(String id) {
        return webClient.get()
            .uri("/data/{id}", id)
            .retrieve()
            .onStatus(status -> status.is4xxClientError(),
                resp -> resp.bodyToMono(ErrorBody.class)
                    .flatMap(body -> Mono.error(new ClientException(body.message()))))
            .onStatus(HttpStatusCode::is5xxServerError,
                resp -> Mono.error(new ServiceUnavailableException()))
            .bodyToMono(ExternalResponse.class)
            .retryWhen(Retry.backoff(3, Duration.ofMillis(500)))
            .timeout(Duration.ofSeconds(10));
    }
}
```

---

## 6. R2DBC — Base de datos reactiva

R2DBC (Reactive Relational Database Connectivity) es la alternativa reactiva a JDBC.
Las operaciones de BBDD devuelven `Mono`/`Flux` en lugar de bloquear.

```java
public interface UserRepository extends ReactiveCrudRepository<User, String> {
    Flux<User> findByActiveTrue();
    Mono<User> findByUsername(String username);
}

@Service
public class UserService {
    public Mono<UserDto> createUser(CreateUserCommand cmd) {
        return userRepository.findByUsername(cmd.username())
            .flatMap(existing -> Mono.error(new UserAlreadyExistsException()))
            .switchIfEmpty(Mono.defer(() -> {
                var user = new User(cmd.username(), cmd.email());
                return userRepository.save(user);
            }))
            .map(userMapper::toDto);
    }
}
```

**Transacciones reactivas**: `@Transactional` funciona con R2DBC via
`ReactiveTransactionManager`.

---

## 7. Spring MVC vs WebFlux — cuándo cada uno (2025)

| Criterio | Spring MVC + VTs | Spring WebFlux |
|----------|-----------------|----------------|
| Modelo mental | Síncrono | Reactivo (Mono/Flux) |
| I/O-bound | Excelente con VTs | Excelente |
| Backpressure | No | Sí |
| Ecosistema | JDBC, Hibernate, todo | R2DBC, reactive drivers |
| Debugging | Stack traces normales | Difícil (project reactor stacktrace agent) |
| Testing | JUnit normal | StepVerifier |
| Equipo | Todo el mundo | Curva de aprendizaje |
| Librería externa bloqueante | OK | Problema (subscribeOn) |

**Recomendación actual**: Spring MVC + Virtual Threads para apps nuevas,
a menos que haya un requisito explícito de backpressure o se integre con
un ecosistema 100% reactivo (R2DBC, Kafka reactive, etc.).

WebFlux sigue siendo la elección correcta para: gateways, proxies de alta
concurrencia, streaming de datos real-time (Server-Sent Events, WebSockets),
y cuando ya tienes un equipo con experiencia reactiva.

---

## 8. Testing con StepVerifier

Para testear publishers Reactor:

```java
@Test
void shouldReturnUserDto() {
    // Given
    when(userRepository.findById("123")).thenReturn(Mono.just(existingUser));

    // When
    Mono<UserDto> result = userService.findById("123");

    // Then
    StepVerifier.create(result)
        .expectNextMatches(dto -> dto.id().equals("123") && dto.name().equals("Alice"))
        .verifyComplete();
}

@Test
void shouldReturnFluxOfUsers() {
    when(userRepository.findAll()).thenReturn(Flux.just(user1, user2, user3));

    StepVerifier.create(userService.findAll())
        .expectNextCount(3)
        .verifyComplete();
}

@Test
void shouldHandleError() {
    when(userRepository.findById("999")).thenReturn(Mono.empty());

    StepVerifier.create(userService.findById("999"))
        .expectError(UserNotFoundException.class)
        .verify();
}

// Con tiempo virtual (evitar sleeps en tests):
@Test
void shouldRetryOnError() {
    StepVerifier.withVirtualTime(() -> fluxWithRetry)
        .thenAwait(Duration.ofSeconds(3)) // avanza el tiempo virtual
        .expectNext("result")
        .verifyComplete();
}
```

---

## 9. Preguntas de entrevista — WebFlux y Reactor

¿Cuál es la diferencia entre `map` y `flatMap` en Reactor?
> `map` aplica una función síncrona T→R y devuelve `Mono<R>` o `Flux<R>`.
> `flatMap` aplica una función T→`Mono<R>` o T→`Flux<R>` y "aplana" el resultado.
> Si la transformación hace I/O (llamada a BBDD, servicio externo) devuelve
> un Mono/Flux → usar `flatMap`. Si es una transformación en memoria → `map`.

¿Qué pasa si bloqueas en un flujo reactivo?
> El thread del event loop queda bloqueado, impidiendo que procese otros requests.
> Con Netty (4 threads por CPU), bloquear un thread durante 500ms puede reducir
> el throughput en un 25%. Solución: `fromCallable(...).subscribeOn(Schedulers.boundedElastic())`.

¿Cuándo elegirías WebFlux sobre Spring MVC + Virtual Threads?
> Cuando necesitas backpressure real (el consumer controla la velocidad del producer),
> cuando el ecosistema es completamente reactivo (R2DBC, reactive Kafka, etc.),
> o cuando hay streaming real-time (SSE, WebSockets de alta concurrencia).
> En apps típicas CRUD, VTs + MVC son equivalentes en rendimiento con menos complejidad.

¿Qué es la diferencia entre `publishOn` y `subscribeOn`?
> `subscribeOn` afecta en qué thread se ejecuta el source (el publisher inicial).
> `publishOn` cambia el thread para todos los operadores que vienen DESPUÉS.
> Para código bloqueante en el source: `subscribeOn(boundedElastic)`.
> Para CPU-intensive en el medio del pipeline: `publishOn(parallel)`.

¿Cómo se testea un Mono o Flux?
> Con `StepVerifier` de `reactor-test`. Define una suscripción síncrona que
> verifica paso a paso las emisiones: `expectNext`, `expectNextCount`,
> `expectError`, `verifyComplete`. Para operaciones con tiempo, `withVirtualTime`
> permite avanzar el reloj sin sleeps reales.
