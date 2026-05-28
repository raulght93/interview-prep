# Preguntas para Hacer al Entrevistador

> 6 categorías con preguntas clave. Haz al menos 3-4 en cada entrevista. Las mejores revelan la madurez real del equipo.


## Las 5 esenciales (no te vayas sin preguntar estas)

1. ¿Cuál es el reto técnico más grande del equipo ahora mismo?
2. ¿Qué decisiones de arquitectura os habéis arrepentido en los últimos 12 meses?
3. ¿Cómo es el camino de un commit hasta producción y con qué frecuencia desplegáis?
4. ¿Qué expectativas tendríais de mí en los primeros 3-6 meses?
5. ¿Qué cambiarías del equipo si pudieras?


## Equipo, cultura y proceso

*Estas son las preguntas que mejor te dicen cómo es el día a día. Las respuestas "depende" o evasivas son una señal. Las concretas son verdes.*

- **¿Cómo es el flujo de trabajo del equipo? ¿Cómo aplicáis Scrum/Kanban en el día a día (ceremonias, tamaño de sprint, planning)?**
  *(Si recitan la guía Scrum pero no tienen retro o no la usan, es bandera amarilla.)*
- **¿Cómo se prioriza el backlog? ¿Lo lleva Producto, el Tech Lead, el equipo?**
- **¿Cuál es la cultura de code review? ¿Se hace en serio o es trámite?**
- **¿Cómo manejáis la deuda técnica? ¿Hay tiempo dedicado en cada sprint?**
- **¿Cómo es la relación con Producto? ¿Os involucran desde el principio o llega el ticket cerrado?**
- **¿Hacéis pair programming, mob, o cada uno con su tarea?**

## Técnico y arquitectura

*Sondea si la realidad coincide con la oferta. Lo que dicen aquí debería ser específico.*

- **¿Qué grado de adopción tenéis de hexagonal/DDD y cuán estricto es? ¿Hay ADRs?**
  *(Quieres saber si "hexagonal" es real o nombre del archivo.)*
- **¿Usáis Kafka, RabbitMQ o ambos? ¿Qué casos resuelve cada uno?**
- **¿Cuál es vuestra estrategia de contratos? ¿OpenAPI contract-first, AsyncAPI, contract testing?**
- **¿Cómo gestionáis transacciones que cruzan microservicios? ¿Saga, outbox, eventos?**
- **¿Qué versión de Java/Spring Boot estáis usando? ¿Habéis adoptado virtual threads, records, pattern matching?**
- **¿Qué decisiones de arquitectura os habéis arrepentido en los últimos 12 meses?**
  *(Buenos equipos lo reconocen sin problema.)*

## CI/CD, entornos y entrega

*Buena señal: pipelines automatizados, despliegues frecuentes. Mala señal: "deploy los viernes a las 18:00 a mano".*

- **¿Cómo es el camino de un commit hasta producción? ¿Cuánto tarda y qué pasos automáticos hay?**
- **¿Con qué frecuencia desplegáis a producción?**
- **¿Tenéis entornos efímeros para PRs / feature branches?**
- **¿Qué hacéis cuando algo se rompe en producción? ¿Tenéis rollback automático?**
- **¿Tenéis runbooks de incidentes y post-mortems blameless?**

## Observabilidad y operación

*Aquí distingues equipos que reaccionan a quejas de los que detectan problemas antes que el usuario.*

- **¿Tenéis SLOs definidos y error budgets?**
  *(SLOs + error budget es la frase mágica de equipos maduros.)*
- **¿Qué stack de observabilidad usáis (Prometheus, Grafana, OpenTelemetry, OpenSearch/ELK)?**
- **¿Tenéis tracing distribuido funcional?**
- **¿Resilience4j o algo equivalente en sitio? ¿Habéis tenido cascading failures?**

## Producto, negocio y dirección

*Sirve para entender si la empresa sabe a dónde va y por qué.*

- **¿Cuál es el reto técnico más grande del equipo en los próximos 6-12 meses?**
- **¿Qué porcentaje del trabajo es feature nuevo vs mantenimiento vs deuda técnica?**
- **¿Cómo medís el éxito del equipo? ¿Velocidad, calidad, métricas DORA?**

## Onboarding, crecimiento y persona

*Si estás dispuesto a aceptar el puesto, esto importa más que el stack.*

- **¿Cómo es el onboarding? ¿Cuánto tardan los nuevos en hacer su primer cambio en producción?**
- **¿Qué expectativas tendríais de mí en los primeros 3, 6 y 12 meses?**
- **¿Cómo es la trayectoria de carrera? ¿Tech lead, principal, manager?**
- **¿Hay presupuesto/tiempo para formación, conferencias, libros?**
- **¿Por qué te gusta trabajar aquí?**
  *(La respuesta dice más que toda la entrevista junta.)*
- **Si pudieras cambiar una cosa del equipo, ¿cuál sería?**
  *(Si dicen "nada", no son honestos.)*