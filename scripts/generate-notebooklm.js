#!/usr/bin/env node
// Genera archivos Markdown en notebooklm/ listos para subir a Google NotebookLM.
// Ejecutar: node scripts/generate-notebooklm.js

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// DATA: cargada dinámicamente desde los archivos fuente
// ---------------------------------------------------------------------------

const QUESTIONS_JSON = path.resolve(__dirname, '../src/data/questions.json');
const { questions, topics } = JSON.parse(fs.readFileSync(QUESTIONS_JSON, 'utf8'));

// ---------------------------------------------------------------------------
// THEORY (from src/data/theory.ts)
// ---------------------------------------------------------------------------

const THEORY = {
  java: `Java funcional y moderno. Los streams son una vista perezosa sobre una colección: encadenas operaciones intermedias (filter, map, flatMap, sorted) que no se ejecutan hasta una operación terminal (collect, forEach, reduce). La diferencia importante entre map y flatMap es la dimensionalidad: map transforma 1→1, flatMap aplana Stream<Stream<T>> en Stream<T> — útil cuando cada elemento se expande en varios.

Una interfaz funcional tiene exactamente un método abstracto y por eso aceptas lambdas donde se espera (Function, Predicate, Consumer, Supplier, Comparator). Las clases abstractas llevan estado y lógica compartida, pero solo herencia simple; usa interfaz para contratos entre clases no relacionadas, abstracta para una jerarquía con código común. Records (J16+) son clases inmutables con equals/hashCode generados — ideales como DTOs, value objects de DDD y mensajes thread-safe por construcción.

Java moderno (21/25) trae virtual threads (Loom): millones de hilos ligeros gestionados por la JVM, ideales para servidores I/O-bound que vuelven a escribir código bloqueante normal. Pattern matching + sealed types + switch expressions modelan jerarquías cerradas con comprobación de exhaustividad en compilación. Sequenced collections uniforman first/last en colecciones ordenadas. Structured concurrency y scoped values suceden a ThreadLocal para propagar contexto de forma segura con Loom.

Thread safety se consigue por (en orden de preferencia): inmutabilidad (records), estructuras concurrentes (ConcurrentHashMap), atomics (CAS), sincronización clásica (synchronized/locks), confinamiento. Nunca asumas que algo es thread-safe; HashMap, ArrayList y SimpleDateFormat no lo son.`,

  spring: `Spring Boot es Spring con autoconfiguración y starters: añades spring-boot-starter-web, define endpoints y arranca un servidor embebido. Los @Controller devuelven nombres de vista resueltos por un ViewResolver; los @RestController añaden @ResponseBody a todo y serializan al body (JSON con Jackson por defecto). En APIs REST puras se usa el segundo; en aplicaciones con vistas, el primero.

Transacciones. @Transactional envuelve el método en una transacción gestionada por un PlatformTransactionManager mediante proxy AOP. Por defecto hace rollback ante excepciones unchecked; las checked no lo disparan, salvo rollbackFor. La trampa más común es self-invocation: si llamas this.metodo() desde otro método del mismo bean, el proxy no intercepta y la anotación se ignora; la transacción debe entrar desde fuera del bean. La propagación controla la composición: REQUIRED (default) se une o crea, REQUIRES_NEW suspende y abre otra independiente, NESTED usa savepoints. Para transacciones cruzando dos BD, lo moderno es saga + outbox en vez de XA/2PC.

AOP (programación orientada a aspectos). Separa las preocupaciones transversales (logging, métricas, seguridad, transacciones, caché) de la lógica de negocio. Se compone de un aspecto (@Aspect), un advice (@Around, @Before, @After) y un pointcut (@Pointcut, dónde se aplica). El propio @Transactional y @Cacheable son AOP — de ahí la trampa del self-invocation con proxies. Para no penalizar rendimiento: pointcut afinado, advice ligero, asíncrono donde el efecto no sea crítico.

MapStruct genera mappers en tiempo de compilación: sin reflexión, type-safe y rápidos. Es la pieza clave en hexagonal para traducir entre dominios y DTOs (REST/Kafka) sin contaminar el dominio.`,

  arch: `Arquitectura hexagonal (ports & adapters) organiza el código en tres anillos: dominio (modelo y reglas), aplicación (casos de uso y puertos — interfaces de entrada y de salida), e infraestructura (adaptadores que implementan los puertos). La regla cardinal: las dependencias apuntan hacia el dominio. El dominio no sabe de HTTP, JPA, Kafka ni Spring; lo que llamas "fuera" lo haces a través de un puerto que tú definiste y la infraestructura implementa.

Los adaptadores driving (REST controllers, listeners Kafka, schedulers) invocan puertos de entrada (casos de uso). Los adaptadores driven (repositorios JPA/Mongo, clientes HTTP, productores Kafka) implementan puertos de salida declarados por el dominio. Los DTOs viven junto a su adaptador y se mapean al dominio con MapStruct.

DDD táctico. Diferencia tres bloques: entidades (identidad propia que persiste), value objects (definidos por sus atributos, inmutables; Dinero, Email), y aggregate roots (la entidad raíz que garantiza invariantes de un grupo tratado como unidad de consistencia). La lógica de negocio vive dentro del agregado, no en servicios anémicos. Los domain events publicados al cambiar el estado desacoplan reacciones.

DDD estratégico: bounded contexts. Se separan por lenguaje ubicuo, ownership de equipo, capacidad de negocio, independencia de despliegue. La proyección de datos de dos BCs nunca vive en ninguno de los dos: se hace en un read model dedicado (CQRS) que consume eventos de ambos. Una Anti-Corruption Layer te aísla del modelo de un sistema externo.

Microservicios. Aportan despliegue/escalado independiente, ownership por equipo y aislamiento de fallos, a cambio de complejidad distribuida: red, consistencia eventual, observabilidad, versionado de contratos, almacén por servicio. Patrones esenciales: API gateway, service discovery, circuit breaker, saga para transacciones distribuidas, outbox para publicar eventos atómicamente con la BD, CQRS para lecturas/escrituras asimétricas, observabilidad con tracing distribuido.`,

  async: `Asíncrono ≠ Reactivo. Asíncrono significa que el caller no se bloquea esperando la respuesta. Reactivo es un paradigma basado en streams de datos, push desde la fuente, backpressure (el consumidor controla el ritmo del productor) y non-blocking I/O sobre pocos threads en un event loop. En Java son Mono<T> y Flux<T> de Project Reactor. Todo reactivo es asíncrono, pero no al revés.

Cuándo elegir reactivo. Aporta mucho cuando tienes alta concurrencia con I/O y toda la cadena puede ser no bloqueante (R2DBC en vez de JDBC, WebClient en vez de RestTemplate). Si solo una pieza bloquea, paralizas el event loop. Nunca bloquees dentro de un flujo reactivo: nada de Thread.sleep, .block(), JDBC síncrono; si tienes que bloquear, aíslalo en un scheduler dedicado.

Virtual threads (Java 21+) cambian la ecuación. Permiten escribir código bloqueante y secuencial que escala a millones de hilos sin necesidad de modelo reactivo: la JVM desmonta el virtual del platform thread cuando bloquea por I/O. Regla práctica: si tu problema es "muchas peticiones I/O-bound" → virtual threads (más simple); si es "streams de datos con composición y control de flujo" → reactivo.

Convertir un endpoint lento en asíncrono. El patrón canónico: encolar el trabajo (Kafka/SQS/Rabbit) y devolver 202 Accepted con un id. @Async + CompletableFuture son útiles pero si el pod muere, se pierde. Thread safety: la mejor herramienta es la inmutabilidad; luego estructuras concurrentes, atomics, y solo cuando hace falta, sincronización clásica.`,

  msg: `Kafka es un log distribuido persistente y particionado, no una cola. Los mensajes se retienen (no se borran al leerse) → se pueden reproducir; brutal para alto throughput, streaming, event sourcing y varios consumer groups leyendo lo mismo. El orden solo se garantiza dentro de una partición; para que dos mensajes salgan ordenados al consumer, deben ir a la misma partición → misma clave (hash(key) % particiones). El paralelismo lo dan las particiones: máximo consumers activos por grupo = nº de particiones. At-least-once → idempotencia obligatoria.

RabbitMQ es un broker AMQP centrado en routing: el productor publica a un exchange, que enruta a colas según bindings y routing key. Tipos: direct (key exacta), topic (patrones con comodines), fanout (broadcast), headers. A diferencia de Kafka, el mensaje se borra al consumirse: no es un log reproducible.

Cuándo cada uno. Kafka para streams de eventos de alto volumen, reproducibles, varios consumidores que leen lo mismo, event sourcing. RabbitMQ para colas de comandos/tareas con routing fino y volumen menor. Muchos sistemas reales usan ambos.

Apache Flink es un motor de procesamiento de streams con estado, ventanas avanzadas, checkpoints para exactly-once, state backend RocksDB para estado enorme, y CEP (Complex Event Processing) para correlacionar eventos en tiempo real.

Garantías y patrones. At-least-once → idempotencia + DLQ. Exactly-once existe dentro de Kafka pero es difícil entre sistemas externos. Para publicar de forma atómica con la BD usa el patrón Outbox. Eventos versionados, Schema Registry (Avro/JSON Schema).`,

  db: `Modelado relacional. Una clave primaria identifica unívocamente cada fila; una clave foránea referencia la PK de otra tabla. Una relación N:M se modela con tres tablas: las dos entidades + tabla de unión con dos FKs y PK compuesta.

Normalización. 1FN: valores atómicos. 2FN: en 1FN y no hay dependencias parciales de una clave compuesta. 3FN: en 2FN y sin dependencias transitivas. Mnemotécnico: 1FN atómico · 2FN toda la clave · 3FN nada más que la clave.

ACID e aislamiento. A=atomicidad, C=consistencia, I=aislamiento, D=durabilidad. Niveles de aislamiento: READ UNCOMMITTED (dirty reads), READ COMMITTED (no dirty), REPEATABLE READ (la misma fila no cambia, puede haber phantoms), SERIALIZABLE (sin anomalías).

NoSQL documental: MongoDB. Almacena documentos JSON/BSON. Modelar va por patrones de acceso: embebes lo que se lee/escribe junto, referencias por id cuando el sub-doc crece sin límite.

Persistencia políglota. En microservicios: relacional para transaccional, documental para agregados, Redis/Valkey para caché/sesiones/locks, Neo4j para grafos, OpenSearch para full-text. En Agata Next conviven Mongo + Neo4j + Valkey + PostgreSQL — cada uno por su caso de uso.`,

  sql: `Joins combinan filas de varias tablas. INNER devuelve solo la intersección. LEFT devuelve todas las filas de la tabla izquierda + las casadas de la derecha (NULLs donde no haya match). FULL devuelve ambos lados. CROSS es el producto cartesiano (peligroso). SELF JOIN une una tabla consigo misma.

Las preguntas trampa con números. Tabla A(5) LEFT JOIN B(10): la respuesta no es 5 a secas: es al menos 5 (más si una fila de A casa con varias de B). INNER JOIN con 3 coincidencias = 3. LEFT JOIN ≥ INNER siempre.

WHERE filtra filas, HAVING filtra grupos. El orden lógico: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT. ORDER BY 1 ordena por la primera columna del SELECT.

NULL es "desconocido", no un valor. NULL = NULL da NULL; usa IS NULL. COUNT(*) cuenta filas; COUNT(col) ignora NULLs. AVG ignora NULLs (no los trata como 0).

Subqueries vs joins. EXISTS es seguro frente a NULLs y suele ser más eficiente que IN con subqueries grandes. NOT IN con un subselect que tiene NULLs puede vaciar el resultado inesperadamente — usa NOT EXISTS.`,

  perf: `PreparedStatement vs Statement plano. El PreparedStatement parametriza la query: los valores van separados del SQL (anti-SQL-injection), el motor parsea y planifica una sola vez (plan cache), y los setX tipados evitan errores.

Plan de ejecución. EXPLAIN (estimación) y EXPLAIN ANALYZE (ejecuta y muestra coste real) en Postgres. Lee el árbol de operaciones de adentro hacia afuera: hojas son accesos (seq scan, index scan, index-only scan), nodos intermedios son joins y operaciones.

Qué buscar. Full table scans inesperados sobre tablas grandes. Índices no usados por estadísticas obsoletas (corre ANALYZE) o función sobre la columna. Joins ineficientes. Estimación vs filas reales muy distintas.

Índices. El B-tree es el general (igualdad, rangos, ORDER BY). Los índices compuestos (a, b) se usan para filtros por a o por a+b, pero no por solo b (regla del prefijo más a la izquierda). Un covering index contiene todas las columnas que la query necesita → index-only scan sin tocar la tabla. Cuando un índice perjudica: tablas pequeñas, columnas con baja selectividad, mucho escritor.

N+1 en JPA: cargas N entidades con 1 query y luego al acceder a una relación lazy se disparan N queries más. Soluciones: JOIN FETCH o @EntityGraph para traer la relación de una vez, @BatchSize para agrupar lazies.`,

  patterns: `Patrones de diseño son soluciones recurrentes a problemas de diseño OO. El catálogo clásico (GoF, 1994) se divide en creacionales (Singleton, Factory, Builder), estructurales (Adapter, Decorator, Facade, Proxy) y de comportamiento (Strategy, Observer, Command, Template Method, State, Chain of Responsibility).

Java moderno los hace más ligeros. Una Strategy es una lambda implementando una interfaz funcional. Singleton es un @Component de Spring. Decorator y Proxy son lo que hace Spring AOP debajo (@Transactional, @Cacheable). Template Method sigue vivo en JdbcTemplate. Builder es Lombok @Builder.

Patrones de arquitectura distribuida. CQRS separa el modelo de escritura del de lectura, posiblemente con almacenes distintos sincronizados por eventos. Saga sustituye a las transacciones distribuidas con una secuencia de transacciones locales y acciones compensatorias. Outbox garantiza la publicación atómica de un evento junto al cambio en la BD: insertas la fila + un registro outbox en la misma transacción local, y un proceso aparte publica al broker.

Antipatrones. Anemic Domain Model (entidades con getters/setters y toda la lógica en servicios). God class, shotgun surgery, feature envy. Primitive obsession: pasar String/Long para todo en vez de value objects. Service locator disfrazando dependencias. Distributed monolith: microservicios acoplados síncronos en cadena.`,

  obs: `Observabilidad es la capacidad de entender qué le pasa a tu sistema en producción desde fuera, sin desplegar de nuevo. Tres pilares: métricas, logs y traces.

Métricas: valores numéricos agregados en el tiempo (counter, gauge, histogram). Prometheus + Micrometer es el stack típico en Spring. Usa percentiles (p95, p99) en latencias, no medias. Cuidado con la cardinalidad de etiquetas — nunca userId o traceId como tag.

Logs: registros en JSON (logstash-logback-encoder) con MDC para inyectar traceId/spanId/userId en cada línea. OpenSearch (fork open-source de Elasticsearch) donde aterrizan los logs. Pipeline típico: Filebeat → Logstash → OpenSearch → Dashboards.

Traces: el viaje de una petición por varios servicios, representado como spans anidados correlacionados por un traceId propagado en headers HTTP / metadata Kafka. OpenTelemetry (OTel) es el estándar abierto. Sampling porque trazar el 100% es caro: head-based (decides al inicio) o tail-based (decides según el resultado, siempre los errores).

Resiliencia. Resilience4j: circuit breaker (corta llamadas a un servicio caído), retry con backoff exponencial, rate limiter, bulkhead, time limiter. Health checks con Actuator: liveness (¿proceso vivo?) reinicia si falla; readiness (¿listo para tráfico?) saca del Service mientras falla.

SLI/SLO/SLA. SLI es la métrica (latencia, disponibilidad); SLO es tu objetivo interno ("99.9% < 200ms en 30 días"); SLA el contrato externo con consecuencias. El error budget (1 - SLO) define cuánto error te permites gastar.`,
};

