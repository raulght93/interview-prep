// Chuletas: 1 bloque por tema con los puntos clave, para repaso de última hora.
// Texto telegráfico a propósito (no son las cards, son recordatorios).

export interface CheatSheet {
  topicId: string;
  points: string[];
}

export const CHEATSHEETS: CheatSheet[] = [
  {
    topicId: 'java',
    points: [
      'map: 1→1 · flatMap: aplana Stream<Stream<T>>→Stream<T> · collect: terminal, materializa (Collectors).',
      'Interfaz funcional = 1 método abstracto → lambdas (Function/Predicate/Consumer/Supplier).',
      'Interfaz: contrato, multi-herencia, sin estado · Abstracta: estado + lógica común, herencia simple.',
      'No se instancia una abstracta. Optional para ausencia. record = inmutable → thread-safe.',
    ],
  },
  {
    topicId: 'spring',
    points: [
      '@RestController = @Controller + @ResponseBody. ViewResolver: nombre de vista → View (no en REST).',
      'Query nativa: @Query(nativeQuery=true). Spring Batch: Job→Step→reader/processor/writer.',
      '@Transactional: rollback por unchecked (no checked → rollbackFor). Self-invocation NO aplica (proxy).',
      'Sin @Transactional: TransactionTemplate / PlatformTransactionManager / wrapper bean.',
      'AOP = cross-cutting (logging, seguridad, tx). @Pointcut afinado para no penalizar. MapStruct: mapper en compilación, sin reflexión.',
    ],
  },
  {
    topicId: 'arch',
    points: [
      'Capas: domain → application (use cases + ports) → infrastructure (adapters). Deps hacia el dominio.',
      'Driving (entrada: controller, listener) vs driven (salida: repo, cliente HTTP, productor Kafka).',
      'Repo: interfaz en domain, impl en infra. DTOs junto al controller. Dominio puro (sin HTTP/Kafka/JPA).',
      'BCs: lenguaje ubicuo, ownership, ciclo de vida, capacidad. Proyección cross-BC: read model (CQRS).',
      'Saga (compensación) para tx distribuida. ACL para aislar modelos externos. Entidad/VO/aggregate root.',
      'Microservicios: independientes pero complejidad distribuida. API gateway, circuit breaker, outbox.',
    ],
  },
  {
    topicId: 'rest',
    points: [
      'Content-Type = media type del body (header; produces/consumes en Spring). json/text-plain/multipart.',
      'PUT: reemplazo total, idempotente · PATCH: parcial, no necesariamente idempotente.',
      'Seguros: GET/HEAD/OPTIONS. Idempotentes: +PUT/DELETE. POST no idempotente.',
      'CRUD: GET /x, GET /x/{id}, POST /x (201+Location), PUT/PATCH /x/{id}, DELETE /x/{id} (204).',
      'OpenAPI: responses→content→schema. openapi-generator → interfaz que el controller implementa.',
    ],
  },
  {
    topicId: 'sec',
    points: [
      'JWT = header.payload.signature (Base64Url). Se DECODIFICA siempre; la FIRMA valida.',
      'Claims: registered (iss/sub/aud/exp/iat), public, private (role/tenant). Nada sensible en el payload.',
      'Stateless: Bearer en cada request, valida firma sin sesión en BD.',
      'Access token (corto) + refresh token (largo, revocable). Resource server valida JWT (issuer/JWKS).',
    ],
  },
  {
    topicId: 'cors',
    points: [
      'CORS = mecanismo del NAVEGADOR (same-origin). No es seguridad del servidor ni autorización.',
      'Falta Access-Control-Allow-Origin → el navegador bloquea la respuesta. Preflight OPTIONS para no-simples.',
      '401 = no autenticado (identifícate). 403 = autenticado sin permiso.',
      '404 = no existe. 500 = error del servidor (5xx servidor, 4xx cliente).',
    ],
  },
  {
    topicId: 'async',
    points: [
      'Endpoint lento → 202 Accepted + encolar + consumer. O @Async/CompletableFuture.',
      'Async = no bloqueas al caller. Reactivo = push + backpressure + pocos threads (Mono/Flux).',
      'Nunca bloquear en flujo reactivo (event loop). Virtual threads (J21) para I/O bloqueante simple.',
      'async→sync: join()/get(), CountDownLatch, block() (fuera del event loop).',
      'Thread-safe: inmutabilidad > locks/atomics/concurrentes. No: HashMap, ArrayList, SimpleDateFormat.',
    ],
  },
  {
    topicId: 'msg',
    points: [
      'Cola = point-to-point (1 consumidor). Topic = pub/sub. 10 pods en cola → 1 lee.',
      'Kafka: orden por partición → misma clave (hash). Particiones = paralelismo (max consumers/grupo = particiones).',
      'Offset/commit (antes=at-most-once, después=at-least-once). Consumer lag = no da abasto.',
      'At-least-once → idempotencia obligatoria. DLQ para fallidos. Exactly-once difícil entre sistemas.',
      'RabbitMQ: exchange (direct/topic/fanout) → binding → queue; ack/prefetch; mensaje se borra al consumir.',
      'Kafka (log persistente, reproducible, alto throughput) vs Rabbit (colas/routing, se consume y desaparece).',
    ],
  },
  {
    topicId: 'db',
    points: [
      'N:M = 3 tablas (unión con 2 FKs + PK compuesta). PK identifica; FK referencia (integridad referencial).',
      '1FN atómico · 2FN toda la clave (no parciales) · 3FN nada más que la clave (no transitivas).',
      'Índice compuesto: orden importa (prefijo más a la izquierda). HAVING sin GROUP BY = agregado global.',
      'ACID: Atomicidad, Consistencia, Aislamiento, Durabilidad.',
      'Aislamiento: READ UNCOMMITTED→COMMITTED→REPEATABLE READ→SERIALIZABLE (dirty/non-repeatable/phantom).',
      'Mongo: documental, embeber vs referenciar según acceso. Persistencia políglota: el almacén adecuado a cada caso.',
    ],
  },
  {
    topicId: 'sql',
    points: [
      'INNER = intersección. LEFT/RIGHT = + filas sueltas del lado con NULLs. CROSS = producto cartesiano.',
      'LEFT A(5)→B(10): ≥5. Al revés: ≥10. INNER 3 matches: 3. RIGHT ≥ INNER.',
      'WHERE filtra filas (antes de agrupar) · HAVING filtra grupos (tras agregar).',
      'ORDER BY 1 = primera columna del SELECT (proyección, no tabla).',
      'NULL: NULL=NULL → NULL (usar IS NULL). COUNT(*) cuenta filas; COUNT(col) ignora NULLs.',
      'Orden lógico: FROM→WHERE→GROUP BY→HAVING→SELECT→DISTINCT→ORDER BY→LIMIT.',
    ],
  },
  {
    topicId: 'perf',
    points: [
      'PreparedStatement: anti-injection + plan cache + tipado + legibilidad.',
      'Plan de ejecución: árbol con coste estimado (EXPLAIN/EXPLAIN ANALYZE). Lee de dentro afuera.',
      'Buscas: seq scans inesperados, índices no usados, joins/sorts caros, estimado vs real distinto.',
      'Coste = estimación (I/O+CPU) para comparar planes. Índice baja coste si la selectividad es buena.',
      'Índices: B-tree (general), hash (=), GIN (jsonb/fulltext). Perjudica: escrituras, baja selectividad, tablas pequeñas.',
      'Covering index / index-only scan. N+1: JOIN FETCH / @EntityGraph / @BatchSize.',
    ],
  },
  {
    topicId: 'test',
    points: [
      'TDD: red → green → refactor (técnica de diseño). Mock (falso, tú defines) vs Spy (real, stub parcial).',
      '@Mock (test, sin Spring) vs @MockBean (en el contexto, integración).',
      'Unit (aislado, mocks) vs integración (infra real, Testcontainers). Pirámide: muchos unit, pocos E2E.',
      'Carga: JMeter/Gatling/k6; throughput + p95/p99 (no la media).',
      'SOLID: SRP, Open/Closed, Liskov, Interface Segregation, Dependency Inversion. FIRST + Given/When/Then.',
      'WireMock = stub de APIs externas. Mockear solo bordes, nunca dominio/mappers.',
    ],
  },
  {
    topicId: 'redis',
    points: [
      'In-memory, compartido entre instancias (vs caché local incoherente). Sub-ms, single-thread (atómico).',
      'Estructuras: string/hash/list/set/sorted set (rankings)/stream/HyperLogLog.',
      'TTL + eviction (allkeys-lru/lfu). Patrones: cache-aside, read/write-through, write-behind.',
      'Más que caché: sesiones, rate limiting, colas, pub/sub, locks distribuidos (SET NX PX + Lua).',
      'Persistencia RDB (snapshot) vs AOF (append, más durable). Cluster: sharding por hash slots + réplicas.',
    ],
  },
  {
    topicId: 'contracts',
    points: [
      'OpenAPI: spec REST (endpoints, schemas, responses). Contract-first vs code-first.',
      'openapi-generator → interfaz + DTOs; el controller la implementa. Breaking change → no compila.',
      'AsyncAPI = OpenAPI para eventos (Kafka/Rabbit): channels, publish/subscribe, bindings.',
      'Versionado: /v1, aditivo (no rompe), deprecación con gracia. Schema Registry: compat backward/forward/full.',
      'Contract testing (Pact): el consumidor define lo que espera; falla el build del proveedor si rompe.',
    ],
  },
];

export function cheatsheet(topicId: string): CheatSheet | undefined {
  return CHEATSHEETS.find((c) => c.topicId === topicId);
}
