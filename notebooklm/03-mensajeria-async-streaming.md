# Mensajería · Asíncrono · Streaming

> Kafka, RabbitMQ, Apache Flink, programación reactiva, virtual threads y concurrencia.

## Teoría

### ASYNC

Asíncrono ≠ Reactivo. Asíncrono significa que el caller no se bloquea esperando la respuesta. Reactivo es un paradigma basado en streams de datos, push desde la fuente, backpressure (el consumidor controla el ritmo del productor) y non-blocking I/O sobre pocos threads en un event loop. En Java son Mono<T> y Flux<T> de Project Reactor. Todo reactivo es asíncrono, pero no al revés.

Cuándo elegir reactivo. Aporta mucho cuando tienes alta concurrencia con I/O y toda la cadena puede ser no bloqueante (R2DBC en vez de JDBC, WebClient en vez de RestTemplate). Si solo una pieza bloquea, paralizas el event loop. Nunca bloquees dentro de un flujo reactivo: nada de Thread.sleep, .block(), JDBC síncrono; si tienes que bloquear, aíslalo en un scheduler dedicado.

Virtual threads (Java 21+) cambian la ecuación. Permiten escribir código bloqueante y secuencial que escala a millones de hilos sin necesidad de modelo reactivo: la JVM desmonta el virtual del platform thread cuando bloquea por I/O. Regla práctica: si tu problema es "muchas peticiones I/O-bound" → virtual threads (más simple); si es "streams de datos con composición y control de flujo" → reactivo.

Convertir un endpoint lento en asíncrono. El patrón canónico: encolar el trabajo (Kafka/SQS/Rabbit) y devolver 202 Accepted con un id. @Async + CompletableFuture son útiles pero si el pod muere, se pierde. Thread safety: la mejor herramienta es la inmutabilidad; luego estructuras concurrentes, atomics, y solo cuando hace falta, sincronización clásica.

### MSG

Kafka es un log distribuido persistente y particionado, no una cola. Los mensajes se retienen (no se borran al leerse) → se pueden reproducir; brutal para alto throughput, streaming, event sourcing y varios consumer groups leyendo lo mismo. El orden solo se garantiza dentro de una partición; para que dos mensajes salgan ordenados al consumer, deben ir a la misma partición → misma clave (hash(key) % particiones). El paralelismo lo dan las particiones: máximo consumers activos por grupo = nº de particiones. At-least-once → idempotencia obligatoria.

RabbitMQ es un broker AMQP centrado en routing: el productor publica a un exchange, que enruta a colas según bindings y routing key. Tipos: direct (key exacta), topic (patrones con comodines), fanout (broadcast), headers. A diferencia de Kafka, el mensaje se borra al consumirse: no es un log reproducible.

Cuándo cada uno. Kafka para streams de eventos de alto volumen, reproducibles, varios consumidores que leen lo mismo, event sourcing. RabbitMQ para colas de comandos/tareas con routing fino y volumen menor. Muchos sistemas reales usan ambos.

Apache Flink es un motor de procesamiento de streams con estado, ventanas avanzadas, checkpoints para exactly-once, state backend RocksDB para estado enorme, y CEP (Complex Event Processing) para correlacionar eventos en tiempo real.

Garantías y patrones. At-least-once → idempotencia + DLQ. Exactly-once existe dentro de Kafka pero es difícil entre sistemas externos. Para publicar de forma atómica con la BD usa el patrón Outbox. Eventos versionados, Schema Registry (Avro/JSON Schema).

## Chuletas (puntos clave)

### ASYNC

- Endpoint lento → 202 Accepted + encolar + consumer. O @Async/CompletableFuture.
- Async = no bloqueas al caller. Reactivo = push + backpressure + pocos threads (Mono/Flux).
- Nunca bloquear en flujo reactivo (event loop). Virtual threads (J21) para I/O bloqueante simple.
- Thread-safe: inmutabilidad > locks/atomics/concurrentes. No: HashMap, ArrayList, SimpleDateFormat.

### MSG