// ---------------------------------------------------------------------------
// CHEATSHEETS (from src/data/cheatsheets.ts)
// ---------------------------------------------------------------------------

const CHEATSHEETS = {
  java: [
    'map: 1→1 · flatMap: aplana Stream<Stream<T>>→Stream<T> · collect: terminal, materializa (Collectors).',
    'Interfaz funcional = 1 método abstracto → lambdas (Function/Predicate/Consumer/Supplier).',
    'Interfaz: contrato, multi-herencia, sin estado · Abstracta: estado + lógica común, herencia simple.',
    'No se instancia una abstracta. Optional para ausencia. record = inmutable → thread-safe.',
  ],
  spring: [
    '@RestController = @Controller + @ResponseBody. ViewResolver: nombre de vista → View (no en REST).',
    'Query nativa: @Query(nativeQuery=true). Spring Batch: Job→Step→reader/processor/writer.',
    '@Transactional: rollback por unchecked (no checked → rollbackFor). Self-invocation NO aplica (proxy).',
    'Sin @Transactional: TransactionTemplate / PlatformTransactionManager / wrapper bean.',
    'AOP = cross-cutting (logging, seguridad, tx). @Pointcut afinado para no penalizar. MapStruct: mapper en compilación, sin reflexión.',
  ],
  arch: [
    'Capas: domain → application (use cases + ports) → infrastructure (adapters). Deps hacia el dominio.',
    'Driving (entrada: controller, listener) vs driven (salida: repo, cliente HTTP, productor Kafka).',
    'Repo: interfaz en domain, impl en infra. DTOs junto al controller. Dominio puro (sin HTTP/Kafka/JPA).',
    'BCs: lenguaje ubicuo, ownership, ciclo de vida, capacidad. Proyección cross-BC: read model (CQRS).',
    'Saga (compensación) para tx distribuida. ACL para aislar modelos externos. Entidad/VO/aggregate root.',
    'Microservicios: independientes pero complejidad distribuida. API gateway, circuit breaker, outbox.',
  ],
  rest: [
    'Content-Type = media type del body (header; produces/consumes en Spring). json/text-plain/multipart.',
    'PUT: reemplazo total, idempotente · PATCH: parcial, no necesariamente idempotente.',
    'Seguros: GET/HEAD/OPTIONS. Idempotentes: +PUT/DELETE. POST no idempotente.',
    'CRUD: GET /x, GET /x/{id}, POST /x (201+Location), PUT/PATCH /x/{id}, DELETE /x/{id} (204).',
    'OpenAPI: responses→content→schema. openapi-generator → interfaz que el controller implementa.',
  ],
  sec: [
    'AuthN (¿quién eres? 401) vs AuthZ (¿qué puedes? 403). AuthN antes que AuthZ; AuthZ en cada operación.',
    'OAuth2 = autorización delegada. OIDC = OAuth2 + id_token (login). SAML = XML + SSO empresarial.',
    'Flujos OAuth2: Auth Code + PKCE (apps/SPAs), Client Credentials (M2M), Refresh, Device.',
    'Keycloak: Realm (tenant) · Client (app) · Users · Roles (realm/client) · Groups · Identity Providers.',
    'JWT = header.payload.signature Base64Url (NO cifrado, decodificable). Access corto + refresh largo.',
    'Spring Security: FilterChain → AuthenticationManager → SecurityContext → AuthorizationManager.',
    '@EnableMethodSecurity + @PreAuthorize (SpEL) / @PostAuthorize / @Secured / @RolesAllowed.',
    'RBAC (roles+permisos) · ABAC (atributos+contexto, OPA/Rego) · ReBAC (relaciones).',
    'Passwords: NUNCA MD5/SHA-256 (rápidos). Usa bcrypt (cost 12+), Argon2 (PHC winner), scrypt.',
    'MFA: SMS (débil) < TOTP < Push < WebAuthn/passkeys (phishing-resistant por origin binding).',
    'CSRF = navegador envía cookie automáticamente. Defensas: token, SameSite, JWT en header.',
    'XSS = JS inyectado. Defensas: escape de salida, CSP, httpOnly en cookies, sanitización HTML.',
  ],
  cors: [
    'CORS = mecanismo del NAVEGADOR (same-origin). No es seguridad del servidor ni autorización.',
    'Falta Access-Control-Allow-Origin → el navegador bloquea la respuesta. Preflight OPTIONS para no-simples.',
    '401 = no autenticado (identifícate). 403 = autenticado sin permiso.',
    '404 = no existe. 500 = error del servidor (5xx servidor, 4xx cliente).',
  ],
  async: [
    'Endpoint lento → 202 Accepted + encolar + consumer. O @Async/CompletableFuture.',
    'Async = no bloqueas al caller. Reactivo = push + backpressure + pocos threads (Mono/Flux).',
    'Nunca bloquear en flujo reactivo (event loop). Virtual threads (J21) para I/O bloqueante simple.',
    'Thread-safe: inmutabilidad > locks/atomics/concurrentes. No: HashMap, ArrayList, SimpleDateFormat.',
  ],
  msg: [
    'Cola = point-to-point (1 consumidor). Topic = pub/sub. 10 pods en cola → 1 lee.',
    'Kafka: orden por partición → misma clave (hash). Particiones = paralelismo (max consumers/grupo = particiones).',
    'Offset/commit (antes=at-most-once, después=at-least-once). Consumer lag = no da abasto.',
    'At-least-once → idempotencia obligatoria. DLQ para fallidos. Exactly-once difícil entre sistemas.',
    'RabbitMQ: exchange (direct/topic/fanout) → binding → queue; ack/prefetch; mensaje se borra al consumir.',
    'Kafka (log persistente, reproducible, alto throughput) vs Rabbit (colas/routing, se consume y desaparece).',
  ],
  db: [
    'N:M = 3 tablas (unión con 2 FKs + PK compuesta). PK identifica; FK referencia (integridad referencial).',
    '1FN atómico · 2FN toda la clave (no parciales) · 3FN nada más que la clave (no transitivas).',
    'Índice compuesto: orden importa (prefijo más a la izquierda).',
    'ACID: Atomicidad, Consistencia, Aislamiento, Durabilidad.',
    'MVCC (Postgres/Oracle): varias versiones por fila, lectores no bloquean escritores.',
    'Deadlock = dos tx esperándose. Evita: orden consistente de locks, tx cortas, reintentos con backoff.',
    'Mongo: documental, embeber vs referenciar según acceso. Persistencia políglota.',
    'Neo4j (grafo): nodos+relaciones con propiedades, recorridos O(salto). Cypher: (a:Tipo)-[:REL]->(b).',
  ],
  sql: [
    'INNER = intersección. LEFT/RIGHT = + filas sueltas del lado con NULLs. CROSS = producto cartesiano.',
    'LEFT A(5)→B(10): ≥5. INNER 3 matches: 3.',
    'WHERE filtra filas (antes de agrupar) · HAVING filtra grupos (tras agregar).',
    'ORDER BY 1 = primera columna del SELECT (proyección, no tabla).',
    'NULL: NULL=NULL → NULL (usar IS NULL). COUNT(*) cuenta filas; COUNT(col) ignora NULLs.',
    'Orden lógico: FROM→WHERE→GROUP BY→HAVING→SELECT→DISTINCT→ORDER BY→LIMIT.',
  ],
  perf: [
    'PreparedStatement: anti-injection + plan cache + tipado + legibilidad.',
    'Plan de ejecución: árbol con coste estimado (EXPLAIN/EXPLAIN ANALYZE). Lee de dentro afuera.',
    'Buscas: seq scans inesperados, índices no usados, joins/sorts caros, estimado vs real distinto.',
    'Índices: B-tree (general), hash (=), GIN (jsonb/fulltext). Perjudica: escrituras, baja selectividad, tablas pequeñas.',
    'Covering index / index-only scan. N+1: JOIN FETCH / @EntityGraph / @BatchSize.',
  ],
  test: [
    'TDD: red → green → refactor (técnica de diseño). Mock (falso, tú defines) vs Spy (real, stub parcial).',
    '@Mock (test, sin Spring) vs @MockBean (en el contexto, integración).',
    'Unit (aislado, mocks) vs integración (infra real, Testcontainers). Pirámide: muchos unit, pocos E2E.',
    'Carga: JMeter/Gatling/k6; throughput + p95/p99 (no la media).',
    'SOLID: SRP, Open/Closed, Liskov, Interface Segregation, Dependency Inversion. FIRST + Given/When/Then.',
    'WireMock = stub de APIs externas. Mockear solo bordes, nunca dominio/mappers.',
  ],
  redis: [
    'In-memory, compartido entre instancias (vs caché local incoherente). Sub-ms, single-thread (atómico).',
    'Estructuras: string/hash/list/set/sorted set (rankings)/stream/HyperLogLog.',
    'TTL + eviction (allkeys-lru/lfu). Patrones: cache-aside, read/write-through, write-behind.',
    'Más que caché: sesiones, rate limiting, colas, pub/sub, locks distribuidos (SET NX PX + Lua).',
    'Persistencia RDB (snapshot) vs AOF (append, más durable). Cluster: sharding por hash slots + réplicas.',
  ],
  contracts: [
    'OpenAPI: spec REST (endpoints, schemas, responses). Contract-first vs code-first.',
    'openapi-generator → interfaz + DTOs; el controller la implementa. Breaking change → no compila.',
    'AsyncAPI = OpenAPI para eventos (Kafka/Rabbit): channels, publish/subscribe, bindings.',
    'Versionado: /v1, aditivo (no rompe), deprecación con gracia. Schema Registry: compat backward/forward/full.',
    'Contract testing (Pact): el consumidor define lo que espera; falla el build del proveedor si rompe.',
  ],
  patterns: [
    'GoF: creacionales (Singleton, Factory, Builder), estructurales (Adapter, Decorator, Facade, Proxy), comportamiento (Strategy, Observer, Template Method).',
    'Singleton: bean Spring por defecto. Antipatrón si es variable global con estado mutable.',
    'Strategy = lambda con interfaz funcional. Spring inyecta Map<String, Strategy>.',
    'Decorator añade comportamiento, Proxy controla acceso. @Transactional/@Cacheable = AOP proxy → cuidado self-invocation.',
    'Distribuidos: Saga (compensación) > 2PC. Outbox: escribir BD + evento atómico. Idempotent consumer obligatorio.',
    'CQRS: separa read/write. ACL aísla modelos externos. Anti-patterns: anemic domain, god class, primitive obsession.',
  ],
  obs: [
    '3 pilares: métricas (agregadas), logs (texto/JSON), traces (recorrido de petición).',
    'Prometheus + Micrometer: counter/gauge/histogram. p95/p99 (no la media). Cuidado cardinalidad de tags.',
    'OpenTelemetry estándar (CNCF) para producir telemetría. Spans anidados, traceparent header, sampling.',
    'Logs estructurados JSON + MDC (traceId/userId). Filebeat → Logstash → OpenSearch + Dashboards.',
    'Liveness (reinicia) vs Readiness (saca del Service). No confundir o reinicios en bucle.',
    'Resilience4j: circuit breaker, retry+backoff, rate limiter, bulkhead, time limiter.',
    'SLI (métrica) · SLO (objetivo interno) · SLA (contrato externo) · error budget (1-SLO).',
  ],
  algo: [
    'Big-O: O(1)<log n<n<n log n<n²<2ⁿ. Identifica el peor caso asintótico.',
    'ArrayList: get O(1), insert end amortized O(1), insert middle O(n). LinkedList rara vez es la mejor.',
    'HashMap: O(1) promedio. Java 8+: bucket con árbol rojinegro si >8 entradas → O(log n) peor caso.',
    'TreeMap/TreeSet: O(log n), ordenado. PriorityQueue: heap binario, O(log n).',
    'BFS = cola, camino más corto en aristas. DFS = pila/recursión, ciclos, topológico. Ambos O(V+E).',
    'Memoization (top-down) y DP (bottom-up): subestructura óptima + subproblemas solapados.',
    'Java sort: Arrays.sort primitivos = dual-pivot quicksort; Collections.sort = TimSort (estable).',
    'Patrones: two pointers, sliding window, divide y vencerás, greedy, backtracking.',
    'Concurrentes: ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue, LongAdder.',
  ],
  cc: [
    'Agentic (ejecuta) > autocomplete. Loop think→act→observe.',
    'CLAUDE.md: memoria del proyecto. Reglas/convenciones/comandos. NO código, NO secrets, NO git history.',
    'Subagents: aislan contexto, paralelizan, especializan (test-writer, architect).',
    'Plan mode para cambios grandes; aprobación humana antes de aplicar.',
    'Hooks: scripts en eventos (PreToolUse/PostToolUse/Stop).',
    'MCP = estándar abierto para integrar fuentes externas (Jira, GitHub, BBDD).',
    'NO delegues: arquitectura, revisión final, seguridad, código propietario en chats públicos.',
    'Verifica siempre: tests + build verde + lee el diff. La IA puede alucinar APIs.',
  ],
  k8s: [
    'Pod = unidad mínima. Deployment (stateless) vs StatefulSet (identidad estable) vs DaemonSet (1 por nodo).',
    'Service tipos: ClusterIP (interno), NodePort (debug), LoadBalancer (1 IP externa), Headless.',
    'Ingress > N LoadBalancers: 1 IP + reglas por host/path + TLS.',
    'Probes: liveness (reinicia), readiness (saca del Service), startup (arranque lento).',
    'NetworkPolicy: segmentación L3/L4 entre pods. Necesita CNI compatible (Calico, Cilium).',
    'Operators + CRDs = código vivo: Strimzi (Kafka), CNPG (Postgres HA), cert-manager.',
    'Requests = reserva (scheduling). Limits = máximo (throttling/OOMKilled).',
  ],
};

