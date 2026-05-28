# Java Moderno — Java 17 a 21 en producción

## Por qué importa Java 21 en 2025

Java 21 es LTS (Long-Term Support) y el más adoptado en proyectos nuevos.
Las novedades no son cosméticas: Virtual Threads cambia el modelo de concurrencia,
Records + Sealed + Pattern Matching permiten modelar dominio con mucho menos código,
y la JVM tiene mejoras sustanciales de GC (ZGC pausas <1ms).

En Agata Next, Java 21 se usa con Spring Boot 3.x, que es la primera versión
que exige Java 17+ y aprovecha completamente estas características.

---

## 1. Records — Data Classes inmutables

Un `record` es una clase inmutable cuyos campos se declaran en el header.
El compilador genera automáticamente: constructor canónico, getters, equals,
hashCode y toString.

```java
public record EventoAcceso(
    String sensorId,
    Instant timestamp,
    TipoAcceso tipo,
    String areaId
) {}

// Uso:
var evento = new EventoAcceso("S-001", Instant.now(), TipoAcceso.ENTRADA, "ZONA-A");
evento.sensorId();   // getter
evento.timestamp();  // getter
```

**Records en arquitectura hexagonal**: ideales para DTOs de entrada/salida de puertos
y para Value Objects del dominio que son inmutables por naturaleza.

```java
// Puerto de entrada — Command Object
public record RegistrarAccesoCommand(String sensorId, Instant timestamp, String areaId) {}

// Value Object del dominio
public record Coordenadas(double latitud, double longitud) {
    public Coordenadas {
        if (latitud < -90 || latitud > 90) throw new IllegalArgumentException("Latitud inválida");
    }
    // Compact constructor para validación
}
```

**Limitaciones**: no pueden extender otras clases (solo implementar interfaces),
son `final` implícitamente, los campos son `private final` siempre.

**Record Patterns** (Java 21): permite desestructurar records en pattern matching:

```java
if (obj instanceof EventoAcceso(var sensorId, var ts, var tipo, var area)) {
    // sensorId, ts, tipo, area ya están extraídas
    log.info("Sensor {} entró en {} a las {}", sensorId, area, ts);
}
```

---

## 2. Sealed Classes — Jerarquías cerradas

Las `sealed` classes declaran explícitamente qué subclases pueden existir.
Permiten al compilador verificar exhaustividad en switch expressions.

```java
public sealed interface ResultadoValidacion
    permits ResultadoOk, ResultadoError, ResultadoPendiente {}

public record ResultadoOk(String entidadId) implements ResultadoValidacion {}
public record ResultadoError(String motivo, List<String> campos) implements ResultadoValidacion {}
public record ResultadoPendiente(Instant reintentoEn) implements ResultadoValidacion {}
```

Con sealed + switch expression, el compilador avisa si no manejas todos los casos:

```java
String mensaje = switch (resultado) {
    case ResultadoOk ok -> "Validado: " + ok.entidadId();
    case ResultadoError err -> "Error en: " + String.join(", ", err.campos());
    case ResultadoPendiente p -> "Reintentar a las " + p.reintentoEn();
    // No hace falta default — el compilador sabe que cubre todos los casos
};
```

**Aplicación práctica**: modelar resultados de operaciones de dominio
(Result/Either types), estados de una máquina de estados, tipos de eventos
en un sistema event-driven. Alternativa más tipada a `enum` cuando los casos
tienen datos distintos.

---

## 3. Pattern Matching — switch, instanceof y guarded patterns

### instanceof con variable de binding (Java 16+)

```java
// Antes:
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.toUpperCase());
}

// Java 16+:
if (obj instanceof String s) {
    System.out.println(s.toUpperCase()); // s ya está tipada
}

// Con guarda:
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s); // solo si es String Y longitud > 5
}
```

### switch expression con pattern matching (Java 21)

```java
String descripcion = switch (evento) {
    case AccesoEvento(var sensor, var ts, TipoAcceso.ENTRADA, var area)
         when area.equals("ZONA-RESTRINGIDA") ->
        "⚠️ Acceso a zona restringida: sensor " + sensor;

    case AccesoEvento(var sensor, var ts, TipoAcceso.ENTRADA, var area) ->
        "Entrada normal: " + sensor + " en " + area;

    case SensorOfflineEvento(var sensor, var razon) ->
        "Sensor offline: " + sensor + " — " + razon;

    case null -> "Evento nulo";
};
```