- Cola = point-to-point (1 consumidor). Topic = pub/sub. 10 pods en cola → 1 lee.
- Kafka: orden por partición → misma clave (hash). Particiones = paralelismo (max consumers/grupo = particiones).
- Offset/commit (antes=at-most-once, después=at-least-once). Consumer lag = no da abasto.
- At-least-once → idempotencia obligatoria. DLQ para fallidos. Exactly-once difícil entre sistemas.
- RabbitMQ: exchange (direct/topic/fanout) → binding → queue; ack/prefetch; mensaje se borra al consumir.
- Kafka (log persistente, reproducible, alto throughput) vs Rabbit (colas/routing, se consume y desaparece).

## Flashcards: Mensajería + Async

### ASYNC (13 preguntas)

**Pregunta 1:** Tienes un endpoint síncrono que tarda 10s pero el usuario sólo necesita saber que se va a hacer. ¿Cómo lo conviertes en asíncrono?

**Respuesta:** Patrones:
1. Encolar el trabajo (Kafka, SQS, Rabbit) y devolver 202 Accepted con un id o Location para consultar estado. Un consumer lo procesa aparte.
2. @Async + CompletableFuture en Spring para disparar la tarea en un pool de threads (sólo si la tarea puede quedarse en la misma app; si el pod muere, se pierde).
3. Event-driven completo: el endpoint publica un evento de dominio y otros servicios reaccionan.
4. Polling/SSE/WebSocket para que el cliente reciba el resultado luego.

Para producción seria, opción 1 (cola/broker) es la más fiable: persistencia, reintentos, escalado horizontal.

💡 Analogía: en una hamburguesería te dan un número de pedido y vas a sentarte; te avisan por megafonía cuando esté listo. Si te tuvieran 10 minutos de pie en el mostrador (síncrono), se colapsaría la fila. El 202 Accepted con id de seguimiento es tu número de pedido.

---

**Pregunta 2:** Si no quieres ejecutarlo después mediante un scheduler sino ahora, ¿qué usarías?

**Respuesta:** Opciones para ejecutar trabajo asíncrono sin bloquear el hilo del caller:

[ver código en la app]

Trampa de @Async: solo funciona si el método se llama desde fuera del bean (Spring intercepta vía proxy). Si llamas this.enviar() dentro de la misma clase, el @Async no aplica.

---

**Pregunta 3:** ¿Qué diferencia hay entre que algo sea asíncrono y que algo sea reactivo?

**Respuesta:** Asíncrono: el caller no se bloquea esperando la respuesta. Puede implementarse con threads, callbacks, futures, etc. No implica ningún modelo concreto.

Reactivo: paradigma basado en streams de datos y propagación de cambios, con push desde la fuente, backpressure (el consumidor controla el ritmo) y non-blocking I/O.

[ver código en la app]

Todo lo reactivo es asíncrono, pero no todo lo asíncrono es reactivo: CompletableFuture es async pero no reactivo (sin backpressure, modelo pull/futures).

Ejemplo de la diferencia en el coste de scaling — 10k requests I/O-bound:
- MVC clásico: ~10k threads bloqueados → OOM o tuning intensivo del pool.
- WebFlux reactivo: ~16 threads en event loop, escala lineal.
- Virtual threads (J21): ~10k virtual threads sobre ~16 carriers → comparable a reactivo con código secuencial. Cambia mucho la ecuación para apps I/O-bound.

---

**Pregunta 4:** ¿Qué significa que algo sea thread safe?

**Respuesta:** Una clase/método es thread-safe si funciona correctamente cuando múltiples threads la usan simultáneamente, sin corrupción de datos ni comportamiento inesperado.

[ver código en la app]

Herramientas en Java:

[ver código en la app]

Estrategia: elige inmutabilidad cuando puedas. Si necesitas estado mutable compartido, usa Atomic* para contadores simples, ConcurrentHashMap para mapas, y locks solo cuando la operación es multi-paso y necesita consistencia como bloque.

En Agata Next: los event processors de Flink/Kafka son stateless entre mensajes (el estado va en Flink State Backends o en la BD), eliminando la mayoría de problemas de concurrencia.

---

**Pregunta 5:** ¿Cómo combinas varias tareas asíncronas con CompletableFuture?

**Respuesta:** CompletableFuture permite componer y combinar operaciones asíncronas sin bloquear hilos:

[ver código en la app]

[ver código en la app]

---

**Pregunta 6:** Java 21 trae virtual threads. ¿Hacen innecesario el modelo reactivo?

**Respuesta:** No del todo, pero cambian la ecuación. Los virtual threads (Project Loom, GA en Java 21) permiten escribir código bloqueante con throughput similar al reactivo, eliminando el problema del "wasted thread".

