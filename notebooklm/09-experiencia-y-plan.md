# Mi Perfil y Experiencia Profesional

> Pitch, matriz de tecnologías, trayectoria, puntos a vender y a cubrir. Plan de estudio de 6 días.


## Pitch profesional

Ingeniero Informático (UCLM) con 6+ años desarrollando software, especializado en backend con Java y Spring Boot y con recorrido full-stack (Angular, React). He trabajado con microservicios y Kafka en varios proyectos y actualmente desarrollo Agata Next, plataforma de interoperabilidad portuaria event-driven sobre Kubernetes (RKE2) con ~40 microservicios conectores en arquitectura hexagonal estricta con Java 21, DDD, Kafka 4 (KRaft), MongoDB, Apache Flink (CEP) y Valkey, con OpenAPI/AsyncAPI contract-first, observabilidad completa (Prometheus + OpenSearch + OpenTelemetry) y testing con Testcontainers. Me interesa este rol porque encaja con lo que ya hago a diario (hexagonal, DDD, mensajería, clean code) y quiero seguir profundizando.

## Trayectoria profesional


### Actual — Diverger — Agata Next
**Rol:** Desarrollador backend
**Stack:** Java 21, Spring Boot, hexagonal estricta/DDD, ~40 microservicios conectores OT/IT, Kafka 4 (KRaft) + Flink CEP, MongoDB + Neo4j + Valkey + PostgreSQL (CNPG), Keycloak SSO, OpenAPI/AsyncAPI contract-first, MapStruct, Testcontainers/WireMock/Cucumber, OpenSearch + OpenTelemetry + Prometheus, RKE2 sobre Proxmox

### 2023 – ahora — AvantGardeIT
**Rol:** Analista programador
**Stack:** Voice (Next + ExpressJS + GCF), OpenBank (React + Spring Boot)

### 2022 – 2023 — Freelance (Colombia)
**Rol:** Analista programador
**Stack:** Spring, Java 17, JPA, Redis, Kafka, Angular 15, Ionic

### 2021 – 2022 — AvantGardeIT
**Rol:** Analista programador
**Stack:** IBIL: microservicios Spring Boot, Java 11, JPA, Kafka · Dimática: Angular/Ionic/NgRx

### 2020 – 2021 — El Inwebnadero
**Rol:** Socio y desarrollador
**Stack:** React/Redux + Spring microservicios REST + Apache Kafka; Portlets JSP/Hibernate; Cordova + Oracle 21c

### 2019 — Avanttic (Madrid)
**Rol:** Fusion Middleware Consultant
**Stack:** Oracle Jet, Cordova, Java; PL/SQL + Spring Boot + Oracle DB 19c

### 2017 – 2018 — INDRA / ESI / Feebbo
**Rol:** Programador
**Stack:** Sistemas PI, Android Java, Python+cloud+REST, Java/Hibernate/Tapestry

## Matriz de tecnologías

| Tecnología | Nivel | Contexto |
|---|---|---|
| Java (8 → 21) | fuerte | Todos los proyectos; Java 21 en Agata Next |
| Spring Boot | fuerte | Agata, IBIL, OpenBank, mercado mayorista, Avanttic |
| Arquitectura hexagonal | fuerte | Agata (estricta: domain/application/infrastructure) |
| DDD | medio | Agata (dominio puro, value objects, agregados, ACL) |
| Microservicios | fuerte | Agata (~40 conectores), IBIL, buscador turístico |
| Kafka | fuerte | Agata Next: Kafka 4.0 KRaft, Strimzi, Schema Registry, REST Proxy, 3 brokers RF=3 |
| Apache Flink (CEP) | medio | Agata Next: 1 JM + 6 TM (114 task slots) para correlación de eventos |
| RabbitMQ | conceptual | No en producción — conoces el modelo AMQP (exchanges, ack, DLQ) |
| MQTT | medio | Agata: Mosquitto para conectores IoT y eventos CCTV |
| JPA / Hibernate | fuerte | IBIL, mercado mayorista, Feebbo |
| MongoDB | medio | Agata (ReplicaSet 3 nodos, Mongock para migraciones) |
| PostgreSQL | medio | Agata (CNPG operator HA), Avanttic |
| Neo4j (grafo) | conceptual | Agata Next: topología GIS de activos |
| Valkey / Redis | medio | Agata (Valkey 8.1 cluster 3+3), mercado mayorista (Redis) |
| Oracle / PL/SQL | medio | Avanttic (19c, migraciones), apps nativas (21c) |
| OpenAPI / AsyncAPI / Contract-first | fuerte | Agata (~43 módulos con openapi-generator, validador AsyncAPI propio) |
| Keycloak (OIDC/OAuth2/SAML) | medio | Agata Next: SSO + roles para Frontend/Grafana/Zabbix |
| Spring Security / OAuth2 RS | medio | Agata (resource server + client) |
| MapStruct | medio | Agata (mapeo entre capas, sin reflexión) |
| Testing (JUnit 5, Mockito, Testcontainers, WireMock) | medio | Agata (Given/When/Then, Object Mothers) |
| Observabilidad (Prometheus, OpenTelemetry, Grafana) | medio | Agata: micrometer + tracing OTel + dashboards |
| OpenSearch / ELK | medio | Agata Next: logs centralizados (Filebeat + Logstash + OpenSearch) |
| Resilience4j | medio | Agata: circuit breaker + retry en conectores externos |
| Kubernetes (RKE2) / Docker | medio | Agata Next: cluster RKE2 sobre Proxmox, namespaces por dominio |
| Angular / NgRx | fuerte | Dimática (reactivo), mercado mayorista (Angular 15) |
| React / Redux / Next | medio | OpenBank, buscador turístico, Voice (Next) |

