# Redis / Valkey · Observabilidad · Kubernetes

> Caché, locks distribuidos, métricas, trazas, logs, SLI/SLO, K8s.

## Teoría

### OBS

Observabilidad es la capacidad de entender qué le pasa a tu sistema en producción desde fuera, sin desplegar de nuevo. Tres pilares: métricas, logs y traces.

Métricas: valores numéricos agregados en el tiempo (counter, gauge, histogram). Prometheus + Micrometer es el stack típico en Spring. Usa percentiles (p95, p99) en latencias, no medias. Cuidado con la cardinalidad de etiquetas — nunca userId o traceId como tag.

Logs: registros en JSON (logstash-logback-encoder) con MDC para inyectar traceId/spanId/userId en cada línea. OpenSearch (fork open-source de Elasticsearch) donde aterrizan los logs. Pipeline típico: Filebeat → Logstash → OpenSearch → Dashboards.

Traces: el viaje de una petición por varios servicios, representado como spans anidados correlacionados por un traceId propagado en headers HTTP / metadata Kafka. OpenTelemetry (OTel) es el estándar abierto. Sampling porque trazar el 100% es caro: head-based (decides al inicio) o tail-based (decides según el resultado, siempre los errores).

Resiliencia. Resilience4j: circuit breaker (corta llamadas a un servicio caído), retry con backoff exponencial, rate limiter, bulkhead, time limiter. Health checks con Actuator: liveness (¿proceso vivo?) reinicia si falla; readiness (¿listo para tráfico?) saca del Service mientras falla.

SLI/SLO/SLA. SLI es la métrica (latencia, disponibilidad); SLO es tu objetivo interno ("99.9% < 200ms en 30 días"); SLA el contrato externo con consecuencias. El error budget (1 - SLO) define cuánto error te permites gastar.

## Chuletas (puntos clave)

### REDIS

- In-memory, compartido entre instancias (vs caché local incoherente). Sub-ms, single-thread (atómico).
- Estructuras: string/hash/list/set/sorted set (rankings)/stream/HyperLogLog.
- TTL + eviction (allkeys-lru/lfu). Patrones: cache-aside, read/write-through, write-behind.
- Más que caché: sesiones, rate limiting, colas, pub/sub, locks distribuidos (SET NX PX + Lua).
- Persistencia RDB (snapshot) vs AOF (append, más durable). Cluster: sharding por hash slots + réplicas.

### OBS

- 3 pilares: métricas (agregadas), logs (texto/JSON), traces (recorrido de petición).
- Prometheus + Micrometer: counter/gauge/histogram. p95/p99 (no la media). Cuidado cardinalidad de tags.
- OpenTelemetry estándar (CNCF) para producir telemetría. Spans anidados, traceparent header, sampling.
- Logs estructurados JSON + MDC (traceId/userId). Filebeat → Logstash → OpenSearch + Dashboards.
- Liveness (reinicia) vs Readiness (saca del Service). No confundir o reinicios en bucle.
- Resilience4j: circuit breaker, retry+backoff, rate limiter, bulkhead, time limiter.
- SLI (métrica) · SLO (objetivo interno) · SLA (contrato externo) · error budget (1-SLO).

### K8S

- Pod = unidad mínima. Deployment (stateless) vs StatefulSet (identidad estable) vs DaemonSet (1 por nodo).
- Service tipos: ClusterIP (interno), NodePort (debug), LoadBalancer (1 IP externa), Headless.
- Ingress > N LoadBalancers: 1 IP + reglas por host/path + TLS.
- Probes: liveness (reinicia), readiness (saca del Service), startup (arranque lento).
- NetworkPolicy: segmentación L3/L4 entre pods. Necesita CNI compatible (Calico, Cilium).
- Operators + CRDs = código vivo: Strimzi (Kafka), CNPG (Postgres HA), cert-manager.
- Requests = reserva (scheduling). Limits = máximo (throttling/OOMKilled).

## Flashcards: Redis + Obs + K8s

### REDIS (10 preguntas)

**Pregunta 1:** ¿Qué es Redis y por qué usarlo en vez de una caché in-memory local?

**Respuesta:** Redis es un almacén clave-valor en memoria (in-memory data store) que funciona como servidor independiente, usable como caché, base de datos o broker. Es extremadamente rápido (latencia sub-milisegundo).

