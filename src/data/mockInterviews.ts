// Simulaciones de conversación al estilo real de la entrevista: el entrevistador
// hace una pregunta y va "drilling" con follow-ups según la respuesta.
// Cada turno: pregunta del entrevistador + respuesta modelo / puntos a tocar.

export interface MockTurn {
  interviewer: string;
  /** Respuesta modelo / talking points (Markdown). */
  model: string;
}

export interface MockSession {
  id: string;
  title: string;
  emoji: string;
  /** topicId relacionado para enlazar a sus flashcards. */
  topic?: string;
  intro: string;
  turns: MockTurn[];
}

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: 'arranque',
    title: 'Arranque + experiencia',
    emoji: '👋',
    topic: 'xp',
    intro: 'El típico inicio: se rompe el hielo y enseguida tantean tu experiencia real. Encadena hacia tus proyectos (Agata, IBIL, Kafka).',
    turns: [
      {
        interviewer: 'Cuéntame un poco sobre ti y tu experiencia.',
        model: 'Ingeniero Informático con **6+ años**, backend con **Java/Spring Boot** y recorrido full-stack (Angular, React). Ahora en **Agata**: plataforma de interoperabilidad portuaria, ~40 microservicios conectores en **hexagonal estricta con Java 21, DDD, Kafka y MongoDB**, OpenAPI contract-first. Antes, microservicios + Kafka en IBIL (recarga de coches) y otros. Cierra con por qué te interesa el rol.',
      },
      {
        interviewer: '¿Qué estás haciendo ahora mismo con IA en tu día a día?',
        model: 'Claude Code sobre el monorepo de Agata: generar/evolucionar conectores siguiendo las reglas del proyecto (hexagonal, MapStruct, testing), escribir tests, refactors, explorar APIs externas. Lo que **NO delegas**: arquitectura, revisión final, seguridad; nunca pegas código propietario en herramientas públicas; revisas el output por alucinaciones.',
      },
      {
        interviewer: 'Veo Angular y NgRx en tu CV. ¿Reactividad la has tocado en backend?',
        model: 'Honestidad: reactividad **fuerte en frontend** (NgRx, Redux — estado push, unidireccional). En backend dominas el **concepto** (no bloqueo, backpressure, event loop, Mono/Flux) y en Agata hay conectores con WebFlux/feign-reactor y repos reactivos, pero la mayoría de tu backend es **imperativo (Spring MVC)**. No infles.',
      },
      {
        interviewer: '¿Y cómo enfocáis el testing en Agata?',
        model: 'JUnit 5 + Mockito, **Given/When/Then**, naming `whenXxx_thenYyy`, **Object Mothers** para datos realistas. Se mockean solo los **bordes** (adaptadores, BD, Kafka), nunca dominio/mappers. **Testcontainers** (Mongo/Redis/Kafka reales) + **WireMock** para APIs externas, Cucumber para BDD. Si no haces TDD estricto siempre, dilo y di que aplicas red-green-refactor donde aporta.',
      },
    ],
  },
  {
    id: 'hexagonal',
    title: 'Hexagonal & DDD (drilling)',
    emoji: '🏗️',
    topic: 'arch',
    intro: 'Aquí preguntan por capas y van bajando: dónde va cada pieza. Es donde más “depende” aceptan si justificas. Apóyate en la estructura real de Agata.',
    turns: [
      {
        interviewer: 'Si te doy 4 o 5 requisitos, ¿cómo planteas la solución?',
        model: 'Entender el dominio (lenguaje ubicuo, casos de uso) → identificar bounded contexts y capacidades → entidades/agregados → estilo de integración (sync vs eventos) → contratos (OpenAPI/AsyncAPI) → persistencia por contexto → NFRs (consistencia, latencia, observabilidad) → dibujar capas hexagonales → iterar con producto.',
      },
      {
        interviewer: '¿En qué capa meterías un REST controller?',
        model: 'Es un **adapter de entrada (driving)**. Convención clásica: en **infraestructura** (en Agata: `infrastructure/driving`), invocando un **puerto de entrada** en `application`. Hay quien lo pone en una capa application como “borde”. Lo que no cambia: sin lógica de negocio, solo traduce HTTP ↔ caso de uso.',
      },
      {
        interviewer: '¿Y los DTOs? ¿Y un repositorio?',
        model: 'Los **DTOs viven junto al controller** (contrato del borde) y se mapean al dominio con MapStruct; si son para llamar a otra API, junto a ese adaptador de salida. El **repositorio**: **interfaz en domain/application** (puerto de salida), **implementación en infraestructura** — así cambias de Postgres a Mongo sin tocar el dominio (inversión de dependencias).',
      },
      {
        interviewer: 'Tienes dos entidades en bounded contexts separados y necesitas una proyección de ambos. ¿Dónde la haces?',
        model: '**Nunca en el dominio** de ninguno (acoplaría contextos). Un **read model dedicado (CQRS)** que consume eventos de ambos BCs y mantiene su propia proyección. Alternativa más simple: un **BFF/API de agregación**. La proyección vive en su propio espacio.',
      },
      {
        interviewer: '¿Cuál es tu regla para separar bounded contexts?',
        model: 'Lenguaje ubicuo (misma palabra, significado distinto → contexto distinto), ownership de equipo, capacidad de negocio, independencia de despliegue y ciclo de vida. Más allá: frecuencia de cambio, consistencia requerida (lo transaccional junto), NFRs muy distintos, compliance (PII/PCI).',
      },
    ],
  },
  {
    id: 'kafka',
    title: 'Kafka & mensajería (drilling)',
    emoji: '📨',
    topic: 'msg',
    intro: 'Tu terreno fuerte. Enseña modelo mental: cola vs topic, paralelismo, orden. Y prepara el matiz RabbitMQ.',
    turns: [
      {
        interviewer: '¿Qué experiencia tienes con colas o brokers como Kafka o RabbitMQ?',
        model: 'Kafka fuerte: Agata (Kafka + Schema Registry JSON, Spring Cloud Stream, eventos versionados, AsyncAPI), IBIL, buscador turístico, mercado mayorista. **Honestidad**: RabbitMQ a nivel conceptual (exchanges direct/topic/fanout, ack/prefetch, DLQ); tu experiencia productiva es Kafka.',
      },
      {
        interviewer: '¿Qué diferencia hay entre una cola y un topic?',
        model: 'Cola = point-to-point, un mensaje lo consume **una** instancia (load balance). Topic = pub/sub, llega a **todos** los suscriptores. En Kafka: cada **consumer group** recibe el mensaje; dentro del grupo, una sola instancia por partición.',
      },
      {
        interviewer: 'Si tengo una cola y levanto 10 pods, ¿cuántos leen un mensaje?',
        model: '**Uno solo**. La cola entrega cada mensaje a una única instancia; las otras 9 no lo ven. Eso es lo que da escalado horizontal. Si una falla, el mensaje se reentrega (visibility timeout / ack) y otra lo coge.',
      },
      {
        interviewer: 'Si insertas 2 mensajes en un topic Kafka, ¿cómo garantizas leerlos en orden?',
        model: 'El orden solo se garantiza **dentro de una partición** → enviar ambos a la **misma partición** usando la **misma clave** (`hash(key) % particiones`). Sin clave, round-robin y pierdes el orden relativo.',
      },
      {
        interviewer: '¿Para qué sirven las particiones y cómo diriges un mensaje a una concreta?',
        model: 'Son la unidad de **escalado, paralelismo y tolerancia a fallos**: cada partición es un log ordenado independiente; máx. consumers activos por grupo = nº particiones. Para una partición concreta: **clave** (hashing), partición explícita o un `Partitioner` propio.',
      },
    ],
  },
  {
    id: 'sql',
    title: 'SQL con trampas',
    emoji: '🧮',
    topic: 'sql',
    intro: 'El bloque crítico. Tienen preguntas “trampa” con números. La clave: no contestar el número fácil sin el matiz de cardinalidad.',
    turns: [
      {
        interviewer: 'Tabla A (5 filas) LEFT JOIN tabla B (10 filas). ¿Cuántas filas devuelve?',
        model: '**Al menos 5** (una por cada fila de A; más si una fila de A casa con varias de B; las de A sin match salen con NULLs en B). El “5” a secas solo vale si la cardinalidad es 1:1. Da el matiz, es lo que buscan.',
      },
      {
        interviewer: '¿Y al revés, B LEFT JOIN A?',
        model: '**Al menos 10** (una por cada fila de B). Mismo razonamiento: el LEFT garantiza todas las filas de la tabla izquierda.',
      },
      {
        interviewer: '¿Y un INNER JOIN si solo hay 3 coincidencias?',
        model: '**3** (asumiendo 1:1 en los matches). El INNER devuelve solo la intersección; sin coincidencia, fila fuera. Nada de NULLs por filas no casadas.',
      },
      {
        interviewer: 'Si haces ORDER BY 1, ¿por qué columna ordenas? ¿De qué tabla?',
        model: 'Por la **primera columna del SELECT** (posicional, 1-indexed), sea de la tabla que sea o una expresión. No es “de una tabla”, es de la **proyección**. En práctica se desaconseja (frágil).',
      },
      {
        interviewer: '¿Cuándo puedes tener un HAVING sin GROUP BY?',
        model: 'Cuando hay un **agregado sobre todo el conjunto** (grupo único implícito): `SELECT COUNT(*) FROM ventas HAVING COUNT(*) > 100`. Devuelve 0 o 1 fila. Válido pero raro.',
      },
      {
        interviewer: '¿Has sacado un plan de ejecución? ¿Qué buscas?',
        model: '`EXPLAIN`/`EXPLAIN ANALYZE`: árbol de operaciones con coste estimado. Buscas **seq scans inesperados** en tablas grandes, **índices que esperabas y no se usan** (stats obsoletas, función sobre la columna), joins ineficientes, sorts caros, y estimado vs real muy distinto.',
      },
    ],
  },
  {
    id: 'transacciones',
    title: 'Transacciones & Spring',
    emoji: '🌱',
    topic: 'spring',
    intro: 'Drilling sobre @Transactional. Cuidado con el matiz de self-invocation y el rollback de checked.',
    turns: [
      {
        interviewer: '¿Qué anotación usas para transacciones y por qué?',
        model: '`@Transactional` (Spring). Envuelve el método: commit al salir bien, rollback ante excepción. Funciona por **proxy AOP** sobre el bean.',
      },
      {
        interviewer: 'Si el método lanza una excepción, ¿cómo garantizas el rollback?',
        model: 'Por defecto rollback ante **unchecked** (`RuntimeException`/`Error`), **no** ante checked. Para checked: `rollbackFor`. Trampa: si **capturas** y no relanzas, no hay rollback. Una vez marcada, queda *rollback-only*.',
      },
      {
        interviewer: 'Tienes un método que llama a dos repositorios. ¿Cómo lo haces transaccional?',
        model: '`@Transactional` en el **método que engloba** ambas llamadas → misma transacción, commit o rollback conjunto. Cuidado: no metas `@Transactional` en los internos sin pensar (REQUIRES_NEW abriría otra). Y ojo a **self-invocation**: `this.otro()` no pasa por el proxy → la anotación interna se ignora.',
      },
      {
        interviewer: '¿Y si no puedes usar @Transactional (código de una librería externa)?',
        model: '`TransactionTemplate` (commit/rollback en el callback), o el `PlatformTransactionManager` programático, o envolver en un wrapper bean propio, o compensación manual. La transaccionalidad no es magia de la anotación: hay un transaction manager debajo.',
      },
      {
        interviewer: '¿Has cambiado el nivel de aislamiento alguna vez?',
        model: 'Es para nota. Equilibrio consistencia/rendimiento: `READ_COMMITTED` suele bastar; en casos críticos (financiero) `SERIALIZABLE` a costa de concurrencia. Menciona las anomalías: dirty/non-repeatable/phantom reads.',
      },
    ],
  },
  {
    id: 'async',
    title: 'Async / Reactivo',
    emoji: '🔄',
    topic: 'async',
    intro: 'El clásico “endpoint lento” y la distinción fina async vs reactivo.',
    turns: [
      {
        interviewer: 'Tienes un endpoint que tarda 10s pero el usuario solo necesita saber que se hará. ¿Cómo lo conviertes en asíncrono?',
        model: 'Encolar el trabajo (Kafka/SQS/Rabbit) y devolver **202 Accepted** con un id/Location para consultar estado; un consumer lo procesa aparte. Es lo más fiable (persistencia, reintentos, escalado). Alternativas: `@Async`+CompletableFuture, event-driven, polling/SSE.',
      },
      {
        interviewer: 'Si no quieres un scheduler sino ejecutarlo ahora, ¿qué usarías?',
        model: '`@Async` (con `@EnableAsync` y un Executor), `CompletableFuture.supplyAsync` con tu ExecutorService, **virtual threads** (Java 21) si es I/O, o Reactor (`subscribeOn(boundedElastic())`). O una cola interna con un consumer inmediato.',
      },
      {
        interviewer: '¿Qué diferencia hay entre asíncrono y reactivo?',
        model: 'Async = el caller no se bloquea (threads, callbacks, futures). Reactivo = paradigma de **streams** con **push + backpressure + no bloqueo** sobre pocos threads (Mono/Flux). Todo reactivo es async, pero no al revés: un CompletableFuture es async, no reactivo.',
      },
      {
        interviewer: '¿Qué significa que algo sea thread safe?',
        model: 'Que varios hilos pueden usarlo a la vez sin condiciones de carrera ni corrupción. Vías: **inmutabilidad** (la mejor — records), sincronización (`synchronized`, locks), estructuras concurrentes (`ConcurrentHashMap`), atomics (CAS), confinamiento (`ThreadLocal`). No thread-safe: `HashMap`, `ArrayList`, `SimpleDateFormat`.',
      },
    ],
  },
];