[ver código en la app]

¿Cuándo sigue siendo útil Reactor/WebFlux?
- Pipelines complejos con backpressure (Kafka → transformación → sink).
- Código ya reactivo que no quieres migrar.
- Máxima eficiencia en operaciones CPU-intensivas con scheduling preciso.

En Agata Next: se evalúa migrar los conectores de WebFlux a VT + Spring MVC bloqueante para reducir la curva de aprendizaje. Los Flink jobs siguen siendo reactivos/async por su modelo de streaming.

---

**Pregunta 7:** ¿Por qué nunca debes hacer una llamada bloqueante dentro de un flujo reactivo?

**Respuesta:** Porque los contextos reactivos y de virtual threads gestionan hilos de forma diferente al modelo bloqueante tradicional.

[ver código en la app]

[ver código en la app]

---

**Pregunta 8:** ¿Para qué se usa la reactividad en Spring y qué ventajas tiene frente a lo imperativo?

**Respuesta:** La reactividad en Spring (WebFlux + Project Reactor: Mono<T> para 0/1 y Flux<T> para 0..N) procesa peticiones/eventos de forma no bloqueante y asíncrona sobre un event loop con pocos threads, reaccionando a medida que llegan los datos.

Ventajas frente a lo imperativo/bloqueante (Spring MVC):
- No hay bloqueos: un thread atiende muchas peticiones mientras esperan I/O → mejor uso de recursos bajo alta concurrencia con I/O.
- Backpressure: el consumidor controla el ritmo del productor.
- Composición de streams con operadores (map, flatMap, zip).

Coste: curva de aprendizaje, depuración más difícil y necesita toda la cadena no bloqueante (R2DBC, WebClient). Para un CRUD sencillo, MVC imperativo suele ser más simple y suficiente.

---

**Pregunta 9:** ¿Cómo convertirías un método asíncrono en síncrono?

**Respuesta:** Bloqueando hasta obtener el resultado — dos opciones principales:

[ver código en la app]

Regla: en código de producción siempre usa timeout. Un join() sin timeout puede colgar un hilo de plataforma indefinidamente.

En código reactivo (WebFlux): evita bloquear en el scheduler de Reactor — usa .block() solo al borde del sistema (test o main), nunca dentro de un pipeline reactivo.

---

**Pregunta 10:** ¿Cómo implementas un endpoint en Spring WebFlux que aguante mucha carga sin bloquear?

**Respuesta:** Toda la cadena tiene que ser no bloqueante:
[ver código en la app]
Claves:
- Devolver Mono<T> / Flux<T> — el servidor Reactor Netty libera el thread mientras esperas.
- Drivers reactivos abajo: R2DBC (no JDBC), WebClient (no RestTemplate), Mongo reactive.
- Nunca un .block(), ni JDBC, ni Thread.sleep dentro del flujo (paraliza el event loop).
- Para bloqueante inevitable: .subscribeOn(Schedulers.boundedElastic()).
- Streaming con Flux + SSE / WebSocket; backpressure controla el ritmo.

---

**Pregunta 11:** Un repo devuelve un Mono<Camion> y quieres modificarle el volumen. ¿Cómo lo haces?

**Respuesta:** Con un operador del Mono — no llames a .block():
[ver código en la app]
Diferencias:
- map: transforma el valor (función pura, devuelve el resultado).
- flatMap: úsalo si la transformación devuelve otro Mono (p.ej. otra llamada async — guardar):
[ver código en la app]
- doOnNext: para side effects (loggear, métricas). No transforma.

Si necesitas combinar varios Monos: Mono.zip(a, b); manejar error: .onErrorResume(...).

---

**Pregunta 12:** synchronized vs ReentrantLock vs StampedLock: ¿cuándo cada uno?

**Respuesta:** - synchronized: el más sencillo. Lock implícito al entrar al método/bloque, libera al salir (incluso por excepción). Limitaciones: no se puede interrumpir, no hay timeout, no hay tryLock, no se puede saber si está adquirido, es "justo"-no realmente. Y bloquea el carrier en virtual threads (pinning, mejorado en J24+).
- ReentrantLock: lock explícito (lock() / unlock() en try/finally). Soporta timeout (tryLock(timeout)), interrupción, fairness opcional, Condition (espera/notify más rica). Es el que se recomienda con virtual threads.
- ReadWriteLock / ReentrantReadWriteLock: separa lectura (varios lectores simultáneos) de escritura (exclusiva). Útil cuando hay muchas más lecturas que escrituras.
- StampedLock (Java 8+): añade optimistic read (sin lock, comprueba al final si nadie escribió). Más rápido en lecturas muy intensivas, pero más complejo de usar correctamente.

