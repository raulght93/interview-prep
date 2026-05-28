# Java · Spring · Testing

> Fuente de estudio: teoría, chuletas y flashcards de Java, Spring Boot y Testing.

## Teoría

### JAVA

Java funcional y moderno. Los streams son una vista perezosa sobre una colección: encadenas operaciones intermedias (filter, map, flatMap, sorted) que no se ejecutan hasta una operación terminal (collect, forEach, reduce). La diferencia importante entre map y flatMap es la dimensionalidad: map transforma 1→1, flatMap aplana Stream<Stream<T>> en Stream<T> — útil cuando cada elemento se expande en varios.

Una interfaz funcional tiene exactamente un método abstracto y por eso aceptas lambdas donde se espera (Function, Predicate, Consumer, Supplier, Comparator). Las clases abstractas llevan estado y lógica compartida, pero solo herencia simple; usa interfaz para contratos entre clases no relacionadas, abstracta para una jerarquía con código común. Records (J16+) son clases inmutables con equals/hashCode generados — ideales como DTOs, value objects de DDD y mensajes thread-safe por construcción.

Java moderno (21/25) trae virtual threads (Loom): millones de hilos ligeros gestionados por la JVM, ideales para servidores I/O-bound que vuelven a escribir código bloqueante normal. Pattern matching + sealed types + switch expressions modelan jerarquías cerradas con comprobación de exhaustividad en compilación. Sequenced collections uniforman first/last en colecciones ordenadas. Structured concurrency y scoped values suceden a ThreadLocal para propagar contexto de forma segura con Loom.

Thread safety se consigue por (en orden de preferencia): inmutabilidad (records), estructuras concurrentes (ConcurrentHashMap), atomics (CAS), sincronización clásica (synchronized/locks), confinamiento. Nunca asumas que algo es thread-safe; HashMap, ArrayList y SimpleDateFormat no lo son.

### SPRING

Spring Boot es Spring con autoconfiguración y starters: añades spring-boot-starter-web, define endpoints y arranca un servidor embebido. Los @Controller devuelven nombres de vista resueltos por un ViewResolver; los @RestController añaden @ResponseBody a todo y serializan al body (JSON con Jackson por defecto). En APIs REST puras se usa el segundo; en aplicaciones con vistas, el primero.

Transacciones. @Transactional envuelve el método en una transacción gestionada por un PlatformTransactionManager mediante proxy AOP. Por defecto hace rollback ante excepciones unchecked; las checked no lo disparan, salvo rollbackFor. La trampa más común es self-invocation: si llamas this.metodo() desde otro método del mismo bean, el proxy no intercepta y la anotación se ignora; la transacción debe entrar desde fuera del bean. La propagación controla la composición: REQUIRED (default) se une o crea, REQUIRES_NEW suspende y abre otra independiente, NESTED usa savepoints. Para transacciones cruzando dos BD, lo moderno es saga + outbox en vez de XA/2PC.

AOP (programación orientada a aspectos). Separa las preocupaciones transversales (logging, métricas, seguridad, transacciones, caché) de la lógica de negocio. Se compone de un aspecto (@Aspect), un advice (@Around, @Before, @After) y un pointcut (@Pointcut, dónde se aplica). El propio @Transactional y @Cacheable son AOP — de ahí la trampa del self-invocation con proxies. Para no penalizar rendimiento: pointcut afinado, advice ligero, asíncrono donde el efecto no sea crítico.

MapStruct genera mappers en tiempo de compilación: sin reflexión, type-safe y rápidos. Es la pieza clave en hexagonal para traducir entre dominios y DTOs (REST/Kafka) sin contaminar el dominio.

## Chuletas (puntos clave)

### JAVA

- map: 1→1 · flatMap: aplana Stream<Stream<T>>→Stream<T> · collect: terminal, materializa (Collectors).
- Interfaz funcional = 1 método abstracto → lambdas (Function/Predicate/Consumer/Supplier).
- Interfaz: contrato, multi-herencia, sin estado · Abstracta: estado + lógica común, herencia simple.
- No se instancia una abstracta. Optional para ausencia. record = inmutable → thread-safe.

### SPRING

- @RestController = @Controller + @ResponseBody. ViewResolver: nombre de vista → View (no en REST).
- Query nativa: @Query(nativeQuery=true). Spring Batch: Job→Step→reader/processor/writer.
- @Transactional: rollback por unchecked (no checked → rollbackFor). Self-invocation NO aplica (proxy).
- Sin @Transactional: TransactionTemplate / PlatformTransactionManager / wrapper bean.
- AOP = cross-cutting (logging, seguridad, tx). @Pointcut afinado para no penalizar. MapStruct: mapper en compilación, sin reflexión.

### TEST

- TDD: red → green → refactor (técnica de diseño). Mock (falso, tú defines) vs Spy (real, stub parcial).
- @Mock (test, sin Spring) vs @MockBean (en el contexto, integración).
- Unit (aislado, mocks) vs integración (infra real, Testcontainers). Pirámide: muchos unit, pocos E2E.
- Carga: JMeter/Gatling/k6; throughput + p95/p99 (no la media).
- SOLID: SRP, Open/Closed, Liskov, Interface Segregation, Dependency Inversion. FIRST + Given/When/Then.
- WireMock = stub de APIs externas. Mockear solo bordes, nunca dominio/mappers.

