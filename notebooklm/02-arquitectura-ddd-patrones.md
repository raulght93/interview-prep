# Arquitectura · DDD · Patrones de Diseño

> Hexagonal, DDD táctico y estratégico, microservicios, GoF y patrones distribuidos.

## Teoría

### ARCH

Arquitectura hexagonal (ports & adapters) organiza el código en tres anillos: dominio (modelo y reglas), aplicación (casos de uso y puertos — interfaces de entrada y de salida), e infraestructura (adaptadores que implementan los puertos). La regla cardinal: las dependencias apuntan hacia el dominio. El dominio no sabe de HTTP, JPA, Kafka ni Spring; lo que llamas "fuera" lo haces a través de un puerto que tú definiste y la infraestructura implementa.

Los adaptadores driving (REST controllers, listeners Kafka, schedulers) invocan puertos de entrada (casos de uso). Los adaptadores driven (repositorios JPA/Mongo, clientes HTTP, productores Kafka) implementan puertos de salida declarados por el dominio. Los DTOs viven junto a su adaptador y se mapean al dominio con MapStruct.

DDD táctico. Diferencia tres bloques: entidades (identidad propia que persiste), value objects (definidos por sus atributos, inmutables; Dinero, Email), y aggregate roots (la entidad raíz que garantiza invariantes de un grupo tratado como unidad de consistencia). La lógica de negocio vive dentro del agregado, no en servicios anémicos. Los domain events publicados al cambiar el estado desacoplan reacciones.

DDD estratégico: bounded contexts. Se separan por lenguaje ubicuo, ownership de equipo, capacidad de negocio, independencia de despliegue. La proyección de datos de dos BCs nunca vive en ninguno de los dos: se hace en un read model dedicado (CQRS) que consume eventos de ambos. Una Anti-Corruption Layer te aísla del modelo de un sistema externo.

Microservicios. Aportan despliegue/escalado independiente, ownership por equipo y aislamiento de fallos, a cambio de complejidad distribuida: red, consistencia eventual, observabilidad, versionado de contratos, almacén por servicio. Patrones esenciales: API gateway, service discovery, circuit breaker, saga para transacciones distribuidas, outbox para publicar eventos atómicamente con la BD, CQRS para lecturas/escrituras asimétricas, observabilidad con tracing distribuido.

### PATTERNS

Patrones de diseño son soluciones recurrentes a problemas de diseño OO. El catálogo clásico (GoF, 1994) se divide en creacionales (Singleton, Factory, Builder), estructurales (Adapter, Decorator, Facade, Proxy) y de comportamiento (Strategy, Observer, Command, Template Method, State, Chain of Responsibility).

Java moderno los hace más ligeros. Una Strategy es una lambda implementando una interfaz funcional. Singleton es un @Component de Spring. Decorator y Proxy son lo que hace Spring AOP debajo (@Transactional, @Cacheable). Template Method sigue vivo en JdbcTemplate. Builder es Lombok @Builder.

Patrones de arquitectura distribuida. CQRS separa el modelo de escritura del de lectura, posiblemente con almacenes distintos sincronizados por eventos. Saga sustituye a las transacciones distribuidas con una secuencia de transacciones locales y acciones compensatorias. Outbox garantiza la publicación atómica de un evento junto al cambio en la BD: insertas la fila + un registro outbox en la misma transacción local, y un proceso aparte publica al broker.

Antipatrones. Anemic Domain Model (entidades con getters/setters y toda la lógica en servicios). God class, shotgun surgery, feature envy. Primitive obsession: pasar String/Long para todo en vez de value objects. Service locator disfrazando dependencias. Distributed monolith: microservicios acoplados síncronos en cadena.

## Chuletas (puntos clave)

### ARCH

- Capas: domain → application (use cases + ports) → infrastructure (adapters). Deps hacia el dominio.
- Driving (entrada: controller, listener) vs driven (salida: repo, cliente HTTP, productor Kafka).
- Repo: interfaz en domain, impl en infra. DTOs junto al controller. Dominio puro (sin HTTP/Kafka/JPA).
- BCs: lenguaje ubicuo, ownership, ciclo de vida, capacidad. Proyección cross-BC: read model (CQRS).
- Saga (compensación) para tx distribuida. ACL para aislar modelos externos. Entidad/VO/aggregate root.
- Microservicios: independientes pero complejidad distribuida. API gateway, circuit breaker, outbox.

### PATTERNS

- GoF: creacionales (Singleton, Factory, Builder), estructurales (Adapter, Decorator, Facade, Proxy), comportamiento (Strategy, Observer, Template Method).
- Singleton: bean Spring por defecto. Antipatrón si es variable global con estado mutable.
- Strategy = lambda con interfaz funcional. Spring inyecta Map<String, Strategy>.
- Decorator añade comportamiento, Proxy controla acceso. @Transactional/@Cacheable = AOP proxy → cuidado self-invocation.
- Distribuidos: Saga (compensación) > 2PC. Outbox: escribir BD + evento atómico. Idempotent consumer obligatorio.
- CQRS: separa read/write. ACL aísla modelos externos. Anti-patterns: anemic domain, god class, primitive obsession.

## Flashcards: Arquitectura + Patrones

### ARCH (31 preguntas)

**Pregunta 1:** Si te doy 4 o 5 requisitos, ¿qué haces para plantear la solución?

**Respuesta:** [ver código en la app]

Pasos concretos:
1. Lenguaje ubicuo — glosario con el negocio (¿qué es un "Conector"?).
2. Identificar agregados — unidades de consistencia transaccional.
3. Definir puertos — interfaces de entrada (use cases) y salida (repos, mensajería).
4. Implementar dominio — entidades + lógica de negocio pura, sin Spring.
5. Implementar adaptadores — REST controllers, Kafka listeners, repositorios Mongo.
6. Cablear en config — Spring DI conecta puertos ↔ adaptadores.

En Agata Next: cada microservicio-conector sigue esta estructura en paquetes domain/, application/, infrastructure/.

---

**Pregunta 2:** ¿Orientas tu sistema a eventos o eso es un plus sobre tu sistema?

**Respuesta:** Depende del problema. Dos enfoques:

[ver código en la app]

Lo importante: justificarlo por el problema, no por moda.

