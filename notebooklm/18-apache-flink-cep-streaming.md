# Apache Flink y CEP — Procesamiento de Streams en Producción

## Contexto real: Agata Next

En Agata Next, Apache Flink se usa para **Complex Event Processing (CEP)** en tiempo real.
El sistema recibe eventos de múltiples fuentes (CCTV, control de accesos, sensores IoT,
AIS marino) publicados en topics Kafka, y Flink detecta patrones complejos para generar
alertas de seguridad portuaria.

Arquitectura desplegada:
- 1 **JobManager** (coordinador) + 6 **TaskManagers** × 19 slots = **114 task slots totales**
- State backend: **RocksDB** (estado persistente en disco)
- Checkpoints: cada 30s a almacenamiento S3-compatible
- Semantic guarantee: **exactly-once** dentro del job Flink

---

## 1. Modelo Mental: Flink vs Kafka Streams vs Spark

| | Apache Flink | Kafka Streams | Spark Structured Streaming |
|-|-------------|---------------|---------------------------|
| Modelo | Stream nativo (true streaming) | Stream nativo | Micro-batches |
| Estado | RocksDB / en memoria | RocksDB | RDD/DataFrame |
| Latencia | Sub-segundo | Sub-segundo | Segundos |
| CEP | Sí (nativo) | No | No nativo |
| Event-time | Sí (watermarks) | Sí | Sí |
| Despliegue | Cluster propio (K8s, YARN, Standalone) | Dentro de la app (librería) | Cluster |
| Exactamente-once | Sí (dentro del job) | Sí (con EOS) | Sí |
| Casos de uso | CEP, ML pipelines, analytics real-time | Microservicio reactivo | Analytics batch/streaming |

**Cuándo elegir Flink**: necesitas CEP (patrones temporales complejos), tienes
ventanas complejas (session windows, event-time con watermarks), o necesitas
un cluster de procesamiento dedicado con miles de eventos/segundo.

**Cuándo elegir Kafka Streams**: microservicio que transforma/agrega datos de Kafka
sin infraestructura adicional. Se despliega como una app Java normal.

---

## 2. Arquitectura Flink

### JobManager y TaskManagers

```
Cliente (flink CLI / REST API)
        ↓ (sube el JAR del job)
   JobManager
   ├── Dispatcher: recibe y gestiona los jobs
   ├── ResourceManager: gestiona los TaskManagers y slots
   └── JobMaster: coordina la ejecución del job específico
        ↓ (asigna tareas)
   TaskManager 1 (19 slots)
   TaskManager 2 (19 slots)
   ...
   TaskManager 6 (19 slots)
```

**Job**: el programa Flink.
**Task**: unidad de ejecución paralela (una partición de un operador).
**Slot**: recurso de un TaskManager asignado a una task. Un slot puede ejecutar
múltiples tasks del mismo pipeline (slot sharing).
**Paralelismo**: cuántas tasks paralelas para un operador. Con 114 slots y
paralelismo 10, Flink puede ejecutar 11 operadores en paralelo.

### Grafo de ejecución

Un job Flink compila a un **JobGraph** (DAG de operadores). Cada nodo es un
operador (source, transform, sink). Las aristas son los streams que los conectan.

---

## 3. DataStream API — Programación

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

// Source: Kafka
KafkaSource<EventoSensor> source = KafkaSource.<EventoSensor>builder()
    .setBootstrapServers("kafka:9092")
    .setTopics("eventos-sensores", "eventos-accesos", "eventos-cctv")
    .setGroupId("flink-cep-processor")
    .setStartingOffsets(OffsetsInitializer.latest())
    .setValueOnlyDeserializer(new EventoSensorDeserializationSchema())
    .build();

DataStream<EventoSensor> eventos = env.fromSource(
    source,
    WatermarkStrategy
        .<EventoSensor>forBoundedOutOfOrderness(Duration.ofSeconds(5))
        .withTimestampAssigner((event, ts) -> event.getTimestamp().toEpochMilli()),
    "Kafka Source"
);