## Flashcards: Java + Spring + Testing

### JAVA (17 preguntas)

**Pregunta 1:** ¿Cuál es la diferencia entre stream, map y flatMap?

**Respuesta:** - stream() convierte una colección en un Stream<T> para operaciones funcionales encadenadas (intermedias + terminal).
- map(Function<T,R>) transforma cada elemento: Stream<T> → Stream<R> (1 a 1).
- flatMap(Function<T, Stream<R>>) transforma cada elemento en un Stream y los aplana: Stream<List<R>> → Stream<R>.

[ver código en la app]

[ver código en la app]

💡 Tip: map es 1→1; flatMap es 1→N (y aplana). Si el resultado de map fuera Stream<Stream<X>>, usa flatMap en su lugar.

---

**Pregunta 2:** Después de aplicar un map o flatMap, ¿aplicarías un collect? ¿Para qué sirve collect?

**Respuesta:** Sí, si quieres materializar el resultado en una colección. collect es una operación terminal que consume el stream y lo convierte en una estructura.

[ver código en la app]

Regla: una operación intermedia devuelve Stream<T>; una terminal devuelve otra cosa (o void). Sin terminal, el pipeline nunca ejecuta.

En Agata Next: repository.findAll().stream().filter(...).collect(Collectors.toUnmodifiableList()) en puertos de salida del dominio.

---

**Pregunta 3:** ¿Qué te da una interfaz funcional que no te da una interfaz normal?

**Respuesta:** Una interfaz funcional tiene exactamente un método abstracto (SAM — Single Abstract Method). Puede tener métodos default/static.

[ver código en la app]

En Agata Next: se usan Function<DomainEvent, Mono<Void>> como handlers en los puertos de entrada reactivos de los conectores.

---

**Pregunta 4:** ¿Qué es una interfaz? ¿Se extiende o se implementa?

**Respuesta:** [ver código en la app]

Regla: usa interface para el puerto del dominio (UserRepository); usa clase abstracta cuando varias implementaciones comparten código base (plantilla).

[ver código en la app]

---

**Pregunta 5:** ¿Qué diferencia hay entre una interfaz y una clase abstracta? ¿Cuándo usarías cada una?

**Respuesta:** Interfaz: contrato puro (con defaults), sin estado de instancia, multi-herencia, todos los métodos públicos.
Clase abstracta: puede tener estado (campos), constructores, métodos protegidos/privados, lógica compartida; herencia simple.

[ver código en la app]

[ver código en la app]

Regla: en Java moderno, si no hay estado ni jerarquía natural, prefiere interfaz (incluso con métodos default). Las clases abstractas tienen su lugar cuando hay un template method real con estado compartido.

---

**Pregunta 6:** ¿Se puede instanciar directamente una clase abstracta?

**Respuesta:** No. Una clase abstracta no se puede instanciar directamente. Solo puedes instanciar una subclase concreta que implemente todos sus métodos abstractos.

[ver código en la app]

Excepción aparente: clases anónimas — new Animal() { String sonido() { return "miau"; } } — en realidad crean una subclase anónima, no instancian Animal.

En Agata Next: la AbstractConnectorService centraliza retry + tracing; los conectores la extienden e implementan el método abstracto process(Event).

---

**Pregunta 7:** ¿Para qué sirve Optional y cómo se usa bien?

**Respuesta:** Optional<T> es un contenedor que puede tener un valor o estar vacío; comunica explícitamente que un resultado puede no existir y evita NPEs. Bien usado:
[ver código en la app]
Antipatrones: optional.get() sin comprobar (= NPE disfrazado), usarlo como campo de entidad o parámetro de método, o Optional<List> (devuelve lista vacía mejor). Su sitio natural es el tipo de retorno de métodos que pueden no encontrar nada.

---

**Pregunta 8:** ¿Qué es un record y por qué ayuda con la inmutabilidad y el thread safety?

**Respuesta:** Un record (Java 16+) es una clase inmutable y transparente: declaras los campos en la cabecera y el compilador genera constructor canónico, getters, equals, hashCode y toString.

[ver código en la app]

Cuándo usarlo: DTOs, value objects del dominio (ConectorId, EventKey). No usarlo cuando necesites mutabilidad o herencia (records son final).

En Agata Next: los value objects del dominio (ConectorId, TopicPartition) se modelan como records.

---

**Pregunta 9:** ¿Cómo imprimirías de forma ordenada un Map usando streams en Java?

**Respuesta:** Sobre el entrySet():
[ver código en la app]
Orden inverso: .sorted(Map.Entry.<K,V>comparingByValue().reversed()).

Si quieres conservar el orden en un mapa nuevo, recoge en un LinkedHashMap (un HashMap no garantiza orden):
[ver código en la app]

---

**Pregunta 10:** ¿Qué son los virtual threads (Java 21+) y cuándo los usarías?

**Respuesta:** Hilos gestionados por la JVM (Project Loom, GA en Java 21), no por el SO. Son ligerísimos: puedes crear millones; cuando uno hace I/O (esperar BD, HTTP, sleep…) la JVM lo desmonta del platform thread (que queda libre para otro), y lo remonta al volver la respuesta.

