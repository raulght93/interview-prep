// Ejercicios de diseño: "te doy unos requisitos, plantea la solución".
// Cada uno trae el caso, una rúbrica (qué deberías tocar) y un planteamiento modelo.

export interface RubricArea {
  area: string;
  points: string[];
}

export interface DesignExercise {
  id: string;
  title: string;
  emoji: string;
  context: string;
  requirements: string[];
  rubric: RubricArea[];
  model: string;
}

export const DESIGN_EXERCISES: DesignExercise[] = [
  {
    id: 'connector',
    title: 'Conector de interoperabilidad',
    emoji: '🔌',
    context:
      'Tu plataforma debe integrarse con un sistema externo de control de accesos de un puerto. El sistema externo expone una API REST y notifica entradas/salidas. El resto de la plataforma debe enterarse de esos eventos. (Muy cercano a lo que haces en Agata.)',
    requirements: [
      'Consultar el estado de accesos del sistema externo bajo demanda (REST).',
      'Recibir/poll de eventos de entrada y salida de vehículos/personas.',
      'Publicar esos eventos al resto de la plataforma de forma desacoplada.',
      'El sistema externo es lento e inestable a veces (timeouts, 500).',
      'Debe ser desplegable y mantenible de forma independiente.',
    ],
    rubric: [
      { area: 'Dominio', points: ['Modelar el evento de acceso como concepto de dominio propio (no el DTO externo)', 'Dominio puro, sin saber de HTTP ni Kafka', 'Fechas con Instant'] },
      { area: 'Hexagonal', points: ['Puerto de entrada (caso de uso) para procesar accesos', 'Adaptador driving: REST controller + listener/scheduler de polling', 'Adaptador driven: cliente del sistema externo + productor de eventos', 'ACL para traducir el modelo externo al tuyo'] },
      { area: 'Contratos', points: ['OpenAPI para tu API REST (contract-first)', 'AsyncAPI para los eventos que publicas, versionados'] },
      { area: 'Mensajería', points: ['Kafka para publicar eventos (hechos, no comandos)', 'Eventos versionados (acceso-registrado.v1)', 'Idempotencia en el consumidor'] },
      { area: 'Resiliencia', points: ['Circuit breaker + retries con backoff + timeout para el sistema externo (Resilience4j)', 'Degradar con gracia', 'Outbox si necesitas publicar de forma fiable'] },
      { area: 'NFRs', points: ['Observabilidad (métricas, tracing, logs correlacionados)', 'Tests: WireMock para el externo, Testcontainers para Kafka'] },
    ],
    model:
      'Lo plantearía como un **conector hexagonal independiente**:\n\n1. **Dominio**: un `EventoAcceso` (con su identidad y `Instant`), modelado según *mi* lenguaje, no el del sistema externo.\n2. **Puerto de entrada**: `RegistrarAccesoUseCase`. Lo invocan dos adaptadores driving: un **scheduler/poller** (o webhook si el externo lo soporta) y, para consultas, un **REST controller** generado contract-first desde **OpenAPI**.\n3. **Puerto de salida** `SistemaAccesosPort` → adaptador con cliente HTTP (Feign/WebClient) envuelto en **Resilience4j** (circuit breaker, retry con backoff, timeout) por la inestabilidad. Un **ACL** traduce su modelo al mío.\n4. **Puerto de salida** `EventoPublisherPort` → adaptador **Kafka**; publico `acceso-registrado.v1` como **DTO técnico** (no el dominio), descrito en **AsyncAPI**. Para fiabilidad, patrón **outbox**.\n5. **NFRs**: idempotencia en consumidores, **observabilidad** (Prometheus + OpenTelemetry + logs con correlation id), y tests con **WireMock** (externo) + **Testcontainers** (Kafka). Desplegable solo, con su BOM y su pipeline.\n\nLo justificaría: cada integración aislada en su conector → fallos contenidos, despliegue independiente, contrato como fuente de verdad.',
  },
  {
    id: 'orders',
    title: 'Pedidos, pago y stock',
    emoji: '🛒',
    context:
      'Un e-commerce necesita procesar pedidos: validar stock, cobrar el pago y notificar al cliente. El pago lo hace un proveedor externo. Esperan picos de tráfico en campañas.',
    requirements: [
      'Crear un pedido validando que hay stock.',
      'Cobrar mediante una pasarela de pago externa.',
      'Notificar al cliente (email) cuando el pedido se confirma.',
      'Aguantar picos de carga sin caerse.',
      'No perder pedidos aunque falle un paso intermedio.',
    ],
    rubric: [
      { area: 'Bounded contexts', points: ['Separar Pedidos, Pagos, Inventario, Notificaciones', 'Cada uno con su modelo y posiblemente su almacén'] },
      { area: 'Consistencia', points: ['No es una transacción ACID distribuida → Saga', 'Acciones compensatorias si falla el pago (liberar stock)', 'Eventual consistency asumida'] },
      { area: 'Integración', points: ['Eventos entre contextos (pedido-creado, pago-confirmado)', 'Sync REST solo donde haga falta respuesta inmediata', 'Pago externo con circuit breaker + idempotency key'] },
      { area: 'Async / carga', points: ['Confirmar pedido devolviendo 202 + estado', 'Cola/broker para absorber picos', 'Notificación email asíncrona (side effect)'] },
      { area: 'Fiabilidad', points: ['Idempotencia (no cobrar dos veces)', 'Reintentos + DLQ', 'Outbox para publicar eventos de forma atómica con la BD'] },
      { area: 'NFRs', points: ['Observabilidad y trazas cruzando servicios', 'Pruebas de carga para los picos'] },
    ],
    model:
      '**Bounded contexts** separados: Pedidos, Inventario, Pagos, Notificaciones. El flujo principal lo modelaría **event-driven con una Saga** (no 2PC):\n\n1. **Crear pedido**: el servicio de Pedidos valida y persiste el pedido en estado `PENDIENTE`, devuelve **202 Accepted** con un id para consultar estado, y publica `pedido-creado` (vía **outbox** para no perderlo).\n2. **Inventario** reserva stock y emite `stock-reservado` (o `stock-insuficiente` → compensación: pedido cancelado).\n3. **Pagos** llama a la pasarela externa con **idempotency key** (para no cobrar dos veces en reintentos) y **circuit breaker**; emite `pago-confirmado` o `pago-fallido` (→ compensar: liberar stock, cancelar pedido).\n4. **Notificaciones** reacciona a `pedido-confirmado` y manda el email (side effect, asíncrono).\n\n**Picos**: el broker (Kafka/Rabbit) absorbe la carga; los consumidores escalan horizontalmente. **Fiabilidad**: at-least-once + **idempotencia** en cada consumidor, reintentos con **DLQ**. **NFRs**: tracing distribuido para seguir un pedido entre servicios, y **pruebas de carga** para dimensionar antes de campaña.',
  },
  {
    id: 'docpipeline',
    title: 'Procesado asíncrono de documentos',
    emoji: '📄',
    context:
      'Hay que recibir facturas (ficheros) de varios orígenes, procesarlas (validar, extraer datos, transformar) y dejarlas disponibles. El procesado puede tardar y el volumen es variable. (Cercano a un conector de facturación.)',
    requirements: [
      'Aceptar la subida de una factura y responder rápido al cliente.',
      'Procesar el fichero de forma asíncrona (validación + extracción).',
      'Permitir consultar el estado del procesado.',
      'Reprocesar si algo falla, sin perder el documento.',
      'Volumen variable: a veces pocas, a veces miles.',
    ],
    rubric: [
      { area: 'API / borde', points: ['POST subida → 202 + id de seguimiento', 'GET estado por id', 'Almacenar el binario en object storage (S3/MinIO), no en BD'] },
      { area: 'Async', points: ['Encolar el trabajo, no procesar en el request', 'Worker/consumer escalable', 'Estados: RECIBIDO → PROCESANDO → OK/ERROR'] },
      { area: 'Fiabilidad', points: ['Idempotencia por id de documento', 'Reintentos + DLQ', 'No perder el fichero si el worker muere'] },
      { area: 'Persistencia', points: ['Metadatos/estado en BD (Mongo encaja por esquema flexible)', 'Binario en object storage', 'Posible read model para consultas'] },
      { area: 'NFRs', points: ['Backpressure / control de ritmo', 'Observabilidad del pipeline (lag, errores)', 'Escalado horizontal del worker'] },
    ],
    model:
      '**Patrón productor-cola-worker**:\n\n1. **Subida**: el endpoint recibe el fichero, lo guarda en **object storage (MinIO/S3)**, crea un registro de metadatos en estado `RECIBIDO` y devuelve **202 Accepted** con un id. Responde rápido sin procesar nada pesado en el request.\n2. **Encolar**: publica un mensaje `factura-recibida` (con el id y la ruta del fichero). Un **worker** (consumer) la procesa: valida, extrae datos, transforma; actualiza estado `PROCESANDO → OK/ERROR`.\n3. **Consulta**: `GET /facturas/{id}` devuelve el estado (read model si conviene).\n4. **Fiabilidad**: el broker da persistencia; **idempotencia** por id de documento (no procesar dos veces); **reintentos** y **DLQ** para los que fallan; el fichero vive en el storage hasta confirmar.\n5. **Volumen variable**: los workers **escalan horizontalmente** (en Kafka, hasta nº de particiones); con **backpressure** y monitorización del **lag** decides cuándo escalar.\n\nMetadatos en **MongoDB** (esquema flexible por tipo de factura), binario fuera de la BD. Todo observable (métricas del pipeline, trazas).',
  },
];