// ---------------------------------------------------------------------------
// EXPERIENCE (from src/data/experience.ts)
// ---------------------------------------------------------------------------

const PITCH = 'Ingeniero Informático (UCLM) con 6+ años desarrollando software, especializado en backend con Java y Spring Boot y con recorrido full-stack (Angular, React). He trabajado con microservicios y Kafka en varios proyectos y actualmente desarrollo Agata Next, plataforma de interoperabilidad portuaria event-driven sobre Kubernetes (RKE2) con ~40 microservicios conectores en arquitectura hexagonal estricta con Java 21, DDD, Kafka 4 (KRaft), MongoDB, Apache Flink (CEP) y Valkey, con OpenAPI/AsyncAPI contract-first, observabilidad completa (Prometheus + OpenSearch + OpenTelemetry) y testing con Testcontainers. Me interesa este rol porque encaja con lo que ya hago a diario (hexagonal, DDD, mensajería, clean code) y quiero seguir profundizando.';

const TECH_MATRIX = [
  { tech: 'Java (8 → 21)', level: 'fuerte', where: 'Todos los proyectos; Java 21 en Agata Next' },
  { tech: 'Spring Boot', level: 'fuerte', where: 'Agata, IBIL, OpenBank, mercado mayorista, Avanttic' },
  { tech: 'Arquitectura hexagonal', level: 'fuerte', where: 'Agata (estricta: domain/application/infrastructure)' },
  { tech: 'DDD', level: 'medio', where: 'Agata (dominio puro, value objects, agregados, ACL)' },
  { tech: 'Microservicios', level: 'fuerte', where: 'Agata (~40 conectores), IBIL, buscador turístico' },
  { tech: 'Kafka', level: 'fuerte', where: 'Agata Next: Kafka 4.0 KRaft, Strimzi, Schema Registry, REST Proxy, 3 brokers RF=3' },
  { tech: 'Apache Flink (CEP)', level: 'medio', where: 'Agata Next: 1 JM + 6 TM (114 task slots) para correlación de eventos' },
  { tech: 'RabbitMQ', level: 'conceptual', where: 'No en producción — conoces el modelo AMQP (exchanges, ack, DLQ)' },
  { tech: 'MQTT', level: 'medio', where: 'Agata: Mosquitto para conectores IoT y eventos CCTV' },
  { tech: 'JPA / Hibernate', level: 'fuerte', where: 'IBIL, mercado mayorista, Feebbo' },
  { tech: 'MongoDB', level: 'medio', where: 'Agata (ReplicaSet 3 nodos, Mongock para migraciones)' },
  { tech: 'PostgreSQL', level: 'medio', where: 'Agata (CNPG operator HA), Avanttic' },
  { tech: 'Neo4j (grafo)', level: 'conceptual', where: 'Agata Next: topología GIS de activos' },
  { tech: 'Valkey / Redis', level: 'medio', where: 'Agata (Valkey 8.1 cluster 3+3), mercado mayorista (Redis)' },
  { tech: 'Oracle / PL/SQL', level: 'medio', where: 'Avanttic (19c, migraciones), apps nativas (21c)' },
  { tech: 'OpenAPI / AsyncAPI / Contract-first', level: 'fuerte', where: 'Agata (~43 módulos con openapi-generator, validador AsyncAPI propio)' },
  { tech: 'Keycloak (OIDC/OAuth2/SAML)', level: 'medio', where: 'Agata Next: SSO + roles para Frontend/Grafana/Zabbix' },
  { tech: 'Spring Security / OAuth2 RS', level: 'medio', where: 'Agata (resource server + client)' },
  { tech: 'MapStruct', level: 'medio', where: 'Agata (mapeo entre capas, sin reflexión)' },
  { tech: 'Testing (JUnit 5, Mockito, Testcontainers, WireMock)', level: 'medio', where: 'Agata (Given/When/Then, Object Mothers)' },
  { tech: 'Observabilidad (Prometheus, OpenTelemetry, Grafana)', level: 'medio', where: 'Agata: micrometer + tracing OTel + dashboards' },
  { tech: 'OpenSearch / ELK', level: 'medio', where: 'Agata Next: logs centralizados (Filebeat + Logstash + OpenSearch)' },
  { tech: 'Resilience4j', level: 'medio', where: 'Agata: circuit breaker + retry en conectores externos' },
  { tech: 'Kubernetes (RKE2) / Docker', level: 'medio', where: 'Agata Next: cluster RKE2 sobre Proxmox, namespaces por dominio' },
  { tech: 'Angular / NgRx', level: 'fuerte', where: 'Dimática (reactivo), mercado mayorista (Angular 15)' },
  { tech: 'React / Redux / Next', level: 'medio', where: 'OpenBank, buscador turístico, Voice (Next)' },
];