// Transformaciones
DataStream<AlertaSeguridad> alertas = eventos
    .filter(e -> e.getZona().equals("ZONA-RESTRINGIDA"))
    .keyBy(EventoSensor::getSensorId)
    .window(TumblingEventTimeWindows.of(Duration.ofMinutes(5)))
    .aggregate(new AccesoAggregator())
    .filter(agg -> agg.getConteoEntradas() > 3);

// Sink: Kafka
KafkaSink<AlertaSeguridad> sink = KafkaSink.<AlertaSeguridad>builder()
    .setBootstrapServers("kafka:9092")
    .setRecordSerializer(KafkaRecordSerializationSchema.builder()
        .setTopic("alertas-seguridad")
        .setValueSerializationSchema(new AlertaSerializationSchema())
        .build())
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)
    .build();

alertas.sinkTo(sink);
env.execute("Flink CEP Seguridad Portuaria");
```

---

## 4. Event Time y Watermarks

### Processing Time vs Event Time vs Ingestion Time

**Processing time**: hora en que Flink procesa el evento. Simple pero impreciso
si hay retrasos en la red o el producer.

**Event time**: hora en que el evento ocurrió en la fuente. Más preciso pero
necesita watermarks para saber cuándo "cerrar" una ventana.

**Ingestion time**: hora en que entró a Flink. Compromiso entre ambos.

### Watermarks

Un **watermark** es una señal que dice "no espero más eventos con timestamp < T".
Permite a Flink cerrar ventanas y emitir resultados aunque lleguen eventos tardíos.

```
Eventos: [t=10, t=12, t=15, t=11(tardío), t=20]
Watermark con tolerancia 5s:
- Al ver t=15, watermark = 15-5 = 10 → cierra ventanas hasta t=10
- El evento t=11 llega después, pero su watermark ya pasó → es "late"

Los eventos late tienen tres opciones:
1. Descartarlos (default)
2. Enviarlos a un side output para procesamiento especial
3. Re-disparar la ventana con el elemento late (allowedLateness)
```

```java
// Watermarks con elementos tardíos permitidos:
.window(TumblingEventTimeWindows.of(Duration.ofMinutes(5)))
.allowedLateness(Duration.ofMinutes(1))  // retraso hasta 1 min
.sideOutputLateData(lateOutputTag)       // los muy tardíos a side output
.aggregate(new AccesoAggregator())

// Recoger los late:
DataStream<EventoSensor> lateEvents = mainStream.getSideOutput(lateOutputTag);
```

---

## 5. Ventanas (Windows)

Las ventanas agrupan elementos del stream para procesarlos juntos.

### Tipos de ventanas

```java
// Tumbling: ventanas fijas sin solapamiento
.window(TumblingEventTimeWindows.of(Duration.ofMinutes(5)))
// [0-5min), [5-10min), [10-15min)...

// Sliding: ventanas solapadas
.window(SlidingEventTimeWindows.of(
    Duration.ofMinutes(10), // tamaño
    Duration.ofMinutes(1)   // slide
))
// [0-10min), [1-11min), [2-12min)... (cada minuto, ventana de 10)

// Session: ventanas basadas en inactividad
.window(EventTimeSessionWindows.withGap(Duration.ofMinutes(30)))
// Se cierra si no hay eventos en 30 min

// Global: una sola ventana para todo el stream (con trigger explícito)
.windowAll(GlobalWindows.create())
.trigger(CountTrigger.of(100)) // disparar cada 100 elementos
```

### Funciones de ventana

```java
// reduce: reducción incremental (eficiente en memoria)
.reduce((a, b) -> new EventoAgregado(a.getSensorId(), a.getConteo() + b.getConteo()))

// aggregate: más flexible, estado intermedio explícito
.aggregate(new AggregateFunction<EventoSensor, AggState, ResultadoVentana>() {
    @Override
    public AggState createAccumulator() { return new AggState(); }

    @Override
    public AggState add(EventoSensor value, AggState acc) {
        acc.incrementar(value.getSensorId());
        return acc;
    }

    @Override
    public ResultadoVentana getResult(AggState acc) {
        return new ResultadoVentana(acc.getTop5Sensores());
    }

    @Override
    public AggState merge(AggState a, AggState b) { /* para session windows */ }
})