Regla: synchronized para casos simples o legacy; ReentrantLock por defecto en código nuevo (especialmente con Loom); StampedLock cuando midas que el cuello es la contención de lecturas.

---

**Pregunta 13:** ¿Qué garantiza volatile y la relación happens-before?

**Respuesta:** El Java Memory Model define qué cambios de memoria un hilo ve de otro. Sin sincronización, un hilo puede no ver cambios hechos por otro hasta que la JVM "vacíe" caches (puede no ocurrir nunca en código sin reglas).

volatile sobre una variable garantiza:
- Visibility: una escritura a un volatile es visible inmediatamente para los demás hilos al leerlo (no se cachea).
- No reordering: el compilador y CPU no pueden reordenar instrucciones a través de la escritura/lectura volatile.

Lo que NO da: atomicidad en operaciones compuestas (counter++ con volatile sigue siendo race condition — usa AtomicInteger).

Happens-before es la relación de orden parcial del JMM: si una acción A happens-before B, todo lo escrito por A es visible al hacer B. Reglas que la establecen: orden de programa dentro de un hilo; liberación de un lock antes de adquirir el mismo lock; escritura volatile antes de su lectura; Thread.start() antes del primer instrucción del hilo nuevo; thread.join() después de la última instrucción de ese hilo.

En práctica: para flags de "parar" entre hilos usa volatile boolean; para counters/refs usa Atomic*; para sección crítica usa synchronized/Lock.

---

### MSG (16 preguntas)

**Pregunta 1:** ¿Qué experiencia tienes con colas o brokers como SQS, Kafka o RabbitMQ?

**Respuesta:** Respuesta personal — prepara una real. Estructura sugerida:

1. Nombra el/los broker(s) que has usado
> "Principalmente Kafka en producción (clúster KRaft, Strimzi en Kubernetes). También RabbitMQ en un proyecto anterior para colas de trabajo."

2. Contexto y escala
> "En Agata Next, ~40 microservicios conectados a Kafka 4. Topics de eventos de dominio con retención de 7 días, particiones por tenant, compactación en topics de estado."

3. Problema real que resolviste
> "Tuvimos consumer lag sostenido: identificamos un bottleneck en la deserialización. Solución: aumentar max.poll.records, añadir particiones y separar consumers por tipo de evento."

[ver código en la app]

---

**Pregunta 2:** ¿Qué diferencia hay entre una cola y un topic?

**Respuesta:** - Cola (queue): modelo point-to-point. Un mensaje se entrega a un único consumidor (load balancing entre consumidores). Ejemplo: SQS, RabbitMQ (queues).
- Topic: modelo publish/subscribe. Un mensaje llega a todos los suscriptores (broadcast). Ejemplo: SNS, RabbitMQ exchanges, Kafka topics.

[ver código en la app]

💡 Analogía: Cola = el cartero reparte el paquete a UNO. Si hay 10 carteros, cada paquete lo lleva uno. Topic = altavoz en la oficina: lo oyen TODOS los que están suscritos. Kafka es como una cinta de casete: puedes rebobinar y escuchar lo que te perdiste (retención configurable).

---

**Pregunta 3:** Si tengo una cola y levanto 10 instancias de mi aplicación, ¿cuántos leen un mensaje específico?

**Respuesta:** Uno solo. En una cola point-to-point, el broker entrega cada mensaje a una única instancia; las otras 9 no lo ven.

[ver código en la app]

Esto es justo lo que da escalabilidad horizontal: más consumers = más throughput, siempre que haya mensajes suficientes.

Coste del modelo: cada mensaje se procesa exactamente una vez (at-least-once con ACK). Si necesitas que N servicios distintos procesen el mismo mensaje, necesitas un topic o fan-out (SQS → SNS → múltiples SQS).

---

**Pregunta 4:** Si me conecto a un topic, ¿cuántos consumidores leen el mensaje?