Frente a una caché in-memory local (un Map/Caffeine dentro del proceso):
- Compartida entre instancias: con 10 pods, todos ven la misma caché (la local se duplicaría e incoherente).
- Sobrevive al reinicio del servicio (y opcionalmente persiste).
- Ofrece estructuras ricas, TTL, pub/sub, locks distribuidos, atomicidad.

Coste: un hop de red y una pieza más de infraestructura. La caché local sigue siendo válida para datos por-instancia y latencia mínima (incluso combinadas: near cache).

---

**Pregunta 2:** ¿Qué estructuras de datos ofrece Redis y para qué sirven?

**Respuesta:** [ver código en la app]

Casos reales:
- Mercado mayorista (CV): Hash para sesiones de usuario, Sorted Set para los productos más vendidos del día (top-N), List como cola de impresiones de tickets.
- Agata Next: Valkey (Redis fork) — Hash para caché de schemas de entidades, String + TTL para tokens cortos, Sorted Set para rate limiting por endpoint con sliding window.

💡 Tip: la elección de estructura es la diferencia entre "Redis funciona regular" y "Redis vuela". Si usas todo como String → te pierdes la mitad de su valor. Sorted Set + GEO son especialmente infrautilizados.

💡 Analogía: Redis es como una navaja suiza — String es la cuchilla, Hash es el destornillador, Sorted Set es el sacacorchos para rankings, Stream es la sierra para logs. Quien solo usa la cuchilla está pelando manzanas con un martillo.

---

**Pregunta 3:** ¿Cómo funcionan el TTL y las políticas de expiración/eviction en Redis?

**Respuesta:** TTL (Time To Live): tiempo de vida de una clave. Cuando expira, Redis la borra automáticamente.

[ver código en la app]

Políticas de evicción (cuándo la memoria se llena, maxmemory-policy):

[ver código en la app]

En Agata Next (Valkey): volatile-lru para caché de schemas + maxmemory 8gb. Las claves sin TTL son configuración crítica (no se eviccionan); las cachés tienen TTL de 5-30 min.

---

**Pregunta 4:** ¿Qué patrones de caché conoces (cache-aside, write-through…)?

**Respuesta:** [ver código en la app]

Código cache-aside típico (Spring + Redisson):
[ver código en la app]
O usando Spring @Cacheable / @CacheEvict (AOP detrás):
[ver código en la app]

Casos reales:
- Mercado mayorista (CV): cache-aside para el catálogo de productos (10k items, TTL 1h, invalidación al editar precio).
- Agata Next: cache-aside para los schemas de entidades — son inmutables casi todo el tiempo, lectura constante; perfecto para Valkey.

Clave aparte: invalidación. "Solo hay dos cosas difíciles en informática: invalidar cachés y nombrar variables". Estrategias:
- TTL (caduca solo) — la defensa más simple, asume cierta tolerancia a stale.
- Invalidación por evento: cuando cambia el dato, publica un evento (user-updated) que borra la entrada de caché.
- Cache stampede: si N requests llegan justo cuando expira → todas hacen miss y golpean la BD a la vez. Mitigación: single-flight (un solo recargo en curso, los demás esperan) o TTL aleatorio (jitter).

💡 Tip: empieza con cache-aside + TTL bajo (2-10 min). Es el 90% de los casos. Salta a write-through solo si la consistencia inmediata importa, y a write-behind solo si la latencia de escritura es crítica.

---

**Pregunta 5:** Más allá de caché, ¿para qué se usa Redis?

**Respuesta:** Redis es un servidor de estructuras de datos en memoria — la caché es solo uno de sus usos:

[ver código en la app]

En Agata Next (Valkey):
- Hash + TTL: caché de schemas de entidades por tipo.
- Sorted Set: rate limiting por endpoint de API (sliding window por IP).
- String NX+EX: lock distribuido para tareas de consolidación que no deben ejecutarse en paralelo en N pods.

💡 La elección de estructura es lo que marca la diferencia: si lo usas todo como String estás usando un martillo donde hay toda una caja de herramientas.

---

**Pregunta 6:** ¿Cómo implementas un lock distribuido con Redis y qué cuidados tiene?