// process: acceso completo al contexto de ventana (timestamps, side outputs)
.process(new ProcessWindowFunction<EventoSensor, Alerta, String, TimeWindow>() {
    @Override
    public void process(String key, Context context, Iterable<EventoSensor> events,
                        Collector<Alerta> out) {
        long windowEnd = context.window().getEnd();
        long count = StreamSupport.stream(events.spliterator(), false).count();
        if (count > UMBRAL) {
            out.collect(new Alerta(key, count, Instant.ofEpochMilli(windowEnd)));
        }
    }
})
```

---

## 6. CEP — Complex Event Processing

La librería FlinkCEP permite definir patrones complejos de eventos. Es la
funcionalidad más diferenciadora de Flink respecto a otras soluciones.

### Definición de patrones

```java
// Patrón: 3 accesos denegados seguidos en 10 minutos → alerta intrusión
Pattern<EventoAcceso, ?> patronIntento = Pattern.<EventoAcceso>begin("primer-intento")
    .where(SimpleCondition.of(e -> e.getEstado() == EstadoAcceso.DENEGADO))
    .followedBy("segundo-intento")
    .where(SimpleCondition.of(e -> e.getEstado() == EstadoAcceso.DENEGADO))
    .followedBy("tercer-intento")
    .where(SimpleCondition.of(e -> e.getEstado() == EstadoAcceso.DENEGADO))
    .within(Duration.ofMinutes(10));

// Patrón con cuantificadores:
Pattern.<EventoAcceso>begin("intentos-fallidos")
    .where(SimpleCondition.of(e -> e.getEstado() == EstadoAcceso.DENEGADO))
    .times(3, 5)          // entre 3 y 5 veces
    .greedy()             // intenta el máximo
    .within(Duration.ofMinutes(10));

// Patrón: ENTRADA en zona A, luego SALIDA por zona diferente en 30min
Pattern.<EventoMovimiento>begin("entrada")
    .where(e -> e.getTipo() == ENTRADA && e.getZona().equals("ZONA-A"))
    .followedBy("salida")
    .where((e, ctx) -> {
        EventoMovimiento entrada = ctx.getEventsForPattern("entrada").iterator().next();
        return e.getTipo() == SALIDA && !e.getZona().equals(entrada.getZona());
    })
    .within(Duration.ofMinutes(30));
```

### Aplicar el patrón al stream

```java
DataStream<EventoAcceso> accesosStream = ...;

PatternStream<EventoAcceso> patronStream = CEP.pattern(
    accesosStream.keyBy(EventoAcceso::getSensorId),
    patronIntento
);

DataStream<AlertaIntrusión> alertas = patronStream.select(
    // Solo los eventos que matchearon
    matchedEvents -> {
        List<EventoAcceso> intentos = matchedEvents.get("intentos-fallidos");
        return new AlertaIntrusion(
            intentos.get(0).getSensorId(),
            intentos.size(),
            intentos.get(0).getTimestamp()
        );
    }
);

// Con side output para eventos que NO matchearon (timeout del patrón):
OutputTag<EventoAcceso> timeoutTag = new OutputTag<>("timeouts") {};
SingleOutputStreamOperator<AlertaIntrusión> result = patronStream.flatSelect(
    timeoutTag,
    (patterns, timestamp, out) -> { /* timeout handler */ },
    (patterns, out) -> out.collect(crearAlerta(patterns))
);
```

---

## 7. Estado en Flink

### Tipos de estado

**Keyed State**: estado asociado a una clave (necesita `keyBy` antes).
```java
public class EventoCounterFunction extends KeyedProcessFunction<String, Evento, Alerta> {
    // Declarar el estado:
    private ValueState<Integer> contador;
    private ValueState<Long> ultimoEvento;

    @Override
    public void open(Configuration config) {
        // Inicializar en open(), no en el constructor:
        contador = getRuntimeContext().getState(
            new ValueStateDescriptor<>("contador", Integer.class));
        ultimoEvento = getRuntimeContext().getState(
            new ValueStateDescriptor<>("ultimo-evento", Long.class));
    }