- Usa eventos como plus cuando: el flujo de negocio es esencialmente síncrono, los eventos son side effects, el equipo es pequeño.
- Event-driven nativo cuando: escalado asíncrono real, múltiples consumers del mismo evento, replay necesario, bounded contexts realmente desacoplados.

En Agata Next: híbrido. El flujo de ingestión de datos de dispositivos es event-driven nativo (Kafka, Flink). Las APIs de configuración son REST síncrono.

---

**Pregunta 3:** Tienes dos entidades de dominio en bounded contexts separados y necesitas una proyección de datos de ambos. ¿Dónde la haces?

**Respuesta:** No la haces en el dominio de ninguno de los dos (acoplaría contextos). Opciones:

[ver código en la app]

[ver código en la app]

La clave: la proyección vive en su propio espacio, no contamina el modelo de los dominios originales. Es una vista materializada mantenida por eventos.

---

**Pregunta 4:** ¿Cuál es tu regla para separar bounded contexts? Si tienen ciclos de vida distintos, ¿los separarías por algún otro concepto?

**Respuesta:** Criterios principales: lenguaje ubicuo (la misma palabra significa cosas distintas en cada lado → contexto distinto), ownership de equipo, capacidad de negocio (Catálogo, Pagos, Pedidos), independencia de despliegue y ciclo de vida.

Ejemplo: "Cliente" significa cosas distintas en cada contexto — esto es lo que justifica separarlos:
[ver código en la app]

Más allá del ciclo de vida, también separan: frecuencia de cambio, consistencia requerida (lo que necesita transaccionalidad fuerte va junto), dependencias de datos, NFRs muy distintos (uno necesita latencia ms y otro batch nocturno), regulación/compliance (PII, PCI separadas).

Regla mental: si dos partes evolucionan al mismo ritmo, las cambia la misma gente, y comparten lenguaje, NO las separes (un microservicio prematuro es peor que un módulo monolítico bien hecho).

---

**Pregunta 5:** ¿En qué capa meterías un REST controller en arquitectura hexagonal? ¿Y un OpenAPI?

**Respuesta:** El REST controller es un adaptador de entrada (driving/primary adapter) en la capa de infraestructura. Traduce HTTP → llamada al puerto de entrada del dominio.

[ver código en la app]

El controller NO contiene lógica de negocio. Si ves una regla de negocio en el controller, muévela al servicio de aplicación o al dominio.

---

**Pregunta 6:** ¿Qué diferencia hay entre entidad, value object y aggregate root?

**Respuesta:** - Entidad: tiene identidad propia que persiste en el tiempo (un Pedido con su id); dos entidades con mismos datos pero distinto id son distintas.
- Value object: se define por sus atributos, no por identidad; es inmutable y reemplazable (Dinero, Direccion, RangoFechas). Dos value objects con los mismos valores son iguales.
- Aggregate root: la entidad raíz que da acceso a un grupo de objetos tratados como una unidad de consistencia. Las reglas: se referencia por id desde fuera, la raíz garantiza las invariantes del agregado, y una transacción modifica un solo agregado.

[ver código en la app]

Código (estilo Agata Next):
[ver código en la app]

💡 Regla de oro: guarda referencias a otros Aggregates solo por ID (no @ManyToOne). Una transacción = un Aggregate = una unidad de consistencia.

💡 Analogía: el Aggregate Root es el camarero. No puedes entrar a la cocina (Linea interna) a cambiar tu plato — se lo pides al camarero (Pedido), que valida y aplica. Los ingredientes (Dinero, Direccion) son Value Objects: si los cambias por otros iguales, no importa — no tienen identidad, solo valor.

---

**Pregunta 7:** En hexagonal, ¿qué son puertos y adaptadores, y la diferencia driving vs driven?

**Respuesta:** - Puerto: una interfaz definida por el dominio/aplicación. Adaptador: la implementación concreta que la conecta con tecnología.
- Driving / de entrada (primary): lo que invoca a la aplicación. Puerto = caso de uso (interfaz CrearPedidoUseCase); adaptador = REST controller, listener de Kafka, CLI.
- Driven / de salida (secondary): lo que la aplicación necesita. Puerto = interfaz que el dominio declara (PedidoRepository, NotificadorPort); adaptador = implementación JPA, cliente HTTP, productor Kafka.

La regla de oro: las dependencias apuntan hacia el dominio.

[ver código en la app]

Ejemplo en código (estilo Agata):
[ver código en la app]
Clave: el dominio declara lo que necesita (interfaces); la infra lo implementa.

---

**Pregunta 8:** ¿Qué es CQRS y cuándo lo aplicarías?

**Respuesta:** CQRS (Command Query Responsibility Segregation) separa el modelo de escritura (commands, que mutan estado y validan invariantes) del de lectura (queries, optimizado para consultar). Pueden ser dos modelos, dos clases, o incluso dos almacenes distintos sincronizados por eventos.

[ver código en la app]

Cuándo sí: lecturas y escrituras con cargas muy asimétricas; consultas complejas que no encajan con el modelo de dominio; proyección cross-BC (la solución canónica); event sourcing.

Cuándo no: un CRUD sencillo — CQRS añade complejidad real (eventual consistency entre ambos lados; el usuario puede leer un estado anterior al que acaba de escribir). El "CQRS lite" — modelos distintos en código pero misma BD — suele bastar.

En Agata Next: el agata-core-ds-home usa CQRS al delegar búsquedas a OpenSearch (proyección plana, indexada) mientras MongoDB sigue siendo el almacén transaccional del modelo de entidades.

---

**Pregunta 9:** ¿Cómo mantienes consistencia en una transacción que cruza varios microservicios?

**Respuesta:** No puedes usar una transacción ACID distribuida (2PC escala mal y acopla). Se usa el patrón Saga: secuencia de transacciones locales con compensaciones si falla algún paso.

[ver código en la app]

Alternativas: Outbox Pattern (atomicidad local + CDC con Debezium) para garantizar que el evento se publica si y solo si la transacción local persiste.

En Agata Next: se usa Outbox + Debezium con PostgreSQL CNPG para garantizar exactly-once en la publicación de eventos de dominio a Kafka.

---