**Respuesta:** Un lock distribuido resuelve la exclusión mutua entre N instancias (pods) de un servicio.

[ver código en la app]

[ver código en la app]

Cuidados:
- TTL de seguridad siempre (NX sin EX → si el holder muere, lock permanente).
- Owner único por adquisición (UUID) para evitar borrar el lock de otro proceso.
- Redlock (múltiples nodos Redis) para mayor fiabilidad ante fallos de un nodo, pero tiene sus propias limitaciones — para la mayoría de casos, un solo Redis con replicación es suficiente.
- ShedLock (librería Java) encapsula todo esto con soporte a MongoDB, PostgreSQL y Redis — más simple que implementarlo a mano.

---

**Pregunta 7:** ¿Redis pierde los datos al reiniciar? (RDB vs AOF)

**Respuesta:** Redis tiene dos mecanismos de persistencia — por defecto es en memoria pura (datos se pierden al reiniciar):

[ver código en la app]

En Agata Next (Valkey): sin persistencia para la caché de schemas (se reconstruye) + AOF everysec para los locks distribuidos (no perder el estado de bloqueo entre reinicios).

---

**Pregunta 8:** ¿Por qué Redis es tan rápido y cómo escala (single-thread, cluster)?

**Respuesta:** Es rápido porque trabaja en memoria y procesa los comandos en un único hilo con un event loop (I/O multiplexado): sin locks ni cambios de contexto, cada comando es atómico y no hay condiciones de carrera entre comandos. (Las versiones modernas usan hilos solo para I/O de red, no para la lógica.)

Escalado:
- Replicación primario-réplicas para lecturas y alta disponibilidad (+ Sentinel para failover).
- Redis Cluster: sharding por hash slots (16384) repartiendo claves entre nodos → escala escritura y memoria horizontalmente.

Límite: como es un solo hilo de cómputo, un comando costoso (KEYS *, grandes SORT) bloquea a todos; evítalos en producción (usa SCAN).

---

**Pregunta 9:** Redis Streams vs Pub/Sub: ¿qué diferencia hay?

**Respuesta:** Las dos son mecánicas "de mensajes", pero con garantías muy distintas:

Pub/Sub (PUBLISH/SUBSCRIBE):
- Fire-and-forget: si no hay suscriptores cuando publicas, el mensaje se pierde.
- Sin persistencia, sin replay, sin grupos de consumidores.
- Muy rápido. Útil para notificaciones efímeras (eventos de UI, invalidación de caché).

Streams (desde Redis 5):
- Log append-only persistente (parecido a Kafka, escala más modesta).
- Los mensajes se retienen hasta que los borras / aplicas política.
- Consumer groups: varios consumidores se reparten el flujo (XREADGROUP).
- ACK explícito: si un consumidor procesa pero no hace ACK, el mensaje queda "pendiente" y otro lo puede tomar.
- Replay desde un offset arbitrario.

Regla:
- Pub/Sub: notificaciones en vivo donde perder mensajes es aceptable.
- Streams: cola/log fiable cuando no quieres montar Kafka (volumen modesto, latencia muy baja, ya tienes Redis). Sustituye al patrón legacy de LPUSH/BRPOP (sin replay, sin grupos).

---

**Pregunta 10:** Transacciones en Redis: MULTI/EXEC y optimistic locking con WATCH.

**Respuesta:** Redis tiene transacciones simples y atómicas, pero sin rollback clásico:
[ver código en la app]
Entre MULTI y EXEC, los comandos se encolan sin ejecutar. Al hacer EXEC se ejecutan atómicamente (Redis es single-thread → nadie se cuela). Si un comando tiene error de sintaxis, se rechaza la transacción entera. Pero si un comando falla en tiempo de ejecución (tipo equivocado), los demás SÍ se ejecutan (no hay rollback).

Optimistic locking con WATCH (para race conditions del estilo check-and-set):
[ver código en la app]
Si alguien cambió la key vigilada, EXEC aborta y devuelves a leer/intentar. Es el patrón "transferencia atómica" sin locks pesimistas.

La alternativa moderna: scripts Lua (EVAL) — atómicos por construcción (single-thread), más expresivos que MULTI/EXEC, y son lo que usa Redisson internamente para locks distribuidos y operaciones compuestas.