const TIMELINE = [
  { period: 'Actual', org: 'Diverger — Agata Next', role: 'Desarrollador backend', stack: 'Java 21, Spring Boot, hexagonal estricta/DDD, ~40 microservicios conectores OT/IT, Kafka 4 (KRaft) + Flink CEP, MongoDB + Neo4j + Valkey + PostgreSQL (CNPG), Keycloak SSO, OpenAPI/AsyncAPI contract-first, MapStruct, Testcontainers/WireMock/Cucumber, OpenSearch + OpenTelemetry + Prometheus, RKE2 sobre Proxmox' },
  { period: '2023 – ahora', org: 'AvantGardeIT', role: 'Analista programador', stack: 'Voice (Next + ExpressJS + GCF), OpenBank (React + Spring Boot)' },
  { period: '2022 – 2023', org: 'Freelance (Colombia)', role: 'Analista programador', stack: 'Spring, Java 17, JPA, Redis, Kafka, Angular 15, Ionic' },
  { period: '2021 – 2022', org: 'AvantGardeIT', role: 'Analista programador', stack: 'IBIL: microservicios Spring Boot, Java 11, JPA, Kafka · Dimática: Angular/Ionic/NgRx' },
  { period: '2020 – 2021', org: 'El Inwebnadero', role: 'Socio y desarrollador', stack: 'React/Redux + Spring microservicios REST + Apache Kafka; Portlets JSP/Hibernate; Cordova + Oracle 21c' },
  { period: '2019', org: 'Avanttic (Madrid)', role: 'Fusion Middleware Consultant', stack: 'Oracle Jet, Cordova, Java; PL/SQL + Spring Boot + Oracle DB 19c' },
  { period: '2017 – 2018', org: 'INDRA / ESI / Feebbo', role: 'Programador', stack: 'Sistemas PI, Android Java, Python+cloud+REST, Java/Hibernate/Tapestry' },
];