MOCK_SESSIONS.push(
  {
    id: 'testing',
    title: 'Testing / TDD',
    emoji: '🧪',
    topic: 'test',
    intro: 'La oferta pide TDD y testing serio. Diferencia conceptos y ancla a cómo lo hacéis en Agata; sé honesto con TDD/carga.',
    turns: [
      {
        interviewer: '¿Qué diferencia hay entre un Mock y un Spy?',
        model: 'Mock = objeto falso; por defecto no hace nada, tú defines su comportamiento (`when().thenReturn()`). Spy = envuelve una instancia real, ejecuta el código real salvo lo que stubbees. Mock para aislar (lo normal); spy cuando quieres el comportamiento real menos una pieza.',
      },
      {
        interviewer: '¿Y entre @Mock/@Spy y @MockBean/@SpyBean?',
        model: '`@Mock`/`@Spy` (Mockito) viven en el test, sin contexto de Spring → unit tests rápidos. `@MockBean`/`@SpyBean` registran el doble en el **ApplicationContext** (reemplazan el bean) → integración con `@SpringBootTest`; ojo, modifican el contexto y pueden invalidar su caché (más lento).',
      },
      {
        interviewer: '¿Prueba unitaria vs de integración? ¿Cuándo cada una?',
        model: 'Unitaria: unidad aislada con dependencias mockeadas, rápida, prueba lógica. Integración: piezas colaborando con infra real (BD, Kafka, HTTP), prueba la fontanería (mapeos JPA, queries, serialización). Mayoría unitarias (pirámide); integración donde el riesgo está en la integración, con Testcontainers.',
      },
      {
        interviewer: '¿Aplicáis TDD?',
        model: 'Honestidad: conoces el ciclo **red-green-refactor** y lo aplicas donde aporta; en Agata el foco es Given/When/Then, Object Mothers y mockear solo los bordes. Si no haces TDD estricto siempre, dilo — mejor que fingir.',
      },
      {
        interviewer: '¿Cómo probarías el rendimiento de un endpoint?',
        model: 'Pruebas de carga con JMeter/Gatling/k6: load (carga esperada), stress (hasta romper), spike, soak. Métricas: throughput y latencia en **percentiles p95/p99** (no la media), tasa de error. Integrable en CI con umbrales/SLOs. (Tu zona más floja — repásalo a nivel concepto.)',
      },
    ],
  },
  {
    id: 'contracts',
    title: 'OpenAPI / AsyncAPI',
    emoji: '📜',
    topic: 'contracts',
    intro: 'Punto fuerte tuyo (contract-first en Agata). Enseña que el contrato manda y enlaza con codegen y eventos.',
    turns: [
      {
        interviewer: 'Si tienes un YAML de OpenAPI, ¿dónde defines qué devuelve cada endpoint?',
        model: 'En el bloque `responses` de cada operación: código (200/201/400…), `content` con su media-type (application/json) y `schema` referenciando un componente.',
      },
      {
        interviewer: '¿Qué relación tiene un REST controller con una interfaz generada de OpenAPI?',
        model: 'Contract-first: con openapi-generator generas una **interfaz Java + DTOs** desde el YAML, y el controller la **implementa**. El contrato es la fuente de verdad; un breaking change no compila. En Agata es el patrón en ~43 módulos.',
      },
      {
        interviewer: '¿Y para eventos asíncronos? ¿Conoces AsyncAPI?',
        model: 'Sí: AsyncAPI es el equivalente a OpenAPI pero para mensajería (Kafka/Rabbit). Describe channels (topics), operaciones publish/subscribe, mensajes y bindings del broker. En Agata validamos que los eventos cumplen el contrato AsyncAPI.',
      },
      {
        interviewer: 'En Kafka, ¿cómo gestionas que el esquema de un evento evolucione sin romper consumidores?',
        model: 'Schema Registry (Avro/JSON Schema) versiona los esquemas; valida compatibilidad: backward (consumidor nuevo lee datos viejos), forward (consumidor viejo lee datos nuevos), full. Rechaza cambios incompatibles. Añadir campo con default = backward-compatible.',
      },
    ],
  },
  {
    id: 'microservicios',
    title: 'Microservicios (drilling)',
    emoji: '🧩',
    topic: 'arch',
    intro: 'La oferta es de diseño de microservicios. Equilibra ventajas y coste, y cita patrones reales de Agata.',
    turns: [
      {
        interviewer: '¿Microservicios o monolito? ¿Cuándo cada uno?',
        model: 'Monolito: simple al inicio, ACID local, escala como bloque. Microservicios: despliegue/escalado independiente, ownership por equipo, aislamiento de fallos, a cambio de complejidad distribuida. Sensato: empezar con monolito modular y extraer cuando el dolor lo justifique. No por moda.',
      },
      {
        interviewer: '¿Cómo se comunican entre ellos?',
        model: 'Sync (REST/gRPC) cuando necesitas respuesta inmediata; async (Kafka/Rabbit) con eventos para desacoplar. En Agata, eventos versionados por Kafka + REST contract-first donde hace falta consulta directa.',
      },
      {
        interviewer: '¿Cómo gestionas la consistencia en una operación que cruza varios servicios?',
        model: 'No 2PC. Saga: transacciones locales con acciones compensatorias. Coreografía (cada uno reacciona a eventos) u orquestación (un coordinador). Es eventual consistency; requiere idempotencia y outbox para publicar fiable.',
      },
      {
        interviewer: '¿Qué patrones de resiliencia y operación usarías?',
        model: 'API gateway, service discovery (Eureka), circuit breaker + retry + timeout (Resilience4j), config centralizada, database-per-service, outbox. Observabilidad: métricas (Prometheus), tracing distribuido (OpenTelemetry), logs correlacionados. ShedLock para scheduled en varias instancias.',
      },
    ],
  },
  {
    id: 'redis',
    title: 'Redis / Caché',
    emoji: '🧱',
    topic: 'redis',
    intro: 'Lo usas en Agata (Redisson) y en el mercado mayorista. Enseña que es más que caché.',
    turns: [
      {
        interviewer: '¿Por qué Redis y no una caché en memoria local?',
        model: 'La local (Map/Caffeine) es por-instancia: con 10 pods, 10 cachés incoherentes. Redis es **compartido** entre instancias, sobrevive al reinicio, y da estructuras ricas, TTL, pub/sub, locks. Coste: un hop de red. A veces se combinan (near cache).',
      },
      {
        interviewer: '¿Qué estructuras de Redis conoces y para qué?',
        model: 'String (contadores), Hash (objeto), List (colas), Set (únicos), Sorted Set (rankings, rate limiting), Stream (eventos), HyperLogLog (conteo aproximado). Elegir la estructura adecuada es la clave.',
      },
      {
        interviewer: 'Más allá de caché, ¿para qué lo has usado o usarías?',
        model: 'Sesiones compartidas, rate limiting, colas/jobs, pub/sub, **locks distribuidos**, leaderboards, contadores atómicos. Es un data structure server, no solo caché.',
      },
      {
        interviewer: '¿Cómo harías un lock distribuido con Redis?',
        model: '`SET lock:x token NX PX ttl` (NX = solo si no existe, PX = TTL para evitar deadlock). Liberar con script Lua que comprueba el token (no borrar el de otro). Cuidado con TTL vs duración de la tarea; Redisson lo encapsula. Para corrección estricta a veces mejor un lock en BD.',
      },
    ],
  },
);