Uso típico: servidores thread-per-request que antes no escalaban con muchos clientes I/O-bound (BD lenta, llamadas a otros servicios) ahora escalan a millones de peticiones simultáneas escribiendo código bloqueante normal (sin reactivo).
[ver código en la app]
NO sirven para CPU-bound (igual de pesados). Y siguen sufriendo pinning si entras en synchronized con I/O dentro (usa ReentrantLock o evítalo) — Java 24+ lo arregla.

---

**Pregunta 11:** ¿Qué aportan pattern matching, sealed types y switch expressions?

**Respuesta:** Diseño expresivo y seguro en tiempo de compilación:
- Switch expressions (Java 14+): var x = switch (e) { case A -> 1; case B -> 2; } — devuelve valor, sin fallthrough accidental, obliga a cubrir casos (exhaustividad).
- Pattern matching (Java 16+ instanceof, 21+ switch): if (obj instanceof Comic c && c.estado() == PUBLICADO) o case Comic c when c.idioma() == ES -> ....
- Sealed types (Java 17+): sealed interface Pago permits TarjetaPago, Transferencia, Paypal {} limita las implementaciones; el compilador puede comprobar exhaustividad en switch.
- Records (Java 16+) + deconstrucción en pattern matching: case Punto(int x, int y) -> ....

Juntos sustituyen mucha herencia/visitor por código declarativo: el dominio modelado con sealed + record + pattern matching es seguro, breve y refactorable.

---

**Pregunta 12:** ¿Qué son sequenced collections, structured concurrency y scoped values?

**Respuesta:** - Sequenced collections (Java 21): interfaces SequencedCollection, SequencedSet, SequencedMap con métodos uniformes para primer/último (getFirst, getLast, reversed()). Antes había que recordar list.get(list.size()-1), linkedHashMap.entrySet().iterator()... Ahora es uniforme.
- Structured concurrency (Java 21 preview, evoluciona en 22+): StructuredTaskScope agrupa tareas concurrentes en un scope; si una falla, cancela las demás; espera a todas o a la primera con éxito. Sustituye a malabares con CompletableFuture.allOf/anyOf cuando lanzas varias subtareas dentro de una operación.
- Scoped values (preview): alternativa inmutable a ThreadLocal que funciona bien con virtual threads (que se desmontan/remontan); pasas contexto (user, traceId) sin pasarlo por parámetros, pero sin las pegas de ThreadLocal (fugas de memoria, herencia rota).

---

**Pregunta 13:** ¿Qué versión LTS de Java es la más actual y qué trae?

**Respuesta:** Java 25 (septiembre 2025) es el LTS más reciente tras Java 21 (sept 2023). Consolida features previas y añade mejoras prácticas:
- Virtual threads maduros (sin pinning de synchronized desde 24).
- Structured concurrency y scoped values estabilizadas/refinadas.
- Pattern matching ampliado (deconstrucción, sealed exhaustividad).
- Generational ZGC mejorado (pausas sub-milisegundo en heaps enormes).
- Statements before super(...) (Java 25): inicializar antes de llamar al constructor padre.
- Compact source files y otras simplificaciones para principiantes.

Para producción: J21 sigue siendo el LTS conservador (Agata usa J21); J25 si el equipo quiere lo último estable. Entre LTS hay versiones "normales" cada 6 meses (22, 23, 24) que adelantan features.

---

**Pregunta 14:** ¿Qué es un "carrier thread" y por qué importa con virtual threads?

**Respuesta:** Un virtual thread no se ejecuta solo: corre montado sobre un carrier = un platform thread real (de un ForkJoinPool por defecto). Cuando el virtual hace I/O bloqueante, la JVM lo desmonta del carrier (libre para otro virtual) y lo remonta al volver la respuesta.

Problemas ("pinning"): si dentro de un synchronized o JNI hay I/O bloqueante, el virtual no se puede desmontar → bloquea el carrier → pierdes la ventaja. Por eso se recomienda ReentrantLock sobre synchronized con I/O dentro (en Java 24 se relaja). El monitor del pinning lo activas con -Djdk.tracePinnedThreads=full.

Idea: el modelo es "todos los hilos parecen bloqueantes, pero la JVM hace la magia debajo" — pero la magia solo funciona si no la tapas con primitivas que no entienden Loom.

---

**Pregunta 15:** ¿Qué son los wildcards en generics (? extends, ? super) y la regla PECS?

**Respuesta:** Los wildcards te dejan ser más permisivo con los tipos genéricos:
- List<?> acepta cualquier List, pero solo puedes leer como Object (no puedes añadir nada salvo null).
- List<? extends T> acepta List<T> o subtipos. Puedes leer elementos como T, pero no puedes añadir (la lista podría ser de un subtipo y no aceptaría un T cualquiera).
- List<? super T> acepta List<T> o supertipos. Puedes añadir un T (o subtipos), pero al leer solo obtienes Object.

PECS — Producer Extends, Consumer Super:
- Si la colección produce Ts (vas a leer), usa ? extends T.
- Si la colección consume Ts (vas a añadir), usa ? super T.
- Si necesitas leer y añadir Ts, usa T sin wildcard.

Ejemplo: Collections.copy(List<? super T> dest, List<? extends T> src). La fuente produce, el destino consume — perfecto.

---

**Pregunta 16:** ¿Diferencia entre excepciones checked y unchecked? ¿Cuándo usar cada una?

