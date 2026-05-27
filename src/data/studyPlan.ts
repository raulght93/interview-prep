// Plan de estudio de 6 días, derivado del diagnóstico del arquitecto del área.
// Cada día enlaza con los topics que toca (deep link a flashcards / quiz).

export interface StudyDay {
  day: number;
  title: string;
  hours: string;
  /** topicIds que se trabajan ese día (para los deep links). */
  topics: string[];
  /** Puntos clave a repasar. */
  points: string[];
}

export const STUDY_PLAN: StudyDay[] = [
  {
    day: 1,
    title: 'Java funcional + Spring (MVC, transacciones, AOP) + Testing',
    hours: '~4h',
    topics: ['java', 'spring', 'test'],
    points: [
      'Streams: map vs flatMap (flatMap aplana Stream<Stream<T>>), collect y Collectors.',
      'Interfaz funcional vs normal; interfaz vs clase abstracta; no instanciar abstracta.',
      '@Controller vs @RestController; query nativa @Query(nativeQuery=true).',
      'Transacciones: @Transactional (propagation, rollback por unchecked + rollbackFor), self-invocation (proxy), TransactionTemplate.',
      'AOP/aspectos: cross-cutting concerns, @Pointcut, no penalizar rendimiento.',
      'Testing: TDD (red-green-refactor), Mock vs Spy, @Mock vs @MockBean, unit vs integración (Testcontainers), pirámide, SOLID/Clean Code.',
    ],
  },
  {
    day: 2,
    title: 'HTTP / REST / Seguridad + Contratos (OpenAPI/AsyncAPI)',
    hours: '~3h',
    topics: ['rest', 'sec', 'cors', 'contracts'],
    points: [
      'Content-Type (header + produces/consumes); json vs text/plain vs multipart. CRUD URLs.',
      'PUT (idempotente) vs PATCH; verbos seguros/idempotentes.',
      'Contract-first: OpenAPI → interfaz + DTOs generados que el controller implementa. AsyncAPI para eventos.',
      'Versionado de API y breaking changes; schema registry (Avro) en Kafka; contract testing (Pact).',
      'JWT: estructura, claims, se decodifica siempre, la firma valida; access vs refresh token.',
      'CORS (same-origin, preflight) ≠ autorización. 401 vs 403; 404 vs 500.',
    ],
  },
  {
    day: 3,
    title: 'Arquitectura: DDD + Hexagonal + Microservicios + eventos',
    hours: '~3h',
    topics: ['arch'],
    points: [
      'Capas: dominio → aplicación/use cases → adapters/infra. Puertos driving (entrada) vs driven (salida).',
      'Ubicación: RestController y DTOs (debate application vs infra); repositorio = interfaz en domain, impl en infra.',
      'Para qué la infraestructura; entidad vs value object vs aggregate root.',
      'Bounded contexts: lenguaje ubicuo, ownership, ciclo de vida, capacidad. Proyección cross-BC: read model (CQRS).',
      'Microservicios vs monolito; patrones: API gateway, service discovery, circuit breaker, saga, outbox.',
      'Eventos como plus vs event-driven nativo; saga + compensación; ACL.',
    ],
  },
  {
    day: 4,
    title: 'Async / Reactivo + Mensajería (Kafka + RabbitMQ) + Redis',
    hours: '~3-4h',
    topics: ['async', 'msg', 'redis'],
    points: [
      'Endpoint 10s → 202 + encolar; @Async/CompletableFuture; async→sync (join/get, CountDownLatch).',
      'Async (no bloqueas) vs Reactive (push + backpressure + pocos threads); reactividad en Spring (WebFlux, Mono/Flux) vs imperativo.',
      'Nunca bloquear en flujo reactivo; virtual threads vs reactivo; thread safety.',
      'Cola vs topic (10 pods en cola = 1 lee). Kafka: particiones, consumer groups, offset/lag, orden por clave.',
      'RabbitMQ: exchanges (direct/topic/fanout), bindings, routing key, ack/prefetch, DLQ. Kafka vs RabbitMQ.',
      'Redis: estructuras (string/hash/zset/stream), TTL/eviction, patrones de caché (cache-aside), locks distribuidos, pub/sub.',
    ],
  },
  {
    day: 5,
    title: 'SQL — el día crítico',
    hours: '~4h',
    topics: ['db', 'sql', 'perf'],
    points: [
      'Joins con números: LEFT A(5)→B(10) = mínimo 5; al revés mínimo 10; INNER 3 matches = 3.',
      'Tipos de join (INNER/LEFT/RIGHT/FULL/CROSS/SELF). WHERE vs HAVING vs GROUP BY.',
      'Modelado N:M = 3 tablas (tabla de unión, PK compuesta). 1FN/2FN/3FN. ACID y aislamiento.',
      'Índices compuestos (prefijo más a la izquierda); cuándo un índice perjudica.',
      'ORDER BY 1 = primera columna del SELECT. HAVING sin GROUP BY (agregado global). Orden lógico.',
      'PreparedStatement (parámetros, plan cache, anti-injection). Plan de ejecución: seq vs index scan, coste, N+1.',
    ],
  },
  {
    day: 6,
    title: 'IA + mock + repaso de marcadas',
    hours: '~2-3h',
    topics: ['ia'],
    points: [
      'Historia personal de uso de IA: herramientas, para qué, qué NO delegas (arquitectura, revisión, secretos).',
      'LLM en una frase: modelo Transformer entrenado para predecir el siguiente token.',
      'Precauciones con código privado: no pegar propietario en chats públicos, revisar output, no confiar en cifras alucinadas.',
      'Mock interview: respóndete en voz alta usando el modo Quiz de cada topic.',
      'Repasa todas las cards que marcaste como “Repasar” (botón Repaso diario / Marcadas).',
      'Prepara 2-3 anécdotas concretas: una hexagonal+OpenAPI, una Kafka, una de IA.',
    ],
  },
];