    @Override
    public void processElement(Evento evento, Context ctx, Collector<Alerta> out)
            throws Exception {
        Integer count = contador.value();
        if (count == null) count = 0;
        contador.update(count + 1);
        ultimoEvento.update(evento.getTimestamp());

        if (count + 1 >= UMBRAL) {
            out.collect(new Alerta(ctx.getCurrentKey(), count + 1));
            contador.clear(); // reset
        }

        // Registrar un timer (para detectar inactividad):
        ctx.timerService().registerEventTimeTimer(evento.getTimestamp() + TIMEOUT_MS);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Alerta> out) {
        // Se dispara si no llegaron más eventos en TIMEOUT_MS
        out.collect(new Alerta(ctx.getCurrentKey(), "INACTIVIDAD"));
        contador.clear();
    }
}
```

**Tipos de estado Keyed**:
- `ValueState<T>`: un único valor por clave.
- `ListState<T>`: lista de valores por clave.
- `MapState<K, V>`: mapa por clave.
- `ReducingState<T>`: reduce automáticamente al añadir.
- `AggregatingState<IN, OUT>`: como ReducingState pero tipos diferentes.

### State Backend

- **HashMapStateBackend** (default): estado en memoria del TaskManager. Rápido,
  limitado por RAM, no tolera reinicios del TaskManager.
- **EmbeddedRocksDBStateBackend**: estado en disco (RocksDB) del TaskManager.
  Estado grande, más lento que memoria pero persiste entre reinicios.
  Necesario para estado > RAM disponible.

```java
env.setStateBackend(new EmbeddedRocksDBStateBackend(true)); // true = incremental checkpoints
```

---

## 8. Checkpoints y Tolerancia a Fallos

### Checkpoints

Flink hace snapshots del estado de todos los operadores de forma distribuida
y atómica (algoritmo Chandy-Lamport). Si el job falla, se restaura desde el
último checkpoint exitoso.

```java
// Configurar checkpoints:
env.enableCheckpointing(30_000); // cada 30s

CheckpointConfig config = env.getCheckpointConfig();
config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
config.setMinPauseBetweenCheckpoints(5_000);
config.setCheckpointTimeout(60_000); // timeout del checkpoint
config.setMaxConcurrentCheckpoints(1);
config.setExternalizedCheckpointCleanup(
    ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION // guardar al cancelar
);

// State backend con checkpoint storage:
env.getCheckpointConfig().setCheckpointStorage("s3://flink-checkpoints/agata/");
```

### Savepoints

Un savepoint es un checkpoint manual, guardado externamente. Se usa para:
- Actualizar el job con cambios de lógica sin perder el estado.
- Migrar el estado a una versión nueva del job.
- Cambiar el paralelismo.

```bash
# Tomar savepoint:
flink savepoint <jobId> s3://flink-savepoints/upgrade/

# Restaurar desde savepoint:
flink run -s s3://flink-savepoints/upgrade/ nuevo-job.jar
```

### Exactly-Once end-to-end

Exactly-once **dentro del job** es automático con checkpoints + state.
Exactly-once **desde Kafka a Flink** requiere `setStartingOffsets` desde el
checkpoint (KafkaSource lo gestiona solo).
Exactly-once **de Flink a Kafka** requiere el sink transaccional:

```java
KafkaSink.<Alerta>builder()
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)
    .setTransactionalIdPrefix("flink-agata-alertas-")
    .build();
```

Usa Kafka transactions: Flink hace pre-commit con el checkpoint y confirma
cuando el checkpoint se completa. Si el job falla antes de confirmar, el
consumidor de Kafka ve los mensajes como abortados (no los procesa).

---

## 9. Flink en Kubernetes

### Flink Kubernetes Operator

El operator oficial gestiona `FlinkDeployment` CRDs:

```yaml
apiVersion: flink.apache.org/v1beta1
kind: FlinkDeployment
metadata:
  name: cep-seguridad-portuaria