**Respuesta:** - Checked (extienden Exception pero NO RuntimeException): el compilador obliga a manejarlas (try/catch) o declararlas (throws). Ej.: IOException, SQLException.
- Unchecked (extienden RuntimeException): el compilador NO obliga a nada. Ej.: NullPointerException, IllegalArgumentException, IllegalStateException.

Filosofía moderna (Spring, mayoría del código actual):
- Usa unchecked por defecto para errores de programación o estados ilegales del dominio (excepciones de dominio propias que heredan de RuntimeException).
- Checked tiene sentido para errores recuperables que el caller probablemente quiera manejar de forma específica (raro en práctica).
- Las checked se contaminan por toda la firma del código ("checked exception leakage") y empujan a catch (Exception e) {} vacíos.

Spring envuelve SQLException (checked) en DataAccessException (unchecked) precisamente por esto. Reglas clave: lanza por estado no recuperable; nunca tragues (catch vacío); incluye contexto en el mensaje. Y @Transactional solo hace rollback por unchecked por defecto.

---

**Pregunta 17:** ¿Qué garbage collectors hay en la JVM moderna y cómo elegir?

**Respuesta:** El GC libera memoria de objetos sin referencias. La JVM usa hipótesis generacional (la mayoría de objetos mueren jóvenes) → divide el heap en young (eden + survivors) y old (tenured).

Collectors principales en HotSpot (JDK 21+):
- G1 (default desde J9): equilibrado, divide el heap en regiones; pauses objetivo configurables (-XX:MaxGCPauseMillis). Buen default general.
- ZGC: pauses sub-milisegundo incluso en heaps grandes (TB). Concurrente, copia objetos sin pausa. Ideal para latencia crítica. Generational ZGC desde J21.
- Shenandoah (RedHat): similar a ZGC, pauses muy bajas concurrentes.
- Parallel GC: throughput máximo, pauses largas. Para batch.
- Serial GC: un solo hilo. Solo para apps diminutas.

Reglas:
- Latencia crítica + heap grande → ZGC.
- Default cómodo → G1.
- Batch que prioriza throughput → Parallel.

No "tunees" GC sin medir: empieza con G1 y solo cambia si tienes un problema concreto (pauses largas → ZGC). Métricas clave: Pause GC time, Allocation rate, frecuencia de full GC.

---

### SPRING (20 preguntas)

**Pregunta 1:** ¿Para qué sirve un ViewResolver?

**Respuesta:** En Spring MVC, un ViewResolver traduce el nombre lógico de vista que devuelve un @Controller en la vista real (HTML, Thymeleaf, JSP…).

[ver código en la app]

[ver código en la app]

Nota: en APIs @RestController el ViewResolver no entra en juego porque @ResponseBody serializa directo a JSON/XML.

---

**Pregunta 2:** ¿Qué diferencia hay entre un @Controller y un @RestController? ¿Cuándo usar cada uno?

**Respuesta:** @RestController = @Controller + @ResponseBody en todos los métodos. Diferencia clave: el valor de retorno va directo al body HTTP (Jackson lo serializa), sin pasar por ningún ViewResolver.

[ver código en la app]

Regla práctica: usa @RestController para APIs; @Controller para apps con vistas Thymeleaf/JSP. En Agata Next todos los endpoints de los conectores son @RestController.

---

**Pregunta 3:** ¿Se puede definir un GET, PATCH, POST o PUT en un @Controller?

**Respuesta:** Sí. Añadiendo @ResponseBody al método (o a la clase) le dices a Spring que el valor de retorno debe ir directo al body HTTP, no a un ViewResolver.

[ver código en la app]

En la práctica: si un controlador devuelve solo JSON, usa directamente @RestController. La combinación @Controller + @ResponseBody es útil cuando la misma clase sirve tanto vistas HTML como endpoints JSON (raro pero válido).

---

**Pregunta 4:** ¿Cómo puedo ejecutar una query nativa en Hibernate/Spring Data?

**Respuesta:** Con @Query y nativeQuery = true en el repositorio:
[ver código en la app]
También con EntityManager.createNativeQuery(...). Usar cuando la query no se puede expresar bien en JPQL (CTE, dialecto específico, hints).

---

**Pregunta 5:** ¿Hay procesos Spring Batch? ¿Cómo gestionas o programas los procesos batch?

**Respuesta:** Spring Batch es el framework para procesos masivos (importar 10M filas, generar reports, ETL nocturno).

[ver código en la app]

Ejemplo mínimo:
[ver código en la app]

Para programarlos:
- @Scheduled(cron="0 0 3   *") para tareas simples in-process (3:00 cada día).
- Quartz para scheduling complejo (clusters, persistencia, misfires).
- ShedLock para coordinar @Scheduled en entornos distribuidos (que solo UNA instancia lo ejecute aunque haya N réplicas — Agata Next lo usa con MongoLockProvider).
- Triggers externos: Kubernetes CronJob, AWS EventBridge, Jenkins, Airflow.

💡 Tip clave: el chunk size es la palanca de tuning. Pequeño → muchos commits, lento. Grande → commits caros, memoria alta. Empieza en 100-1000 y mide.

💡 Analogía: una línea de producción industrial. El Reader es el operario que pone piezas en la cinta, el Processor las modela, el Writer las empaqueta en cajas de 1000 (chunk) y las manda al almacén. Si la fábrica se va la luz a media producción, vuelves al último camión despachado, no empiezas de cero.

