// Resúmenes teóricos por tema: narrativa más larga que las chuletas, que ata
// los conceptos clave en lugar de listarlos sueltos. Markdown.

export interface TheorySection {
  topicId: string;
  body: string;
}

export const THEORY: TheorySection[] = [
  {
    topicId: 'java',
    body: `**Java funcional y moderno.** Los **streams** son una vista perezosa sobre una colección: encadenas operaciones intermedias (\`filter\`, \`map\`, \`flatMap\`, \`sorted\`) que no se ejecutan hasta una operación **terminal** (\`collect\`, \`forEach\`, \`reduce\`). La diferencia importante entre \`map\` y \`flatMap\` es la dimensionalidad: \`map\` transforma 1→1, \`flatMap\` aplana \`Stream<Stream<T>>\` en \`Stream<T>\` — útil cuando cada elemento se expande en varios.

Una **interfaz funcional** tiene exactamente un método abstracto y por eso aceptas lambdas donde se espera (\`Function\`, \`Predicate\`, \`Consumer\`, \`Supplier\`, \`Comparator\`). Las **clases abstractas** llevan estado y lógica compartida, pero solo herencia simple; usa interfaz para contratos entre clases no relacionadas, abstracta para una jerarquía con código común. **Records** (J16+) son clases inmutables con \`equals/hashCode\` generados — ideales como DTOs, value objects de DDD y mensajes thread-safe por construcción.

Java moderno (21/25) trae **virtual threads** (Loom): millones de hilos ligeros gestionados por la JVM, ideales para servidores I/O-bound que vuelven a escribir código bloqueante normal. **Pattern matching** + **sealed types** + **switch expressions** modelan jerarquías cerradas con comprobación de exhaustividad en compilación. **Sequenced collections** uniforman \`first/last\` en colecciones ordenadas. **Structured concurrency** y **scoped values** suceden a \`ThreadLocal\` para propagar contexto de forma segura con Loom.

**Thread safety** se consigue por (en orden de preferencia): inmutabilidad (records), estructuras concurrentes (\`ConcurrentHashMap\`), atomics (CAS), sincronización clásica (\`synchronized\`/locks), confinamiento. Nunca asumas que algo es thread-safe; \`HashMap\`, \`ArrayList\` y \`SimpleDateFormat\` no lo son.`,
  },
  {
    topicId: 'spring',
    body: `**Spring Boot** es Spring con autoconfiguración y starters: añades \`spring-boot-starter-web\`, define endpoints y arranca un servidor embebido. Los \`@Controller\` devuelven nombres de vista resueltos por un \`ViewResolver\`; los \`@RestController\` añaden \`@ResponseBody\` a todo y serializan al body (JSON con Jackson por defecto). En APIs REST puras se usa el segundo; en aplicaciones con vistas, el primero.

**Transacciones.** \`@Transactional\` envuelve el método en una transacción gestionada por un \`PlatformTransactionManager\` mediante **proxy AOP**. Por defecto hace rollback ante excepciones **unchecked**; las checked no lo disparan, salvo \`rollbackFor\`. La trampa más común es **self-invocation**: si llamas \`this.metodo()\` desde otro método del mismo bean, el proxy no intercepta y la anotación se ignora; la transacción debe entrar **desde fuera del bean**. La **propagación** controla la composición: \`REQUIRED\` (default) se une o crea, \`REQUIRES_NEW\` suspende y abre otra independiente, \`NESTED\` usa savepoints. Para transacciones cruzando dos BD, lo moderno es **saga + outbox** en vez de XA/2PC.

**AOP (programación orientada a aspectos).** Separa las preocupaciones transversales (logging, métricas, seguridad, transacciones, caché) de la lógica de negocio. Se compone de un **aspecto** (\`@Aspect\`), un **advice** (\`@Around\`, \`@Before\`, \`@After\`) y un **pointcut** (\`@Pointcut\`, dónde se aplica). El propio \`@Transactional\` y \`@Cacheable\` son AOP — de ahí la trampa del self-invocation con proxies. Para no penalizar rendimiento: pointcut afinado, advice ligero, asíncrono donde el efecto no sea crítico, y monitorización.

**MapStruct** genera mappers en tiempo de compilación: sin reflexión, type-safe y rápidos. Es la pieza clave en hexagonal para traducir entre dominios y DTOs (REST/Kafka) sin contaminar el dominio.`,
  },
  {
    topicId: 'arch',
    body: `**Arquitectura hexagonal (ports & adapters)** organiza el código en tres anillos: **dominio** (modelo y reglas), **aplicación** (casos de uso y puertos — interfaces de entrada y de salida), e **infraestructura** (adaptadores que implementan los puertos). La regla cardinal: las dependencias **apuntan hacia el dominio**. El dominio no sabe de HTTP, JPA, Kafka ni Spring; lo que llamas a "fuera" lo haces a través de un **puerto** que tú definiste y la infraestructura implementa. Esto hace el dominio testeable sin levantar BD ni frameworks, y portable a cualquier tecnología.

Los **adaptadores driving** (REST controllers, listeners Kafka, schedulers) invocan **puertos de entrada** (casos de uso). Los **adaptadores driven** (repositorios JPA/Mongo, clientes HTTP, productores Kafka) implementan **puertos de salida** declarados por el dominio. Los DTOs viven junto a su adaptador (REST DTOs junto al controller; eventos Kafka junto al productor) y se mapean al dominio con MapStruct.

**DDD táctico.** Diferencia tres bloques: **entidades** (identidad propia que persiste; cómic con id), **value objects** (definidos por sus atributos, inmutables; \`Dinero\`, \`Email\`), y **aggregate roots** (la entidad raíz que garantiza invariantes de un grupo tratado como unidad de consistencia; una transacción modifica un solo agregado). La lógica de negocio vive **dentro** del agregado, no en servicios anémicos. Cuando una operación cruza agregados, usa **domain services**. Los **domain events** publicados al cambiar el estado desacoplan reacciones.

**DDD estratégico: bounded contexts.** Se separan por **lenguaje ubicuo** (misma palabra, significado distinto → contexto distinto), ownership de equipo, capacidad de negocio, independencia de despliegue, ciclo de vida y consistencia requerida. La proyección de datos de dos BCs nunca vive en ninguno de los dos: se hace en un **read model dedicado** (CQRS) que consume eventos de ambos. Una **Anti-Corruption Layer** te aísla del modelo de un sistema externo.

**Microservicios.** No son la respuesta por defecto. Aportan despliegue/escalado independiente, ownership por equipo y aislamiento de fallos, a cambio de **complejidad distribuida**: red, consistencia eventual, observabilidad, versionado de contratos, almacén por servicio. Patrones esenciales: **API gateway**, **service discovery**, **circuit breaker**, **saga** para transacciones distribuidas (con compensación, no 2PC), **outbox** para publicar eventos atómicamente con la BD, **CQRS** para lecturas/escrituras asimétricas, **observabilidad** con tracing distribuido.`,
  },
  {
    topicId: 'async',
    body: `**Asíncrono ≠ Reactivo**, aunque se confundan. Asíncrono significa que el caller no se bloquea esperando la respuesta; se implementa con callbacks, futures, hilos. **Reactivo** es un paradigma específico basado en **streams de datos**, **push desde la fuente**, **backpressure** (el consumidor controla el ritmo del productor) y **non-blocking I/O** sobre pocos threads en un event loop. En Java son \`Mono<T>\` y \`Flux<T>\` de **Project Reactor** (la base de Spring WebFlux). Todo reactivo es asíncrono, pero no al revés: un \`CompletableFuture\` es asíncrono, no reactivo (sin backpressure, modelo pull).

**Cuándo elegir reactivo.** Aporta mucho cuando tienes **alta concurrencia con I/O** y toda la cadena puede ser no bloqueante (R2DBC en vez de JDBC, WebClient en vez de RestTemplate, Mongo/Redis reactivos). Si solo una pieza bloquea, paralizas el event loop y pierdes la ventaja. **Nunca bloquees dentro de un flujo reactivo**: nada de \`Thread.sleep\`, \`.block()\`, JDBC síncrono; si tienes que bloquear, aíslalo en un scheduler dedicado (\`subscribeOn(Schedulers.boundedElastic())\`). Reactor expone operadores: \`map\` transforma valores; \`flatMap\` cuando la transformación devuelve otro Mono/Flux (evita \`Mono<Mono<T>>\`); \`doOnNext\` para side effects; \`zip\` para combinar; \`onErrorResume\` para manejar errores.

**Virtual threads (Java 21+)** cambian la ecuación. Permiten escribir código **bloqueante y secuencial** que escala a millones de hilos sin necesidad de modelo reactivo: la JVM desmonta el virtual del platform thread cuando bloquea por I/O. Regla práctica: si tu problema es "muchas peticiones I/O-bound" → virtual threads (más simple, depuración natural); si es "streams de datos con composición y control de flujo" → reactivo. Loom no elimina reactivo; resuelve un subconjunto importante de sus casos.

**Convertir un endpoint lento en asíncrono.** El patrón canónico: encolar el trabajo (Kafka/SQS/Rabbit) y devolver \`202 Accepted\` con un id para consultar estado; un consumer aparte lo procesa. Alternativas in-process (\`@Async\` + \`CompletableFuture\`) son útiles pero si el pod muere, se pierde. **Thread safety**: la mejor herramienta es la inmutabilidad; luego estructuras concurrentes, atomics, y solo cuando hace falta, sincronización clásica.`,
  },
  {
    topicId: 'msg',
    body: `**Kafka** es un **log distribuido persistente y particionado**, no una cola. Los mensajes se **retienen** (no se borran al leerse) → se pueden **reproducir**; brutal para alto throughput, streaming, event sourcing y varios consumer groups leyendo lo mismo. Internamente cada topic se divide en **particiones**, cada una un log ordenado independiente que puede replicarse (RF=3, ISR=2 es lo típico). El **orden** solo se garantiza dentro de una partición; para que dos mensajes salgan ordenados al consumer, deben ir a la misma partición → misma **clave** (Kafka hace \`hash(key) % particiones\`). El **paralelismo** lo dan las particiones: máximo consumers activos por grupo = nº de particiones. Cada consumer group recuerda su **offset** y va commiteando; commitear antes de procesar = at-most-once (pierdes), después = at-least-once (puedes duplicar). La realidad práctica es **at-least-once**, así que **idempotencia obligatoria** en el consumer. Los mensajes fallidos van a una **DLQ** tras N reintentos. Kafka 4 introduce **KRaft** (sin ZooKeeper), simplifica la operación.

**RabbitMQ** es un broker **AMQP** centrado en *routing*: el productor publica a un **exchange**, que enruta a colas según **bindings** y **routing key**. Tipos de exchange: \`direct\` (key exacta), \`topic\` (patrones con comodines), \`fanout\` (broadcast), \`headers\`. Los consumers leen de colas y hacen **ack/nack**; sin ack, reentrega. **Prefetch** (QoS) limita cuántos mensajes sin ack recibe un consumer (reparto justo). A diferencia de Kafka, el mensaje **se borra al consumirse**: no es un log reproducible.

**Cuándo cada uno.** Kafka para streams de eventos de alto volumen, reproducibles, varios consumidores que leen lo mismo, event sourcing. RabbitMQ para colas de comandos/tareas con routing fino y volumen menor, donde el mensaje se consume y desaparece. Muchos sistemas reales usan ambos.

**Apache Flink** sube el listón sobre Kafka Streams: motor de **procesamiento de streams** con estado, ventanas avanzadas (tumbling, sliding, session, event-time + watermarks), checkpoints periódicos para exactly-once dentro del job, state backend RocksDB para estado enorme, y **CEP** (Complex Event Processing) para correlacionar eventos en tiempo real. Arquitectura: 1 JobManager + N TaskManagers con M slots cada uno. En Ágata Next se usan 6 TM con 19 slots cada uno (114 totales) para CEP de eventos OT/IT.

**Garantías y patrones.** At-least-once por defecto → idempotencia + DLQ. Exactly-once existe dentro de Kafka (transactional producer + Streams/Flink) pero es difícil entre sistemas externos. Para publicar de forma atómica con la BD usa el **patrón Outbox** (mismo tx). Eventos versionados (\`pedido-creado.v1\`), Schema Registry (Avro/JSON Schema) para evolución compatible.`,
  },
  {
    topicId: 'db',
    body: `**Modelado relacional.** Una **clave primaria** identifica unívocamente cada fila; una **clave foránea** referencia la PK de otra tabla. La **integridad referencial** la garantiza la BD con la constraint \`FOREIGN KEY\` y políticas (\`CASCADE\`, \`SET NULL\`, \`RESTRICT\`). Una relación **N:M** se modela con **tres tablas**: las dos entidades + tabla de unión con dos FKs y PK compuesta; si la relación tiene atributos propios (fecha, rol), van en la intermedia.

**Normalización.** **1FN**: valores atómicos (nada de \`telefonos = '600..., 601...'\`). **2FN**: está en 1FN y no hay dependencias parciales de una clave compuesta (si la PK es \`(pedido_id, producto_id)\`, \`nombre_producto\` depende solo de \`producto_id\` → sacarlo a otra tabla). **3FN**: en 2FN y sin dependencias transitivas (ningún atributo no clave depende de otro no clave). Mnemotécnico: 1FN atómico · 2FN toda la clave · 3FN nada más que la clave. Hay más formas (BCNF, 4FN), pero hasta 3FN cubre el 95% de los casos. **Desnormalizar** es válido para rendimiento si lo mides, pero asume duplicación controlada.

**ACID e aislamiento.** A=atomicidad (todo o nada), C=consistencia (estado válido a válido), I=aislamiento (las tx concurrentes no se pisan), D=durabilidad (lo commiteado persiste). El **aislamiento** tiene niveles que eliminan anomalías progresivamente: \`READ UNCOMMITTED\` (dirty reads), \`READ COMMITTED\` (no dirty pero sí non-repeatable), \`REPEATABLE READ\` (la misma fila no cambia, puede haber phantoms), \`SERIALIZABLE\` (sin anomalías, pero más bloqueos). Más aislamiento = más correcto pero menos concurrencia. Postgres y Oracle por defecto \`READ COMMITTED\`; MySQL InnoDB \`REPEATABLE READ\`.

**NoSQL documental: MongoDB.** Almacena documentos JSON/BSON sin esquema rígido. Encaja cuando los datos son **jerárquicos y se leen juntos** (un pedido con sus líneas como un documento), el esquema **evoluciona rápido**, o necesitas **escalado horizontal**. Modelar va por **patrones de acceso**, no por 3FN: embebes lo que se lee/escribe junto (líneas dentro del pedido), referencias por id cuando el sub-doc crece sin límite, se consulta por separado, o la relación es N:M.

**Persistencia políglota.** En microservicios, el almacén adecuado a cada necesidad: relacional para transaccional con integridad, documental para agregados que se leen juntos, Redis/Valkey para caché/sesiones/locks/contadores, Neo4j para grafos (topología, relaciones recursivas), búsqueda (OpenSearch) para full-text, object storage (S3/MinIO) para binarios. En Agata Next conviven Mongo + Neo4j + Valkey + PostgreSQL — cada uno por su caso de uso, **database-per-service**.`,
  },
  {
    topicId: 'sql',
    body: `**Joins** combinan filas de varias tablas según una condición \`ON\`. **INNER** devuelve solo la intersección (filas con coincidencia en ambas). **LEFT (OUTER)** devuelve todas las filas de la tabla izquierda + las casadas de la derecha (NULLs donde no haya match); **RIGHT** es el simétrico. **FULL** devuelve ambos lados (NULLs por el lado que no case). **CROSS** es el producto cartesiano (todas con todas, sin condición — peligroso si lo haces sin querer). **SELF JOIN** une una tabla consigo misma (empleado → su jefe, ambos en \`empleados\`).

Las **preguntas trampa** clásicas con números. *Tabla A(5) LEFT JOIN B(10): ¿cuántas filas?* La respuesta no es 5 a secas: es **al menos 5** (una por cada fila de A; más si una fila de A casa con varias de B; con NULLs si no casa). El "5" solo vale si la cardinalidad es 1:1. *INNER JOIN con 3 coincidencias = 3* (asumiendo 1:1). *LEFT JOIN ≥ INNER* siempre, porque el LEFT incluye lo del INNER más las filas sueltas de la izquierda. Mismo razonamiento simétrico para RIGHT.

**WHERE filtra filas, HAVING filtra grupos.** El orden lógico de un SELECT no es como lo escribes: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT. Por eso no puedes usar un alias del SELECT en el WHERE (no se ha evaluado todavía), pero sí en el ORDER BY. \`ORDER BY 1\` ordena por la **primera columna del SELECT** (posicional) — no por una columna concreta de una tabla. \`HAVING\` sin \`GROUP BY\` es válido cuando hay un agregado sobre todo el conjunto (grupo único implícito): \`SELECT COUNT(*) FROM ventas HAVING COUNT(*) > 100\` devuelve 0 o 1 fila.

**NULL es "desconocido"**, no un valor. \`NULL = NULL\` da NULL (no \`true\`); para comparar usa \`IS NULL\`. Los agregados ignoran NULL: \`COUNT(*)\` cuenta filas (incluidas las que tienen NULLs), \`COUNT(col)\` cuenta filas donde \`col\` no es NULL. \`AVG\` promedia solo los no-NULL, no los trata como 0. \`COALESCE(col, default)\` sustituye NULLs.

**Subqueries vs joins.** Usa JOIN cuando necesitas columnas de ambas tablas en el resultado; subquery cuando solo filtras o calculas un valor. **EXISTS** es seguro frente a NULLs y suele ser más eficiente que **IN** con subqueries grandes (para en cuanto encuentra una fila). \`NOT IN\` con un subselect que tiene NULLs te puede vaciar el resultado inesperadamente — usa \`NOT EXISTS\`.`,
  },
  {
    topicId: 'perf',
    body: `**PreparedStatement** vs Statement plano. El PreparedStatement parametriza la query: los valores van separados del SQL, así que **no se interpretan como código** (anti-SQL-injection). Además, el motor **parsea, planifica y optimiza una sola vez** la query parametrizada; ejecuciones posteriores reutilizan el plan (plan cache). Y los \`setX\` tipados evitan errores de formato y quoting. Sin PreparedStatement no hay defensa contra inyección ni reuso de plan, y los strings concatenados son frágiles.

**Plan de ejecución.** \`EXPLAIN\` (estimación) y \`EXPLAIN ANALYZE\` (ejecuta y muestra coste real) en Postgres; \`DBMS_XPLAN\` en Oracle; \`EXPLAIN\` en MySQL. Devuelve un **árbol de operaciones** que se lee de adentro hacia afuera: las hojas son accesos a tablas (seq scan, index scan, index-only scan), los nodos intermedios son joins (nested loop, hash join, merge join) y operaciones (sort, hash, filter), y la raíz es el resultado. Cada nodo lleva un **coste estimado** (formato \`startup_cost..total_cost rows=... width=...\` en Postgres) que es una estimación abstracta de I/O + CPU; sirve para comparar planes, no para medir ms reales.

**Qué buscar en el árbol.** Full table scans (seq scan) inesperados sobre tablas grandes — falta índice o el optimizador decidió que no compensa por baja selectividad. Índices que esperabas usar y no se usan — suele ser por **estadísticas obsoletas** (corre \`ANALYZE\`), una función sobre la columna (\`WHERE LOWER(email) = ...\` no usa el índice de \`email\` salvo que tengas índice funcional), o cast implícito. Joins ineficientes (nested loop con muchas filas en el lado externo). Sorts y hash que se desbordan a disco. Estimación vs filas reales muy distintas en \`ANALYZE\`.

**Índices.** El B-tree es el general (igualdad, rangos, prefijos de LIKE, ORDER BY). Hash solo para igualdad. GIN para jsonb/arrays/full-text. Los **índices compuestos** \`(a, b)\` se usan para filtros por \`a\` o por \`a + b\`, pero no por solo \`b\` (regla del **prefijo más a la izquierda**). El orden importa. Un **covering index** contiene todas las columnas que la query necesita y permite **index-only scan** sin tocar la tabla. **Cuando un índice perjudica**: tablas pequeñas (seq scan sale más barato), columnas con baja selectividad (sexo, activo), mucho escritor (cada UPDATE/INSERT/DELETE mantiene todos los índices).

**N+1 en JPA**: cargas N entidades con 1 query y luego, al acceder a una relación lazy de cada una, se disparan N queries más. Se detecta en el log SQL (ráfaga de selects). Soluciones: \`JOIN FETCH\` o \`@EntityGraph\` para traer la relación de una vez, \`@BatchSize\` para agrupar lazies en pocas queries \`IN (...)\`, o una proyección/DTO con un solo join. Cuidado con \`JOIN FETCH\` de varias colecciones a la vez (producto cartesiano).`,
  },
  {
    topicId: 'patterns',
    body: `**Patrones de diseño** son soluciones recurrentes a problemas de diseño OO. El catálogo clásico (**GoF**, 1994) se divide en **creacionales** (Singleton, Factory, Builder, Prototype), **estructurales** (Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight) y **de comportamiento** (Strategy, Observer, Command, Template Method, Iterator, State, Chain of Responsibility, Visitor, Mediator, Memento). El valor no es aplicarlos a saco — es tener vocabulario común para discutir diseños y reconocerlos cuando aparecen. Sobre-ingeniería = forzar patrones donde no aportan.

**Java moderno los hace más ligeros.** Una **Strategy** es una lambda implementando una interfaz funcional; un **Observer** son \`@EventListener\` o un broker pub/sub; **Singleton** es un \`@Component\` de Spring; **Decorator** y **Proxy** son lo que hace Spring AOP debajo (\`@Transactional\`, \`@Cacheable\`). De ahí el caveat de **self-invocation**: una llamada interna del mismo bean no pasa por el proxy. **Template Method** sigue vivo en \`JdbcTemplate\`, \`RestTemplate\` y similares; tu callback rellena el hueco. **Builder** es Lombok \`@Builder\` o records con métodos \`with\`-style. **Adapter** y **Facade** son exactamente lo que hacen los driving/driven adapters en hexagonal y los servicios de aplicación que orquestan varios componentes.

**Patrones de arquitectura distribuida** (más relevantes para microservicios que GoF). **CQRS** separa el modelo de escritura del de lectura, posiblemente con almacenes distintos sincronizados por eventos — ideal para cargas asimétricas y read models cross-bounded-context. **Saga** sustituye a las transacciones distribuidas (2PC) con una secuencia de transacciones locales y **acciones compensatorias**; coreografía (cada servicio reacciona a eventos) u orquestación (un coordinador). **Outbox** garantiza la publicación atómica de un evento junto al cambio en la BD: insertas la fila + un registro \`outbox\` en la misma transacción local, y un proceso aparte publica al broker — resuelve el dual-write.

**Antipatrones a evitar.** **Anemic Domain Model** (entidades con getters/setters y toda la lógica en servicios — no es OO ni DDD). **God class**, **shotgun surgery**, **feature envy**. **Primitive obsession**: pasar \`String\`/\`Long\` para todo en vez de value objects (\`Email\`, \`Dinero\`). **Service locator** disfrazando dependencias. **Premature optimization** y **over-engineering** (abstracciones que solo tienen una implementación). **Distributed monolith**: microservicios acoplados síncronos en cadena — todo lo malo de monolito y de distribuido a la vez.`,
  },
  {
    topicId: 'java21',
    body: `**Java 21 es LTS** y el punto de referencia del ecosistema en 2025. Las novedades se agrupan en tres categorías: nuevas abstracciones de datos, pattern matching avanzado y un nuevo modelo de concurrencia.

**Records** (Java 16 estable): clases inmutables con constructor canónico, getters, equals, hashCode y toString generados automáticamente. Ideales para DTOs y Value Objects. El constructor compacto permite validación sin repetir los campos. Los **Record Patterns** (Java 21) permiten desestructurar records directamente en \`instanceof\` y \`switch\`: \`if (obj instanceof Punto(var x, var y)) { ... }\`.

**Sealed Classes** (Java 17): declaran explícitamente sus subclases con \`permits\`. El compilador verifica **exhaustividad** en \`switch\` expressions: si no cubres todos los casos, error en compilación. Combinado con records dan un ADT (Algebraic Data Type) completo: \`sealed interface Resultado permits ResultadoOk, ResultadoError, ResultadoPendiente {}\`. Modela results/errors tipados sin excepciones.

**Pattern Matching** ha evolucionado mucho: \`instanceof\` con variable de binding (Java 16), switch expressions con patrones y **guarded patterns** (\`when\`): \`case ResultadoError err when err.critico() -> ...\`. Se puede desestructurar, combinar condiciones y manejar \`null\` como un case más.

**Virtual Threads** (Project Loom, Java 21 estable): threads ligeros gestionados por la JVM (~KB vs ~MB de platform threads). Cuando hacen I/O bloqueante, la JVM los **desmonta** del carrier thread sin bloquearlo — otro VT puede ejecutarse. El código sigue siendo síncrono e imperativo (no hay Mono, no hay callbacks). Con Spring Boot 3.2+: \`spring.threads.virtual.enabled=true\`. Maneja miles de concurrentes con JDBC estándar. El único antipatrón: \`synchronized\` dentro de un VT causa **pinning** (el VT no puede desmontarse); usar \`ReentrantLock\` en su lugar. \`StructuredConcurrency\` (preview) gestiona tareas concurrentes relacionadas en un scope con cancelación automática y sin thread leaks, superando las limitaciones de \`CompletableFuture\`.

**Secuenced Collections** (Java 21): nueva interfaz con \`getFirst()\`, \`getLast()\`, \`addFirst()\`, \`addLast()\`, \`reversed()\` para listas, deques y mapas con orden definido.`,
  },
  {
    topicId: 'webflux',
    body: `**Spring WebFlux** es el framework reactivo de Spring, basado en **Project Reactor** (\`Mono<T>\` y \`Flux<T>\`). Se ejecuta sobre Netty con un event loop: pocos threads del OS gestionan miles de conexiones porque ninguno queda bloqueado esperando I/O. Toda la cadena de procesamiento debe ser non-blocking; bloquear en el event loop es el **antipatrón más grave**.

**Mono** emite 0 o 1 elemento (equivale a \`Optional<T>\` async). **Flux** emite 0 a N (equivale a \`Stream<T>\` async). Ambos son **cold** (lazy): nada ocurre hasta que alguien se suscribe. Diferencia clave de operadores: \`map\` = transformación síncrona T→R; \`flatMap\` = transformación async T→Mono/Flux (aplana el resultado). Si tu transformación hace I/O o devuelve un publisher, es \`flatMap\`. \`switchMap\` cancela la suscripción anterior (búsquedas, autocompletar); \`concatMap\` respeta el orden (secuencial); \`mergeMap\` paralelo sin orden. Para errores: \`onErrorReturn\`, \`onErrorResume\`, \`onErrorMap\`, \`retry\`, \`retryWhen(Retry.backoff(...))\`, \`timeout\`. Para efectos secundarios sin transformar: \`doOnNext\`, \`doOnError\`, \`doFinally\`.

**Schedulers** controlan en qué thread pool se ejecuta el trabajo. \`publishOn\` cambia el thread para los operadores DESPUÉS. \`subscribeOn\` afecta al source. Para código bloqueante (JDBC) que se debe ejecutar en WebFlux: \`Mono.fromCallable(() -> jdbcCall()).subscribeOn(Schedulers.boundedElastic())\`. \`boundedElastic\` es un pool elástico para I/O bloqueante. \`parallel\` para CPU-intensive.

**Backpressure**: el consumidor señala al productor la velocidad a la que puede procesar, evitando saturación. Configurable con \`onBackpressureBuffer\`, \`onBackpressureDrop\`, \`onBackpressureLatest\`. En la práctica, la mayoría de fuentes reactivas (WebClient, R2DBC) la gestionan automáticamente. **WebClient** reemplaza \`RestTemplate\` en WebFlux: fluido, composable, con \`retrieve().onStatus(...).bodyToMono(...)\`.

**R2DBC** es la alternativa reactiva a JDBC. Las operaciones devuelven Mono/Flux. \`ReactiveCrudRepository\` proporciona los mismos métodos que \`JpaRepository\` pero reactivos. Las transacciones se gestionan via \`@Transactional\` con \`ReactiveTransactionManager\`. **Testing** con \`StepVerifier\`: \`StepVerifier.create(mono).expectNext(...).verifyComplete()\`. Para tiempos virtuales: \`withVirtualTime\`.

**WebFlux vs Virtual Threads** (la pregunta de 2025): VTs son más simples (código síncrono, debugging normal, todo el ecosistema JDBC/Hibernate) y ofrecen rendimiento equivalente para la mayoría de apps I/O-bound. WebFlux sigue ganando cuando necesitas **backpressure real**, SSE/WebSockets de alta concurrencia, o ya tienes un ecosistema 100% reactivo.`,
  },
  {
    topicId: 'react',
    body: `**React 18** introduce el modo concurrente: el motor puede interrumpir renders para priorizar actualizaciones urgentes. \`useTransition\` marca una actualización como no urgente (\`startTransition(() => setQuery(...))\`). \`useDeferredValue\` pospone actualizaciones de valores para mantener la UI responsiva. El **Automatic Batching** agrupa todas las actualizaciones de estado (incluso en setTimeout o fetch) en un solo re-render.

Los **hooks** son el modelo mental central. \`useState\`/\`useReducer\` para estado local; \`useRef\` para referencias mutables sin re-render; \`useMemo\` para memoizar cálculos costosos; \`useCallback\` para memoizar funciones (evitar que referencias nuevas rompan comparaciones en hijos memoizados); \`useEffect\` para sincronizar con sistemas externos. **Regla de oro de useEffect**: si no necesitas el DOM ni sistemas externos, no lo uses. La función de limpieza previene memory leaks. **Custom hooks** (empiezan con \`use\`) encapsulan lógica reutilizable.

**React.memo** evita re-renders si las props no cambian (comparación shallow). Para comparaciones deep, segundo argumento: \`(prev, next) => isEqual(prev.properties, next.properties)\`. **Lazy loading**: \`React.lazy(() => import('./Component'))\` + \`<Suspense fallback={<Skeleton />}>\`. En Next.js: \`next/dynamic(..., { ssr: false })\`.

**Next.js App Router** (v14+): todo es **Server Component** por defecto (corre en el servidor, sin JS en el cliente, puede fetchear datos directamente). Marcar con \`'use client'\` solo lo que necesita interactividad o browser APIs. Server Components no tienen state ni effects. Estructura de carpetas: \`layout.tsx\`, \`page.tsx\`, \`loading.tsx\`, \`error.tsx\`, \`route.ts\`. Route groups (\`(pages)\`) sin efecto en URL. Dynamic routes con \`[id]\`. Prefetching con TanStack Query: en el Server Component \`await queryClient.prefetchQuery(options)\` → \`dehydrate(queryClient)\` → \`<HydrationBoundary state={dehydrated}>\` — los datos están en cache al montar el componente cliente, sin doble fetch.

**Middleware** (\`middleware.ts\`): intercepta requests antes de responder. Auth con next-auth v5: valida JWT del proveedor Keycloak, redirige a login si no autenticado o si el token de refresh falló. El JWT callback renueva el access_token con el refresh_token cuando caduca. Config con \`matcher\` para excluir rutas públicas y assets.

**Design System** con Radix UI (lógica + a11y sin estilos) + CVA (class-variance-authority para variantes Tailwind) + \`cn\` (clsx + tailwind-merge). Separación server/client: componentes sin estado (Button, Input) en \`@ds/server\`, interactivos (Dialog, Select, Toast) en \`@ds/client\`. El patrón \`asChild\` (Slot de Radix) renderiza el child como elemento raíz con las props del padre — permite \`<Button asChild><Link href="...">...</Link></Button>\`.`,
  },
  {
    topicId: 'angular',
    body: `**Angular** es un framework opinionado con DI jerárquico, Change Detection y un router con lazy loading. El orden de los lifecycle hooks importa: \`constructor\` (solo DI, no lógica), \`ngOnChanges\` (cuando cambia un @Input), \`ngOnInit\` (inicialización real, @Inputs disponibles), \`ngAfterViewInit\` (DOM disponible, @ViewChild accesible), \`ngOnDestroy\` (cleanup: unsubscribe, timers).

**Change Detection**: Default verifica todo el árbol en cada evento. **OnPush** solo verifica el componente cuando cambia una referencia de @Input, hay un evento local, el async pipe emite, o se llama \`markForCheck()\`. Requiere objetos inmutables (no mutar, crear nuevos). **NgRx + OnPush** es el combo estándar porque el store siempre devuelve objetos nuevos. **Signals** (Angular 17+): primitivos reactivos que solo actualizan los bindings que los consumen. \`signal(0)\`, \`computed(() => x() * 2)\`, \`effect(() => log(x()))\`.

**DI jerárquico**: \`providedIn: 'root'\` → singleton global, tree-shakeable. \`providers: [...]\` en @Component → instancia propia, se destruye con el componente. \`inject()\` function (Angular 14+): usar fuera del constructor (guards, factories). Tokens: \`InjectionToken<T>\` para valores no-clase y \`HTTP_INTERCEPTORS\` multi-token.

**Router**: rutas lazy con \`loadChildren: () => import('./module').then(m => m.ROUTES)\`. Guards funcionales con \`inject()\`: \`export const authGuard: CanActivateFn = () => inject(AuthService).isAuth() || inject(Router).createUrlTree(['/login'])\`. Resolvers precarga datos antes de activar la ruta. \`ActivatedRoute.snapshot.data['key']\` para leer datos resueltos. \`canDeactivate\` para prevenir salida con cambios sin guardar.

**Reactive Forms**: FormGroup + FormBuilder. Validators síncronos inline (\`Validators.required, Validators.pattern\`) y async (\`AsyncValidatorFn\`, debounce con \`switchMap\`). \`valueChanges\` es un Observable: combina con \`debounceTime\`, \`distinctUntilChanged\`, \`switchMap\` para autocompletar, validación lazy o efectos secundarios. \`markAllAsTouched()\` para mostrar todos los errores al hacer submit.

**HTTP Interceptors** (funcionales, Angular 15+): \`HttpInterceptorFn = (req, next) => {...}\`. Para refresh de token: cuando llega 401, llamar a \`authService.refreshToken()\`, y con \`switchMap\` reintentar el request original con el nuevo token. Si el refresh falla, logout. **Memory leaks**: antipatrón = \`subscribe\` sin cleanup. Soluciones: \`takeUntilDestroyed(this.destroyRef)\` (Angular 16+, recomendado), \`async\` pipe (gestión automática), o patrón clásico \`destroy$ = new Subject()\` + \`takeUntil\`.`,
  },
  {
    topicId: 'flink',
    body: `**Apache Flink** es un motor de procesamiento de streams de estado distribuido con soporte nativo para **CEP** (Complex Event Processing), ventanas complejas y garantías exactly-once. Es la elección cuando necesitas correlación temporal de eventos o estado de procesamiento grande que no cabe en memoria. En Agata Next se usa con 1 JobManager + 6 TaskManagers × 19 slots = 114 slots totales, estado en RocksDB y checkpoints cada 30s.

**Arquitectura**: el **JobManager** compila el DAG del job y coordina la ejecución. Los **TaskManagers** ejecutan las tareas con sus slots. Un slot puede ejecutar múltiples tareas del mismo pipeline (slot sharing). El **paralelismo** define cuántas instancias paralelas tiene un operador. DataStream API: \`source → keyBy → window/process → sink\`. El source de Kafka asigna un timestamp y watermark a cada evento.

**Event Time vs Processing Time**: event time usa el timestamp del evento (cuándo ocurrió), processing time usa el reloj de Flink (cuándo llegó). Para análisis temporales correctos usar event time. Los **watermarks** son señales que garantizan que no llegarán eventos anteriores a T: permiten cerrar ventanas aunque lleguen eventos desordenados. \`forBoundedOutOfOrderness(Duration.ofSeconds(5))\` tolera hasta 5s de retraso. Los eventos más tardíos van a un side output o se descartan.

**Ventanas**: Tumbling (fijas sin solapamiento), Sliding (solapadas: tamaño + slide), Session (por inactividad: se cierran si no hay eventos en N ms), Global (con trigger explícito). Funciones: \`reduce\` (incremental, eficiente), \`aggregate\` (estado intermedio explícito), \`process\` (acceso al contexto, timestamps, side outputs).

**CEP**: \`Pattern.begin("a").where(...).followedBy("b").where(...).within(Duration)\` define patrones temporales. \`CEP.pattern(stream.keyBy(...), patron)\` aplica el patrón. \`patternStream.select(match -> ...)\` extrae los eventos que coinciden. Soporta cuantificadores (\`times\`, \`greedy\`), patrones negados (\`notFollowedBy\`), y condiciones que referencian eventos anteriores del patrón.

**Estado y tolerancia a fallos**: \`ValueState\`, \`ListState\`, \`MapState\` por clave (necesita \`keyBy\` antes). Declarar en \`open()\`, nunca en el constructor. State backend **RocksDB** para estado > RAM: persistente en disco, incrementally checkpointable. **Checkpoints** (periódicos, automáticos) + **Savepoints** (manuales, para upgrades). Exactly-once end-to-end con Kafka: offsets del source en el checkpoint + sink transaccional (\`EXACTLY_ONCE\` + \`setTransactionalIdPrefix\`). El Flink Kubernetes Operator gestiona \`FlinkDeployment\` CRDs con \`upgradeMode: savepoint\` para upgrades sin pérdida de estado.`,
  },
  {
    topicId: 'cicd',
    body: `**IaC (Infrastructure as Code)** gestiona la infraestructura mediante archivos versionados en Git, dando reproducibilidad, auditoría y rollback. Dos categorías: **provisioning** (crear la infra: VMs, redes, cluster) y **configuration** (configurar lo que existe: instalar software, desplegar servicios).

**OpenTofu/Terraform** es el estándar de provisioning declarativo. Describes el estado deseado, \`plan\` muestra el diff y \`apply\` lo aplica. El **state** guarda el estado actual (remote backend en S3/MinIO para trabajo en equipo + locking para evitar applies concurrentes). Bloques clave: \`resource\` (infraestructura), \`variable\` (inputs parametrizables), \`locals\` (valores calculados), \`output\` (exports), \`module\` (reutilización). Ciclo: \`init → plan → apply → destroy\`. En Agata se usa para provisionar VMs en Proxmox y el cluster RKE2.

**Ansible** es el estándar de configuration management. Sin agente, usa SSH. Playbooks YAML con tareas idempotentes (ejecutar dos veces da el mismo resultado). **Roles** encapsulan tasks + handlers + templates. El módulo \`template\` con Jinja2 genera configuraciones dinámicas. Los **handlers** se disparan con \`notify\` solo si la tarea cambió algo (ej: "restart rke2"). Inventarios estáticos (INI/YAML) o dinámicos.

**Jenkins** es el servidor CI/CD más extendido en enterprise Java. **Jenkinsfile declarativo**: \`pipeline { agent { docker {...} } stages { stage('Build') { steps {...} } } post { failure { emailext ... } } }\`. Etapas paralelas con \`parallel\`. Variables de entorno con \`credentials()\` (secrets de Jenkins). \`waitForQualityGate abortPipeline: true\` detiene el pipeline si SonarQube no aprueba. **Shared Libraries** para reutilizar código Groovy entre pipelines del mismo equipo. **Multibranch Pipeline**: pipeline automático por rama detectando el Jenkinsfile.

**SonarQube** analiza estáticamente bugs, vulnerabilidades, code smells y cobertura (vía JaCoCo). El **Quality Gate** es un conjunto de umbrales (cobertura nueva ≥ 80%, 0 bugs críticos). Si no se supera, el pipeline se aborta. Integración Maven con \`sonar:sonar -Dsonar.token\`. Configuración en \`sonar-project.properties\` o propiedades Maven. \`@SuppressWarnings("java:SXXXX")\` para suprimir reglas específicas con justificación.

**GitOps** = infraestructura y despliegue declarados en Git, sincronizados automáticamente por herramientas (ArgoCD, Flux). Ningún cambio manual en producción: todo via PR. El cluster converge hacia el estado del repositorio. Auditabilidad completa. ArgoCD detecta divergencias y puede alertar o autocorregir.`,
  },
  {
    topicId: 'obs',
    body: `**Observabilidad** es la capacidad de entender qué le pasa a tu sistema en producción **desde fuera**, sin desplegar de nuevo. Tres pilares: **métricas**, **logs** y **traces**. Las **métricas** son valores numéricos agregados en el tiempo (counter, gauge, histogram). Son baratas, agregables y perfectas para alertas y dashboards. **Prometheus** + **Micrometer** es el stack típico en Spring; cuidado con la cardinalidad de etiquetas — nunca \`userId\` o \`traceId\` como tag. Usa percentiles (p95, p99) en latencias, no medias.

Los **logs** son los registros textuales/estructurados; cada vez más en **JSON** (logstash-logback-encoder) con \`MDC\` para inyectar \`traceId\`/\`spanId\`/\`userId\` en cada línea, sin contaminar el código. Esto los hace buscables y agregables. **OpenSearch** (fork open-source de Elasticsearch tras el cambio de licencia) es donde aterrizan los logs en muchas plataformas modernas; el pipeline típico es Filebeat → Logstash → OpenSearch → OpenSearch Dashboards (o Loki/Promtail para alternativa más barata). Reglas: nunca PII ni secretos en logs; usa los niveles bien; no abuses de INFO en zonas calientes.

Los **traces** son el viaje de una petición por varios servicios, representado como **spans** anidados con duración y atributos; correlacionados por un \`traceId\` que se propaga en headers HTTP / metadata Kafka. **OpenTelemetry (OTel)** es el estándar abierto (CNCF) para producir telemetría neutral y exportarla a cualquier backend (Tempo, Jaeger, Datadog…). En Spring se usa \`micrometer-tracing-bridge-otel\` + exporter OTLP. **Sampling** porque trazar el 100% es caro: head-based (decides al inicio, ej. 10%) o tail-based (decides según el resultado, ej. siempre los errores). El valor real es ver una request lenta y descubrir que el cuello está en el 3er servicio de la cadena.

**Resiliencia.** **Resilience4j** ofrece circuit breaker (corta llamadas a un servicio caído), retry con backoff exponencial, rate limiter, bulkhead (aísla pools por tipo), time limiter y cache. Cada uno expone métricas Micrometer, así que ves cuándo el circuito se abre o cuántos reintentos haces. **Health checks** con Actuator: **liveness** (¿proceso vivo?) reinicia si falla; **readiness** (¿listo para tráfico?) saca del Service mientras falla — confundirlos provoca reinicios en bucle cuando una dependencia tiene un blip.

**SLI/SLO/SLA.** SLI es la métrica (latencia, disponibilidad); SLO es tu objetivo interno ("99.9% < 200ms en 30 días"); SLA el contrato externo con consecuencias. El **error budget** (1 - SLO) define cuánto error te permites gastar; si te lo gastas, congelas releases y priorizas fiabilidad. Es el contrapeso entre velocidad y estabilidad — el lenguaje SRE para decidir cuándo seguir entregando y cuándo invertir en infra.`,
  },
  {
    topicId: 'redux',
    body: `**Redux** es un gestor de estado global predecible: **una sola fuente de verdad** (el store), estado **inmutable** y cambios solo mediante **acciones puras**. El flujo es unidireccional: UI dispara una acción → el reducer (función pura) calcula el nuevo estado → el store notifica a los suscriptores.

**Redux Toolkit (RTK)** es la forma oficial moderna. \`createSlice\` genera actions + reducer en un bloque, usando **Immer** internamente (puedes escribir código "mutante" y RTK lo convierte a actualizaciones inmutables):
\`\`\`ts
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },  // Immer: OK mutar el draft
    addAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});
export const { increment, addAmount } = counterSlice.actions;
\`\`\`

**createAsyncThunk** maneja acciones asíncronas con estados \`pending/fulfilled/rejected\` automáticos:
\`\`\`ts
const fetchUser = createAsyncThunk('users/fetch', async (id: string) => {
  const res = await api.getUser(id);
  return res.data; // → action fulfilled con este payload
});
// En el slice:
extraReducers: (builder) => {
  builder.addCase(fetchUser.pending, (state) => { state.loading = true })
         .addCase(fetchUser.fulfilled, (state, action) => {
           state.user = action.payload; state.loading = false;
         })
         .addCase(fetchUser.rejected, (state, action) => {
           state.error = action.error.message; state.loading = false;
         });
},
\`\`\`

**createSelector** (Reselect) memoiza selectores derivados: solo recalcula si cambian los inputs. Evita re-renders innecesarios por objetos nuevos en cada acceso.

**RTK Query** es una capa de data fetching integrada: define endpoints, genera hooks (\`useGetUserQuery\`, \`useCreateUserMutation\`) con cache, loading states, invalidación y refetch automáticos. Elimina la necesidad de \`createAsyncThunk\` para peticiones API estándar.

**Cuándo usar Redux vs Context**: Context es suficiente para estado de UI poco frecuente (tema, idioma). Redux aporta valor cuando tienes: estado complejo con muchos actores, necesitas DevTools/time-travel, o el estado se actualiza frecuentemente desde múltiples componentes sin relación directa.`,
  },
  {
    topicId: 'ngrx',
    body: `**NgRx** implementa el patrón Redux para Angular con integración de RxJS. El flujo es: componente dispara **Action** → **Reducer** actualiza el **Store** (inmutablemente) → **Selector** deriva vista del estado → **Effect** maneja side effects (I/O) y dispara nuevas acciones.

\`\`\`ts
// Actions
const loadUsers = createAction('[Users] Load Users');
const loadUsersSuccess = createAction('[Users] Load Success', props<{ users: User[] }>());
const loadUsersFailure = createAction('[Users] Load Failure', props<{ error: string }>());

// Reducer
const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state) => ({ ...state, loading: true })),
  on(loadUsersSuccess, (state, { users }) => ({ ...state, users, loading: false })),
  on(loadUsersFailure, (state, { error }) => ({ ...state, error, loading: false })),
);

// Effect — maneja el I/O y despacha nuevas acciones
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.userService.getAll().pipe(
        map((users) => loadUsersSuccess({ users })),
        catchError((err) => of(loadUsersFailure({ error: err.message }))),
      ),
    ),
  ),
);

// Selector memoizado
const selectUsers = createSelector(
  selectUsersState,
  (state) => state.users.filter((u) => u.active)
);
// En el componente:
users$ = this.store.select(selectUsers);
\`\`\`

**NgRx Signal Store** (v17+): alternativa ligera y sin boilerplate usando Signals. \`signalStore\` compone piezas funcionales: \`withState\`, \`withComputed\`, \`withMethods\`, \`withHooks\`. Más ergonómico para stores pequeños/medianos, sin Actions ni Effects separados. No requiere RxJS para lo básico.

**Entity Adapter** simplifica el manejo de colecciones: \`addOne\`, \`updateOne\`, \`removeOne\`, \`setAll\`, con IDs indexados para O(1) en lugar de \`Array.find\`.

**NgRx vs Servicios con BehaviorSubject**: para estado local de un componente, un servicio con BehaviorSubject es suficiente. NgRx brilla para estado global compartido entre módulos con interacciones complejas, auditabilidad (Actions como log), y testing determinista de effects.`,
  },
  {
    topicId: 'rxjs',
    body: `**RxJS** implementa el patrón Observer con un enfoque funcional y composable. Un **Observable** es una secuencia lazy de cero o más valores a lo largo del tiempo, que solo "corre" cuando hay un suscriptor. Un **Subject** es a la vez Observable y Observer: puedes emitir valores desde fuera (\`subject.next(val)\`).

**Tipos de Subject**: \`Subject\` (no repite valores pasados a nuevos suscriptores), \`BehaviorSubject\` (emite el último valor al suscribirse — ideal para estado), \`ReplaySubject(n)\` (repite los últimos N), \`AsyncSubject\` (solo emite el último valor al completarse).

**Operadores de transformación** — los más críticos:
- \`map\`: transforma 1→1 síncrono.
- \`switchMap\`: cancela la suscripción anterior al llegar un nuevo valor. Para búsquedas/typeahead donde solo interesa el último.
- \`mergeMap\` (alias \`flatMap\`): suscribe en paralelo, sin orden. Para peticiones independientes concurrentes.
- \`concatMap\`: espera a que termine el anterior antes de suscribir al siguiente. Para operaciones ordenadas/secuenciales.
- \`exhaustMap\`: ignora nuevos valores mientras hay una suscripción activa. Para botones "submit" que no deben repetirse.

**Operadores de combinación**:
- \`combineLatest([a$, b$])\`: emite cuando cualquiera emite, con los últimos valores de todos. Para vistas que dependen de múltiples fuentes.
- \`forkJoin([a$, b$])\`: espera a que todos completen, emite el último valor de cada uno. Para peticiones paralelas donde quieres los resultados juntos.
- \`zip\`: combina por posición (emite cuando todos han emitido el N-ésimo valor).
- \`merge\`: mezcla streams en paralelo, sin esperar.
- \`withLatestFrom\`: combina el observable principal con el último valor de otro (sin suscribirse al secundario).

**Gestión de recursos** — evitar memory leaks:
\`\`\`ts
// Patrón moderno en Angular:
readonly users$ = this.store.select(selectUsers).pipe(takeUntilDestroyed());
// O con async pipe en template — Angular gestiona la suscripción
\`\`\`

**shareReplay(1)**: convierte un Observable frío en hot y cachea el último valor. Útil para peticiones HTTP compartidas entre múltiples componentes sin repetir el fetch. Sin \`{refCount: true}\`, el upstream no se cancela nunca — cuidado en Angular con HTTP.

**Depuración con tap**: \`tap(val => console.log('valor:', val))\` sin alterar el stream. \`catchError\` debe devolver un Observable (p.ej. \`of(fallback)\`) o relanzar con \`throwError(() => err)\`.`,
  },
  {
    topicId: 'microfrontend',
    body: `**Micro-frontend** extiende los principios de microservicios al frontend: equipos independientes despliegan porciones de la UI de forma autónoma, cada una con su propio ciclo de release. El "shell" o host orquesta qué micro-app carga en cada ruta.

**Module Federation** (Webpack 5 / Native Federation para Angular con esbuild): el mecanismo de integración más usado en la actualidad. Un remote expone módulos compilados; el host los consume en runtime sin recompilar. Configuración clave:
\`\`\`js
// remote (widget-manager en Agata):
new ModuleFederationPlugin({
  name: 'widgetManager',
  exposes: { './EntityDetail': './src/widgets/entity-detail' },
  shared: { react: { singleton: true, requiredVersion: '^18.0.0' } }
})
// host (agata-front-next):
new ModuleFederationPlugin({
  remotes: { widgetManager: 'widgetManager@https://cdn.example.com/remoteEntry.js' },
  shared: { react: { singleton: true } }  // una sola instancia de React
})
\`\`\`
La directiva **singleton** en los shared es crítica: React, Angular y otros frameworks no pueden tener múltiples instancias activas. Sin ella, los hooks fallan con "Hooks can only be called inside a function component".

**Web Components como delivery**: el remote expone Custom Elements en lugar de módulos JS. El host usa \`<widget-entity-detail>\` como HTML estándar, sin conocer el framework interno. Es el patrón de Agata: **@r2wc/react-to-web-component** envuelve componentes React en Custom Elements, y **DynamicWebComponent** gestiona un triple caché (React state → blob URL → network) para servir el script del widget con latencia cero tras la primera carga.

**iframe-based**: máximo aislamiento (CSS, JS, errores) pero con las limitaciones de comunicación (postMessage, limitado) y UX (scroll, resize, deep linking). Usado en legacy o cuando el aislamiento de seguridad es prioritario.

**Comunicación entre micro-apps**: \`CustomEvent\` en el DOM (desacoplado), \`window.postMessage\` (entre iframes o web workers), \`BroadcastChannel\` (entre pestañas/iframes del mismo origen), **WidgetMessenger** (Agata: singleton de postMessage con un protocolo tipado de MessageTypes para comunicación bidireccional host↔widget). Evitar estado global compartido mediante módulos JS — crea acoplamiento implícito.

**Trade-offs reales**: cada bundle copia sus propias dependencias no compartidas → mayor peso total. La coordinación de versiones entre equipos es un reto. El debugging a través de micro-apps es más complejo. Compensa cuando los equipos superan ~15-20 personas o cuando los ciclos de release son verdaderamente independientes.`,
  },
  {
    topicId: 'spa',
    body: `**SPA (Single Page Application)** carga una sola página HTML y actualiza el DOM dinámicamente sin recargas completas. El navegador descarga el bundle JS, el framework hidrata la app y el **History API** (\`pushState\`/\`replaceState\`) gestiona la navegación sin peticiones al servidor. Resultado: transiciones de página instantáneas tras el primer load.

**Estrategias de rendering**:
- **CSR (Client-Side Rendering)**: el servidor devuelve HTML vacío + bundle JS. El navegador ejecuta el JS, hace fetch de datos y renderiza. Ventajas: carga inicial única, transiciones fluidas, desacople total front-back. Desventajas: TTFB de contenido alto (el HTML inicial está vacío), malo para SEO por defecto, First Contentful Paint lento en conexiones lentas.
- **SSR (Server-Side Rendering)**: cada petición genera HTML en el servidor (con datos) y lo envía. Luego el JS "hidrata" la app para hacerla interactiva. Ventajas: buen SEO, FCP rápido. Desventajas: carga en el servidor por petición, TTFB puede ser alto si la DB es lenta, complejidad (el código debe funcionar en ambos entornos).
- **SSG (Static Site Generation)**: el HTML se genera en build-time, se sirve como fichero estático desde CDN. Velocidad máxima, sin servidor. Para contenido que no cambia frecuentemente.
- **ISR (Incremental Static Regeneration)**: SSG con revalidación en background cada N segundos. Next.js: \`revalidate: 60\` en los route handlers. El primer request tras expirar regenera la página.

**Hidratación**: proceso por el cual el JS en el cliente "toma control" del HTML pre-renderizado por el servidor, añadiendo event listeners sin volver a crear el DOM. Problemas comunes: **hydration mismatch** (el HTML del servidor difiere del que generaría el cliente → React lanza error), acceso a \`window\`/\`localStorage\` durante SSR (solo existen en el navegador).

**Code splitting y lazy loading**: dividir el bundle en chunks por ruta o por componente. Next.js lo hace automáticamente por página; en SPA puro, \`React.lazy(() => import('./Page'))\` + \`<Suspense>\`. Reduce el JS inicial cargado → mejora el TTI (Time to Interactive).

**Routing**: el router intercepta clicks en \`<a>\` y cambios de URL, actualiza el estado de la app y renderiza el componente correspondiente sin recarga. En Next.js App Router, \`<Link>\` hace prefetch de la ruta destino al hacer hover. En Angular Router, el route guard (\`CanActivateFn\`) puede cancelar la navegación (para auth) o el resolver puede precargar datos.

**Shell app pattern** en micro-frontends: la SPA principal actúa como "shell" que carga dinámicamente las micro-apps según la ruta activa. El shell gestiona autenticación, layout global y navegación; las micro-apps gestionan su dominio propio.`,
  },
];

export function theory(topicId: string): TheorySection | undefined {
  return THEORY.find((t) => t.topicId === topicId);
}