**Pregunta 10:** ¿Qué es una Anti-Corruption Layer (ACL)?

**Respuesta:** Una Anti-Corruption Layer (ACL) es una capa de traducción que protege tu modelo de dominio del modelo externo (legacy, tercero, otro bounded context).

[ver código en la app]

[ver código en la app]

Cuándo necesitarla: al integrar con sistemas legacy, APIs de terceros, o al consumir eventos de otro bounded context con un modelo distinto.

---

**Pregunta 11:** ¿Dónde van el REST controller y los DTOs en arquitectura hexagonal?

**Respuesta:** El REST controller es un adapter de entrada (driving/primary). Hay dos convenciones sobre dónde vive físicamente:
- Ports & adapters clásica: en infraestructura/adapters, junto a los demás adaptadores de E/S; application solo contiene los casos de uso (puertos de entrada) y orquestación.
- Otra convención lo sitúa en una capa application entendida como "borde/punto de entrada", dejando en infraestructura lo puramente técnico (incluso quedando application casi vacío salvo el arranque).

Lo que no cambia: el controller no tiene lógica de negocio, solo traduce HTTP ↔ caso de uso e invoca un puerto de entrada. Los DTOs de request/response viven junto al controller (son el contrato del borde) y se mapean a/desde el dominio. Si hay DTOs para hablar con otra API (cliente saliente), van junto a ese adaptador. Regla: el dominio nunca conoce DTOs ni HTTP.

---

**Pregunta 12:** ¿Dónde meterías un repositorio en arquitectura hexagonal y por qué?

**Respuesta:** La interfaz del repositorio se declara en el dominio (o capa de aplicación). La implementación concreta va en la infraestructura.

[ver código en la app]

[ver código en la app]

La regla de dependencia: el dominio no importa nada de org.springframework ni de org.mongodb. Solo Java puro + interfaces propias.

---

**Pregunta 13:** ¿Para qué sirve la capa de infraestructura en arquitectura hexagonal?

**Respuesta:** La capa de infraestructura contiene las implementaciones concretas acopladas a una tecnología:

[ver código en la app]

Regla: nada de esta capa se importa desde el dominio. La dirección de dependencia va siempre hacia adentro (infra → aplicación → dominio). Si ves un import de MongoTemplate en el dominio, hay un error de arquitectura.

---

**Pregunta 14:** ¿Microservicios o monolito? ¿Cuándo cada uno?

**Respuesta:** - Monolito: un despliegue único. Más simple de desarrollar, depurar y desplegar al inicio; transacciones ACID locales; menos latencia. Escala como un bloque y puede degenerar en big ball of mud.
- Microservicios: servicios pequeños, desplegables de forma independiente, por capacidad de negocio/bounded context. Ventajas: escalado y despliegue independientes, ownership por equipo, aislamiento de fallos, libertad tecnológica. Coste: complejidad distribuida (red, consistencia eventual, observabilidad, versionado de contratos, un almacén por servicio).

Regla sensata: empieza por un monolito bien modularizado y extrae microservicios cuando el dolor (escalado, nº de equipos, cadencia de despliegue) lo justifique. No por moda.

---

**Pregunta 15:** ¿Qué patrones habituales usarías en una arquitectura de microservicios?

**Respuesta:** [ver código en la app]

Piezas clave:
- API Gateway (Spring Cloud Gateway): entrada única — routing, auth, rate limiting, agregación.
- Service discovery (Eureka, Consul, DNS de K8s): localizar instancias dinámicamente.
- Circuit breaker + retry + timeout + bulkhead (Resilience4j): cortar llamadas a un servicio caído y degradar con gracia.
- Config centralizada (Spring Cloud Config); service mesh (Istio/Linkerd) para mTLS automático entre servicios.
- Comunicación: sync (REST/gRPC) cuando hace falta respuesta; async (Kafka/RabbitMQ) para desacoplar.
- Datos: database-per-service; saga + compensación para consistencia distribuida; outbox para publicar eventos de forma fiable.
- Observabilidad: logs centralizados, métricas y tracing distribuido (correlación de peticiones).

---

**Pregunta 16:** ¿Cómo aportas observabilidad y resiliencia a un microservicio?

**Respuesta:** Observabilidad (los tres pilares):
- Métricas: Micrometer + Prometheus (latencias, throughput, errores, JVM); dashboards en Grafana.
- Logs estructurados (JSON, p.ej. logstash-logback-encoder) centralizados, con correlation/trace id.
- Trazas distribuidas: OpenTelemetry / Micrometer Tracing para seguir una petición a través de varios servicios.
- Actuator expone health, info y métricas.

Resiliencia (Resilience4j): circuit breaker (cortar llamadas a un servicio caído), retry con backoff, timeouts, rate limiter, bulkhead (aislar pools). Para tareas programadas en varias instancias, ShedLock garantiza que solo una las ejecute. Objetivo: fallar rápido, degradar con gracia y poder diagnosticar en producción.

---

**Pregunta 17:** ¿Cómo modelarías una entidad (p.ej. Cómic) en un sistema Java? ¿Qué atributos incluirías?

**Respuesta:** Una entidad de dominio porque su identidad persiste (un cómic tiene su id propio aunque cambien sus atributos). Estructura:
- Id estable (UUID o id de negocio inmutable).
- Atributos que describen la entidad: titulo, numero, editorial, fechaPublicacion (Instant), idioma, autorId, estado (enum), precio (value object Dinero con cantidad + moneda).
- Invariantes en el constructor: título no vacío, fecha válida, idioma permitido, estado inicial coherente.
- Métodos de comportamiento (no setters anémicos): publicar(), retirar(), cambiarPrecio(nuevo) — encapsulan reglas.
- En hexagonal, POJO puro, sin anotaciones JPA/Mongo (eso va en la entidad de persistencia separada).

Usa record solo si es inmutable y sin invariantes complejas; si necesitas comportamiento y mutación controlada, clase normal con campos final donde proceda.

---

**Pregunta 18:** ¿Cómo aseguras un identificador único para una entidad?