---

### OBS (11 preguntas)

**Pregunta 1:** ¿Cuáles son los 3 pilares de la observabilidad?

**Respuesta:** [ver código en la app]

- Métricas: valores numéricos agregados en el tiempo (CPU, latencia, throughput, errores). Baratas, agregables, perfectas para alertas y dashboards. Modelo Prometheus: counter (solo sube), gauge (sube y baja), histogram (distribución, percentiles), summary.
- Logs: registros textuales/estructurados de eventos discretos. Detalle máximo, pero caros y difíciles de agregar. Idealmente JSON estructurado con correlation_id/trace_id para enlazarlos a los otros pilares.
- Traces (trazas distribuidas): el viaje de una petición por varios servicios, con spans anidados ("controller → service → BD → Kafka"). Diagnostican latencia y dependencias.

No basta con uno: las métricas detectan, los traces localizan dónde, los logs explican qué pasó exactamente. La magia está en correlacionarlos vía trace_id. OpenTelemetry es el estándar para producir los tres.

---

**Pregunta 2:** Métricas con Prometheus + Micrometer: tipos y buenas prácticas.

**Respuesta:** Micrometer es la API de métricas de Spring Boot (vendor-neutral); Prometheus scrapea su endpoint /actuator/prometheus.

Tipos:
- Counter: solo sube (peticiones totales, errores).
- Gauge: sube y baja (sesiones activas, threads).
- Timer / Histogram: latencia, con percentiles (p50/p95/p99). Cuidado con la cardinalidad — cada combinación de etiquetas (tags) crea una serie.

Buenas prácticas:
- Etiquetas/dimensiones útiles (uri, method, status) pero acotadas: nunca userId o traceId como tag (explotaría la cardinalidad).
- Usa percentiles (p95, p99) no medias para latencia.
- Naming consistente: http_server_requests_seconds, kafka_consumer_lag.
- En Agata: Prometheus retiene 365 días, dashboards en Grafana, alertas por reglas.

---

**Pregunta 3:** ¿Qué es OpenTelemetry y cómo funciona el tracing distribuido?

**Respuesta:** OpenTelemetry (OTel) es el estándar abierto (CNCF) para producir telemetría (traces, métricas, logs) de forma neutral; envías a cualquier backend (Jaeger, Tempo, Datadog, NewRelic) sin cambiar el código.

Un trace = árbol de spans anidados que representan el recorrido de una petición a través de servicios. Cada span lleva: operación, duración, atributos, eventos. El trace context (header traceparent del W3C) se propaga por HTTP/Kafka para unir todos los spans en un solo trace.

[ver código en la app]

Los traceparent/tracestate headers viajan en cada hop (HTTP, Kafka). Cada servicio lee el padre, abre sus propios spans hijos, y los manda al backend (Tempo/Jaeger) que los une por trace_id.

En Spring se hace casi gratis con micrometer-tracing-bridge-otel + opentelemetry-exporter-otlp (lo que usa Agata Next).

Sampling — no traces todo en prod (caro):
- Head-based: decides al inicio según un % (10%). Sencillo pero pierde casos raros (errores).
- Tail-based: decides al final con el resultado completo → siempre muestrea errores y lentos. Mejor, más complejo (necesita un collector intermedio que retenga el trace).

Valor real: una request lenta y descubres que el cuello es el 3er servicio de la cadena en una query — algo invisible solo con logs.

---

**Pregunta 4:** ¿Qué son los logs estructurados y por qué son mejores?

**Respuesta:** Logs estructurados = en formato máquina-legible (JSON), no texto libre. Cada entrada tiene campos: timestamp, level, message, service, trace_id, span_id, user_id, error.kind...

En Java/Spring: logstash-logback-encoder convierte la salida en JSON; añades campos con MDC (Mapped Diagnostic Context: MDC.put("traceId", ...)), que se imprimen en cada línea del hilo. Filebeat los recoge y los manda a OpenSearch/ELK.

Ventajas sobre texto plano:
- Buscable (filtra por service=pagos AND status=500 AND elapsed_ms>500).
- Agregable (cuenta errores por servicio).
- Correlación con traces (trace_id enlaza un log con su span).

Reglas: no logues datos sensibles (PII, secrets); usa el nivel correcto (INFO/WARN/ERROR), no abuses de INFO en zonas calientes (rendimiento).

