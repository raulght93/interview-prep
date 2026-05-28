// Resumen de experiencia para tener a mano antes/durante la entrevista.
// Derivado del CV + análisis del stack real de Agata. Personalízalo.

export interface TechRow {
  tech: string;
  level: 'fuerte' | 'medio' | 'conceptual';
  where: string;
}

export interface TimelineItem {
  period: string;
  org: string;
  role: string;
  stack: string;
}

export const PITCH =
  'Ingeniero Informático (UCLM) con 6+ años desarrollando software, especializado en **backend con Java y Spring Boot** y con recorrido full-stack (Angular, React). He trabajado con **microservicios y Kafka** en varios proyectos y actualmente desarrollo **Agata Next**, plataforma de interoperabilidad portuaria event-driven sobre **Kubernetes (RKE2)** con ~40 microservicios conectores en **arquitectura hexagonal estricta con Java 21, DDD, Kafka 4 (KRaft), MongoDB, Apache Flink (CEP) y Valkey**, con OpenAPI/AsyncAPI contract-first, observabilidad completa (Prometheus + OpenSearch + OpenTelemetry) y testing con Testcontainers. Me interesa este rol porque encaja con lo que ya hago a diario (hexagonal, DDD, mensajería, clean code) y quiero seguir profundizando.';

export const PITCH_NOTE =
  'Tu CV no incluye aún Agata (no está actualizado), y es tu experiencia más relevante para esta oferta — menciónalo de forma natural.';

export const TECH_MATRIX: TechRow[] = [
  { tech: 'Java (8 → 21)', level: 'fuerte', where: 'Todos los proyectos; Java 21 en Agata Next' },
  { tech: 'Spring Boot', level: 'fuerte', where: 'Agata, IBIL, OpenBank, mercado mayorista, Avanttic' },
  { tech: 'Arquitectura hexagonal', level: 'fuerte', where: 'Agata (estricta: domain/application/infrastructure)' },
  { tech: 'DDD', level: 'medio', where: 'Agata (dominio puro, value objects, agregados, ACL)' },
  { tech: 'Microservicios', level: 'fuerte', where: 'Agata (~40 conectores), IBIL, buscador turístico' },
  { tech: 'Kafka', level: 'fuerte', where: 'Agata Next: Kafka 4.0 KRaft, Strimzi, Schema Registry, REST Proxy, 3 brokers RF=3' },
  { tech: 'Apache Flink (CEP)', level: 'medio', where: 'Agata Next: 1 JM + 6 TM (114 task slots) para correlación de eventos' },
  { tech: 'RabbitMQ', level: 'conceptual', where: 'No en producción — conoces el modelo AMQP (exchanges, ack, DLQ)' },
  { tech: 'MQTT', level: 'medio', where: 'Agata: Mosquitto para conectores IoT y eventos CCTV (Bosch)' },
  { tech: 'JPA / Hibernate', level: 'fuerte', where: 'IBIL, mercado mayorista, Feebbo (Tapestry)' },
  { tech: 'MongoDB', level: 'medio', where: 'Agata (ReplicaSet 3 nodos, Mongock para migraciones)' },
  { tech: 'PostgreSQL', level: 'medio', where: 'Agata (CNPG operator HA), Avanttic' },
  { tech: 'Neo4j (grafo)', level: 'conceptual', where: 'Agata Next: topología GIS de activos' },
  { tech: 'Valkey / Redis', level: 'medio', where: 'Agata (Valkey 8.1 cluster 3+3), mercado mayorista (Redis)' },
  { tech: 'Oracle / PL/SQL', level: 'medio', where: 'Avanttic (19c, migraciones), apps nativas (21c)' },
  { tech: 'OpenAPI / AsyncAPI / Contract-first', level: 'fuerte', where: 'Agata (~43 módulos con openapi-generator, validador AsyncAPI propio)' },
  { tech: 'Keycloak (OIDC/OAuth2/SAML)', level: 'medio', where: 'Agata Next: SSO + roles para Frontend/Grafana/Zabbix' },
  { tech: 'Spring Security / OAuth2 RS', level: 'medio', where: 'Agata (resource server + client)' },
  { tech: 'Flowable BPM', level: 'conceptual', where: 'Agata Next (motor BPM para procesos de negocio)' },
  { tech: 'MapStruct', level: 'medio', where: 'Agata (mapeo entre capas, sin reflexión)' },
  { tech: 'Testing (JUnit 5, Mockito, Testcontainers, WireMock)', level: 'medio', where: 'Agata (Given/When/Then, Object Mothers)' },
  { tech: 'TDD / pruebas de carga', level: 'conceptual', where: 'Conoces el ciclo y herramientas; poca práctica formal' },
  { tech: 'Observabilidad (Prometheus, OpenTelemetry, Grafana)', level: 'medio', where: 'Agata: micrometer + tracing OTel + dashboards' },
  { tech: 'OpenSearch / ELK', level: 'medio', where: 'Agata Next: logs centralizados (Filebeat + Logstash + OpenSearch)' },
  { tech: 'Resilience4j', level: 'medio', where: 'Agata: circuit breaker + retry en conectores externos' },
  { tech: 'Kubernetes (RKE2) / Docker', level: 'medio', where: 'Agata Next: cluster RKE2 sobre Proxmox, namespaces por dominio' },
  { tech: 'OpenTofu / Ansible (IaC)', level: 'medio', where: 'Agata Next: aprovisionamiento de entornos (Proxmox + RKE2 + servicios)' },
  { tech: 'Angular / NgRx', level: 'fuerte', where: 'Dimática (reactivo), mercado mayorista (Angular 15)' },
  { tech: 'React / Redux / Next', level: 'medio', where: 'OpenBank, buscador turístico, Voice (Next)' },
];

