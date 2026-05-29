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
      'AuthN (¿quién eres? 401) vs AuthZ (¿qué puedes? 403). AuthN antes que AuthZ; AuthZ en cada operación.',
      'OAuth2 = autorización delegada. OIDC = OAuth2 + id_token (login). SAML = XML + SSO empresarial.',
      'Flujos OAuth2: Auth Code + PKCE (apps/SPAs), Client Credentials (M2M), Refresh, Device. Implicit y Password deprecados.',
      'Keycloak: Realm (tenant) · Client (app) · Users · Roles (realm/client) · Groups · Identity Providers (LDAP/social) · protocol mappers.',
      'JWT = header.payload.signature Base64Url (NO cifrado, decodificable). La firma valida. Access corto + refresh largo.',
      'Spring Security: FilterChain → AuthenticationManager (providers) → SecurityContext (ThreadLocal) → AuthorizationManager.',
      '@EnableMethodSecurity + @PreAuthorize (antes, SpEL) / @PostAuthorize (sobre returnObject) / @Secured / @RolesAllowed.',
      'RBAC (roles+permisos, simple) · ABAC (atributos+contexto, OPA/Rego) · ReBAC (relaciones, Zanzibar/OpenFGA).',
      'Passwords: NUNCA MD5/SHA-256 (rápidos). Usa bcrypt (cost 12+), Argon2 (PHC winner), scrypt. Spring: DelegatingPasswordEncoder.',
      'MFA: SMS (débil) < TOTP < Push < WebAuthn/passkeys (phishing-resistant por origin binding).',
      'CSRF = navegador envía cookie automáticamente. Defensas: token, SameSite, JWT en header (no cookie).',
      'XSS = JS inyectado. Defensas: escape de salida, CSP, httpOnly en cookies, sanitización HTML.',
      'Identidad en micros: token forwarding (scope amplio) vs BFF (sesión + service tokens cortos) vs Token Exchange RFC 8693.',
      'mTLS entre servicios (zero trust, service mesh). Secretos: Vault / Sealed Secrets / External Secrets, nunca en el repo.',
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
      'ACID: Atomicidad, Consistencia, Aislamiento, Durabilidad. Aislamiento: READ UNCOMMITTED→COMMITTED→REPEATABLE READ→SERIALIZABLE.',
      'MVCC (Postgres/Oracle): varias versiones por fila, lectores no bloquean escritores. VACUUM limpia versiones obsoletas.',
      'Deadlock = dos tx esperándose. Evita: orden consistente de locks, tx cortas, reintentos con backoff.',
      'Mongo: documental, embeber vs referenciar según acceso. Persistencia políglota: el almacén adecuado a cada caso.',
      'Neo4j (grafo): nodos+relaciones con propiedades, recorridos O(salto). Cypher: (a:Tipo)-[:REL]->(b). Cuándo: redes, recomendaciones, GIS, topología, fraude.',
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
  {
    topicId: 'patterns',
    points: [
      'GoF: creacionales (Singleton, Factory, Builder), estructurales (Adapter, Decorator, Facade, Proxy), comportamiento (Strategy, Observer, Template Method).',
      'Singleton: bean Spring por defecto. Antipatrón si es variable global con estado mutable.',
      'Strategy = lambda con interfaz funcional. Spring inyecta Map<String, Strategy>.',
      'Decorator añade comportamiento, Proxy controla acceso. @Transactional/@Cacheable = AOP proxy → cuidado self-invocation.',
      'Distribuidos: Saga (compensación) > 2PC. Outbox: escribir BD + evento atómico. Idempotent consumer obligatorio (at-least-once).',
      'CQRS: separa read/write. ACL aísla modelos externos. Anti-patterns: anemic domain, god class, primitive obsession, distributed monolith.',
    ],
  },
  {
    topicId: 'algo',
    points: [
      'Big-O: O(1)<log n<n<n log n<n²<2ⁿ. Identifica el peor caso asintótico.',
      'ArrayList: get O(1), insert end amortized O(1), insert middle O(n). LinkedList rara vez es la mejor.',
      'HashMap: O(1) promedio. Java 8+: bucket con árbol rojinegro si >8 entradas → O(log n) peor caso. equals/hashCode consistentes.',
      'TreeMap/TreeSet: O(log n), ordenado (rojinegro). PriorityQueue: heap binario, O(log n).',
      'BFS = cola, camino más corto en aristas. DFS = pila/recursión, ciclos, topológico. Ambos O(V+E).',
      'Memoization (top-down) y DP (bottom-up): subestructura óptima + subproblemas solapados.',
      'Java sort: Arrays.sort primitivos = dual-pivot quicksort; Collections.sort = TimSort (estable).',
      'Patrones: two pointers, sliding window, divide y vencerás, greedy, backtracking.',
      'Concurrentes: ConcurrentHashMap (no Hashtable), CopyOnWriteArrayList (lectura intensiva), BlockingQueue, LongAdder.',
    ],
  },
  {
    topicId: 'cc',
    points: [
      'Agentic (ejecuta) > autocomplete. Loop think→act→observe.',
      'CLAUDE.md: memoria del proyecto. Reglas/convenciones/comandos. NO código, NO secrets, NO git history.',
      'Subagents: aislan contexto, paralelizan, especializan (test-writer, architect). Custom en .claude/agents/.',
      'Plan mode para cambios grandes; aprobación humana antes de aplicar.',
      'Hooks: scripts en eventos (PreToolUse/PostToolUse/Stop). Auto-format, validación, logging.',
      'MCP = estándar abierto para integrar fuentes externas (Jira, GitHub, BBDD). Auth en el server, no en el prompt.',
      'settings.json: modos de permiso + allow/deny granular. Versiona el del proyecto.',
      'NO delegues: arquitectura, revisión final, seguridad, código propietario en chats públicos.',
      'Coste: elige modelo (Opus/Sonnet/Haiku). Cache de prompts. Subagents para no llenar contexto.',
      'Verifica siempre: tests + build verde + lee el diff. La IA puede alucinar APIs.',
    ],
  },
  {
    topicId: 'k8s',
    points: [
      'Pod = unidad mínima. Deployment (stateless) vs StatefulSet (identidad estable, PVC propio) vs DaemonSet (1 por nodo).',
      'Service tipos: ClusterIP (interno), NodePort (debug), LoadBalancer (1 IP externa), Headless (DNS a pods).',
      'Ingress > N LoadBalancers: 1 IP + reglas por host/path + TLS. Necesita Ingress Controller (nginx/Traefik).',
      'Probes: liveness (reinicia), readiness (saca del Service), startup (arranque lento). No confundir.',
      'NetworkPolicy: segmentación L3/L4 entre pods. Necesita CNI compatible (Calico, Cilium). Patrón default-deny.',
      'Operators + CRDs = código vivo: Strimzi (Kafka), CNPG (Postgres HA), cert-manager (TLS).',
      'Requests = reserva (scheduling). Limits = máximo (throttling/OOMKilled). QoS: Guaranteed > Burstable > BestEffort.',
    ],
  },
  {
    topicId: 'java21',
    points: [
      'Records: clase inmutable, constructor canónico + getters + equals/hashCode/toString auto. Compact constructor para validar.',
      'Sealed classes + permits: jerarquías cerradas. Switch expression exhaustivo sin default (el compilador valida).',
      'Pattern matching: instanceof con binding var, switch con patrones y guarded patterns (when). Record patterns para desestructurar.',
      'Virtual Threads (Loom): threads ligeros gestionados por JVM (~KB). I/O bloqueante → VT se desmonta del carrier, no bloquea.',
      'spring.threads.virtual.enabled=true → Spring MVC escala como WebFlux sin cambiar el modelo de programación.',
      'Pinning: synchronized dentro de VT impide desmontarse → usar ReentrantLock. Detectar: -Djdk.tracePinnedThreads=full.',
      'StructuredConcurrency (preview): scope con fork+join, cancela tareas huérfanas, sin thread leaks.',
      'Text blocks: """ ... """ para JSON/SQL/HTML multilínea. .formatted() para interpolación.',
      'Sequenced Collections: getFirst/getLast/addFirst/addLast/reversed() en List, Deque y Map con orden.',
    ],
  },
  {
    topicId: 'webflux',
    points: [
      'Mono<T>: 0 o 1 elemento. Flux<T>: 0 a N. Ambos son cold (nada ocurre hasta subscribe).',
      'map: síncrono T→R. flatMap: async T→Mono/Flux (aplana). switchMap: cancela la suscripción anterior.',
      'onErrorReturn / onErrorResume / onErrorMap / retry / retryWhen(Retry.backoff) / timeout.',
      'publishOn: cambia thread para operadores siguientes. subscribeOn: afecta al source. boundedElastic para I/O bloqueante.',
      'Nunca bloquear en el event loop. fromCallable(() -> jdbcCall()).subscribeOn(Schedulers.boundedElastic()).',
      'WebClient: fluido, composable, replace RestTemplate. retrieve().onStatus(...).bodyToMono(...).',
      'R2DBC: drivers BBDD reactivos. ReactiveCrudRepository. @Transactional con ReactiveTransactionManager.',
      'Testing: StepVerifier.create(flux).expectNext(...).verifyComplete(). withVirtualTime para tiempo virtual.',
      'VTs vs WebFlux: VTs más simples para apps CRUD. WebFlux solo si necesitas backpressure real o SSE/WS de alta carga.',
    ],
  },
  {
    topicId: 'react',
    points: [
      'Next.js App Router: Server Components por defecto (sin JS cliente). "use client" solo para interactividad o browser APIs.',
      'Prefetch SSR→CSR: queryClient.prefetchQuery → dehydrate → HydrationBoundary. Sin doble fetch al montar.',
      'Middleware (middleware.ts): auth, redirects. Matcher para excluir /api/auth, _next, assets.',
      'next-auth v5 + Keycloak: JWT callback renueva access_token con refresh_token cuando caduca.',
      'React.memo con comparación custom (isEqual). Lazy + Suspense para code splitting.',
      'useCallback / useMemo para referencias estables. Regla: solo cuando la creación es cara o rompe memoización de hijos.',
      'TanStack Query: staleTime/gcTime, queryOptions pattern, invalidateQueries para actualización manual.',
      'Radix UI (a11y sin estilos) + CVA (variantes Tailwind) + cn (clsx+tailwind-merge). asChild/Slot pattern.',
      'Web Components: @r2wc/react-to-web-component. Comunicación postMessage (WidgetMessenger). customElements.whenDefined.',
    ],
  },
  {
    topicId: 'angular',
    points: [
      'Lifecycle: constructor (solo DI) → ngOnChanges → ngOnInit → ngAfterViewInit → ngOnDestroy.',
      'OnPush: solo re-renderiza con nueva referencia @Input, evento local, async pipe emite, o markForCheck(). Requiere inmutabilidad.',
      'Signals (v17+): signal(), computed(), effect(). Fine-grained reactivity sin OnPush ni Zone.js.',
      'DI: providedIn:"root" → singleton global. providers en @Component → instancia propia. inject() fuera del constructor.',
      'Routing lazy: loadChildren(() => import(...).then(m => m.ROUTES)). Guards funcionales con inject(). Resolvers.',
      'Reactive Forms: FormBuilder, valueChanges (Observable). AsyncValidatorFn con debounce+switchMap. markAllAsTouched().',
      'Interceptors funcionales (v15+): HttpInterceptorFn. Refresh token: 401 → refreshToken() → switchMap(reintento) → catchError(logout).',
      'Memory leaks: takeUntilDestroyed(destroyRef) (v16+) o async pipe. Nunca subscribe sin cleanup.',
      'Standalone components (v17+): imports directos, sin NgModule. provideHttpClient(withInterceptors([...])).',
    ],
  },
  {
    topicId: 'flink',
    points: [
      'Arquitectura: JobManager (coordina) + N TaskManagers (slots). Paralelismo = instancias por operador.',
      'Event time vs Processing time. Watermarks: señal "no llegan eventos < T". forBoundedOutOfOrderness(Duration).',
      'Ventanas: Tumbling (fijas), Sliding (solapadas), Session (por inactividad), Global (trigger explícito).',
      'Funciones de ventana: reduce (incremental), aggregate (estado explícito), process (contexto completo + side outputs).',
      'CEP: Pattern.begin().where().followedBy().within(). CEP.pattern(stream.keyBy(), patron). select() o flatSelect().',
      'Keyed state: ValueState, ListState, MapState. Declarar en open(), nunca en constructor.',
      'State backend: HashMapStateBackend (memoria, rápido) vs EmbeddedRocksDB (disco, estado grande).',
      'Checkpoints (automáticos, recuperación) vs Savepoints (manuales, upgrades de job). upgradeMode: savepoint en K8s Operator.',
      'Exactly-once E2E: offsets Kafka en checkpoint + KafkaSink con DeliveryGuarantee.EXACTLY_ONCE + transactionalIdPrefix.',
    ],
  },
  {
    topicId: 'cicd',
    points: [
      'IaC: versionar infra en Git. Provisioning (OpenTofu/Terraform) + Configuration (Ansible). Reproducibilidad + auditoría.',
      'Terraform/OpenTofu: declarativo. init → plan (dry-run) → apply. State en remote backend (S3/MinIO). Resource / variable / module.',
      'Ansible: imperativo + idempotente. Sin agente (SSH). Playbooks, Roles (tasks+handlers+templates), Inventory, Jinja2.',
      'Jenkins declarativo: pipeline { agent { docker } stages { stage { steps } } post { failure } }. parallel para etapas concurrentes.',
      'Jenkins: credentials() para secrets. Shared Libraries para reutilizar Groovy. Multibranch para pipeline por rama.',
      'SonarQube: bugs, vulnerabilidades, code smells, duplicación, cobertura (JaCoCo). Quality Gate: umbrales que abortan el pipeline.',
      'waitForQualityGate abortPipeline: true en Jenkins. sonar:sonar con token. Excluir generated/** en sonar.exclusions.',
      'GitOps: estado en Git, ArgoCD/Flux sincroniza el cluster. Sin kubectl manual en producción. PR = cambio de infra.',
      'Conventional commits + semantic-release: feat→minor, fix→patch, feat!→major. Changelog automático.',
    ],
  },
  {
    topicId: 'obs',
    points: [
      '3 pilares: métricas (agregadas), logs (texto/JSON), traces (recorrido de petición).',
      'Prometheus + Micrometer: counter/gauge/histogram. p95/p99 (no la media). Cuidado cardinalidad de tags.',
      'OpenTelemetry estándar (CNCF) para producir telemetría. Spans anidados, traceparent header, sampling.',
      'Logs estructurados JSON + MDC (traceId/userId). Filebeat → Logstash → OpenSearch + Dashboards.',
      'Liveness (reinicia) vs Readiness (saca del Service). No confundir o reinicios en bucle.',
      'Resilience4j: circuit breaker, retry+backoff, rate limiter, bulkhead, time limiter.',
      'SLI (métrica) · SLO (objetivo interno) · SLA (contrato externo) · error budget (1-SLO).',
    ],
  },
];

export function cheatsheet(topicId: string): CheatSheet | undefined {
  return CHEATSHEETS.find((c) => c.topicId === topicId);
}