// Simulacro completo: secuencia larga que mezcla temas, como una entrevista real.
export const FULL_SIMULACRO: MockTurn[] = [
  { interviewer: 'Para empezar, cuéntame sobre ti y tu experiencia.', model: 'Pitch de 30-45s: 6+ años, Java/Spring Boot, microservicios + Kafka, ahora Agata (hexagonal Java 21, DDD, Kafka, Mongo). Menciona que el CV no está actualizado con Agata.' },
  { interviewer: '¿Qué haces con IA en tu trabajo?', model: 'Claude Code en Agata (conectores, tests, refactors, explorar APIs). Lo que NO delegas: arquitectura, revisión, seguridad; no pegar código propietario; revisar alucinaciones.' },
  { interviewer: '¿Diferencia entre map y flatMap en streams?', model: 'map: 1→1 (Stream<R>). flatMap: transforma cada elemento en un Stream y lo aplana (Stream<Stream<R>>→Stream<R>). Ej: List<Pedido> con List<Linea> → flatMap para todas las líneas.' },
  { interviewer: '¿Interfaz vs clase abstracta?', model: 'Interfaz: contrato, sin estado, multi-herencia, con defaults. Abstracta: estado + lógica compartida, herencia simple. Interfaz para comportamiento de clases no relacionadas; abstracta para jerarquía con código común.' },
  { interviewer: '¿@Controller vs @RestController?', model: '@RestController = @Controller + @ResponseBody: serializa el retorno (JSON) en vez de resolver una vista por ViewResolver. @Controller para web con vistas; @RestController para APIs.' },
  { interviewer: 'En hexagonal, ¿dónde va el REST controller y el repositorio?', model: 'Controller = adapter de entrada (driving), invoca un puerto de entrada. Repositorio: interfaz en domain (puerto de salida), implementación en infraestructura. Dependencias hacia el dominio.' },
  { interviewer: '¿Cómo separas bounded contexts?', model: 'Lenguaje ubicuo, ownership, ciclo de vida, capacidad de negocio, independencia de despliegue. Y consistencia requerida, NFRs, compliance.' },
  { interviewer: 'Un endpoint tarda 10s y el usuario solo necesita saber que se hará. ¿Qué haces?', model: 'Encolar + 202 Accepted con id de seguimiento; consumer aparte. Alternativas: @Async/CompletableFuture, event-driven. La cola es lo más fiable (persistencia, reintentos, escalado).' },
  { interviewer: '¿Async vs reactivo?', model: 'Async: el caller no se bloquea. Reactivo: streams con push + backpressure + no bloqueo sobre pocos threads (Mono/Flux). Todo reactivo es async, no al revés.' },
  { interviewer: 'Cola vs topic, y si levanto 10 pods en una cola, ¿cuántos leen un mensaje?', model: 'Cola = point-to-point (1 consumidor lee); topic = pub/sub (todos los suscriptores / por consumer group en Kafka). 10 pods en una cola: uno solo lee cada mensaje.' },
  { interviewer: '¿Cómo garantizas el orden en Kafka?', model: 'Orden solo por partición → misma clave → misma partición (hash(key)). Sin clave, round-robin y se pierde el orden relativo.' },
  { interviewer: 'Tabla A(5) LEFT JOIN B(10), ¿cuántas filas? ¿Y al revés?', model: 'Al menos 5 (una por fila de A, más si hay varios matches, NULLs si no casa). Al revés, al menos 10. El número exacto depende de la cardinalidad.' },
  { interviewer: '¿Cómo modelas una relación N:M?', model: 'Tres tablas: las dos entidades + tabla de unión con dos FKs y PK compuesta. Si la relación tiene atributos, van en la intermedia.' },
  { interviewer: '¿Ventajas de un PreparedStatement?', model: 'Previene SQL injection (parámetros separados del SQL), reutiliza el plan (parsea/planifica una vez), tipado, legibilidad. Frente al Statement que concatena strings.' },
  { interviewer: '¿Qué es un 401 vs un 403? ¿Y un error de CORS?', model: '401 no autenticado; 403 autenticado sin permiso. CORS: bloqueo del navegador por same-origin (falta Access-Control-Allow-Origin), no es autorización ni seguridad del servidor.' },
  { interviewer: '¿Cómo aseguras que un método con dos repos sea transaccional?', model: '@Transactional en el método que engloba ambas llamadas (misma transacción). Cuidado con self-invocation (proxy) y con poner @Transactional en internos. rollback por unchecked + rollbackFor.' },
  { interviewer: '¿Cómo enfocas el testing?', model: 'JUnit 5 + Mockito, Given/When/Then, Object Mothers, mockear solo bordes, Testcontainers + WireMock. Pirámide. TDD donde aporta; pruebas de carga a nivel concepto.' },
  { interviewer: 'Para cerrar, ¿tienes preguntas para nosotros?', model: 'Sí: cómo aplicáis Scrum, grado de hexagonal/DDD y ADRs, Kafka/Rabbit y para qué cada uno, estrategia de testing, camino a producción (CI/CD), retos actuales del equipo.' },
];

export function mockSession(id: string): MockSession | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}