Las **guarded patterns** (`when`) permiten condiciones adicionales en los casos.
`null` ahora puede ser un caso en switch (antes lanzaba NullPointerException).

---

## 4. Text Blocks (Java 15+)

```java
// Antes:
String json = "{\n  \"tipo\": \"acceso\",\n  \"sensorId\": \"S-001\"\n}";

// Text Block:
String json = """
        {
          "tipo": "acceso",
          "sensorId": "S-001"
        }
        """;

// Con interpolación dinámica (String.formatted):
String payload = """
        {
          "sensorId": "%s",
          "timestamp": "%s"
        }
        """.formatted(sensorId, timestamp);
```

Útil para: queries SQL, JSONs de test, plantillas de mensaje, HTMLs en tests.

---

## 5. Virtual Threads — Project Loom (Java 21)

### El problema que resuelven

La JVM tiene **platform threads** (mapeados 1:1 con threads del OS).
Son caros: ~1MB de stack cada uno, context switch caro.
Con I/O bloqueante, el thread queda parado esperando. Por eso Spring MVC
con un pool de 200 threads se satura fácilmente bajo carga alta.

WebFlux resuelve esto con un modelo reactivo: pocos threads del OS,
operaciones non-blocking. Pero obliga a cambiar el modelo de programación
a Mono/Flux, que es complejo y dificulta el debugging.

**Virtual Threads** (Loom) resuelven el mismo problema **sin cambiar el modelo de programación**:
- Son threads ligeros gestionados por la JVM (no por el OS).
- Coste: ~few KB de stack, millones de VT posibles.
- Cuando un VT hace I/O bloqueante, la JVM lo desmonta del platform thread
  (carrier thread) sin bloquearlo. Otro VT puede ejecutarse en ese carrier thread.
- El código sigue siendo secuencial e imperativo: no hay Mono, no hay callbacks.

```java
// Crear VTs explícitamente:
Thread.ofVirtual().start(() -> {
    var result = jdbcTemplate.queryForObject(...); // bloquea — pero el carrier no
    System.out.println(result);
});

// En Spring Boot 3.2+: una propiedad lo habilita para todo:
spring.threads.virtual.enabled=true
```

Con esto, Spring MVC puede manejar miles de requests concurrentes con código bloqueante
estándar (JDBC, RestTemplate) sin WebFlux.

### Virtual Threads vs WebFlux — cuándo cada uno

| | Virtual Threads | WebFlux |
|-|-----------------|---------|
| Modelo programación | Síncrono/imperativo | Reactivo (Mono/Flux) |
| Curva de aprendizaje | Baja | Alta |
| Debugging | Stack trace normal | Difícil (chains de operators) |
| I/O-bound workloads | Excelente | Excelente |
| CPU-bound | No aporta | No aporta |
| Backpressure | No nativo | Sí |
| Memoria | Mejor que platform threads | Muy bajo |
| Ecosistema | Todo Spring | Spring WebFlux |

**Regla práctica**: nueva app con Spring Boot 3.2+ → Virtual Threads por defecto.
WebFlux solo cuando necesitas backpressure o ya tienes un equipo con experiencia reactiva.

### Pinning — el antipatrón a evitar

Un VT queda "pinned" (no puede desmontarse del carrier) cuando:
- Está dentro de un bloque `synchronized`.
- Llama código nativo (JNI).

El pinning anula la ventaja de los VTs. Solución: usar `ReentrantLock` en lugar
de `synchronized` en código de alta concurrencia con VTs.

JVM opción para detectar: `-Djdk.tracePinnedThreads=full`

### StructuredConcurrency (Java 21 preview)