---

**Pregunta 6:** ¿Qué hace @Transactional y qué controlan propagation e isolation?

**Respuesta:** @Transactional envuelve el método en una transacción (commit al salir bien, rollback ante RuntimeException/Error por defecto; las checked no hacen rollback salvo rollbackFor).

propagation — cómo se comporta respecto a una transacción existente:
[ver código en la app]

isolation — qué anomalías permite ver:
[ver código en la app]

⚠️ Ojo Spring: funciona por proxy AOP. Una llamada interna (this.metodo()) no aplica la transacción — el proxy no intercepta las llamadas dentro de la misma clase.

[ver código en la app]

---

**Pregunta 7:** Si un método @Transactional lanza una excepción, ¿cómo garantizas el rollback?

**Respuesta:** Por defecto @Transactional hace rollback solo ante excepciones unchecked (RuntimeException y Error). Las excepciones checked NO causan rollback automático.

[ver código en la app]

Otra trampa: si llamas this.metodoTransaccional() desde dentro de la misma clase, el proxy Spring no intercepta → la anotación no tiene efecto. Solución: inyecta el bean y llama desde fuera.

---

**Pregunta 8:** ¿Cómo haces que un método que llama a dos repositorios sea completamente transaccional?

**Respuesta:** Anota con @Transactional el método de servicio que engloba ambas llamadas: las dos modificaciones quedan en la misma transacción → commit conjunto o rollback de ambas.

[ver código en la app]

Trampa famosa: self-invocation. @Transactional funciona por proxy AOP (Spring envuelve el bean). Si llamas un método del mismo bean con this.otro(), el proxy no intercepta y la anotación interna se ignora.

[ver código en la app]

Soluciones a self-invocation:
1. Mover el método a otro bean (lo más limpio).
2. Inyectarse a uno mismo vía @Autowired ApplicationContext o @Resource self (feo, indica diseño cuestionable).
3. AspectJ con compile-time weaving (sin proxies) — nuclear, solo en casos extremos.

💡 Tip 1: no pongas @Transactional en los métodos internos pensando que ayuda. Con REQUIRED (default) se unirían a la externa, pero REQUIRES_NEW crearía dos transacciones distintas (y la interna no puede hacer rollback de la externa).

💡 Tip 2: para depurar, mira el nombre real del bean (bean.getClass().getName()). Si ves MyService$$EnhancerBySpringCGLIB$$xxxx es proxy CGLIB; si es la clase directa, NO hay proxy y @Transactional no aplicará.

💡 Analogía: el proxy es como un recepcionista. Cuando alguien viene de fuera (otroBean → service.metodoB()) pasa por recepción y se registra (abre tx). Cuando estás dentro de la oficina y vas tú mismo (con this) al despacho de al lado, no pasas por recepción — y, claro, no quedas registrado.

---

**Pregunta 9:** Si necesitas transaccionalidad pero no puedes usar @Transactional (p.ej. código de una librería), ¿cómo lo haces?

**Respuesta:** La transaccionalidad no es magia de la anotación: por debajo hay un PlatformTransactionManager. Alternativas cuando @Transactional no está disponible (código de librería, lambdas, instancias no gestionadas por Spring):

[ver código en la app]

Cuándo usar TransactionTemplate vs @Transactional:
- @Transactional = declarativo, legible, la mayoría de los casos.
- TransactionTemplate = código no gestionado por Spring, lambdas, control fino del rollback, tests.
- PTM programático = casos muy avanzados donde necesitas gestión manual completa.

---

**Pregunta 10:** ¿Para qué se usan los aspectos (AOP) en Spring?

**Respuesta:** AOP (Aspect-Oriented Programming) separa las preocupaciones transversales (cross-cutting concerns) de la lógica de negocio: logging, seguridad, transacciones, métricas, manejo de excepciones.

[ver código en la app]

Conceptos: aspecto (el módulo transversal), advice (@Before/After/Around), pointcut (expresión que define dónde aplica), join point (punto de ejecución interceptable — en Spring, invocación de método).

⚠️ Self-invocation: el AOP de Spring usa proxies — si this.metodo() desde dentro del bean, el proxy NO intercepta. Lo mismo que @Transactional.

💡 @Transactional, @Cacheable y @Secured son AOP built-in de Spring. Si ves que una anotación "no funciona", casi siempre es por self-invocation o porque el bean no es un proxy gestionado.

---

**Pregunta 11:** ¿Cómo evitarías que un aspecto penalice el rendimiento?

**Respuesta:** [ver código en la app]

[ver código en la app]

---

**Pregunta 12:** ¿Qué es MapStruct y por qué usarlo en lugar de mapear a mano o con reflexión?

**Respuesta:** MapStruct es un generador de mappers en tiempo de compilación: declaras una interface con @Mapper y los métodos de conversión, y un annotation processor genera el código de mapeo (puro Java, sin reflexión).

Ventajas: rápido (no usa reflexión como ModelMapper), seguro en compilación (si falta un campo o no casa un tipo, avisa al compilar), y mantiene el mapeo explícito y testeable. En hexagonal es clave para traducir entre capas: dominio ↔ DTO REST, dominio ↔ DTO de Kafka, entidad de persistencia ↔ dominio.