const SELL = [
  'Hexagonal estricta + DDD a diario en Agata Next — estructura real de un conector (driving/driven, MapStruct, dominio puro).',
  'Kafka en varios proyectos: orden por partición, consumer groups, Schema Registry, eventos versionados, KRaft sin ZooKeeper.',
  'Event-driven con Apache Flink (CEP) para correlación en tiempo real — patrón moderno de streaming.',
  'OpenAPI + AsyncAPI contract-first con codegen — el contrato como fuente de verdad, valida cambios en CI.',
  'Persistencia políglota real: Mongo + Neo4j + Valkey + PostgreSQL en el mismo sistema.',
  'Observabilidad completa: Prometheus + Grafana + OpenSearch (logs) + OpenTelemetry (tracing).',
  'Seguridad: Keycloak con OIDC/OAuth2/SAML, resource server, mTLS interno.',
  'Clean Code y SOLID interiorizados (el proyecto los exige).',
  'Full-stack real: si hace falta tocar Angular/React, puedes (NgRx para reactividad en frontend).',
];

const COVER = [
  'RabbitMQ: la oferta lo pide y tu fuerte es Kafka. Repasa exchanges/colas/ack/DLQ y di la verdad: Kafka en prod, Rabbit a nivel de concepto.',
  'TDD y pruebas de carga/rendimiento: tu zona más floja. Repasa red-green-refactor y JMeter/Gatling/k6 + p95/p99.',
  'SQL teórico (joins con cardinalidades, 3FN, índices, planes): es donde más teoría preguntan.',
  'Reactividad backend (WebFlux/Reactor): conoces el concepto; no exageres la experiencia productiva.',
];