**Respuesta:** Depende del modelo:
- Pub/Sub puro (SNS, Rabbit fanout): todos los suscriptores reciben el mensaje.
- Kafka: cada consumer group recibe el mensaje. Dentro de un mismo grupo, sólo una instancia lo procesa (load balance entre partitions).

[ver código en la app]

💡 Tip Agata: Strimzi/KRaft define replicas y partitions por topic en KafkaTopic CRD. Los consumer groups de los conectores usan KafkaUser con ACLs por topic.

---

**Pregunta 5:** ¿Qué garantías de entrega hay (at-least-once, etc.) y por qué necesitas idempotencia?

**Respuesta:** Las tres garantías de entrega son la base de todo sistema de mensajería:

[ver código en la app]

Idempotencia en el consumer (at-least-once en la práctica):
[ver código en la app]

En Agata Next (Strimzi/KRaft): at-least-once para eventos de telemetría de dispositivos (idempotentes por naturaleza — el último valor es el correcto). Exactly-once para cambios de estado de activos críticos.

---

**Pregunta 6:** En Kafka, ¿qué es el offset, el commit y el consumer lag?

**Respuesta:** En Kafka, el offset es el número de secuencia de un mensaje dentro de una partición — el "marcapáginas" del consumer.

[ver código en la app]

[ver código en la app]

[ver código en la app]

Consumer lag = la distancia entre lo que hay en el topic y lo que el consumer ha procesado. Es la métrica clave de salud de un consumer: un lag creciente = consumer más lento que el productor → escalar consumers (hasta el límite de particiones).

En Agata: alertas en Grafana cuando lag > 10.000 mensajes en topics críticos de ingestión.

---

**Pregunta 7:** ¿Cómo funciona RabbitMQ (exchanges, colas, routing)?

**Respuesta:** RabbitMQ es un broker AMQP basado en routing. Flujo: el productor publica a un exchange, que enruta a una o varias queues según los bindings y la routing key.

[ver código en la app]