Buenas prácticas (las del proyecto): un mapper por tipo, InjectionStrategy.CONSTRUCTOR, nada de lógica de negocio dentro, qualifiedByName mejor que expression, e ignorar campos explícitamente con @Mapping(ignore = true).

---

**Pregunta 13:** ¿Cómo proteges una API con Spring Security como OAuth2 Resource Server?

**Respuesta:** Un resource server es una API que valida tokens (no los emite). Con spring-boot-starter-oauth2-resource-server configuras la validación de un JWT (Bearer):
- Defines el issuer/JWKS (spring.security.oauth2.resourceserver.jwt.issuer-uri); Spring descarga las claves públicas y valida firma, exp, iss, aud.
- En la SecurityFilterChain declaras qué rutas requieren auth y con qué authorities/scopes (hasAuthority('SCOPE_x')).
- Los claims del JWT se mapean a authorities (JwtAuthenticationConverter).

Así la API es stateless: no guarda sesión, cada petición trae su token y se valida sin ir a BD. El cliente OAuth2 (oauth2-client) es el otro lado: obtiene el token para llamar a otros servicios (machine-to-machine, client credentials).

---

**Pregunta 14:** ¿Qué tipos de propagación de @Transactional hay y cuándo usar cada uno?

**Respuesta:** [ver código en la app]

Detalle de los más usados:
- REQUIRED (default): el 95% de los casos. Si llamas desde otro @Transactional, se une; si no, crea una.
- REQUIRES_NEW: suspende la actual y abre otra independiente → tu rollback no afecta a la externa, y viceversa.
  - Caso real Agata Next: ConsolidationAudit — registramos cada intento de consolidación de entidades en una tabla de auditoría con REQUIRES_NEW; aunque el merge del agregado haga rollback, la traza queda persistida ("qué intentamos hacer y por qué falló").
- NESTED: subtransacción con savepoint dentro de la actual; rollback parcial sin tumbar la externa. Solo con managers que lo soporten (JDBC sí, JPA limitado).
- SUPPORTS: usa la actual si existe; si no, ejecuta sin transacción. Útil en métodos que pueden llamarse desde contextos transaccionales o no.
- NOT_SUPPORTED: suspende la actual; ejecuta sin transacción. Para operaciones caras que no necesitan atomicidad (p.ej. una llamada larga a una API externa que no queremos que mantenga la tx abierta).
- MANDATORY: debe existir una activa; si no, falla. Defensivo: "este método solo debe llamarse dentro de una tx".
- NEVER: no debe existir ninguna; si la hay, falla.

💡 Tip: el caso de REQUIRES_NEW para auditoría es de los pocos donde la propagación importa de verdad. Si te preguntan por un caso concreto en entrevista, es la respuesta canónica.

💡 Trampa: con REQUIRES_NEW, la transacción externa queda suspendida pero con sus locks. Si la interna intenta tocar las mismas filas, se queda esperando a sí misma → deadlock o timeout.

---

**Pregunta 15:** Si solo una parte de una operación debe ser transaccional, ¿cómo lo haces?

**Respuesta:** El problema: @Transactional funciona vía proxy AOP. Si llamas a un método transaccional desde dentro de la misma clase (this.metodo()), el proxy no intercepta y la transacción no abre.

[ver código en la app]

Soluciones:

[ver código en la app]

Regla: si ves @Transactional en un método privado → tampoco funciona (el proxy no puede sobrescribir métodos privados). Debe ser public.

---

**Pregunta 16:** ¿Cómo optimizarías una consulta pesada dentro de un método @Transactional?

**Respuesta:** 1. No hagas nada caro en la transacción que no necesite atomicidad: separa la lectura pesada (sin tx o readOnly = true) de la escritura.
2. @Transactional(readOnly = true) para tx solo lectura: el ORM activa optimizaciones (sin dirty checking, snapshot ligero), y algunos drivers usan réplicas de lectura.
3. Reducir lo cargado: proyección DTO en vez de la entidad entera, paginación, índices apropiados.
4. N+1: JOIN FETCH / @EntityGraph / @BatchSize para no disparar queries por elemento.
5. Streaming si recorres muchos datos (cursor/Stream<> con @QueryHints), procesando por lotes.
6. Caché (segundo nivel JPA o Redis) si la query se repite.
7. Mover la operación fuera de la tx HTTP: encolar y procesar async si tarda mucho.

Mide con EXPLAIN el plan real antes de tocar nada.

---

**Pregunta 17:** Si un método llama a dos repositorios de DOS BBDD distintas, ¿cómo lo haces transaccional?

**Respuesta:** Una @Transactional normal solo abarca un transaction manager (una BD). Opciones:
1. No lo hagas como una sola tx ACID — patrón Saga con compensación: opera en BD1, publica un evento; otro componente opera en BD2; si falla, compensas la anterior. Es la respuesta moderna en microservicios.
2. JTA / XA (Atomikos, Narayana): two-phase commit sobre dos data sources. Real pero lento, complejo y escala mal — evitar si puedes.
3. ChainedTransactionManager (Spring): commitea las dos en secuencia, best-effort (no es ACID — entre los dos commits puede haber inconsistencia). Útil para BD + Kafka cuando ya asumes idempotencia.
4. Outbox: escribes en BD1 el cambio + el evento en una tabla outbox dentro de la misma tx (atómica); un proceso aparte lo publica al broker (que actualiza BD2). Resuelve el dual-write con una sola tx local.

