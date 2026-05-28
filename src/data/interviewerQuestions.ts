// Preguntas interesantes que TÚ haces al entrevistador.
// Cada categoría: el "porqué" + 4-7 preguntas concretas, con notas sobre
// qué revela cada una y qué deberías escuchar.

export interface QuestionSection {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  questions: { q: string; why?: string }[];
}

export const INTERVIEWER_SECTIONS: QuestionSection[] = [
  {
    id: 'equipo',
    emoji: '👥',
    title: 'Equipo, cultura y proceso',
    intro:
      'Estas son las preguntas que mejor te dicen cómo es el día a día. Las respuestas "depende" o evasivas son una señal. Las concretas — "hacemos daily a las 10, retro cada 2 semanas" — son verdes.',
    questions: [
      { q: '¿Cómo es el flujo de trabajo del equipo? ¿Cómo aplicáis Scrum/Kanban en el día a día (ceremonias, tamaño de sprint, planning)?', why: 'Si recitan la guía Scrum pero no tienen retro o no la usan, es bandera amarilla.' },
      { q: '¿Cómo se prioriza el backlog? ¿Lo lleva Producto, el Tech Lead, el equipo?' },
      { q: '¿Cuál es la cultura de code review? ¿Se hace en serio o es trámite? ¿Quién aprueba?' },
      { q: '¿Cómo manejáis la deuda técnica? ¿Hay tiempo dedicado en cada sprint o solo cuando "duele"?' },
      { q: '¿Cómo se reciben las nuevas ideas o propuestas de mejora? ¿Quién las decide?' },
      { q: '¿Cómo es la relación con Producto? ¿Os involucran desde el principio (descubrimiento) o llega el ticket cerrado?' },
      { q: '¿Hacéis pair programming, mob, o cada uno con su tarea?' },
    ],
  },
  {
    id: 'tecnico',
    emoji: '🏗️',
    title: 'Técnico y arquitectura',
    intro:
      'Es donde sondea si la realidad coincide con la oferta. Lo que dicen aquí debería ser específico ("usamos hexagonal en N, en M aún no llegamos") — las generalidades indican poca madurez.',
    questions: [
      { q: '¿Qué grado de adopción tenéis de hexagonal/DDD y cuán estricto es? ¿Hay ADRs documentando decisiones?', why: 'Quieres saber si "hexagonal" es real o nombre del archivo.' },
      { q: '¿Usáis Kafka, RabbitMQ o ambos? ¿Qué casos resuelve cada uno?' },
      { q: '¿Cuál es vuestra estrategia de contratos? ¿OpenAPI contract-first, AsyncAPI, contract testing entre servicios?' },
      { q: '¿Cómo gestionáis transacciones que cruzan microservicios? ¿Saga, outbox, eventos?' },
      { q: '¿Cómo está la estrategia de testing: pirámide, contract tests, Testcontainers, pruebas de carga en CI?' },
      { q: '¿Qué tipos de BBDD usáis y cómo gestionáis la persistencia políglota?', why: 'Si dicen "tenemos Postgres y a veces Mongo", normal. Si mezclan Mongo, Redis, Neo4j con criterio, te encontrarás cómodo viniendo de Agata.' },
      { q: '¿Qué versión de Java/Spring Boot estáis usando? ¿Habéis adoptado virtual threads, records, pattern matching?' },
      { q: '¿Qué patrón seguís para autenticación y autorización (Keycloak, otro IdP)? ¿Method-level security, RBAC, ABAC?' },
      { q: '¿Qué decisiones de arquitectura grandes os habéis arrepentido en los últimos 12 meses?', why: 'Buenos equipos lo reconocen sin problema; los malos te dicen "ninguna".' },
    ],
  },
  {
    id: 'entrega',
    emoji: '🚢',
    title: 'CI/CD, entornos y entrega',
    intro:
      'Buena señal: pipelines automatizados, despliegues frecuentes y poco dramáticos, rollback ensayado. Mala señal: "deploy los viernes a las 18:00 a mano".',
    questions: [
      { q: '¿Cómo es el camino de un commit hasta producción? ¿Cuánto tarda y qué pasos automáticos hay?' },
      { q: '¿Con qué frecuencia desplegáis a producción? ¿Por servicio, por release tren?' },
      { q: '¿Tenéis entornos efímeros para PRs / feature branches?' },
      { q: '¿Qué hacéis cuando algo se rompe en producción? ¿Tenéis rollback automático o feature flags?' },
      { q: '¿Hay on-call? ¿Cómo se reparte? ¿Quién es el primer respondedor?' },
      { q: '¿Tenéis runbooks de incidentes y post-mortems? ¿Sin culpas (blameless)?' },
      { q: '¿Cómo está el feedback loop local? ¿Se puede levantar un entorno de desarrollo en minutos o es una pesadilla?' },
    ],
  },
  {
    id: 'observabilidad',
    emoji: '🔭',
    title: 'Observabilidad y operación',
    intro:
      'Que la app esté en producción no significa que sepan cómo va. Aquí distingues equipos que reaccionan a quejas de los que detectan problemas antes que el usuario.',
    questions: [
      { q: '¿Tenéis SLOs definidos y error budgets, o solo monitorizáis dashboards?', why: 'SLOs + error budget es la frase mágica de equipos maduros.' },
      { q: '¿Qué stack de observabilidad usáis (Prometheus, Grafana, OpenTelemetry, OpenSearch/ELK)?' },
      { q: '¿Tenéis tracing distribuido funcional? ¿Os habéis encontrado con un bug donde el tracing fue decisivo?' },
      { q: '¿Cómo gestionáis alertas? ¿Ruidosas o accionables? ¿Hay runbook por alerta?' },
      { q: '¿Qué hacéis con los logs? ¿Los buscáis cuando hay un problema o tenéis dashboards proactivos?' },
      { q: '¿Resilience4j o algo equivalente en sitio? ¿Habéis tenido cascading failures?' },
    ],
  },
  {
    id: 'producto',
    emoji: '🎯',
    title: 'Producto, negocio y dirección',
    intro:
      'Sirve para entender si la empresa sabe a dónde va y por qué. Si las respuestas son vagas, ojo: estarás construyendo sobre arena.',
    questions: [
      { q: '¿Cuál es el reto técnico más grande del equipo en los próximos 6-12 meses?' },
      { q: '¿Qué métrica de producto/negocio mueve más vuestras decisiones técnicas?' },
      { q: '¿Cómo es vuestro cliente típico? ¿Tenéis acceso a feedback real o solo a través de Producto?' },
      { q: '¿Qué porcentaje del trabajo es feature nuevo vs mantenimiento vs deuda técnica?' },
      { q: '¿Qué cambios habéis hecho en arquitectura/proceso en los últimos meses y por qué?' },
      { q: '¿Cómo medís el éxito del equipo? ¿Velocidad, calidad, satisfacción del cliente, métricas DORA?' },
    ],
  },
  {
    id: 'crecimiento',
    emoji: '🌱',
    title: 'Onboarding, crecimiento y persona',
    intro:
      'Si estás dispuesto a aceptar el puesto, esto importa más que el stack. Equipos que invierten en la gente tienen menos rotación.',
    questions: [
      { q: '¿Cómo es el onboarding? ¿Cuánto tardan típicamente los nuevos en hacer su primer cambio en producción?' },
      { q: '¿Qué expectativas tendríais de mí en los primeros 3, 6 y 12 meses?' },
      { q: '¿Cómo es la trayectoria de carrera en el equipo? ¿Tech lead, principal, manager? ¿Hay caminos definidos o ad-hoc?' },
      { q: '¿Hay presupuesto/tiempo para formación, conferencias, libros, certificaciones?' },
      { q: '¿Hacéis 1:1s con el manager? ¿Con qué frecuencia?' },
      { q: '¿Cómo se da feedback en el equipo? ¿Solo en evaluación anual o de forma continua?' },
      { q: '¿Por qué te gusta trabajar aquí?', why: 'La respuesta a esta dice más que toda la entrevista junta.' },
      { q: 'Si pudieras cambiar una cosa del equipo o de la empresa, ¿cuál sería?', why: 'Si dicen "nada", o son nuevos o no son honestos. Lo honesto es que haya algo.' },
    ],
  },
];

// Selección de "esenciales" — las 5 que NO deberías irte sin preguntar.
export const ESSENTIAL_QUESTIONS: string[] = [
  '¿Cuál es el reto técnico más grande del equipo ahora mismo?',
  '¿Qué decisiones de arquitectura os habéis arrepentido en los últimos 12 meses?',
  '¿Cómo es el camino de un commit hasta producción y con qué frecuencia desplegáis?',
  '¿Qué expectativas tendríais de mí en los primeros 3-6 meses?',
  '¿Qué cambiarías del equipo si pudieras?',
];