Tipos de exchange:
- direct: routing key exacta → cola. Ej: order.created → solo la cola con binding order.created.
- topic: patrones con comodines ( = una palabra, # = cero o más). Ej: pedido..creado casa con pedido.es.creado pero no con pedido.creado.normal.
- fanout: broadcast a TODAS las colas enlazadas (ignora la key). Útil para eventos que muchos consumers necesitan.
- headers: enruta por cabeceras del mensaje en vez de routing key.

Los consumidores leen de colas y hacen ack/nack:
[ver código en la app]

prefetch (QoS): limita cuántos mensajes sin ack recibe un consumer (reparto justo entre consumers lentos y rápidos). Los fallidos van a un DLX (Dead Letter Exchange) → DLQ tras N reintentos.

Diferencia clave con Kafka: el mensaje se borra al consumirse (no es un log persistente reproducible). En Kafka el mismo mensaje lo pueden leer N consumer groups; en Rabbit es uno y se acabó.

---

**Pregunta 8:** ¿Cuándo usarías Kafka y cuándo RabbitMQ?

**Respuesta:** - Kafka: log distribuido persistente y particionado. Los mensajes se retienen (no se borran al leerse) → se pueden reproducir; brillante para alto throughput, streaming, event sourcing y varios consumer groups leyendo lo mismo. Orden garantizado por partición.
- RabbitMQ: broker de colas/routing (AMQP). Routing flexible (exchanges), entrega push con ack; ideal para colas de tareas/comandos, RPC y enrutado complejo, donde el mensaje se consume y desaparece.

Regla: Kafka para streams de eventos de alto volumen y reproducibles; RabbitMQ para mensajería de comandos/tareas con enrutado fino y menor volumen. No es raro usar ambos en el mismo sistema.

---

**Pregunta 9:** ¿Cómo garantizas el orden al leer mensajes de Kafka? ¿Cuántos puedes leer a la vez?

**Respuesta:** Kafka no garantiza orden global entre particiones. Solo garantiza orden dentro de una partición.

[ver código en la app]

Cómo garantizar orden para una entidad:
[ver código en la app]

Cuántos consumers activos por grupo: máximo N (número de particiones). Con 3 particiones, el 4º consumer quedará idle sin asignación.

Casos donde el orden importa: event sourcing de una entidad (los eventos deben aplicarse en secuencia), estados de máquinas (crear antes de actualizar). Si el orden global es imprescindible → un topic con 1 sola partición (sin escalado paralelo) o event sourcing con versión/sequence number.

---

**Pregunta 10:** ¿Para qué sirven las particiones en Kafka y cómo diriges un mensaje a una concreta?

**Respuesta:** Las particiones son la unidad de escalabilidad, paralelismo y tolerancia a fallos: un topic se divide en N particiones, cada una es un log ordenado e independiente que puede vivir en brokers distintos y replicarse. Más particiones = más consumers en paralelo dentro de un grupo (máx. = nº de particiones).

[ver código en la app]

Para enviar a una partición concreta: produce con una clave (key) y Kafka aplica hash(key) % nº_particiones → misma key, misma partición (y por tanto orden por key). También puedes indicar la partición explícitamente o implementar un Partitioner propio. Sin key, reparte round-robin.

Ejemplo Spring Kafka:
[ver código en la app]
En Agata: la convención [subsistema]-[localización].event.[tipo] define el topic; la clave suele ser el id del activo (sensor/cámara) para mantener orden por entidad.

---

**Pregunta 11:** ¿Qué es Apache Flink y para qué se usa?

**Respuesta:** Apache Flink es un motor de procesamiento de streams distribuido, de baja latencia y con estado. Procesa eventos de forma continua (no batch), con exactly-once dentro del pipeline, checkpoints para tolerancia a fallos y state backends (RocksDB) para mantener estado grande en disco.

Usos típicos:
- CEP (Complex Event Processing): correlacionar eventos en tiempo real ("si llegan 3 alarmas del mismo sensor en 5 minutos → emite alerta") — esto es lo que se hace en Agata Next (1 JobManager + 6 TaskManagers, 114 task slots).
- ETL streaming: transformar y enriquecer eventos en vuelo.
- Analítica en tiempo real, detección de fraude, joins entre streams.

Arquitectura: JobManager (coordina) + TaskManagers (ejecutan; cada uno con N slots); jobs definidos en Java/SQL; lee/escribe a Kafka, BD, etc.

---

**Pregunta 12:** ¿Flink vs Kafka Streams? ¿Cuándo uno u otro?

**Respuesta:** - Kafka Streams: librería Java embebida en tu app (no es un cluster aparte). Lee/escribe Kafka, mantiene estado local en RocksDB, replica vía un changelog topic. Más simple de operar (lo despliegas como una app más).
- Apache Flink: cluster dedicado (JobManager + TaskManagers). Mucho más potente: ventanas avanzadas, CEP, joins de streams complejos, conectores a más sistemas (no solo Kafka), SQL nativo, escalado independiente. Más operación.

Regla:
- Pocos topics, app Java sencilla, fluye en Kafka: Kafka Streams.
- Pipelines complejos, ventanas grandes, varios sistemas, CEP, equipos dedicados de datos: Flink.

Flink también tiene Table API y SQL streaming; Kafka Streams tiene kSQLdb aparte. En Agata Next se usa Flink para CEP por su potencia en correlación temporal.

---

**Pregunta 13:** En Flink, ¿qué son las ventanas, el estado y los checkpoints?

**Respuesta:** Ventanas (windows) agrupan eventos por tiempo o conteo para agregar:

[ver código en la app]

- Event time vs processing time: lo importante es el event time (cuándo ocurrió, marcado en el evento), no cuándo procesas. Para eventos tardíos: watermarks ("hasta este timestamp ya he visto casi todo lo del pasado"). Flink cierra la ventana cuando la watermark la supera.
- Estado: cada operador (keyBy(...)) mantiene estado (contadores, agregaciones, joins). El state backend RocksDB lo persiste en disco y soporta estado enorme (TB).
- Checkpoints: snapshots periódicos consistentes del estado + offsets de Kafka en almacenamiento durable (PVC/Ceph). Si un TaskManager cae, Flink reinicia desde el último checkpoint → garantía exactly-once dentro del job.
- Savepoints: snapshots manuales para upgrades / migraciones planificadas.

En Agata Next (subsystem-cep): jobs Flink consumen Kafka, hacen keyBy(sensorId) para tener estado por sensor, usan ventanas para correlacionar ("3 alarmas del mismo sensor en 5 min → incidente"), restart policy con backoff exponencial + jitter.

---

**Pregunta 14:** Patrón Outbox al detalle: ¿cómo funciona y por qué evita dual-write?

**Respuesta:** Problema: en una operación necesitas persistir en BD y publicar un evento al broker. Si lo haces como dos pasos separados, puedes fallar entre medias → BD actualizada sin evento (o viceversa) = inconsistencia.

Outbox resuelve esto con una sola transacción local:

[ver código en la app]

Flujo:
1. En la misma transacción que actualiza el negocio, inserta una fila en outbox (id, aggregate_id, event_type, payload JSON, created_at, published_at).
2. Commitea. Ahora el cambio + el evento son atómicos: o ambos persisten o ninguno.
3. Proceso separado lee filas no publicadas y las publica al broker. Cuando confirma, marca published_at.

Implementaciones:
- Polling: un scheduler (ShedLock en HA — exactamente el patrón que se usa en Agata Next) hace SELECT ... WHERE published_at IS NULL cada N segundos.
- CDC con Debezium: lee el WAL/binlog y publica automáticamente. Más eficiente, más infra.

Garantía: at-least-once (puede publicar dos veces si muere tras publicar antes de marcar) → consumidores deben ser idempotentes.

---

**Pregunta 15:** Dead Letter Queue (DLQ) y estrategias de reintento.

**Respuesta:** 💡 Analogía: un buzón de "correo devuelto" en una oficina de paquetería: si tras N intentos no se ha podido entregar, va a esa estantería para que alguien le eche un ojo a mano. No se pierde, pero tampoco bloquea la cinta.

Cuando un consumer falla procesando un mensaje (excepción no transitoria, payload malformado), no quieres ni perderlo ni reintentarlo eternamente bloqueando el flujo.

Patrón estándar:
1. Reintentar N veces (3-5) con backoff exponencial + jitter (1s, 2s, 4s, 8s...) — para errores transitorios (red, BD temporal).
2. Si tras N reintentos sigue fallando, mover a una Dead Letter Queue: cola/topic separado donde aterriza el mensaje + el error + el stack trace.
3. Alerta cuando la DLQ tiene contenido (métrica monitorizada).
4. Replay manual después de arreglar el bug: reprocesar los mensajes de la DLQ.

Implementación:
- Kafka: no hay DLQ nativa; se hace con un topic <topic>-dlq y Spring Kafka tiene DeadLetterPublishingRecoverer. Cuidado con bloquear el consumer principal (ofrece reintento sin bloquear con DefaultErrorHandler).
- RabbitMQ: DLX (Dead Letter Exchange) nativo, configurado en la cola; cuando un mensaje hace nack con requeue=false o expira, va al DLX.
- SQS: DLQ nativa con redrive policy (después de N recibos sin éxito).

Distingue errores transitorios (reintentar) de permanentes (DLQ directa).

---

**Pregunta 16:** CDC con Debezium: ¿qué es y cómo encaja con Outbox y Event Sourcing?

**Respuesta:** CDC (Change Data Capture) lee los cambios de la BD (inserts, updates, deletes) y los emite como eventos a otros sistemas. En vez de la app publicar manualmente, la BD es la fuente de los eventos.

Debezium es el motor CDC más popular: lee el WAL de Postgres, el binlog de MySQL, el oplog de Mongo, etc., y publica eventos a Kafka (también Pulsar). Cada cambio en la tabla = un evento con before/after.

Casos de uso:
- Outbox sin polling: en vez de un scheduler que lea la tabla outbox, Debezium lee el WAL y publica → más eficiente, menor latencia, sin race conditions.
- Sincronización entre sistemas: réplica de una BD a un read model en otro almacén (caché Redis, search Elasticsearch, data warehouse).
- Event sourcing en BD legacy: empieza emitiendo cambios sin reescribir la app.
- Microservicios desacoplados del monolito: las app downstream reaccionan a los cambios sin tocar la app fuente.

Garantías:
- At-least-once: el consumer puede recibir un evento dos veces si Debezium reintenta → idempotencia obligatoria.
- Orden por tabla/clave: si el evento usa la PK como clave Kafka, el orden por entidad se preserva.

En la stack Spring se integra con Kafka Connect (de hecho Debezium suele correr como connector). Coste: una pieza más de infra que vigilar (consumer lag de Debezium, errores de WAL).

---