La respuesta esperada hoy: saga + outbox, no XA.

---

**Pregunta 18:** ¿Cómo defines un aspecto en Spring y un caso real?

**Respuesta:** Anotas una clase con @Aspect y @Component, declaras un pointcut y un advice:
[ver código en la app]
Casos reales: logging estandarizado, métricas/timing, auditoría (qué usuario hace qué), autorización custom (@OnlyAdmin), caché (@Cacheable ya es AOP), reintentos declarativos. Activa con @EnableAspectJAutoProxy. Cuidado con el coste si el pointcut es muy amplio.

---

**Pregunta 19:** ¿Qué son los Spring profiles y cómo se usan @Conditional beans?

**Respuesta:** Los profiles son etiquetas que activan/desactivan configuración según el entorno: dev, staging, prod, test. Activas uno con spring.profiles.active=prod (variable de entorno, propiedad, o argumento).

- @Profile("prod") en una clase de configuración o bean: solo se carga si ese profile está activo.
- @Profile("!prod"): en cualquiera EXCEPTO prod.
- application-{profile}.yml: el profile activa propiedades específicas (puerto, BD, niveles de log) que sobrescriben las base.

Más granular: @Conditional... y sus variantes (@ConditionalOnProperty, @ConditionalOnClass, @ConditionalOnMissingBean). La auto-configuración de Spring Boot está construida sobre estos: "si hay X en el classpath y no hay un bean Y, crea Z".

Reglas: no abuses de profiles para lógica de negocio (eso debe estar en código); úsalos para configuración (qué proveedor, qué endpoint, qué nivel). Y nunca activas "prod" en tu máquina por error: usa @ActiveProfiles("test") en tests.

---

**Pregunta 20:** ¿Cómo publicas y consumes eventos in-process en Spring (ApplicationEventPublisher)?

**Respuesta:** Para desacoplar componentes dentro de la misma JVM (no entre microservicios) sin meter Kafka:
[ver código en la app]
Por defecto los listeners se ejecutan síncronamente en el mismo hilo (dentro de la transacción del emisor). Con @TransactionalEventListener los ejecutas después del commit (más seguro: no notificas si la tx hace rollback).

Úsalo para domain events que no salen del proceso. Cuando necesites cruzar microservicios o asegurar fiabilidad → Kafka/Rabbit + outbox. No es sustituto de un broker.

---

### TEST (13 preguntas)

**Pregunta 1:** ¿Qué es TDD y en qué consiste el ciclo red-green-refactor?

**Respuesta:** TDD (Test-Driven Development) es escribir el test antes que el código, en ciclos cortos Red-Green-Refactor:

[ver código en la app]

Ejemplo concreto (servicio de descuentos):
[ver código en la app]

Qué aporta: diseño guiado por el uso (APIs más claras), cobertura por construcción, red de seguridad para refactorizar, feedback inmediato. No es "testing" sin más: es una técnica de diseño. Variante: BDD (Given-When-Then) centrada en el comportamiento de negocio.

---

**Pregunta 2:** ¿Cuál es la diferencia entre un Mock y un Spy?

**Respuesta:** - Stub: devuelve datos predefinidos. No verifica interacciones.
- Mock: igual que stub + verifica que se llamó (cuántas veces, con qué args).
- Spy: envuelve un objeto real; ejecuta el código real salvo lo que explícitamente stubbees.

[ver código en la app]

Regla: en tests de unidad prefiere mocks para dependencias externas; usa spy solo cuando necesitas el comportamiento real de parte del objeto bajo test. Mockito strict stubs fallan si declaras un stub que no se usa (evita tests ruidosos).

---

**Pregunta 3:** ¿Diferencia entre @Mock/@Spy y @MockBean/@SpyBean?

**Respuesta:** - @Mock (Mockito puro): crea el doble en el test sin contexto Spring. Ultrarrápido.
- @MockBean (Spring Boot Test): crea el doble y lo registra en el ApplicationContext, reemplazando el bean real. Necesario cuando el componente bajo test está en el contexto Spring.

[ver código en la app]

Regla: usa @Mock siempre que puedas (más rápido). Usa @MockBean solo en tests que levanten el contexto Spring (@SpringBootTest, @WebMvcTest).

---

**Pregunta 4:** ¿Diferencia entre prueba unitaria y de integración? ¿Cuándo prefieres cada una?

**Respuesta:** [ver código en la app]

[ver código en la app]

Pirámide: muchos tests unitarios, algunos de integración, pocos E2E. En Agata Next los conectores tienen ~80% unitarios + slices @DataMongoTest/@DataJpaTest + un test de contrato Pact por cada API pública.

---

**Pregunta 5:** ¿Qué es la pirámide de testing?

**Respuesta:** Propone una proporción sana de tipos de test:

[ver código en la app]

- Base — unit (muchos): rápidos, aislados con mocks, baratos. El grueso.
- Medio — integración (algunos): colaboración entre componentes/infra (Testcontainers + PostgreSQL real, @WebMvcTest, @DataJpaTest).
- Cima — E2E / UI (pocos): flujo completo de usuario, lentos y frágiles.

Antipatrón — cono de helado (lo opuesto):
[ver código en la app]

Complemento moderno en microservicios: contract testing (Pact) sustituye parte de los E2E entre servicios — valida el contrato sin desplegar ambos servicios juntos.

---