## Puntos a vender en la entrevista

- Hexagonal estricta + DDD a diario en Agata Next — estructura real de un conector (driving/driven, MapStruct, dominio puro).
- Kafka en varios proyectos: orden por partición, consumer groups, Schema Registry, eventos versionados, KRaft sin ZooKeeper.
- Event-driven con Apache Flink (CEP) para correlación en tiempo real — patrón moderno de streaming.
- OpenAPI + AsyncAPI contract-first con codegen — el contrato como fuente de verdad, valida cambios en CI.
- Persistencia políglota real: Mongo + Neo4j + Valkey + PostgreSQL en el mismo sistema.
- Observabilidad completa: Prometheus + Grafana + OpenSearch (logs) + OpenTelemetry (tracing).
- Seguridad: Keycloak con OIDC/OAuth2/SAML, resource server, mTLS interno.
- Clean Code y SOLID interiorizados (el proyecto los exige).
- Full-stack real: si hace falta tocar Angular/React, puedes (NgRx para reactividad en frontend).

## Puntos a cubrir / áreas de mejora

- RabbitMQ: la oferta lo pide y tu fuerte es Kafka. Repasa exchanges/colas/ack/DLQ y di la verdad: Kafka en prod, Rabbit a nivel de concepto.
- TDD y pruebas de carga/rendimiento: tu zona más floja. Repasa red-green-refactor y JMeter/Gatling/k6 + p95/p99.
- SQL teórico (joins con cardinalidades, 3FN, índices, planes): es donde más teoría preguntan.
- Reactividad backend (WebFlux/Reactor): conoces el concepto; no exageres la experiencia productiva.

---

# Plan de Estudio de 6 Días


## Día 1: Java funcional + Spring + Testing (~4h)

- Streams: map vs flatMap, collect y Collectors.
- Interfaz funcional vs normal; interfaz vs clase abstracta.
- @Controller vs @RestController; query nativa @Query(nativeQuery=true).
- @Transactional: propagation, rollback por unchecked, self-invocation (proxy).
- AOP/aspectos: cross-cutting concerns, @Pointcut.
- Testing: TDD (red-green-refactor), Mock vs Spy, pirámide, SOLID/Clean Code.

## Día 2: HTTP / REST / Seguridad + Contratos (~3h)

- Content-Type, CRUD URLs, PUT vs PATCH, verbos seguros/idempotentes.
- Contract-first: OpenAPI → interfaz + DTOs. AsyncAPI para eventos.
- JWT: estructura, claims, acceso vs refresh token.
- CORS (same-origin, preflight). 401 vs 403.

## Día 3: Arquitectura: DDD + Hexagonal + Microservicios + Patrones (~3-4h)

- Capas hexagonales, puertos driving vs driven, dependencias hacia el dominio.
- DDD táctico: entidad/value object/aggregate root.
- Bounded contexts: lenguaje ubicuo, proyección cross-BC.
- Microservicios vs monolito; saga, outbox, circuit breaker.
- GoF: Strategy, Decorator vs Proxy, Builder. Antipatrones.

## Día 4: Async + Mensajería + Redis + Observabilidad (~4h)

- Endpoint 10s → 202 + encolar; @Async/CompletableFuture.
- Async vs Reactive; WebFlux/Mono/Flux; nunca bloquear en flujo reactivo.
- Kafka 4 KRaft: particiones, consumer groups, offset/lag, orden por clave.
- RabbitMQ: exchanges + bindings + ack/prefetch. Kafka vs RabbitMQ.
- Redis/Valkey: estructuras, TTL/eviction, cache-aside, locks distribuidos.
- Observabilidad: 3 pilares, Prometheus, OpenTelemetry, SLI/SLO/SLA.

## Día 5: SQL — el día crítico (~4h)

- Joins con números: LEFT A(5)→B(10) = mínimo 5; INNER 3 matches = 3.
- Tipos de join, WHERE vs HAVING vs GROUP BY.
- Modelado N:M, 1FN/2FN/3FN, ACID y aislamiento.
- Índices: B-tree, compuestos, covering, cuándo perjudican.
- PreparedStatement: parámetros, plan cache, anti-injection.

## Día 6: IA + mock + repaso de marcadas (~2-3h)

- LLM: modelo Transformer entrenado para predecir el siguiente token.
- Precauciones con código privado: no pegar propietario en chats públicos.
- Mock interview: respóndete en voz alta usando el modo Quiz de cada topic.
- Repasa todas las cards marcadas como "Repasar".
- Prepara 2-3 anécdotas concretas: hexagonal+OpenAPI, Kafka, IA.