---

**Pregunta 5:** ¿Qué es OpenSearch (vs Elasticsearch)? ¿Para qué se usa?

**Respuesta:** OpenSearch es el fork open-source de Elasticsearch (de AWS, tras el cambio de licencia de Elastic). Mantiene la API y la mayoría de funciones de Elasticsearch 7.x e itera por su cuenta.

Usos:
- Centralización y búsqueda de logs (su uso más común en plataformas; lo que hace Agata Next: Filebeat/Logstash → OpenSearch + Dashboards).
- Búsqueda full-text en aplicaciones (productos, documentos).
- Análisis y dashboards de telemetría.
- Métricas y APM (con plugins).

Arquitectura: shards + réplicas distribuidos en un cluster, inverted index para búsqueda rápida en texto, agregaciones sobre grandes volúmenes. OpenSearch Dashboards es el equivalente a Kibana para visualizar.

---

**Pregunta 6:** El stack ELK / EFK / OpenSearch: cada pieza para qué.

**Respuesta:** Pipeline clásico de observabilidad de logs:

[ver código en la app]

En Agata Next: Filebeat + Logstash + OpenSearch + Dashboards + políticas ISM para rotación de índices por antigüedad. Los logs van con trace_id del W3C para correlacionar con los traces de OpenTelemetry.

💡 Cuándo elegir Loki sobre OpenSearch: si el volumen de logs es enorme y buscas por etiquetas (service, pod, namespace) más que full-text → Loki es 10× más barato (no indexa el contenido). OpenSearch gana cuando necesitas buscar dentro del mensaje ("EXCEPTION", "timeout", texto libre).

---

**Pregunta 7:** Health checks en Spring (liveness vs readiness): ¿qué diferencia hay?

**Respuesta:** Spring Boot Actuator expone health checks via /actuator/health. Kubernetes los consume con dos sondas distintas:
- Liveness probe: "¿el proceso está vivo?" Si falla, Kubernetes reinicia el pod. Detecta deadlocks, OOM, hangs. Solo dependencias internas que un reinicio arreglaría.
- Readiness probe: "¿está listo para recibir tráfico?" Si falla, se saca del Service (no reinicia) hasta que vuelva. Comprueba dependencias externas necesarias (BD, broker) al arrancar o cuando se pierden.

Spring Boot ya separa los groups: /actuator/health/liveness y /actuator/health/readiness. Mal configurado, una BD caída tira todos los pods en bucle de reinicio. Regla: liveness ligero, readiness con dependencias críticas y startup probe aparte para apps lentas en arrancar.

---

**Pregunta 8:** ¿Qué patrones de resiliencia ofrece Resilience4j y cómo encajan?

**Respuesta:** Librería ligera para resiliencia en JVM (sucesora moderna de Hystrix). Patrones:
- Circuit breaker: si X% de llamadas fallan en una ventana, el circuito se abre y rechaza llamadas directas hasta un half-open que prueba si recuperó. Evita martillear un servicio caído.
- Retry: reintenta con backoff exponencial + jitter para no agravar la caída.
- Rate limiter: limita llamadas por unidad de tiempo.
- Bulkhead: aísla recursos por tipo de llamada (pool de threads o semáforo) → un fallo no agota todos los threads.
- Time limiter: timeout sobre CompletableFuture.
- Cache: caché simple sobre respuestas.

Se componen con anotaciones (@CircuitBreaker, @Retry) o programáticamente. Combina con observabilidad: cada uno expone métricas Micrometer.

💡 Analogía (circuit breaker): el diferencial eléctrico de tu casa. Detecta sobrecarga (fallos repetidos), salta y deja de pasar corriente para no quemar todos los electrodomésticos. Al rato lo rearmas (half-open) y pruebas. Resilience4j hace eso pero con llamadas HTTP en vez de electrones.

💡 Analogía (bulkhead): las mamparas estancas de un barco. Si un compartimento se inunda, el barco no se hunde — el agua queda contenida. En código, un pool de threads dedicado por tipo de llamada: si la API X se cuelga, no se lleva por delante al resto del servicio.

---

**Pregunta 9:** ¿Qué son SLI, SLO y SLA?