**Respuesta:** Opciones:
- UUID (UUID.randomUUID()): generado en aplicación, distribuido, sin colisiones prácticas. Lo más habitual en microservicios.
- ULID/Snowflake: ordenables temporalmente (mejor que UUID v4 para índices secuenciales en BD).
- Autoincremental de BD: simple en monolitos, pero acopla a la BD y no funciona bien distribuido.
- Id de negocio (ISBN para libros, código de cómic): si lo hay y es inmutable.

En DDD el id es un Value Object del agregado, asignado en el constructor (no después). Lo expones como tipo fuerte (ComicId), no String/Long desnudo — evita pasarlo por error a otro id. Lo persistes con su representación textual (UUID) o nativa según el almacén.

---

**Pregunta 19:** ¿Cómo implementarías la relación cómic ↔ autor en Java?

**Respuesta:** Depende del estilo:
- DDD puro: el cómic referencia al autor por id (autorId), no por objeto completo. Cada uno es su propio agregado; la consistencia transaccional vive dentro de cada agregado. Si necesitas datos del autor al mostrar el cómic, los unes en el read model.
- JPA estilo más clásico: @ManyToOne desde Cómic a Autor (autor 1 — N cómics), con FetchType.LAZY y Optional<Autor> al cargarlo. Si es N:M (varios autores por cómic y viceversa) → tabla intermedia con @ManyToMany o entidad propia si la relación tiene atributos (rol, fecha colaboración).
- En Mongo sueles referenciar por id o embeber un sub-doc reducido con los campos necesarios para evitar joins.

Evita acoplar agregados con referencias directas: prefiere id + un servicio/repo si necesitas el otro lado.

---

**Pregunta 20:** ¿Cómo restringes los estados de una entidad (en producción/publicado/retirado)?

**Respuesta:** Modelar el estado como enum y exponer transiciones como métodos del agregado, no como setters:
[ver código en la app]
Las invariantes viven en el agregado. Alternativas más sofisticadas: máquina de estados explícita (Spring StateMachine, librería propia), o sealed types (Java 17+) que modelan cada estado como un subtipo con sus operaciones permitidas — el compilador valida las transiciones.

---

**Pregunta 21:** ¿Cómo validas que un cómic solo se publica en idiomas permitidos?

**Respuesta:** Capas:
- Borde (controller / deserialización): Bean Validation (@NotNull, @Pattern, validador custom @IdiomaPermitido que consulta una lista). Devuelve 400 Bad Request si falla — protege el dominio.
- Dominio: la invariante vive en el agregado (constructor o método publicar(idioma)): si idioma no está en IDIOMAS_PERMITIDOS, lanza una excepción de dominio (IdiomaNoPermitidoException). Nunca confíes solo en el borde.
- Modela el idioma como Value Object (Idioma) o un enum cerrado si el conjunto es fijo (ES, EN, FR…). Si depende de configuración, una lista inyectada como puerto.

Nada de validación dispersa con if por todo el código (defensiveness): centraliza en el constructor/factory y en el VO.

---

**Pregunta 22:** ¿Cómo manejas lógica de negocio compleja siguiendo DDD?

**Respuesta:** Pones la lógica en el dominio (no en los servicios ni los controllers — anemic domain model es el antipatrón). Herramientas DDD:
- Agregados que encapsulan estado + comportamiento y garantizan invariantes (pedido.aplicarDescuento(promo) valida y muta).
- Value Objects para conceptos sin identidad (Dinero, RangoFechas, Direccion), inmutables, con métodos (dinero.sumar(otro)).
- Domain Services cuando la operación involucra varios agregados o no encaja en uno (CalculadoraImpuestos.aplicarA(pedido, cliente)).
- Domain Events para reaccionar a cambios sin acoplar (PedidoConfirmado → notificaciones, analytics).
- Especificaciones (pattern Specification) para reglas compuestas (PedidoElegibleParaDescuento.isSatisfiedBy(p)).

El servicio de aplicación orquesta (carga agregado, llama a su método, persiste) sin lógica de negocio dentro. El test del dominio es puro Java (sin Spring/BD).

---

**Pregunta 23:** ¿Cómo implementas la comunicación entre capas en arquitectura hexagonal con Spring?

**Respuesta:** Spring inyecta las implementaciones de los puertos en cada capa, pero las interfaces las define el dominio/aplicación:
- El controller (infra/driving) recibe por constructor un puerto de entrada (CrearPedidoUseCase), interfaz de la capa application; Spring inyecta la implementación (@Service que implementa la interfaz).
- El servicio de aplicación recibe por constructor los puertos de salida que necesita (PedidoRepository, NotificadorPort) — interfaces en domain/application; las implementaciones (JpaPedidoRepository, KafkaNotificador) viven en infra y son los beans inyectados.
- Constructor injection, nada de @Autowired en campos.
- DTOs del controller se mapean al dominio con MapStruct antes de llamar al caso de uso; el dominio nunca conoce DTOs.

La regla: las dependencias apuntan hacia el dominio. Spring es solo el ensamblador (la composición), no parte del dominio.

---

**Pregunta 24:** ¿Cómo estimas la capacidad/throughput de un sistema en una fase de diseño?

**Respuesta:** Estimación back-of-the-envelope, no necesita ser exacta — necesita ser defendible:
1. Cargas de entrada: usuarios concurrentes, peticiones por usuario y minuto, picos vs media. P.ej. "100k usuarios, 10% activos por hora, 5 peticiones/min/usuario → ~833 req/s pico".
2. Mezcla read/write (típicamente 80/20 o 90/10).
3. Latencia objetivo (p95 < 200ms).
4. Cuello de botella probable: BD suele ser el primero. ¿Cuántas queries por petición? ¿Cuántos por segundo aguanta un Postgres con tu hardware? (Regla: ~5–20k qps simple).
5. Mensajería: throughput esperado, retención, particiones. Un broker Kafka aguanta 100k+ msg/s por broker en simple.
6. Holgura x2-x3 sobre el pico esperado.
7. Datos: GB/día → escalado de almacenamiento.

Descompón por servicio. Cita números de referencia conocidos. Termina con "empezamos con X y monitorizamos para escalar".

---

**Pregunta 25:** ¿Cómo asignas un "latency budget" entre los componentes de una petición?