**Pregunta 6:** ¿Qué son las pruebas de carga/rendimiento y qué métricas miras?

**Respuesta:** Verifican cómo se comporta el sistema bajo demanda — no si es funcionalmente correcto.

[ver código en la app]

Herramientas Java:
[ver código en la app]

En Agata Next: se miden latencias p50/p95/p99 con Micrometer + Prometheus. Los alertas de SLO se definen como p99 < 500ms para endpoints de ingesta.

---

**Pregunta 7:** ¿Cómo estructuras tests en Spring (slices, Testcontainers)?

**Respuesta:** - @SpringBootTest: levanta el contexto completo de Spring. Integración end-to-end. Lento (~10-30s). Necesario cuando pruebas la wiring real entre capas.
- Slices: contexto parcial que solo carga las capas relevantes. Mucho más rápido.

[ver código en la app]

[ver código en la app]

---

**Pregunta 8:** ¿Qué son los principios SOLID?

**Respuesta:** Cinco principios de diseño OO:

[ver código en la app]

En Agata Next: DIP es la base de la arquitectura hexagonal — el dominio define los puertos (abstracciones) y la infraestructura los implementa.

---

**Pregunta 9:** ¿Qué prácticas de Clean Code aplicas?

**Respuesta:** Principios de código limpio (Robert C. Martin):

[ver código en la app]

Reglas clave:
- Nombres reveladores de intención — isAdult() > age > 18.
- Funciones pequeñas y con una sola responsabilidad.
- Sin comentarios que expliquen el qué — el código ya lo dice; comenta solo el por qué.
- No repetir código (DRY) — pero no abstraer prematuramente (tres repeticiones antes de extraer).
- Manejo de errores separado — no mezclar lógica de negocio con try/catch.

---

**Pregunta 10:** ¿Cómo es un buen test (AAA / Given-When-Then, FIRST)?

**Respuesta:** Estructura AAA / Given-When-Then: organiza el test en tres bloques claros para maximizar legibilidad.

[ver código en la app]

Reglas:
- Cada test verifica una sola cosa (un when).
- El nombre del método describe el escenario: deberiaX_cuandoY.
- No comentarios // given si el código ya es claro — solo como guía cuando el arrange es largo.
- Un test que falla debe decirte exactamente qué y por qué sin leer el código de producción.

---

**Pregunta 11:** ¿Cómo testeas integraciones con APIs externas y con infraestructura real?

**Respuesta:** - WireMock: levanta un servidor HTTP simulado que devuelve respuestas predefinidas (stubs) para las APIs externas. Pruebas tu adaptador de salida contra respuestas controladas (incluidos timeouts, 500, payloads raros) sin depender del tercero real.
- Testcontainers: arranca Mongo/Redis/Kafka reales en Docker durante el test, así la integración con la BD/broker es fiel (mejor que un fake o H2 que miente con dialectos).
- BDD / Cucumber: escenarios Given/When/Then en lenguaje de negocio para pruebas de aceptación.
- AsyncAPI/contract validation: validar que los eventos publicados cumplen el contrato.

Estrategia: unitarios mockeando puertos (Mockito); integración con Testcontainers + WireMock para verificar los adaptadores reales.

---

**Pregunta 12:** ¿Qué es property-based testing?

**Respuesta:** En lugar de escribir casos concretos ("para input 3, espero 6"), declaras propiedades que la función debe cumplir para cualquier input válido, y el framework genera cientos de inputs aleatorios para intentar romperlas.

Ejemplo con jqwik (Java):
[ver código en la app]
El framework lanza 1000 listas (vacías, gigantes, con duplicados, ordenadas, con un solo elemento…). Si encuentra un fallo, hace shrinking: reduce el input al mínimo que reproduce el bug.

Descubre edge cases que no se te ocurrirían: listas vacías, números negativos, NaN, strings con Unicode raro, integer overflow.

Propiedades típicas:
- Idempotencia: f(f(x)) == f(x).
- Roundtrip: decode(encode(x)) == x.
- Invariantes: tras addItem(cart, item), cart.size() aumenta en 1.
- Comparación con implementación de referencia: tu sort produce lo mismo que Collections.sort.

Complemento de los tests de ejemplos, no sustituto. Ideal para funciones puras/matemáticas/parsers.

---

**Pregunta 13:** ¿Qué es mutation testing y para qué sirve?

**Respuesta:** Mide cómo de buenos son tus tests: el framework introduce pequeñas mutaciones en el código de producción (cambia > por >=, + por -, && por ||, devuelve null...) y ejecuta tus tests. Cada mutante es un bug artificial.

- Si los tests fallan con la mutación → el mutante "muere" → tus tests detectan ese tipo de fallo.
- Si los tests pasan con la mutación → el mutante "sobrevive" → tus tests son ciegos a ese cambio: probablemente falten asserts.

El score = mutantes muertos / mutantes totales. Métrica más honesta que la cobertura de código (que solo dice qué líneas se ejecutan, no si los tests las verifican).

Herramienta estándar en Java: PIT (PITest), plugin de Maven/Gradle. Reporta line/mutation coverage y muestra qué mutantes sobrevivieron y dónde.

Coste: lento (ejecuta tests N veces). Por eso se suele correr en CI nightly o solo en módulos críticos, no en cada PR. Pero da feedback brutal sobre calidad real de tests.

---