**Respuesta:** Vocabulario SRE para fijar objetivos de fiabilidad:
- SLI (Service Level Indicator): la métrica que mides — disponibilidad, latencia p99, tasa de error, throughput.
- SLO (Service Level Objective): el objetivo interno sobre ese SLI durante una ventana — "el 99,9% de las peticiones responden en <200ms a lo largo de 30 días". El equipo se compromete con esto.
- SLA (Service Level Agreement): el contrato externo con el cliente y sus consecuencias si se incumple (créditos, penalizaciones). El SLA suele ser más laxo que el SLO interno (te dejas margen).

[ver código en la app]

Error budget es el equilibrio entre velocidad y estabilidad:
- Si tienes budget → puedes desplegar, probar, iterar.
- Si lo gastas → pares y priorizas fiabilidad.
- Es una conversación objetiva entre producto (velocidad) y SRE (estabilidad).

💡 Regla práctica: define SLI solo sobre lo que el usuario percibe (latencia end-to-end, tasa de éxito). Métricas internas (CPU, GC) son síntomas, no SLIs.

Agata Next: SLA 99,9%, p95 < 200ms, Kafka ≥ 10 K msg/s. Error budget en Grafana como panel "Remaining budget this month".

---

**Pregunta 10:** Alerting con Prometheus AlertManager: ¿qué problemas evitar?

**Respuesta:** Una alerta debe disparar solo cuando hay algo que un humano debe hacer ahora. Errores comunes:

- Alertar por causa, no por síntoma: alertar de "CPU al 90%" no es accionable si la latencia es buena. Mejor: alertar de "p95 latencia > 500ms" o "error rate > 2%" — síntomas que el usuario nota.
- Alertas ruidosas: el equipo aprende a ignorarlas. Una alerta cada minuto sobre transitorios = todas son ignoradas, incluida la real ("alert fatigue").
- Sin runbook: cada alerta debe enlazar a un documento con qué comprobar y cómo actuar.

Patrón moderno: multi-window burn rate sobre SLOs. Mides la velocidad a la que estás "quemando" tu error budget (1 - SLO). Si la quema es 14x en 1h, 3x en 6h... entonces alerta. Esto distingue picos transitorios (ignorables) de degradación real.

Herramientas:
- Prometheus AlertManager: enruta alertas a canales (email, Slack, PagerDuty), deduplica, agrupa, hace silencios.
- Severities: warning (revisar pronto, sin urgencia) vs critical (paginar a quien guarda). Sin esa distinción, todo es critical o todo es ignorado.

---

**Pregunta 11:** Cómo estructurar dashboards: métodos USE y RED.

**Respuesta:** Dos frameworks complementarios para no pegar gráficas al azar:

RED (orientado a servicios — Google SRE):
- Rate: peticiones/segundo.
- Errors: tasa de error.
- Duration: latencia (p50, p95, p99).

Da una visión por servicio: "¿cómo está el endpoint X?". Es el dashboard de servicio mínimo viable. Combina con el famoso Four Golden Signals de Google (Latency, Traffic, Errors, Saturation).

USE (orientado a recursos — Brendan Gregg):
- Utilization: % de uso (CPU, disco, conexiones del pool).
- Saturation: cuánto trabajo extra está encolado (CPU run-queue, BD waits, JVM GC pressure).
- Errors: errores del recurso.

Da una visión por recurso: "¿la BD está saturada?". Imprescindible para infra.

Reglas adicionales:
- No más de ~10 paneles por dashboard (sino nadie lo mira).
- Top-down: agregado arriba, detalle abajo. Empieza con visión global, baja a servicio, baja a instancia.
- Anota despliegues y cambios (Grafana anotations) — correlacionas cambios con incidentes.

---

### K8S (7 preguntas)

**Pregunta 1:** Conceptos clave de Kubernetes: Pod, Deployment, Service, Ingress.

**Respuesta:** [ver código en la app]