export const TIMELINE: TimelineItem[] = [
  { period: 'Actual', org: 'Diverger — Agata Next', role: 'Desarrollador backend', stack: 'Java 21, Spring Boot, hexagonal estricta/DDD, ~40 microservicios conectores OT/IT, Kafka 4 (KRaft) + Flink CEP, MongoDB + Neo4j + Valkey + PostgreSQL (CNPG), Keycloak SSO, OpenAPI/AsyncAPI contract-first, MapStruct, Testcontainers/WireMock/Cucumber, OpenSearch + OpenTelemetry + Prometheus, RKE2 sobre Proxmox, OpenTofu+Ansible (IaC) — no en el CV' },
  { period: '2023 – ahora', org: 'AvantGardeIT', role: 'Analista programador', stack: 'Voice (Next + ExpressJS + GCF), OpenBank (React + Spring Boot)' },
  { period: '2022 – 2023', org: 'Freelance (Colombia)', role: 'Analista programador', stack: 'Spring, Java 17, JPA, Redis, Kafka, Angular 15, Ionic' },
  { period: '2021 – 2022', org: 'AvantGardeIT', role: 'Analista programador', stack: 'IBIL: microservicios Spring Boot, Java 11, JPA, Kafka · Dimática: Angular/Ionic/NgRx' },
  { period: '2020 – 2021', org: 'El Inwebnadero', role: 'Socio y desarrollador', stack: 'React/Redux + Spring microservicios REST + Apache Kafka; Portlets JSP/Hibernate; Cordova + Oracle 21c' },
  { period: '2019', org: 'Avanttic (Madrid)', role: 'Fusion Middleware Consultant', stack: 'Oracle Jet, Cordova, Java; PL/SQL + Spring Boot + Oracle DB 19c' },
  { period: '2017 – 2018', org: 'INDRA / ESI / Feebbo', role: 'Programador', stack: 'Sistemas PI, Android Java, Python+cloud+REST, Java/Hibernate/Tapestry' },
];

export const SELL: string[] = [
  'Hexagonal estricta + DDD a diario en Agata Next — estructura real de un conector (driving/driven, MapStruct, dominio puro).',
  'Kafka en varios proyectos: orden por partición, consumer groups, Schema Registry, eventos versionados, KRaft sin ZooKeeper.',
  'Event-driven con Apache Flink (CEP) para correlación en tiempo real — patrón moderno de streaming.',
  'OpenAPI + AsyncAPI contract-first con codegen — el contrato como fuente de verdad, valida cambios en CI.',
  'Persistencia políglota real: Mongo + Neo4j + Valkey + PostgreSQL en el mismo sistema (cada uno por su caso de uso).',
  'Observabilidad completa: Prometheus + Grafana + OpenSearch (logs) + OpenTelemetry (tracing) — sé qué pasa en producción.',
  'Seguridad: Keycloak con OIDC/OAuth2/SAML, resource server, mTLS interno.',
  'Clean Code y SOLID interiorizados (el proyecto los exige; coinciden con la oferta).',
  'Full-stack real: si hace falta tocar Angular/React, puedes (NgRx para reactividad en frontend).',
];

export const COVER: string[] = [
  'RabbitMQ: la oferta lo pide y tu fuerte es Kafka. Repasa exchanges/colas/ack/DLQ y di la verdad: Kafka en prod, Rabbit a nivel de concepto.',
  'TDD y pruebas de carga/rendimiento: tu zona más floja. Repasa red-green-refactor y JMeter/Gatling/k6 + p95/p99.',
  'SQL teórico (joins con cardinalidades, 3FN, índices, planes): es donde más teoría preguntan. Es el día crítico del plan.',
  'Reactividad backend (WebFlux/Reactor): conoces el concepto; no exageres la experiencia productiva.',
];

export const REVERSE_QUESTIONS: string[] = [
  '¿Cómo es el flujo de trabajo del equipo? ¿Cómo aplicáis Scrum en el día a día (ceremonias, tamaño de sprint)?',
  '¿Qué grado de adopción tenéis de hexagonal/DDD y cómo de estricto es? ¿Hay ADRs?',
  '¿Kafka, RabbitMQ o ambos? ¿Para qué casos usáis cada uno?',
  '¿Cómo está la estrategia de testing (pirámide, contract testing, pruebas de carga en CI)?',
  '¿Cómo es el camino de un cambio hasta producción (CI/CD, entornos, despliegue)?',
  '¿Usáis observabilidad activa (SLOs/error budgets, alertas, dashboards) o solo logs?',
  '¿Qué retos técnicos tenéis ahora mismo en el equipo?',
  '¿Cómo es la curva de aprendizaje para un nuevo desarrollador y qué esperáis que aporte en los primeros 3-6 meses?',
];