spec:
  image: agata-registry.local/flink-cep:2.1.0
  flinkVersion: v1_18
  flinkConfiguration:
    taskmanager.numberOfTaskSlots: "19"
    state.backend: rocksdb
    state.checkpoints.dir: s3://flink-checkpoints/
    execution.checkpointing.interval: "30000"
  serviceAccount: flink
  jobManager:
    resource: { memory: "2048m", cpu: 1 }
  taskManager:
    replicas: 6
    resource: { memory: "4096m", cpu: 2 }
  job:
    jarURI: local:///opt/flink/usrlib/cep-seguridad.jar
    parallelism: 10
    upgradeMode: savepoint
    savepointTriggerNonce: 0
```

`upgradeMode: savepoint` asegura que al actualizar el deployment se tome
un savepoint, se cancele el job actual y se arranque el nuevo desde el savepoint.

---

## 10. Métricas y Observabilidad

Flink expone métricas via Prometheus JMX exporter:

```yaml
# Métricas clave a monitorizar:
- flink_jobmanager_job_uptime                  # tiempo en ejecución
- flink_taskmanager_job_task_numRecordsIn      # registros procesados
- flink_taskmanager_job_task_numRecordsOut     # registros emitidos
- flink_taskmanager_job_task_currentInputWatermark  # watermark actual
- kafka_consumer_records_lag_max               # lag en Kafka (fuera de Flink)
- flink_taskmanager_Status_JVM_Memory_Heap_Used # uso de heap
- flink_jobmanager_job_numberOfFailedCheckpoints # checkpoints fallidos
- flink_taskmanager_job_latency_source_id_histogram_95percentile # latencia p95
```

El **consumer lag** de Kafka es la métrica más importante para detectar que
Flink no puede seguir el ritmo de ingesta. Si sube sostenidamente → escalar.

---

## 11. Preguntas de entrevista — Flink y CEP

¿Cuál es la diferencia entre event time y processing time?
> Processing time usa el reloj del sistema cuando Flink procesa el evento.
> Event time usa el timestamp del evento en la fuente (cuándo ocurrió realmente).
> Event time requiere watermarks (señales que dicen "no esperamos más eventos
> anteriores a T") para cerrar ventanas. Es más preciso para análisis temporales
> pero más complejo de configurar.

¿Para qué sirven los watermarks en Flink?
> Para manejar eventos que llegan desordenados o tardíos en un stream de event time.
> Un watermark W(t) garantiza que no llegarán más eventos con timestamp < t.
> Cuando el watermark supera el fin de una ventana, Flink cierra esa ventana y
> emite el resultado. La tolerancia a tardíos (allowedLateness) permite un margen
> adicional antes de cerrar definitivamente.

¿Qué es un savepoint vs un checkpoint en Flink?
> Checkpoint: snapshot automático y periódico del estado para recuperación
> ante fallos. Se gestiona automáticamente, se sobrescriben. Savepoint: snapshot
> manual y explícito, se guarda indefinidamente. Para upgrades de jobs, cambios
> de paralelismo, o migraciones. Los savepoints sobreviven a redeployments.

¿Cómo garantiza Flink exactly-once end-to-end con Kafka?
> Tres partes: (1) KafkaSource: los offsets de consumo se guardan en el
> checkpoint de Flink, no en Kafka, así al restaurar se releen desde el punto
> correcto. (2) Estado interno de Flink: los checkpoints son atómicos y
> consistentes. (3) KafkaSink con `EXACTLY_ONCE`: usa Kafka transactions —
> los mensajes se escriben en pre-commit, se confirman solo cuando el checkpoint
> completa. Si el job falla entre pre-commit y commit, Kafka aborta la transacción.

¿Cuándo usarías RocksDB como state backend?
> Cuando el estado del job supera la RAM disponible en los TaskManagers.
> RocksDB guarda el estado en disco (SSD) con caché en memoria. Es más lento
> que HashMapStateBackend (operaciones de disco) pero permite estado de varios
> GB/TB. En Agata se usa por el volumen de eventos históricos en ventanas de
> correlación largas.