**Respuesta:** Tienes un objetivo end-to-end (p.ej. p95 < 200ms) y lo repartes entre todo lo que la petición atraviesa. Ejemplo de presupuesto:
- API gateway / auth: 5-10ms
- Servicio (lógica): 20-30ms
- BD principal (query simple con índice): 5-20ms (más si compleja)
- Caché Redis/Valkey: <1ms
- Llamada a otro servicio (red interna): 5-15ms + su propio presupuesto
- Serialización JSON, GC, overhead JVM: 5-10ms
- Margen (15-20%): para picos

Si un componente excede, optimiza ese o ajusta el budget. Esto te da una guía para decidir cuándo cachear, cuándo paginar, cuándo hacer algo asíncrono. Para latencias "a través de varios servicios" recuerda que la latencia se suma (peor caso) — por eso el async/eventos es clave para no acumular en el camino crítico.

---

**Pregunta 26:** Estimación ágil: story points, planning poker, t-shirt sizing.

**Respuesta:** Estimas complejidad relativa, no horas (las horas son sesgadas e inválidas a través de personas).
- Story points: escala Fibonacci (1, 2, 3, 5, 8, 13, 21). Una historia de 3 es 3× más compleja que una de 1, no 3 horas. Calibrado con una historia de referencia del equipo.
- Planning poker: cada miembro elige carta a la vez → revela → discuten quien votó muy alto/bajo → vuelven a votar. Saca consenso y discusiones útiles ("no sabía que también afectaba a Y").
- T-shirt sizing (XS/S/M/L/XL): más grueso, para roadmap/épicas donde no hay detalle.
- #NoEstimates: dividir todo en historias pequeñas y similares; estimar = contar.

La velocidad del equipo (puntos completados por sprint) es lo que da previsibilidad. No comparar velocidad entre equipos (es relativa).

---

**Pregunta 27:** ¿Qué es Event Sourcing?

**Respuesta:** En lugar de guardar el estado actual de tus entidades, guardas la secuencia completa de eventos que han ocurrido (PedidoCreado, LineaAñadida, PedidoPagado). El estado actual se reconstruye reproduciendo los eventos.

Ventajas:
- Auditoría completa: cada cambio queda registrado con quién y cuándo.
- Time travel: puedes ver el estado en cualquier momento del pasado.
- Domain events de primera clase: el almacén ya son los eventos del dominio.
- Encaja muy bien con CQRS (el read model se construye consumiendo los eventos).

Coste:
- Complejidad alta (versionado de eventos, snapshots para reconstruir rápido, manejo de eventos obsoletos).
- Queries ad-hoc difíciles (de ahí el read model separado).
- Reescribir la historia (cambios de schema) es complicado.

No lo uses por defecto. Tiene sentido en dominios donde la auditoría/temporalidad es central (finanzas, sanidad, plataformas que deben justificar cada cambio). Frameworks: Axon, EventStoreDB.

---

**Pregunta 28:** ¿Qué son los "domain primitives" y por qué evitar primitive obsession?

**Respuesta:** Primitive obsession = pasar String/Long/BigDecimal para todo (String email, Long userId, BigDecimal price). Problemas:
- Mezcla accidental (pasar el id de pedido donde se esperaba el de usuario; el compilador no se entera).
- Validación dispersa: "¿es un email válido?" comprobado en 20 sitios.
- Sin comportamiento: las operaciones ("suma de dos Dinero solo si la moneda coincide") las pones donde no tocan.

Domain primitives: tipos pequeños envolviendo el primitivo con sus invariantes:
[ver código en la app]
Ventajas: imposible mezclar tipos, validación una vez (en el constructor), comportamiento donde toca. En Java moderno con record el coste sintáctico es mínimo y compensa con creces.

---

**Pregunta 29:** Spring Cloud Gateway: ¿qué hace y por qué usarlo?

**Respuesta:** Spring Cloud Gateway es un API Gateway construido sobre Spring WebFlux (reactivo, no bloqueante). Es el reemplazo moderno de Zuul (que es bloqueante).

Qué hace:
- Routing: mapea rutas externas a servicios internos basado en predicates (Path, Host, Method, Header, Cookie, Query...).
- Filters: transforma request/response (rewrite path, añadir headers, autenticación, rate limiting, retry, circuit breaker).
- Cross-cutting: termina TLS, autentica (JWT/OAuth2), logea, métricas, tracing.

Config YAML típica:
[ver código en la app]

Valor en microservicios:
- Punto único de entrada (auth, rate limit, CORS), no replicado en cada servicio.
- Cliente externo desacoplado de la topología interna (puedes mover/dividir servicios sin cambiar URLs públicas).
- Composición/agregación (un BFF que combina varios servicios).

Alternativas: Kong, Traefik, AWS API Gateway, Nginx. Spring Cloud Gateway encaja cuando ya estás en stack JVM y quieres definirlo en código.

---

**Pregunta 30:** Service discovery: Eureka vs Consul vs DNS de Kubernetes.

**Respuesta:** El problema: en un clúster de microservicios, los pods/instancias cambian de IP. Los clientes necesitan localizar dónde está el servicio destino.

- Eureka (Spring Cloud Netflix): client-side. Cada servicio se registra al arrancar y los clientes le preguntan al servidor Eureka qué instancias están vivas. Cliente cachea + balancea (con RestTemplate/WebClient + LoadBalancer). Modelo AP (CAP): prioriza disponibilidad sobre consistencia.
- Consul (HashiCorp): más completo (KV store + service mesh + DNS). Compatible con stacks no-Java. Modelo CP.
- DNS de Kubernetes (CoreDNS): server-side. Los services tienen una entrada DNS (pedidos.namespace.svc.cluster.local). El cliente solo hace http://pedidos:8080 y kube-proxy hace el load-balance. No necesitas Eureka si estás en K8s: la plataforma lo da gratis.

Regla: si estás en Kubernetes, usa el DNS nativo. Eureka tiene sentido en VMs/bare-metal sin K8s o si vienes de un stack Spring Cloud antiguo. Consul si necesitas service mesh L7 + KV + multi-cloud.

En Agata Next conviven los tres modos según el componente: Eureka en algunos servicios, DNS de K8s para la mayoría.

---

**Pregunta 31:** Service mesh (Istio, Linkerd): ¿qué aporta sobre microservicios en K8s?