// ---------------------------------------------------------------------------
// STUDY PLAN (from src/data/studyPlan.ts)
// ---------------------------------------------------------------------------

const STUDY_PLAN = [
  {
    day: 1, title: 'Java funcional + Spring + Testing', hours: '~4h',
    topics: ['java', 'spring', 'test'],
    points: [
      'Streams: map vs flatMap, collect y Collectors.',
      'Interfaz funcional vs normal; interfaz vs clase abstracta.',
      '@Controller vs @RestController; query nativa @Query(nativeQuery=true).',
      '@Transactional: propagation, rollback por unchecked, self-invocation (proxy).',
      'AOP/aspectos: cross-cutting concerns, @Pointcut.',
      'Testing: TDD (red-green-refactor), Mock vs Spy, pirámide, SOLID/Clean Code.',
    ],
  },
  {
    day: 2, title: 'HTTP / REST / Seguridad + Contratos', hours: '~3h',
    topics: ['rest', 'sec', 'cors', 'contracts'],
    points: [
      'Content-Type, CRUD URLs, PUT vs PATCH, verbos seguros/idempotentes.',
      'Contract-first: OpenAPI → interfaz + DTOs. AsyncAPI para eventos.',
      'JWT: estructura, claims, acceso vs refresh token.',
      'CORS (same-origin, preflight). 401 vs 403.',
    ],
  },
  {
    day: 3, title: 'Arquitectura: DDD + Hexagonal + Microservicios + Patrones', hours: '~3-4h',
    topics: ['arch', 'patterns'],
    points: [
      'Capas hexagonales, puertos driving vs driven, dependencias hacia el dominio.',
      'DDD táctico: entidad/value object/aggregate root.',
      'Bounded contexts: lenguaje ubicuo, proyección cross-BC.',
      'Microservicios vs monolito; saga, outbox, circuit breaker.',
      'GoF: Strategy, Decorator vs Proxy, Builder. Antipatrones.',
    ],
  },
  {
    day: 4, title: 'Async + Mensajería + Redis + Observabilidad', hours: '~4h',
    topics: ['async', 'msg', 'redis', 'obs'],
    points: [
      'Endpoint 10s → 202 + encolar; @Async/CompletableFuture.',
      'Async vs Reactive; WebFlux/Mono/Flux; nunca bloquear en flujo reactivo.',
      'Kafka 4 KRaft: particiones, consumer groups, offset/lag, orden por clave.',
      'RabbitMQ: exchanges + bindings + ack/prefetch. Kafka vs RabbitMQ.',
      'Redis/Valkey: estructuras, TTL/eviction, cache-aside, locks distribuidos.',
      'Observabilidad: 3 pilares, Prometheus, OpenTelemetry, SLI/SLO/SLA.',
    ],
  },
  {
    day: 5, title: 'SQL — el día crítico', hours: '~4h',
    topics: ['db', 'sql', 'perf'],
    points: [
      'Joins con números: LEFT A(5)→B(10) = mínimo 5; INNER 3 matches = 3.',
      'Tipos de join, WHERE vs HAVING vs GROUP BY.',
      'Modelado N:M, 1FN/2FN/3FN, ACID y aislamiento.',
      'Índices: B-tree, compuestos, covering, cuándo perjudican.',
      'PreparedStatement: parámetros, plan cache, anti-injection.',
    ],
  },
  {
    day: 6, title: 'IA + mock + repaso de marcadas', hours: '~2-3h',
    topics: ['ia'],
    points: [
      'LLM: modelo Transformer entrenado para predecir el siguiente token.',
      'Precauciones con código privado: no pegar propietario en chats públicos.',
      'Mock interview: respóndete en voz alta usando el modo Quiz de cada topic.',
      'Repasa todas las cards marcadas como "Repasar".',
      'Prepara 2-3 anécdotas concretas: hexagonal+OpenAPI, Kafka, IA.',
    ],
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function qsByTopic(topicId) {
  return questions.filter(q => q.topicId === topicId);
}

function flashcardsSection(topicIds, label) {
  const lines = [`## Flashcards: ${label}\n`];
  for (const tid of topicIds) {
    const qs = qsByTopic(tid);
    if (!qs.length) continue;
    const topicLabel = tid.toUpperCase();
    lines.push(`### ${topicLabel} (${qs.length} preguntas)\n`);
    qs.forEach((q, i) => {
      // Strip markdown code blocks for cleaner audio
      const answer = q.answer.replace(/```[\s\S]*?```/g, '[ver código en la app]').replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      lines.push(`**Pregunta ${i + 1}:** ${q.question}\n`);
      lines.push(`**Respuesta:** ${answer}\n`);
      lines.push('---\n');
    });
  }
  return lines.join('\n');
}

function cheatsheetSection(topicIds) {
  const lines = ['## Chuletas (puntos clave)\n'];
  for (const tid of topicIds) {
    const cs = CHEATSHEETS[tid];
    if (!cs) continue;
    lines.push(`### ${tid.toUpperCase()}\n`);
    cs.forEach(p => lines.push(`- ${p}`));
    lines.push('');
  }
  return lines.join('\n');
}

function theorySection(topicIds) {
  const lines = ['## Teoría\n'];
  for (const tid of topicIds) {
    const t = THEORY[tid];
    if (!t) continue;
    lines.push(`### ${tid.toUpperCase()}\n`);
    lines.push(t);
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// MCQ LOADER (parse the MCQ.ts file as text and extract questions)
// ---------------------------------------------------------------------------

function loadMCQ() {
  // Read the compiled questions from questions.json (MCQ is in mcq.ts — we'll parse it manually)
  // Since mcq.ts is TypeScript, we strip it to extract the questions as objects.
  const mcqPath = path.resolve(__dirname, '../src/data/mcq.ts');
  const src = fs.readFileSync(mcqPath, 'utf8');

  // Extract each question block using a regex approach
  // Each block looks like: { id: '...', topicId: '...', question: '...', options: [...], correctIndex: N, explanation: '...' }
  const mcqBlocks = [];
  const blockRe = /\{\s*id:\s*'([^']+)',\s*topicId:\s*'([^']+)',\s*question:\s*'([^']+)',\s*options:\s*\[([\s\S]*?)\],\s*correctIndex:\s*(\d+),\s*explanation:\s*'((?:[^'\\]|\\.)*)'/g;

  let m;
  while ((m = blockRe.exec(src)) !== null) {
    const optionsRaw = m[4];
    // Extract each option string
    const optRe = /'((?:[^'\\]|\\.)*)'/g;
    const options = [];
    let om;
    while ((om = optRe.exec(optionsRaw)) !== null) {
      options.push(om[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));
    }
    mcqBlocks.push({
      id: m[1],
      topicId: m[2],
      question: m[3].replace(/\\'/g, "'"),
      options,
      correctIndex: parseInt(m[5]),
      explanation: m[6].replace(/\\'/g, "'").replace(/\\n/g, '\n'),
    });
  }
  return mcqBlocks;
}

// ---------------------------------------------------------------------------
// OUTPUT
// ---------------------------------------------------------------------------

const OUT = path.resolve(__dirname, '../notebooklm');
fs.mkdirSync(OUT, { recursive: true });

function write(filename, content) {
  const filepath = path.join(OUT, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  const kb = Math.round(content.length / 1024);
  console.log(`  ✓ ${filename} (${kb} KB)`);
}

console.log('\nGenerando archivos para NotebookLM...\n');

// ---------------------------------------------------------------------------
// ARCHIVO 1: Java + Spring + Testing
// ---------------------------------------------------------------------------

write('01-java-spring-testing.md', [
  '# Java · Spring · Testing\n',
  '> Fuente de estudio: teoría, chuletas y flashcards de Java, Spring Boot y Testing.\n',
  theorySection(['java', 'spring']),
  cheatsheetSection(['java', 'spring', 'test']),
  flashcardsSection(['java', 'spring', 'test'], 'Java + Spring + Testing'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 2: Arquitectura + DDD + Patrones
// ---------------------------------------------------------------------------

write('02-arquitectura-ddd-patrones.md', [
  '# Arquitectura · DDD · Patrones de Diseño\n',
  '> Hexagonal, DDD táctico y estratégico, microservicios, GoF y patrones distribuidos.\n',
  theorySection(['arch', 'patterns']),
  cheatsheetSection(['arch', 'patterns']),
  flashcardsSection(['arch', 'patterns'], 'Arquitectura + Patrones'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 3: Mensajería + Async + Streaming
// ---------------------------------------------------------------------------

write('03-mensajeria-async-streaming.md', [
  '# Mensajería · Asíncrono · Streaming\n',
  '> Kafka, RabbitMQ, Apache Flink, programación reactiva, virtual threads y concurrencia.\n',
  theorySection(['async', 'msg']),
  cheatsheetSection(['async', 'msg']),
  flashcardsSection(['async', 'msg'], 'Mensajería + Async'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 4: SQL + BBDD + Performance
// ---------------------------------------------------------------------------

write('04-sql-bbdd-performance.md', [
  '# SQL · Bases de Datos · Performance\n',
  '> Modelado relacional, normalización, ACID, MongoDB, joins, índices, planes de ejecución.\n',
  theorySection(['db', 'sql', 'perf']),
  cheatsheetSection(['db', 'sql', 'perf']),
  flashcardsSection(['db', 'sql', 'perf'], 'SQL + BBDD + Performance'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 5: Seguridad + REST + CORS + Contratos
// ---------------------------------------------------------------------------

write('05-seguridad-rest-contratos.md', [
  '# Seguridad · REST · CORS · Contratos de API\n',
  '> OAuth2, OIDC, JWT, Keycloak, Spring Security, CORS/CSRF, OpenAPI, AsyncAPI, Pact.\n',
  cheatsheetSection(['rest', 'sec', 'cors', 'contracts']),
  flashcardsSection(['rest', 'sec', 'cors', 'contracts'], 'Seguridad + REST + Contratos'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 6: Redis + Observabilidad + Kubernetes
// ---------------------------------------------------------------------------

write('06-redis-observabilidad-kubernetes.md', [
  '# Redis / Valkey · Observabilidad · Kubernetes\n',
  '> Caché, locks distribuidos, métricas, trazas, logs, SLI/SLO, K8s.\n',
  theorySection(['obs']),
  cheatsheetSection(['redis', 'obs', 'k8s']),
  flashcardsSection(['redis', 'obs', 'k8s'], 'Redis + Obs + K8s'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 7: Algoritmos + Claude Code + IA
// ---------------------------------------------------------------------------

write('07-algoritmos-ia-cc.md', [
  '# Algoritmos · Inteligencia Artificial · Claude Code\n',
  '> Big-O, estructuras de datos, LLMs, RAG, prompt injection, Claude Code agentic.\n',
  cheatsheetSection(['algo', 'cc']),
  flashcardsSection(['algo', 'cc', 'ia'], 'Algoritmos + IA + Claude Code'),
].join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 8: Todas las preguntas de test MCQ (con explicaciones)
// ---------------------------------------------------------------------------

const mcqData = loadMCQ();
const mcqByTopic = {};
mcqData.forEach(q => {
  if (!mcqByTopic[q.topicId]) mcqByTopic[q.topicId] = [];
  mcqByTopic[q.topicId].push(q);
});

const mcqLines = [
  '# Preguntas de Test con Opciones Múltiples (MCQ)\n',
  `> ${mcqData.length} preguntas de selección múltiple con explicaciones completas.\n`,
  '> Útil para el repaso activo: intenta responder antes de leer la respuesta correcta.\n',
];

const topicOrder = ['java', 'spring', 'arch', 'rest', 'sec', 'cors', 'async', 'msg', 'db', 'sql', 'perf', 'test', 'redis', 'contracts', 'patterns', 'obs', 'algo', 'ia', 'cc', 'k8s'];
for (const tid of topicOrder) {
  const qs = mcqByTopic[tid];
  if (!qs || !qs.length) continue;
  mcqLines.push(`\n## ${tid.toUpperCase()} (${qs.length} preguntas)\n`);
  qs.forEach((q, i) => {
    mcqLines.push(`**Pregunta ${i + 1}:** ${q.question}\n`);
    q.options.forEach((opt, idx) => {
      const marker = idx === q.correctIndex ? '✓' : ' ';
      mcqLines.push(`${marker} ${String.fromCharCode(65 + idx)}) ${opt}`);
    });
    mcqLines.push(`\n**Explicación:** ${q.explanation.replace(/\*\*([^*]+)\*\*/g, '$1')}\n`);
    mcqLines.push('---\n');
  });
}

write('08-preguntas-test-mcq.md', mcqLines.join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 9: Experiencia personal + plan de estudio
// ---------------------------------------------------------------------------

const expLines = [
  '# Mi Perfil y Experiencia Profesional\n',
  '> Pitch, matriz de tecnologías, trayectoria, puntos a vender y a cubrir. Plan de estudio de 6 días.\n',
  '\n## Pitch profesional\n',
  PITCH,
  '\n## Trayectoria profesional\n',
];
TIMELINE.forEach(t => {
  expLines.push(`\n### ${t.period} — ${t.org}`);
  expLines.push(`**Rol:** ${t.role}`);
  expLines.push(`**Stack:** ${t.stack}`);
});
expLines.push('\n## Matriz de tecnologías\n');
expLines.push('| Tecnología | Nivel | Contexto |');
expLines.push('|---|---|---|');
TECH_MATRIX.forEach(row => {
  expLines.push(`| ${row.tech} | ${row.level} | ${row.where} |`);
});
expLines.push('\n## Puntos a vender en la entrevista\n');
SELL.forEach(s => expLines.push(`- ${s}`));
expLines.push('\n## Puntos a cubrir / áreas de mejora\n');
COVER.forEach(c => expLines.push(`- ${c}`));
expLines.push('\n---\n');
expLines.push('# Plan de Estudio de 6 Días\n');
STUDY_PLAN.forEach(d => {
  expLines.push(`\n## Día ${d.day}: ${d.title} (${d.hours})\n`);
  d.points.forEach(p => expLines.push(`- ${p}`));
});

write('09-experiencia-y-plan.md', expLines.join('\n'));

// ---------------------------------------------------------------------------
// ARCHIVO 10: Preguntas para el entrevistador
// ---------------------------------------------------------------------------

const INTERVIEWER_SECTIONS = [
  {
    title: 'Equipo, cultura y proceso',
    intro: 'Estas son las preguntas que mejor te dicen cómo es el día a día. Las respuestas "depende" o evasivas son una señal. Las concretas son verdes.',
    questions: [
      { q: '¿Cómo es el flujo de trabajo del equipo? ¿Cómo aplicáis Scrum/Kanban en el día a día (ceremonias, tamaño de sprint, planning)?', why: 'Si recitan la guía Scrum pero no tienen retro o no la usan, es bandera amarilla.' },
      { q: '¿Cómo se prioriza el backlog? ¿Lo lleva Producto, el Tech Lead, el equipo?' },
      { q: '¿Cuál es la cultura de code review? ¿Se hace en serio o es trámite?' },
      { q: '¿Cómo manejáis la deuda técnica? ¿Hay tiempo dedicado en cada sprint?' },
      { q: '¿Cómo es la relación con Producto? ¿Os involucran desde el principio o llega el ticket cerrado?' },
      { q: '¿Hacéis pair programming, mob, o cada uno con su tarea?' },
    ],
  },
  {
    title: 'Técnico y arquitectura',
    intro: 'Sondea si la realidad coincide con la oferta. Lo que dicen aquí debería ser específico.',
    questions: [
      { q: '¿Qué grado de adopción tenéis de hexagonal/DDD y cuán estricto es? ¿Hay ADRs?', why: 'Quieres saber si "hexagonal" es real o nombre del archivo.' },
      { q: '¿Usáis Kafka, RabbitMQ o ambos? ¿Qué casos resuelve cada uno?' },
      { q: '¿Cuál es vuestra estrategia de contratos? ¿OpenAPI contract-first, AsyncAPI, contract testing?' },
      { q: '¿Cómo gestionáis transacciones que cruzan microservicios? ¿Saga, outbox, eventos?' },
      { q: '¿Qué versión de Java/Spring Boot estáis usando? ¿Habéis adoptado virtual threads, records, pattern matching?' },
      { q: '¿Qué decisiones de arquitectura os habéis arrepentido en los últimos 12 meses?', why: 'Buenos equipos lo reconocen sin problema.' },
    ],
  },
  {
    title: 'CI/CD, entornos y entrega',
    intro: 'Buena señal: pipelines automatizados, despliegues frecuentes. Mala señal: "deploy los viernes a las 18:00 a mano".',
    questions: [
      { q: '¿Cómo es el camino de un commit hasta producción? ¿Cuánto tarda y qué pasos automáticos hay?' },
      { q: '¿Con qué frecuencia desplegáis a producción?' },
      { q: '¿Tenéis entornos efímeros para PRs / feature branches?' },
      { q: '¿Qué hacéis cuando algo se rompe en producción? ¿Tenéis rollback automático?' },
      { q: '¿Tenéis runbooks de incidentes y post-mortems blameless?' },
    ],
  },
  {
    title: 'Observabilidad y operación',
    intro: 'Aquí distingues equipos que reaccionan a quejas de los que detectan problemas antes que el usuario.',
    questions: [
      { q: '¿Tenéis SLOs definidos y error budgets?', why: 'SLOs + error budget es la frase mágica de equipos maduros.' },
      { q: '¿Qué stack de observabilidad usáis (Prometheus, Grafana, OpenTelemetry, OpenSearch/ELK)?' },
      { q: '¿Tenéis tracing distribuido funcional?' },
      { q: '¿Resilience4j o algo equivalente en sitio? ¿Habéis tenido cascading failures?' },
    ],
  },
  {
    title: 'Producto, negocio y dirección',
    intro: 'Sirve para entender si la empresa sabe a dónde va y por qué.',
    questions: [
      { q: '¿Cuál es el reto técnico más grande del equipo en los próximos 6-12 meses?' },
      { q: '¿Qué porcentaje del trabajo es feature nuevo vs mantenimiento vs deuda técnica?' },
      { q: '¿Cómo medís el éxito del equipo? ¿Velocidad, calidad, métricas DORA?' },
    ],
  },
  {
    title: 'Onboarding, crecimiento y persona',
    intro: 'Si estás dispuesto a aceptar el puesto, esto importa más que el stack.',
    questions: [
      { q: '¿Cómo es el onboarding? ¿Cuánto tardan los nuevos en hacer su primer cambio en producción?' },
      { q: '¿Qué expectativas tendríais de mí en los primeros 3, 6 y 12 meses?' },
      { q: '¿Cómo es la trayectoria de carrera? ¿Tech lead, principal, manager?' },
      { q: '¿Hay presupuesto/tiempo para formación, conferencias, libros?' },
      { q: '¿Por qué te gusta trabajar aquí?', why: 'La respuesta dice más que toda la entrevista junta.' },
      { q: 'Si pudieras cambiar una cosa del equipo, ¿cuál sería?', why: 'Si dicen "nada", no son honestos.' },
    ],
  },
];

const intLines = [
  '# Preguntas para Hacer al Entrevistador\n',
  '> 6 categorías con preguntas clave. Haz al menos 3-4 en cada entrevista. Las mejores revelan la madurez real del equipo.\n',
  '\n## Las 5 esenciales (no te vayas sin preguntar estas)\n',
  '1. ¿Cuál es el reto técnico más grande del equipo ahora mismo?',
  '2. ¿Qué decisiones de arquitectura os habéis arrepentido en los últimos 12 meses?',
  '3. ¿Cómo es el camino de un commit hasta producción y con qué frecuencia desplegáis?',
  '4. ¿Qué expectativas tendríais de mí en los primeros 3-6 meses?',
  '5. ¿Qué cambiarías del equipo si pudieras?\n',
];

INTERVIEWER_SECTIONS.forEach(section => {
  intLines.push(`\n## ${section.title}\n`);
  intLines.push(`*${section.intro}*\n`);
  section.questions.forEach(q => {
    intLines.push(`- **${q.q}**`);
    if (q.why) intLines.push(`  *(${q.why})*`);
  });
});

write('10-preguntas-al-entrevistador.md', intLines.join('\n'));

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

const files = fs.readdirSync(OUT).filter(f => f.endsWith('.md'));
const totalKB = files.reduce((acc, f) => {
  return acc + fs.statSync(path.join(OUT, f)).size;
}, 0);

console.log(`\nTotal: ${files.length} archivos · ${Math.round(totalKB / 1024)} KB\n`);
console.log('Carpeta: notebooklm/');
console.log('\nInstrucciones para NotebookLM:');
console.log('  1. Abre https://notebooklm.google.com');
console.log('  2. Nuevo notebook → "Añadir fuentes" → subir los 10 archivos .md');
console.log('  3. Click en "Generar audio overview" → escucha mientras caminas');