- Pod: la unidad mínima desplegable. Uno o varios contenedores que comparten red y volúmenes; mismo ciclo de vida. Lo normal: un contenedor por pod (salvo sidecars como service mesh proxies o log shippers).
- Deployment: orquesta un conjunto de pods stateless con N réplicas, rolling updates, rollback, health checks. Si un pod muere, lo recrea.
- Service: una IP estable y DNS interno para acceder a los pods (que cambian de IP cada vez). Resuelve el descubrimiento dentro del clúster (http://servicio:8080). El kube-proxy hace el load-balance.
- Ingress: capa por encima de Services para HTTP/HTTPS desde fuera, con reglas por host/path. Termina TLS. Implementado por un controller (nginx, Traefik).
- ConfigMap / Secret: configuración y credenciales (Secrets son base64, no es cifrado real — usa Sealed Secrets / External Secrets).
- Namespace: aislamiento lógico (separas equipos/entornos).
- PVC / PV / StorageClass: almacenamiento persistente para pods con estado.

Mental model: declaras el estado deseado (manifiestos YAML); el control plane (API server + scheduler + controller-manager + etcd) reconcilia continuamente hacia ese estado.

💡 Analogía: un edificio de viviendas con conserje. Los Pods son apartamentos (con sus contenedores=habitaciones); el Deployment es "quiero 3 apartamentos iguales y si uno se quema lo restauras"; el Service es el portero automático (un solo timbre para todos los apartamentos del piso); el Ingress es el portal exterior con TLS ("api.x.com → 4º A; app.x.com → 4º B"). El conserje (control plane) ronda cada minuto y arregla lo que no cuadra con los planos.

---

**Pregunta 2:** Deployment vs StatefulSet vs DaemonSet: ¿cuándo cada uno?

**Respuesta:** Tres tipos de "workload controller" para distintos casos:

- Deployment: pods stateless e intercambiables. Identidad anónima (app-7f8d-xyz). Escalado horizontal libre, rolling updates sencillos. Lo normal para microservicios web/API.
- StatefulSet: pods con identidad estable (app-0, app-1, app-2) y orden de arranque/terminación. Cada pod tiene su PVC propio que sobrevive a recreaciones. Para BDs (Mongo ReplicaSet, Kafka brokers con KRaft, Postgres con CNPG, Keycloak HA con Infinispan).
- DaemonSet: un pod por cada nodo del clúster. Para agentes que deben correr en todas las máquinas: log shippers (Filebeat), métricas (node-exporter), CNI plugins, agentes de seguridad.
- Job: ejecuta un pod hasta que termine con éxito (batch). CronJob: como Job pero por crontab.

Reglas: si los pods son intercambiables y no tienen estado persistente propio → Deployment. Si necesitas identidad estable o almacenamiento per-pod → StatefulSet. Si es "uno por nodo" → DaemonSet.

---

**Pregunta 3:** Tipos de Service en Kubernetes: ClusterIP, NodePort, LoadBalancer, Headless.

**Respuesta:** - ClusterIP (default): IP interna del clúster. Solo accesible desde dentro. Lo normal para servicios entre microservicios (http://servicio:8080). DNS gestionado por CoreDNS.
- NodePort: expone el service en un puerto fijo (30000-32767) en todos los nodos. Acceso externo "crudo" — más para dev/debug que producción.
- LoadBalancer: pide al cloud provider (o MetalLB en on-premise) una IP virtual externa. Cada LoadBalancer = una IP — escala mal si tienes N servicios públicos (de ahí Ingress).
- Headless (clusterIP: None): no asigna IP virtual; el DNS resuelve directamente a las IPs de los pods. Útil para clientes que quieren conectar pod-a-pod (drivers Mongo, Kafka).

Patrón típico de exposición:
- Dentro del clúster → ClusterIP.
- Fuera del clúster → Ingress (HTTP/HTTPS) sobre Services internos. Una sola IP, N reglas por host/path.
- Servicio TCP no-HTTP fuera del clúster → LoadBalancer (o NodePort si no hay cloud).

---

**Pregunta 4:** ¿Qué es un Ingress y por qué usarlo en vez de LoadBalancer por servicio?

**Respuesta:** Un Ingress es la capa de entrada HTTP/HTTPS al clúster. Define reglas como "api.miempresa.com/v1→ service A, app.miempresa.com → service B". Termina TLS (con certs gestionados por cert-manager) y enruta al service interno correcto.

Necesita un Ingress Controller que implementa las reglas: nginx-ingress, Traefik, HAProxy, Cloud-managed (ALB, GCLB).

Vs un LoadBalancer por servicio:
- Cada LoadBalancer = una IP pública y un coste (en cloud cada IP cuesta). Con 20 microservicios públicos = 20 IPs.
- Con Ingress, una sola IP expone todos a través de host/path → barato y manejable.
- Termina TLS en un solo punto (gestión centralizada de certificados).
- Permite reglas avanzadas: rate limiting, rewrite, auth básica, CORS, headers de seguridad.

Patrón estándar en producción:
- Externamente → Ingress + cert-manager (Let's Encrypt o PKI interna).
- Internamente → ClusterIP services.
- Servicios TCP no-HTTP → LoadBalancer dedicado.

---

**Pregunta 5:** Network Policies en Kubernetes: ¿para qué y cómo se aplican?

**Respuesta:** Por defecto en K8s, todos los pods se ven entre sí (red plana). Las Network Policies segmentan ese tráfico — el firewall L3/L4 del clúster.

[ver código en la app]

Una NetworkPolicy define para qué pods aplica y qué tráfico ingress/egress permite:
[ver código en la app]

Patrón default-deny-all (empezar bloqueando todo el namespace):
[ver código en la app]
Luego abres lo necesario con policies específicas.

Claves:
- Necesita un CNI que las soporte: Calico, Cilium. (Flannel básico no.)
- Las policies son aditivas: cualquier policy que permita el tráfico lo permite.
- Complementario al service mesh (Istio/Linkerd) que añade L7 (mTLS, auth basada en identidad de workload).

En Agata Next: Calico + NetworkPolicies por namespace + VLANs físicas por dominio funcional (IT/OT/sensores).

---

**Pregunta 6:** ¿Qué son los Operators y CRDs en Kubernetes?

**Respuesta:** Una CRD (Custom Resource Definition) te permite definir tu propio tipo de recurso K8s, además de los nativos (Pod, Service…). Por ejemplo, KafkaCluster, PostgresCluster, Certificate son CRDs.

Un Operator es un controller que reconcilia ese CRD: cuando tú creas un KafkaCluster, el operator se encarga de crear los StatefulSets, Services, ConfigMaps, secrets, etc. necesarios. Es el patrón "código vivo" de la operación: codifica el know-how de operar un sistema complejo.

Ejemplos reales:
- Strimzi: opera Kafka (brokers, topics como KafkaTopic, usuarios como KafkaUser con ACLs). Es lo que usa Agata Next.
- CloudNativePG (CNPG): opera PostgreSQL HA (replicación streaming, failover automático, backups).
- cert-manager: opera certificados TLS (renovación con Let's Encrypt o PKI interna).
- Mongock: migraciones de Mongo.
- External Secrets: sincroniza secretos desde Vault/AWS Secrets Manager.

Valor: declarativa todo desde YAML. En vez de "sigue 30 pasos para añadir un broker", aplicas el manifiesto KafkaCluster con replicas: 4 y el operator lo hace.

Desventaja: complejidad operativa (un operator más que mantener) y curva de aprendizaje. Pero para infra crítica compleja, vale la pena.

---

**Pregunta 7:** Requests, limits y QoS classes en Kubernetes.

**Respuesta:** Cada contenedor declara requests (lo que reserva, garantizado) y limits (lo máximo que puede usar) para CPU y memoria:

[ver código en la app]

Efectos:
- Scheduler coloca el pod en un nodo con requests disponibles. Si pides 8 CPU y ningún nodo las tiene libres, el pod queda Pending.
- CPU limit: si el contenedor intenta superarlo, lo estrangulan (throttling) — no muere, pero va más lento.
- Memory limit: si se supera, el contenedor se mata con OOMKilled y se reinicia.

QoS Classes (asignada automáticamente):
- Guaranteed: requests == limits para CPU y memoria. Última en ser desalojada bajo presión.
- Burstable: tiene requests < limits. Puede ser desalojado si los nodos tienen presión.
- BestEffort: sin requests ni limits. Primera en ser desalojada.

Reglas:
- No pongas CPU limit en cargas latencia-crítica (debate actual): el throttling es brutal y la CPU es "compresible".
- Memory limit siempre (evita un pod fugado que tumbe el nodo).
- Mide en producción antes de fijar: empieza ancho, ajusta a la realidad.

---