**Respuesta:** Un service mesh inyecta un sidecar proxy (Envoy en Istio, ultralight en Linkerd) junto a cada pod. Todo el tráfico entre servicios pasa por el sidecar, que añade funcionalidades sin tocar el código de la app:

- mTLS automático entre servicios (zero trust): cada sidecar tiene certificado emitido por la CA del mesh, rotación automática.
- Routing avanzado: canary, blue/green, retries, timeouts, circuit breaking — declarado en YAML, no en código.
- Observabilidad transparente: métricas, tracing y logs de cada hop sin instrumentar la app.
- Políticas L7: autorización por servicio (X solo puede llamar a Y), no solo L3/4 como NetworkPolicies.

Vs Resilience4j: Resilience4j vive dentro de tu app (anotaciones, métricas en Micrometer). El mesh vive fuera (en el sidecar). Combinados, no se anulan: tu app puede tener circuit breaker propio del dominio + el del mesh.

Coste:
- Complejidad operativa alta (Istio especialmente).
- Overhead de latencia (+1-3ms por hop por el sidecar).
- Curva del equipo de plataforma.

Linkerd es más ligero y opinado; Istio más potente y configurable. Para 5-10 servicios, NetworkPolicies + Resilience4j suele bastar. Para 50+, el mesh empieza a justificarse.

---

### PATTERNS (17 preguntas)

**Pregunta 1:** ¿Qué son los patrones de diseño y qué grupos hay (GoF)?

**Respuesta:** Soluciones probadas a problemas recurrentes de diseño OO, popularizados por el libro "Gang of Four" (Gamma, Helm, Johnson, Vlissides). Tres categorías:
- Creacionales (cómo se crean los objetos): Singleton, Factory Method, Abstract Factory, Builder, Prototype.
- Estructurales (cómo se componen): Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.
- Comportamiento (cómo interactúan): Strategy, Observer, Command, Template Method, Iterator, State, Chain of Responsibility, Mediator, Memento, Visitor.

No son recetas a aplicar siempre: dan vocabulario común y aparecen como respuesta natural a problemas. Hoy muchos los aplicas sin nombrarlos (lambdas = Strategy, Spring beans = Singleton gestionado por contenedor). Sobre-ingeniería = aplicarlos sin necesidad.

---

**Pregunta 2:** Singleton: ¿cuándo es válido y cuándo es un antipatrón?

**Respuesta:** Singleton garantiza una única instancia de una clase, con acceso global. En Java se hace típicamente con enum (la forma segura: seriall ización, reflexión, thread-safety gratis) o con un private static final INSTANCE.

Válido cuando hay una única instancia real por definición: pool de conexiones, logger, registry, caché de configuración.

Antipatrón cuando:
- Se usa como variable global disfrazada: acopla a todo el código, oculta dependencias, dificulta tests (no puedes mockearlo).
- Tiene estado mutable compartido → problemas de concurrencia.
- En Spring lo normal es declarar el bean como @Component (singleton por defecto) e inyectarlo — sin acceso global ni getInstance(). Eso resuelve el caso legítimo sin las pegas.

---

**Pregunta 3:** Factory Method, Abstract Factory y Builder: ¿cuándo cada uno?

**Respuesta:** - Factory Method: una clase delega a un método (sobrescribible) la creación de objetos. Cuando hay varias variantes de un objeto y quieres ocultar el new concreto. En Spring, @Bean métodos son factories.
- Abstract Factory: una familia de objetos relacionados (botón + ventana + scrollbar consistentes con el SO). Devuelve varios productos coordinados.
- Builder: construir un objeto complejo paso a paso, con muchos parámetros opcionales, evitando constructores telescópicos:
[ver código en la app]
Lombok @Builder lo genera. Ideal con muchos campos opcionales, validación al final, o objetos inmutables (records con with-style).

---

**Pregunta 4:** ¿Qué es el patrón Strategy y cómo lo aplicas en Java/Spring moderno?

**Respuesta:** Strategy: encapsula un algoritmo intercambiable detrás de una interfaz; el cliente elige cuál usar en tiempo de ejecución. Sustituye un if/else por composición.

Ejemplo clásico:
[ver código en la app]

Java moderno (lambdas + interfaz funcional):
[ver código en la app]

Patrón muy útil con Spring — inyecta un Map<String, T> con TODOS los beans de un tipo (la clave es el nombre del bean):
[ver código en la app]
Añadir una nueva estrategia = crear un bean. Sin tocar la calculadora. Open/Closed cumplido. En Agata Next se usa este patrón para SimilarityConsolidationStrategy (varias estrategias de deduplicación intercambiables) y para los mappings de schemas.

💡 Analogía: vas tarde al trabajo. Pillas el coche, el metro o la bici — la operación (llegar a la oficina) es la misma; cambia el algoritmo. Y mañana puedes cambiar de transporte sin avisar a tu jefe ni reformar la oficina. Eso es Strategy.

---

**Pregunta 5:** Observer / Pub-Sub: ¿qué es y cómo encaja con eventos de dominio o Kafka?

**Respuesta:** Observer: un sujeto notifica a N observadores cuando cambia su estado, sin conocerlos individualmente. Desacopla productor de consumidores.

Iteraciones modernas:
- En dominio: domain events publicados cuando algo significativo ocurre (PedidoConfirmado); los handlers reaccionan. En Spring: ApplicationEventPublisher + @EventListener (in-process, síncrono por defecto, @Async opcional).
- En arquitectura distribuida: pub/sub vía broker (Kafka, RabbitMQ): el productor publica un evento, N consumer groups reaccionan sin saber unos de otros. Es Observer a escala distribuida.
- En frontend reactivo: RxJS/NgRx, streams + subscribers.

Ventajas: extensible (añadir un nuevo handler no toca al productor); coste: orden, idempotencia y observabilidad distribuida si cruza red.

💡 Analogía: te suscribes a la newsletter de cervezas artesanas. Cuando lanzan una nueva, te llega el email. Tú no atosigas a la cervecería cada mañana preguntando si hay novedades — y si te das de baja, ellos no se enteran (ni les importa). Pub/sub puro.

---

**Pregunta 6:** Decorator vs Proxy: ¿en qué se parecen y en qué se diferencian?

**Respuesta:** Ambos envuelven un objeto e implementan su misma interfaz, pero con intención distinta:

[ver código en la app]

- Decorator: añade funcionalidad dinámicamente. Pueden encadenarse varios (new EncryptedStream(new BufferedStream(new FileStream(...)))). Lo eliges en tiempo de ejecución.
- Proxy: controla el acceso al objeto envuelto: lazy loading, control remoto, seguridad/transacciones, caché. El consumidor no sabe que es un proxy.

En Spring lo ves a diario: @Transactional, @Cacheable, @Async, @PreAuthorize funcionan con proxies dinámicos (JDK si la clase implementa una interfaz, CGLib si no). De ahí el caveat famoso de self-invocation: el this.metodo() no pasa por el proxy y la anotación se ignora. Cuando depuras y ves nombres tipo MyService$$EnhancerBySpringCGLIB$$xxxx estás viendo un proxy.

---

**Pregunta 7:** Adapter y Facade: ¿qué problema resuelven y cómo se ven en arquitectura hexagonal?

**Respuesta:** - Adapter: convierte la interfaz de una clase en otra que el cliente espera (incompatibilidad de contratos).
- Decorator: añade comportamiento a un objeto sin alterar su interfaz ni su clase.
- Facade: proporciona una interfaz simplificada a un subsistema complejo.

[ver código en la app]

[ver código en la app]

---

**Pregunta 8:** Template Method: ¿qué es y un ejemplo en Spring?

**Respuesta:** Template Method: una clase abstracta define el esqueleto de un algoritmo en un método final, con hooks abstractos que las subclases rellenan. El flujo lo manda la clase base; los detalles cambian las subclases.

Ejemplos en Spring:
- JdbcTemplate, RestTemplate, TransactionTemplate: el template gestiona apertura/cierre, manejo de errores, recursos; tú pones solo el callback con tu SQL/petición/operación dentro.
- Spring Batch: el framework controla el ciclo Step, tú implementas reader/processor/writer.

Diferencia con Strategy: Template usa herencia (subclases rellenan métodos); Strategy usa composición (le pasas el comportamiento). En Java moderno se prefiere Strategy con lambdas, pero el template sigue siendo útil cuando hay un flujo elaborado a reusar.

---

**Pregunta 9:** Patrones distribuidos clave: Saga, Outbox, Idempotent Consumer.

**Respuesta:** - Saga: secuencia de transacciones locales con acciones compensatorias si un paso falla; sustituye a 2PC en microservicios.

[ver código en la app]

- Outbox: para escribir en BD y publicar un evento atómicamente sin dual-write. En la misma transacción insertas la fila + un registro en la tabla outbox; un proceso aparte (CDC o poller) publica el evento al broker y marca la fila como enviada.

- Idempotent Consumer: como Kafka/Rabbit garantizan at-least-once, el consumer debe ser idempotente: clave de deduplicación (id del mensaje/operación), UPSERT, comprobar si ya se procesó. Patrón típico:
[ver código en la app]

Dos estilos de saga: coreografía (cada servicio reacciona a eventos, sin coordinador — más desacoplado, harder to follow) y orquestación (un coordinador central dirige los pasos — más visible). Los tres juntos = arquitectura event-driven fiable.

💡 Analogía (Saga): reservas un viaje — vuelo, hotel, coche de alquiler. Llega el día y el rent-a-car no tiene tu modelo. Cancelas el hotel (compensas), devuelves el vuelo (compensas) y te quedas en casa con cara de tonto. No fue una transacción ACID — fue una saga con acciones de deshacer.

💡 Analogía (Outbox): cuando dejas una nota Y la metes en la bandeja de salida del despacho en el mismo movimiento, el conserje pasará a llevarla cuando pueda. No hay riesgo de "escribí la nota pero olvidé sacarla": ambos pasos van juntos.

💡 Analogía (idempotencia): el botón del ascensor. Pulsa 10 veces si quieres, viene una sola vez. Tu consumer hace lo mismo: el mismo mensaje dos veces (reintento) = una sola operación efectiva.

---

**Pregunta 10:** ¿Qué antipatrones evitar conoces?

**Respuesta:** Los antipatrones más comunes con ejemplos concretos:

[ver código en la app]

💡 Truco diagnóstico para God Class: si el nombre de la clase incluye "Manager", "Handler", "Processor" o "Service" SIN un sustantivo de negocio claro → probable God Class. PedidoCreationService ✓, DataProcessingManager ✗.

---

**Pregunta 11:** Repository pattern: ¿qué hace y cómo encaja en hexagonal?

**Respuesta:** Repository abstrae el acceso a una colección de agregados, exponiendo una API orientada al dominio (no a SQL/Mongo). El dominio dice "dame el pedido con id X", "guarda este pedido", "busca los pedidos en estado PENDIENTE". El cómo (JPA, Mongo, in-memory) es detalle de infraestructura.

En hexagonal: la interfaz del repositorio vive en el dominio (o aplicación) como puerto de salida; la implementación vive en infraestructura.
[ver código en la app]
Claves DDD:
- Un repositorio por agregado (no por entidad anémica). 
- No expone consultas arbitrarias estilo findAll(Predicate) — métodos con nombre del dominio (findCanceladosDeUltimoMes).
- Para consultas complejas o cross-agregado → read model separado (CQRS), no metas joins raros en el repo del agregado.

---

**Pregunta 12:** State pattern: cuándo usarlo y cómo encaja con sealed types.

**Respuesta:** State pattern: el comportamiento de un objeto cambia según su estado interno; cada estado es una clase con su propia lógica, y el objeto delega en ella. Sustituye un if/switch enorme repartido por todos los métodos.

Ejemplo Agata-style — máquina de estados de entidades (StateMachineService):
[ver código en la app]
El pedido delega: pedido.estado = pedido.estado.confirmar(pedido). Cada estado define qué transiciones son válidas.

Ventajas vs if/switch:
- Cada estado, una clase: añadir un estado nuevo no toca los demás.
- El compilador valida exhaustividad (sealed + switch).
- Imposible llamar a una operación inválida sin que el estado lo permita.

En Agata Next: el StateMachineService orquesta transiciones de entidades; el EntityState lo persistes en MongoDB. Para flujos con eventos y guardas más complejos, Spring StateMachine (framework) es una alternativa más declarativa.