Nuevo modelo para gestionar tareas concurrentes relacionadas:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<Usuario> usuario = scope.fork(() -> fetchUsuario(id));
    Future<Permisos> permisos = scope.fork(() -> fetchPermisos(id));

    scope.join();           // espera a ambas
    scope.throwIfFailed();  // si una falló, lanza excepción

    return new DashboardData(usuario.resultNow(), permisos.resultNow());
}
// Al salir del try: scope se cierra, cancela cualquier tarea que no terminó
```

Si `fetchPermisos` falla, `scope.throwIfFailed()` cancela `fetchUsuario` automáticamente.
Elimina el problema del "thread leak" que tiene `CompletableFuture`.

---

## 6. Sequenced Collections (Java 21)

Nueva interfaz para colecciones con orden definido:

```java
SequencedCollection<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();  // "a"
list.getLast();   // "c"
list.addFirst("z");
list.addLast("x");
list.reversed();  // vista invertida sin copiar
```

También `SequencedMap`: `firstEntry()`, `lastEntry()`, `reversed()`.

---

## 7. Mejoras de GC — ZGC y G1

**ZGC** (Z Garbage Collector): pausas <1ms independientemente del tamaño del heap.
Ideal para aplicaciones con requisitos de latencia bajos (APIs, microservicios).
Activo con `-XX:+UseZGC`. En Java 21, ZGC generacional mejora el throughput.

**G1GC** (default): equilibrio entre throughput y latencia. Adecuado para la mayoría.

En Spring Boot, para latencia: `-XX:+UseZGC`. Para throughput máximo: G1.

---

## 8. Otras features relevantes de Java 17-21

**String Methods** (Java 11+):
```java
" hello ".strip();    // como trim() pero Unicode-aware
"".isBlank();         // true si vacío o solo whitespace
"a\nb\nc".lines();    // Stream<String>
"*".repeat(10);       // "**********"
```

**Map, List, Set factories inmutables** (Java 9+):
```java
var mapa = Map.of("k1", "v1", "k2", "v2"); // inmutable, no permite null
var lista = List.of(1, 2, 3);
var copia = List.copyOf(existingList); // copia inmutable
```

**Optional mejorado** (Java 9-11):
```java
optional.ifPresentOrElse(v -> process(v), () -> handleEmpty());
optional.stream(); // Stream de 0 o 1 elemento
optional.or(() -> Optional.of(defaultValue));
```

**CompletableFuture** (Java 9+):
```java
CompletableFuture.failedFuture(new RuntimeException("err")); // ya completado con error
cf.orTimeout(5, TimeUnit.SECONDS); // timeout automático
cf.completeOnTimeout(defaultValue, 5, TimeUnit.SECONDS); // timeout con valor por defecto
```

**instanceof pattern en try** (sin casting manual):
```java
try {
    riskyOperation();
} catch (Exception e) {
    if (e instanceof HttpClientErrorException httpEx) {
        log.error("HTTP {}: {}", httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
    }
}
```

---

## 9. Preguntas de entrevista — Java moderno

¿Qué son los Virtual Threads y por qué son importantes?
> Son threads ligeros gestionados por la JVM, no por el OS. El coste es ~KB
> vs ~MB de los platform threads. Cuando hacen I/O bloqueante, la JVM los
> desmonta del carrier thread sin bloquearlo, permitiendo que otro VT use ese
> carrier. Permiten escribir código síncrono/imperativo que escala como WebFlux
> sin la complejidad del modelo reactivo. Con `spring.threads.virtual.enabled=true`
> en Spring Boot 3.2+, todo el servidor los usa.

¿Cuándo usarías Sealed Classes vs Enum?
> Enum cuando los casos no tienen datos distintos (estados, tipos simples).
> Sealed cuando cada variante tiene estructura de datos diferente (ResultadoOk
> con el ID del resultado, ResultadoError con la lista de campos, etc.).
> Sealed + switch expression da exhaustividad en tiempo de compilación.

¿Qué problema tiene `synchronized` con Virtual Threads?
> Causa "pinning": el VT no puede desmontarse del carrier thread mientras
> está en un bloque synchronized, anulando la ventaja de VTs. La solución
> es usar `ReentrantLock`. Detectar con `-Djdk.tracePinnedThreads=full`.

¿Qué es StructuredConcurrency?
> Un nuevo modelo (preview en Java 21) para lanzar tareas concurrentes
> relacionadas en un scope limitado. Al salir del scope, se cancela todo lo
> que no terminó. Evita thread leaks y simplifica el error handling vs
> CompletableFuture, donde un task failure no cancela las otras automáticamente.

¿Records vs Lombok @Value?
> Records son nativos de Java (sin dependencia externa), tienen record patterns
> (desestructuración en switch/instanceof), se entienden por reflection y
> frameworks (Jackson, JPA annotations directas). Lombok @Value genera código
> en compilación, requiere el plugin de IDE, pero permite herencia y campos
> mutables selectivos. Para DTOs/Value Objects nuevos: Records. En proyectos
> con Lombok instalado: ambos son válidos, Records preferidos en Java 16+.