DESIGN_EXERCISES.push({
  id: 'cep',
  title: 'Correlación de eventos en tiempo real (CEP)',
  emoji: '⚡',
  context:
    'Una plataforma de seguridad portuaria recibe eventos de varios sistemas (CCTV, control de accesos, sensores IoT). Hay que detectar patrones de eventos en tiempo real y generar alertas. Volumen alto, latencia baja. (Clavado al Apache Flink + Kafka de Agata Next.)',
  requirements: [
    'Recibir eventos de varios subsistemas (vídeo, accesos, sensores) por Kafka.',
    'Detectar correlaciones temporales (p.ej. 3 alarmas en el mismo sensor en 5 min → incidente).',
    'Emitir un evento de alerta al detectar el patrón, hacia otros consumidores.',
    'Alta disponibilidad y exactly-once dentro del pipeline (no perder ni duplicar alertas).',
    'Volumen elevado y latencia sub-segundo.',
  ],
  rubric: [
    { area: 'Ingesta', points: ['Eventos en topics Kafka por subsistema con clave de particionado adecuada (sensor_id, area)', 'Schema Registry para versionar eventos (AsyncAPI)'] },
    { area: 'Motor de stream', points: ['Apache Flink (CEP) para correlación temporal con estado', 'Ventanas (sliding/tumbling, event-time + watermarks)', 'JobManager + N TaskManagers; paralelismo por slots'] },
    { area: 'Estado y tolerancia', points: ['State backend RocksDB (estado grande)', 'Checkpoints periódicos en almacenamiento durable', 'Exactly-once dentro de Flink (offsets + state coherentes)'] },
    { area: 'Salida', points: ['Topic de alertas (versionado, p.ej. alerta-correlacionada.v1)', 'Consumers downstream (notificaciones, panel de operador) con idempotencia'] },
    { area: 'NFRs', points: ['Latencia sub-segundo (event-time, watermarks ajustados)', 'Observabilidad (métricas Flink, lag de consumers, dashboards)', 'Escalado: añadir TaskManagers o aumentar slots'] },
  ],
  model:
    'Pipeline **Kafka → Flink (CEP) → Kafka**, sin acoplar productores y consumidores finales.\n\n1. **Ingesta**: cada subsistema publica en su topic con clave por entidad (`sensor_id` o `area`) para que el orden por entidad esté garantizado por partición. Eventos como **DTOs técnicos** descritos en **AsyncAPI** + **Schema Registry** para evolución compatible.\n2. **CEP con Apache Flink**: un job consume los topics, define **patrones temporales** (p.ej. `Pattern.<Evento>begin("a").next("b").within(5min)` o `KeyedProcessFunction` con timers) sobre **event-time** + watermarks para tolerar eventos algo tardíos. **Estado** por sensor en **RocksDB**; **checkpoints** periódicos (PVC/Ceph) para tolerancia a fallos → exactly-once dentro del job.\n3. **Salida**: al detectarse el patrón, Flink publica un `alerta-correlacionada.v1` a otro topic. Consumers downstream (notificaciones, dashboard de operador) procesan con **idempotencia** (clave de deduplicación) porque Kafka es at-least-once entre sistemas.\n4. **Escalado**: paralelismo = nº de slots; añadir TaskManagers o aumentar slots. En Agata Next el cluster es 1 JM + 6 TM con 19 slots cada uno (114 totales).\n5. **NFRs**: latencia sub-segundo gracias a streaming + state local; **observabilidad** vía JMX exporters → Prometheus → Grafana, lag de consumers monitorizado, alertas si crece. Logs estructurados en OpenSearch con correlation id por evento.\n\nJustificación: Kafka Streams quedaría corto para CEP complejo con ventanas grandes; Flink es el motor adecuado por su gestión de estado y tiempo.',
});

export function designExercise(id: string): DesignExercise | undefined {
  return DESIGN_EXERCISES.find((e) => e.id === id);
}
