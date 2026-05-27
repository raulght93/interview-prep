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
  'Ingeniero Informático (UCLM) con 6+ años desarrollando software, especializado en **backend con Java y Spring Boot** y con recorrido full-stack (Angular, React). He trabajado con **microservicios y Kafka** en varios proyectos y actualmente desarrollo **Agata**, una plataforma de interoperabilidad portuaria: ~40 microservicios conectores en **arquitectura hexagonal estricta con Java 21, DDD, Kafka y MongoDB**, con OpenAPI contract-first y testing con Testcontainers. Me interesa este rol porque encaja con lo que ya hago a diario (hexagonal, DDD, mensajería, clean code) y quiero seguir profundizando.';

export const PITCH_NOTE =
  'Tu CV no incluye aún Agata (no está actualizado), y es tu experiencia más relevante para esta oferta — menciónalo de forma natural.';

export const TECH_MATRIX: TechRow[] = [
  { tech: 'Java (8 → 21)', level: 'fuerte', where: 'Todos los proyectos; Java 21 en Agata' },
  { tech: 'Spring Boot', level: 'fuerte', where: 'Agata, IBIL, OpenBank, mercado mayorista, Avanttic' },
  { tech: 'Arquitectura hexagonal', level: 'fuerte', where: 'Agata (estricta: domain/application/infrastructure)' },
  { tech: 'DDD', level: 'medio', where: 'Agata (dominio puro, value objects, agregados)' },
  { tech: 'Microservicios', level: 'fuerte', where: 'Agata (~40 conectores), IBIL, buscador turístico' },
  { tech: 'Kafka', level: 'fuerte', where: 'Agata (+Schema Registry, AsyncAPI), IBIL, mercado mayorista' },
  { tech: 'RabbitMQ', level: 'conceptual', where: 'No en producción — conoces el modelo AMQP' },
  { tech: 'JPA / Hibernate', level: 'fuerte', where: 'IBIL, mercado mayorista, Feebbo (Tapestry)' },
  { tech: 'MongoDB', level: 'medio', where: 'Agata (Spring Data + Mongock)' },
  { tech: 'Redis', level: 'medio', where: 'Agata (Redisson, caché), mercado mayorista' },
  { tech: 'Oracle / PL/SQL', level: 'medio', where: 'Avanttic (19c, migraciones), apps nativas (21c)' },
  { tech: 'OpenAPI / AsyncAPI', level: 'fuerte', where: 'Agata (contract-first, openapi-generator, validador AsyncAPI)' },
  { tech: 'Spring Security / OAuth2', level: 'medio', where: 'Agata (resource server + client)' },
  { tech: 'MapStruct', level: 'medio', where: 'Agata (mapeo entre capas)' },
  { tech: 'Testing (JUnit 5, Mockito, Testcontainers, WireMock)', level: 'medio', where: 'Agata' },
  { tech: 'TDD / pruebas de carga', level: 'conceptual', where: 'Conoces el ciclo y herramientas; poca práctica formal' },
  { tech: 'Observabilidad (Prometheus, OpenTelemetry)', level: 'medio', where: 'Agata' },
  { tech: 'Angular / NgRx', level: 'fuerte', where: 'Dimática (reactivo), mercado mayorista (Angular 15)' },
  { tech: 'React / Redux / Next', level: 'medio', where: 'OpenBank, buscador turístico, Voice (Next)' },
  { tech: 'Kubernetes / Docker', level: 'medio', where: 'Agata (despliegue de conectores)' },
];

export const TIMELINE: TimelineItem[] = [
  { period: 'Actual', org: 'Diverger — Agata', role: 'Desarrollador backend', stack: 'Java 21, Spring Boot, hexagonal/DDD, Kafka, MongoDB, Redis, OpenAPI/AsyncAPI, Testcontainers, K8s (no en el CV)' },
  { period: '2023 – ahora', org: 'AvantGardeIT', role: 'Analista programador', stack: 'Voice (Next + ExpressJS + GCF), OpenBank (React + Spring Boot)' },
  { period: '2022 – 2023', org: 'Freelance (Colombia)', role: 'Analista programador', stack: 'Spring, Java 17, JPA, Redis, Kafka, Angular 15, Ionic' },
  { period: '2021 – 2022', org: 'AvantGardeIT', role: 'Analista programador', stack: 'IBIL: microservicios Spring Boot, Java 11, JPA, Kafka · Dimática: Angular/Ionic/NgRx' },
  { period: '2020 – 2021', org: 'El Inwebnadero', role: 'Socio y desarrollador', stack: 'React/Redux + Spring microservicios REST + Apache Kafka; Portlets JSP/Hibernate; Cordova + Oracle 21c' },
  { period: '2019', org: 'Avanttic (Madrid)', role: 'Fusion Middleware Consultant', stack: 'Oracle Jet, Cordova, Java; PL/SQL + Spring Boot + Oracle DB 19c' },
  { period: '2017 – 2018', org: 'INDRA / ESI / Feebbo', role: 'Programador', stack: 'Sistemas PI, Android Java, Python+cloud+REST, Java/Hibernate/Tapestry' },
];

export const SELL: string[] = [
  'Hexagonal estricta + DDD a diario en Agata — puedes describir la estructura real de un conector.',
  'Kafka en varios proyectos: orden por partición, consumer groups, Schema Registry, eventos versionados.',
  'OpenAPI/AsyncAPI contract-first con codegen — el contrato como fuente de verdad.',
  'Clean Code y SOLID interiorizados (el proyecto los exige; coinciden con la oferta).',
  'Full-stack real: si hace falta tocar Angular/React, puedes.',
  'Persistencia políglota: relacional (Oracle/JPA) + documental (Mongo) + clave-valor (Redis).',
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
  '¿Qué retos técnicos tenéis ahora mismo en el equipo?',
];