💡 Analogía: un semáforo. En rojo te dice "para", en ámbar "acelera o frena", en verde "pasa". Mismo objeto, comportamiento que cambia según su estado. Si el alcalde añade un nuevo estado (parpadeante), no cambia los demás — añade una clase nueva.

---

**Pregunta 13:** Chain of Responsibility: ¿dónde lo ves en Spring?

**Respuesta:** Chain of Responsibility: una petición pasa por una cadena de handlers; cada uno decide si la procesa, la transforma, o la pasa al siguiente. Desacopla quién envía de quién acaba procesando.

Donde aparece en Spring (todos siguen este patrón):
- SecurityFilterChain (Spring Security): la request pasa por filtros (SecurityContextPersistenceFilter → BearerTokenAuthenticationFilter → AuthorizationFilter...). Cada uno puede autenticar/rechazar/dejar pasar.
- Servlet FilterChain: filtros HTTP en cadena (CORS, logging, compresión...).
- Spring Cloud Gateway filters: pre y post filters sobre la request.
- HandlerInterceptor de Spring MVC: pre/post handle.
- Cadena de @ControllerAdvice y ExceptionHandlerExceptionResolver: deciden quién maneja qué excepción.

Implementación canónica:
[ver código en la app]
Usos típicos en backend: validación encadenada, pipelines de procesado de eventos (Agata Next usa esto en los procesadores Flink), enriquecimiento de mensajes, autorización por capas (URL → método → dato).

💡 Analogía: pides una excepción en el banco. Cajero: "no puedo, sube al director". Director: "no llego, ve al gerente". Gerente: aprueba. Cada handler decide: lo gestiono, o pásalo al siguiente. Si nadie puede → 403.

---

**Pregunta 14:** Command pattern: ¿cuándo y vs Strategy?

**Respuesta:** Command: encapsula una acción (con sus parámetros) como un objeto. Puedes pasarla, encolarla, registrarla, deshacerla, repetirla. Es la idea base de muchos patrones modernos.

Diferencia con Strategy:
- Strategy = cómo hacer algo (varios algoritmos para la misma tarea). Sin estado.
- Command = qué hacer (la intención + sus parámetros). Con estado (el comando lleva los datos).

Usos modernos:
- CQRS: en la parte de escritura, los commands son objetos (CrearPedidoCommand, ConfirmarPedidoCommand) que un handler ejecuta. El controller convierte un DTO HTTP en un command y se lo da al use case:
[ver código en la app]
Ventajas: API estable (los commands son contratos), tests fáciles, auditoría (loguear todos los commands), reintento.

- Mensajes Kafka como commands: cctv-bosch.command.moveToPreset es literalmente un comando.
- Undo/redo: cada acción es un command; se guardan en un stack para deshacer.
- Encolar acciones (executors, schedulers): un Runnable o Callable es un command.

En Agata Next: los topics [subsistema]-[localización].command.[acción] son commands distribuidos.

---

**Pregunta 15:** Mediator pattern: ¿qué resuelve?

**Respuesta:** Mediator: un componente central por el que los demás se comunican, evitando que cada uno conozca a los demás. Reduce el acoplamiento N-a-N a N-a-1 (cada componente conoce solo al mediator).

Donde aparece:
- ApplicationEventPublisher de Spring: los publishers no conocen a los listeners; el contexto de Spring es el mediator que enruta los eventos.
- Brokers de mensajería: Kafka/RabbitMQ son mediators a escala distribuida.
- MediatR / Axon en CQRS: una pieza central recibe commands/queries y los enruta al handler adecuado.
- UI: un componente padre mediator entre hijos que no se conocen entre sí.

Diferencia con Observer:
- Observer: relación 1-a-N directa (el sujeto sabe sus observadores o un canal de pub/sub).
- Mediator: hub centralizado más rico (puede transformar, decidir reglas de ruteo, no solo retransmitir).

Ejemplo Spring:
[ver código en la app]
PedidoService no sabe de Notificador ni Estadisticas — los descubre el mediator (el contexto).

💡 Analogía: una torre de control aérea. Los aviones no se hablan entre sí (sería caos: 20 aviones = 400 conversaciones); todos hablan con la torre, que decide rutas y orden. Quitas un avión y nadie se entera; añades uno y solo se registra con la torre.

---

**Pregunta 16:** Visitor pattern: ¿y por qué Java moderno lo hace casi innecesario?

**Respuesta:** Visitor: añadir operaciones a una jerarquía cerrada sin tocar las clases. Cada clase tiene un accept(Visitor v) que llama al método del visitor que le corresponde. El visitor define la operación; las clases solo aceptan.

Problema clásico que resuelve: tienes una jerarquía Forma { Circulo, Cuadrado, Triangulo } y quieres añadir operaciones (calcularArea, dibujar, serializar) sin modificar las clases cada vez.

Java moderno (sealed types + pattern matching switch) lo hace mucho más limpio:
[ver código en la app]
El compilador exige exhaustividad (si añades una Forma nueva, todos los switches que faltan dan error de compilación — error útil, te dice qué hay que actualizar).

Cuándo sí usar Visitor clásico hoy:
- Si la jerarquía está en un módulo que NO controlas (no puedes hacer sealed).
- Si necesitas double-dispatch sobre dos jerarquías a la vez.
- En lenguajes sin pattern matching (Java <17, sin sealed).

En lo demás: sealed + switch es más legible y más seguro.

---

**Pregunta 17:** Specification pattern: ¿qué resuelve?

**Respuesta:** Encapsula una regla de negocio booleana ("es elegible para descuento", "está en zona prioritaria") en un objeto reutilizable y combinable, en vez de tenerla repetida como if/else por todo el código.
[ver código en la app]
Ventajas:
- Reusable: la misma spec sirve en validación, filtrado de listas, queries.
- Composable: clienteAlValor.and(zonaPrioritaria).and(noPedidosPendientes).
- Testeable: cada regla en aislamiento.
- Trasladable a queries: Spring Data JPA tiene Specification<T> que genera el WHERE dinámicamente.

Ideal cuando hay reglas que se evalúan en varios sitios (UI, dominio, query) y/o se componen con frecuencia.

---
