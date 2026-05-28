// Tests de selección múltiple: una respuesta correcta por pregunta, con explicación.
// Cada distractor es plausible (no obviamente malo) — la idea es discriminar conocimiento.

export interface McqQuestion {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** Explicación tras responder (Markdown corto). */
  explanation: string;
}

export const MCQ: McqQuestion[] = [
  // ---- Java ----
  {
    id: 'mcq-java-1', topicId: 'java',
    question: '¿Qué hace exactamente flatMap sobre un Stream?',
    options: [
      'Filtra los elementos null y los elimina del stream.',
      'Transforma cada elemento 1→1 (igual que map pero más rápido).',
      'Transforma cada elemento en un Stream y aplana Stream<Stream<T>> en Stream<T>.',
      'Aplana una colección anidada solo si es de tipo List.',
    ],
    correctIndex: 2,
    explanation: '`flatMap(Function<T, Stream<R>>)` transforma cada elemento en un stream y los **aplana**. Útil cuando cada elemento se expande en varios (p.ej. `pedidos.stream().flatMap(p -> p.getLineas().stream())`). `map` daría `Stream<List<Linea>>`.',
  },
  {
    id: 'mcq-java-2', topicId: 'java',
    question: 'Una interfaz funcional en Java es una interfaz que…',
    options: [
      'Tiene al menos un método default.',
      'Tiene exactamente un método abstracto (puede tener defaults/statics).',
      'Se marca obligatoriamente con @FunctionalInterface.',
      'No puede tener métodos estáticos.',
    ],
    correctIndex: 1,
    explanation: 'Exactamente **un** método abstracto. Puede tener defaults/statics/privates. `@FunctionalInterface` es opcional (el compilador valida si la pones).',
  },
  {
    id: 'mcq-java-3', topicId: 'java',
    question: 'Sobre virtual threads (Java 21+), ¿qué afirmación es cierta?',
    options: [
      'Sustituyen completamente al modelo reactivo (Reactor/WebFlux).',
      'Son ideales para tareas CPU-bound porque crean menos overhead.',
      'Cuando bloquean por I/O, la JVM los desmonta del platform thread (carrier) para que ese carrier atienda a otro.',
      'Requieren reescribir el código para usar APIs no bloqueantes.',
    ],
    correctIndex: 2,
    explanation: 'La gracia es que **bloquean** como hilos normales pero la JVM los **desmonta** del carrier en operaciones de I/O. Ideal para I/O-bound. No sustituyen totalmente a reactivo (que sigue dando backpressure y composición de streams) y NO ayudan en CPU-bound.',
  },

  // ---- Spring ----
  {
    id: 'mcq-spring-1', topicId: 'spring',
    question: '¿Qué diferencia hay entre @Controller y @RestController?',
    options: [
      '@RestController solo permite GET; @Controller permite todos los verbos.',
      '@RestController equivale a @Controller + @ResponseBody en todos los métodos.',
      '@Controller no se puede usar en Spring Boot moderno.',
      '@RestController activa CORS por defecto, @Controller no.',
    ],
    correctIndex: 1,
    explanation: '`@RestController = @Controller + @ResponseBody`. Sus retornos se **serializan al body** (JSON) en vez de resolverse como nombre de vista por el ViewResolver.',
  },
  {
    id: 'mcq-spring-2', topicId: 'spring',
    question: '@Transactional por defecto hace rollback ante…',
    options: [
      'Cualquier excepción (checked y unchecked).',
      'Solo excepciones checked (las que heredan de Exception).',
      'Solo excepciones unchecked (RuntimeException y Error).',
      'Solo si configuras explícitamente rollbackFor.',
    ],
    correctIndex: 2,
    explanation: 'Solo unchecked. Para que una checked dispare rollback usas `rollbackFor`. Y si capturas la excepción dentro del método sin relanzarla, NO hay rollback (la transacción no se entera).',
  },
  {
    id: 'mcq-spring-3', topicId: 'spring',
    question: 'Un método A llama a un método B del mismo bean. Ambos son @Transactional. ¿Qué pasa?',
    options: [
      'Se crean dos transacciones independientes.',
      'B se ejecuta sin transacción porque la anotación interna se ignora por self-invocation.',
      'Spring lanza un error al arrancar.',
      'B se une a la transacción de A correctamente gracias al proxy.',
    ],
    correctIndex: 1,
    explanation: '**Self-invocation**: `this.B()` no pasa por el proxy AOP, así que la anotación de B **se ignora**. La transacción de A sigue activa, pero B no añade nada por sí mismo. Para que aplique, B debe estar en otro bean.',
  },

  // ---- Arquitectura ----
  {
    id: 'mcq-arch-1', topicId: 'arch',
    question: 'En arquitectura hexagonal, un REST controller es…',
    options: [
      'Parte del dominio porque define el contrato de la aplicación.',
      'Un adaptador de entrada (driving) en la capa de infraestructura.',
      'Un adaptador de salida (driven) porque consume el caso de uso.',
      'Independiente de las capas; va donde el equipo prefiera.',
    ],
    correctIndex: 1,
    explanation: 'Es un **adapter driving / de entrada** que vive en infraestructura (o en una capa application como "borde" según convención). Invoca un **puerto de entrada** (caso de uso). Sin lógica de negocio dentro.',
  },
  {
    id: 'mcq-arch-2', topicId: 'arch',
    question: 'Tienes dos entidades en bounded contexts separados y necesitas una proyección con datos de ambos. ¿Dónde la haces?',
    options: [
      'En el dominio del BC más grande, importando el modelo del otro.',
      'En un read model dedicado que consume eventos de ambos (CQRS).',
      'En la BD, con una vista materializada que une las dos tablas.',
      'Devolviendo los dos modelos al cliente y que él los combine.',
    ],
    correctIndex: 1,
    explanation: 'Un **read model dedicado** (CQRS): un servicio aparte que consume eventos de los dos BCs y mantiene su propia proyección. Nunca contaminas el dominio de los originales.',
  },
  {
    id: 'mcq-arch-3', topicId: 'arch',
    question: '¿Cuál NO es un patrón típico de microservicios?',
    options: [
      'Saga + compensación para transacciones distribuidas.',
      'Outbox para publicar eventos atómicamente con la BD.',
      'Two-phase commit (2PC/XA) como solución por defecto.',
      'Circuit breaker para cortar llamadas a servicios caídos.',
    ],
    correctIndex: 2,
    explanation: '2PC/XA existe, pero **escala mal y acopla** servicios; en microservicios modernos se evita. La respuesta esperada es **saga** + outbox + idempotencia, no 2PC.',
  },
  {
    id: 'mcq-arch-4', topicId: 'arch',
    question: 'En DDD, un value object…',
    options: [
      'Tiene identidad propia (un id estable) y persiste en el tiempo.',
      'Se define por sus atributos, es inmutable y reemplazable.',
      'Puede mutar su estado para reflejar cambios.',
      'Es lo mismo que una entidad, solo cambia el nombre.',
    ],
    correctIndex: 1,
    explanation: 'Value object = **definido por atributos** (no por identidad), **inmutable**. Dos VOs con los mismos valores son iguales. Ejemplos: `Dinero`, `Email`, `Direccion`. Si necesitas cambiarlo, creas otro.',
  },

  // ---- REST ----
  {
    id: 'mcq-rest-1', topicId: 'rest',
    question: '¿Cuál es la diferencia clave entre PUT y PATCH?',
    options: [
      'PUT requiere autenticación; PATCH no.',
      'PUT es para crear; PATCH para borrar.',
      'PUT reemplaza el recurso completo (idempotente); PATCH actualiza parcialmente.',
      'PUT es para JSON; PATCH para XML.',
    ],
    correctIndex: 2,
    explanation: 'PUT = reemplazo total, idempotente (si omites un campo, lo borras). PATCH = modificación parcial, no necesariamente idempotente. Formatos: JSON Merge Patch (RFC 7396) o JSON Patch (RFC 6902).',
  },
  {
    id: 'mcq-rest-2', topicId: 'rest',
    question: 'En contract-first con OpenAPI, ¿qué relación tiene el REST controller con la spec?',
    options: [
      'El controller genera el YAML cada vez que arranca.',
      'El YAML es solo documentación; el controller es independiente.',
      'openapi-generator genera una interfaz Java desde el YAML, y el controller la implementa.',
      'El controller se genera completo desde el YAML; tú no escribes código.',
    ],
    correctIndex: 2,
    explanation: '**Contract-first**: el YAML manda; un plugin (openapi-generator) genera la **interfaz + DTOs**, y el controller **implements** esa interfaz. Un breaking change → no compila. Es lo que se hace en Agata Next.',
  },

  // ---- Seguridad ----
  {
    id: 'mcq-sec-1', topicId: 'sec',
    question: '¿Cuál de estas afirmaciones sobre JWT es FALSA?',
    options: [
      'Cualquiera puede decodificar header y payload (son Base64Url sin cifrar).',
      'La firma garantiza que el contenido no ha sido alterado.',
      'Es buena idea poner datos sensibles en el payload porque está cifrado.',
      'Suelen tener vida corta (minutos), combinados con un refresh token de vida larga.',
    ],
    correctIndex: 2,
    explanation: '**Falsa**. El payload de un JWT firmado **no está cifrado**, solo codificado. Nunca pongas datos sensibles. Para cifrar usas JWE (encryption), no JWT firmado.',
  },
  {
    id: 'mcq-sec-2', topicId: 'sec',
    question: '¿Qué diferencia hay entre un 401 y un 403?',
    options: [
      '401 = el recurso no existe; 403 = error del servidor.',
      '401 = no autenticado; 403 = autenticado pero sin permiso.',
      '401 = sin permiso; 403 = sesión caducada.',
      '401 y 403 son sinónimos.',
    ],
    correctIndex: 1,
    explanation: 'Regla rápida: **401 = identifícate** (no autenticado / token inválido). **403 = identificado pero te falta autorización** (no tienes permiso para esto).',
  },

  // ---- CORS ----
  {
    id: 'mcq-cors-1', topicId: 'cors',
    question: '¿Quién bloquea una respuesta cuando ves un error de CORS?',
    options: [
      'El servidor, porque no permite el origen.',
      'El proxy de red intermedio.',
      'El navegador del usuario, aplicando la same-origin policy.',
      'El framework del servidor (Spring/Express) automáticamente.',
    ],
    correctIndex: 2,
    explanation: 'CORS es un mecanismo del **navegador**. La petición sí sale y el servidor la procesa (en requests simples); lo que bloquea el navegador es el acceso del JS a la respuesta. No es seguridad del servidor, es protección del browser del usuario.',
  },
  {
    id: 'mcq-cors-2', topicId: 'cors',
    question: 'Un cliente recibe un 500. ¿De quién es la culpa?',
    options: [
      'Del cliente, por mandar mal la petición.',
      'Del servidor: algo se rompió internamente.',
      'Del navegador, que no entiende la respuesta.',
      'De la red intermedia.',
    ],
    correctIndex: 1,
    explanation: '**5xx siempre es del servidor**, **4xx del cliente**. Un 500 es un error genérico del backend (excepción no controlada, fallo de dependencia, NPE…). El cliente no puede arreglarlo.',
  },

  // ---- Async ----
  {
    id: 'mcq-async-1', topicId: 'async',
    question: 'Tienes un endpoint que tarda 10s y el cliente solo necesita saber que se hará. ¿Mejor opción?',
    options: [
      'Aumentar el timeout HTTP y dejarlo síncrono.',
      'Devolver 202 Accepted con un id de seguimiento y procesar la tarea de forma asíncrona (cola/worker).',
      'Hacer @Async sin más; siempre es suficiente en producción.',
      'Pollear desde el cliente con un GET cada segundo hasta que termine.',
    ],
    correctIndex: 1,
    explanation: 'El patrón canónico: encolar (Kafka/SQS/Rabbit) y devolver **202 Accepted** con id; un consumer aparte lo procesa. Es lo más fiable (persistencia, reintentos, escalado horizontal). `@Async` in-process pierde la tarea si el pod muere.',
  },
  {
    id: 'mcq-async-2', topicId: 'async',
    question: '¿Cuál NO es una característica de la programación reactiva?',
    options: [
      'Backpressure: el consumidor controla el ritmo del productor.',
      'Streams con composición (map/flatMap/zip).',
      'Pocos threads sobre un event loop, no bloqueantes.',
      'Bloquea el thread mientras espera I/O, igual que el modelo imperativo.',
    ],
    correctIndex: 3,
    explanation: 'Falso. Lo reactivo es **no bloqueante**: el thread libera mientras espera I/O. Si bloqueas (`.block()`, JDBC síncrono) en un flujo reactivo, paralizas el event loop y pierdes toda la ventaja.',
  },
  {
    id: 'mcq-async-3', topicId: 'async',
    question: 'Un repo devuelve un Mono<Camion> y quieres modificarle el volumen para devolverlo. ¿Cómo?',
    options: [
      'camion.block().setVolumen(v) y devolver el objeto.',
      'camion.map(c -> c.withVolumen(v)) devolviendo otro Mono.',
      'Suscribirse al Mono y leer el valor en el callback.',
      'No se puede, hay que convertirlo a Future.',
    ],
    correctIndex: 1,
    explanation: 'Usa **`.map(...)`** para transformar el valor del Mono sin bloquear. Si la transformación devolviera otro Mono (p.ej. guardar), usarías **`.flatMap`**. NUNCA bloquees con `.block()` dentro de un flujo reactivo.',
  },

  // ---- Mensajería ----
  {
    id: 'mcq-msg-1', topicId: 'msg',
    question: 'Tienes una cola (point-to-point) y levantas 10 instancias de tu app. ¿Cuántas leen un mensaje concreto?',
    options: [
      'Las 10 (broadcast).',
      'Una sola (la cola entrega a uno).',
      'Una por cada partición de la cola.',
      'Depende de la velocidad de cada instancia.',
    ],
    correctIndex: 1,
    explanation: 'En una cola point-to-point, cada mensaje lo entrega el broker a **una única instancia**. Esto da escalado horizontal. Si esa instancia falla, el mensaje vuelve y otra lo coge.',
  },
  {
    id: 'mcq-msg-2', topicId: 'msg',
    question: '¿Cómo garantizas que dos mensajes Kafka se leen en orden?',
    options: [
      'Configurando max.poll.records = 1 en el consumer.',
      'Enviándolos a la misma partición (misma clave).',
      'Aumentando el replication factor a 3.',
      'Activando exactly-once en el productor.',
    ],
    correctIndex: 1,
    explanation: 'Kafka solo garantiza orden **dentro de una partición**. Para que dos mensajes lleguen ordenados a un consumer, deben ir a la misma partición → misma **clave de particionado** (`hash(key) % particiones`). Sin clave, round-robin y se pierde orden.',
  },
  {
    id: 'mcq-msg-3', topicId: 'msg',
    question: '¿Cuándo usarías Apache Flink en vez de Kafka Streams?',
    options: [
      'Cuando solo necesitas leer un topic y escribir en otro.',
      'Cuando quieres una librería embebida en tu app, sin cluster aparte.',
      'Cuando necesitas CEP, ventanas avanzadas con event-time, joins de streams complejos y estado muy grande.',
      'Cuando no tienes Kafka, porque Flink lo reemplaza.',
    ],
    correctIndex: 2,
    explanation: 'Flink es un cluster dedicado más potente: CEP, ventanas avanzadas, event-time + watermarks, joins de streams, state RocksDB enorme, conectores a más sistemas. Kafka Streams es una librería embebida, más simple, válida para casos sencillos.',
  },

  // ---- BD ----
  {
    id: 'mcq-db-1', topicId: 'db',
    question: 'Modelar una relación N:M (empleado-empresa). ¿Cuántas tablas y cómo?',
    options: [
      'Dos tablas con un campo JSON con la lista en cada una.',
      'Tres tablas: las dos entidades + una tabla de unión con dos FKs y PK compuesta.',
      'Una tabla con todos los campos repetidos.',
      'Dos tablas con FKs cruzadas.',
    ],
    correctIndex: 1,
    explanation: '**Tres tablas**: las dos entidades + una tabla de unión (`empleados_empresas`) con dos FKs y **PK compuesta** (evita duplicados). Si la relación tiene atributos propios (fecha, rol), van en la intermedia.',
  },
  {
    id: 'mcq-db-2', topicId: 'db',
    question: '¿Cuál NO es una propiedad ACID?',
    options: [
      'Atomicidad: todo o nada.',
      'Aislamiento: las transacciones concurrentes no se pisan.',
      'Asincronicidad: las operaciones nunca bloquean.',
      'Durabilidad: lo commiteado persiste tras un fallo.',
    ],
    correctIndex: 2,
    explanation: 'ACID = **A**tomicidad, **C**onsistencia, **I**solación, **D**urabilidad. Nada de asincronicidad. (Hay que pensar — algunas opciones suenan plausibles.)',
  },
  {
    id: 'mcq-db-3', topicId: 'db',
    question: '¿Qué describe la 3ª forma normal (3FN)?',
    options: [
      'No hay valores nulos en ninguna columna.',
      'Toda tabla tiene clave primaria autoincremental.',
      'Está en 2FN y no hay dependencias transitivas (todo atributo no clave depende DIRECTAMENTE de la PK).',
      'Hay menos de 5 columnas por tabla.',
    ],
    correctIndex: 2,
    explanation: '3FN: en 2FN + sin transitivas. Ej. de violación: `empleado(id, nombre, dept_id, dept_nombre)` — `dept_nombre` depende de `dept_id`, no del id del empleado. Solución: sacar departamento a su tabla.',
  },

  // ---- SQL ----
  {
    id: 'mcq-sql-1', topicId: 'sql',
    question: 'Tabla A tiene 5 filas, tabla B tiene 10. ¿Cuántas filas devuelve A LEFT JOIN B (cardinalidad 1:1)?',
    options: [
      'Exactamente 5.',
      'Exactamente 10.',
      'Al menos 5 (puede ser más si una fila de A casa con varias de B).',
      'Exactamente 15.',
    ],
    correctIndex: 2,
    explanation: 'La respuesta correcta evita el número fácil: **al menos 5**. Si la cardinalidad es 1:1, son 5. Si una fila de A casa con varias de B, son más. Los entrevistadores buscan que des el matiz.',
  },
  {
    id: 'mcq-sql-2', topicId: 'sql',
    question: 'Tienes `SELECT nombre, edad FROM empleados ORDER BY 1`. ¿Por qué columna ordenas?',
    options: [
      'Por la primera columna alfabéticamente del esquema (suele ser id).',
      'Por la primera columna del SELECT (en este caso, nombre).',
      'Es sintaxis inválida; falla.',
      'Por la PK de la tabla.',
    ],
    correctIndex: 1,
    explanation: '`ORDER BY 1` ordena por **la primera columna del SELECT** (posicional, 1-indexed). En este caso `nombre`. Es válido pero frágil — si reordenas el SELECT, cambia el orden.',
  },
  {
    id: 'mcq-sql-3', topicId: 'sql',
    question: '¿Cuándo puedes tener un HAVING sin GROUP BY?',
    options: [
      'Nunca; siempre se necesita un GROUP BY antes.',
      'Cuando hay una función de agregado sobre todo el conjunto (un grupo único implícito).',
      'Cuando filtras por una columna específica.',
      'Solo en PostgreSQL.',
    ],
    correctIndex: 1,
    explanation: 'Es válido cuando agregas sobre toda la tabla, p.ej. `SELECT COUNT(*) FROM ventas HAVING COUNT(*) > 100`. El motor lo trata como un único grupo y devuelve 0 o 1 fila.',
  },

  // ---- Performance ----
  {
    id: 'mcq-perf-1', topicId: 'perf',
    question: 'Ventajas de PreparedStatement frente a Statement plano.',
    options: [
      'Solo es más legible; rendimiento igual.',
      'Previene SQL injection, reutiliza el plan de ejecución y tipa los parámetros.',
      'Soporta más tipos SQL que Statement.',
      'Compila el SQL en bytecode.',
    ],
    correctIndex: 1,
    explanation: 'Tres ventajas: **anti-SQL-injection** (parámetros separados del SQL), **plan cache** (parsea y planifica una vez), **tipado** (setInt/setString/setTimestamp). El Statement plano concatena strings → vulnerable y sin reuso de plan.',
  },
  {
    id: 'mcq-perf-2', topicId: 'perf',
    question: '¿Qué buscas al sacar un plan de ejecución (EXPLAIN ANALYZE)?',
    options: [
      'Solo la duración total en ms.',
      'Que la query use el índice "más nuevo" creado.',
      'Full scans inesperados, índices que esperabas y no usa, estimación vs filas reales muy distinta, joins ineficientes.',
      'Confirmar que el SQL es sintácticamente correcto.',
    ],
    correctIndex: 2,
    explanation: 'Buscas señales de mal plan: seq scans en tablas grandes, índices no usados (stats obsoletas, función sobre columna), estimación vs real muy distinta, nested loops sobre muchos elementos, sorts caros.',
  },

  // ---- Testing ----
  {
    id: 'mcq-test-1', topicId: 'test',
    question: 'Diferencia entre Mock y Spy.',
    options: [
      'Son sinónimos en Mockito.',
      'Mock = objeto falso (tú defines comportamiento); Spy = instancia real que ejecuta código real salvo lo que stubbees.',
      'Mock = solo se usa con Spring; Spy = sin Spring.',
      'Spy es más rápido que Mock siempre.',
    ],
    correctIndex: 1,
    explanation: 'Mock = objeto falso sin código real, tú dictas qué devuelve. Spy = instancia real envuelta; ejecuta el código real, salvo lo que stubbees explícitamente. Usa Mock por defecto; Spy cuando necesitas el comportamiento real menos una pieza.',
  },
  {
    id: 'mcq-test-2', topicId: 'test',
    question: '¿Qué propone la pirámide de testing?',
    options: [
      'Muchos tests E2E arriba, pocos unitarios abajo.',
      'Muchos tests unitarios abajo, algunos de integración en medio, pocos E2E arriba.',
      'Tres tipos de tests con la misma proporción.',
      'Solo tests unitarios; los demás son innecesarios.',
    ],
    correctIndex: 1,
    explanation: 'La pirámide: **base ancha** de unit tests (rápidos, baratos), **medio** de integración (algunos, infra real), **cima estrecha** de E2E (pocos, lentos, frágiles). El antipatrón es el "cono de helado" (muchos E2E, pocos unit).',
  },

  // ---- Redis ----
  {
    id: 'mcq-redis-1', topicId: 'redis',
    question: '¿Cuál es una razón clave para usar Redis en vez de una caché in-memory local?',
    options: [
      'Redis es siempre más rápido que la memoria local.',
      'Está compartido entre instancias (con 10 pods, todos ven la misma caché).',
      'Redis garantiza ACID como una BD relacional.',
      'No necesita servidor aparte (es embebido).',
    ],
    correctIndex: 1,
    explanation: 'La caché local es **por-instancia**: con 10 pods, 10 cachés incoherentes. Redis es compartido, sobrevive al reinicio y ofrece estructuras ricas, TTL, pub/sub, locks. Coste: un hop de red.',
  },

  // ---- Contracts ----
  {
    id: 'mcq-contracts-1', topicId: 'contracts',
    question: 'AsyncAPI se diferencia de OpenAPI en que…',
    options: [
      'AsyncAPI es para APIs REST modernas; OpenAPI es para SOAP.',
      'AsyncAPI describe arquitecturas dirigidas por eventos (Kafka, Rabbit, MQTT); OpenAPI describe REST request-response.',
      'AsyncAPI es propietario de AWS; OpenAPI es abierto.',
      'No hay diferencia; son sinónimos.',
    ],
    correctIndex: 1,
    explanation: 'OpenAPI describe llamadas request-response (REST). **AsyncAPI** es su equivalente para mensajería: **channels** (topics/colas), publish/subscribe, payloads y bindings del broker.',
  },

  // ---- Patterns ----
  {
    id: 'mcq-patterns-1', topicId: 'patterns',
    question: '¿En qué se parecen Decorator y Proxy y en qué se diferencian?',
    options: [
      'Ambos crean instancias nuevas; la diferencia es solo el nombre.',
      'Ambos envuelven un objeto e implementan su interfaz; Decorator añade funcionalidad, Proxy controla el acceso.',
      'Decorator es de Spring, Proxy es de Java.',
      'Decorator se ejecuta antes del método; Proxy después.',
    ],
    correctIndex: 1,
    explanation: 'Ambos **wrap** y exponen la misma interfaz. **Decorator** añade comportamiento (cadena dinámica). **Proxy** controla acceso (lazy, seguridad, transacciones, caché). Spring AOP (`@Transactional`, `@Cacheable`) usa proxies dinámicos.',
  },
  {
    id: 'mcq-patterns-2', topicId: 'patterns',
    question: '¿Cuál es un antipatrón clásico en DDD?',
    options: [
      'Aggregate root que protege invariantes.',
      'Value objects inmutables.',
      'Anemic domain model: entidades con solo getters/setters y toda la lógica en servicios.',
      'Domain events para reaccionar a cambios.',
    ],
    correctIndex: 2,
    explanation: 'El **anemic domain model** es el antipatrón: entidades vacías de comportamiento, toda la lógica en "services". No es OO ni DDD. Fix: pon la lógica DENTRO del agregado.',
  },

  // ---- Observabilidad ----
  {
    id: 'mcq-obs-1', topicId: 'obs',
    question: '¿Cuáles son los 3 pilares clásicos de la observabilidad?',
    options: [
      'CPU, memoria y red.',
      'Métricas, logs y traces.',
      'Alertas, dashboards e incidentes.',
      'Frontend, backend y BD.',
    ],
    correctIndex: 1,
    explanation: '**Métricas** (agregadas, baratas, dashboards/alertas), **logs** (eventos discretos, detalle, idealmente JSON estructurado), **traces** (recorrido de una petición por varios servicios). OpenTelemetry es el estándar para producir los tres.',
  },
  {
    id: 'mcq-obs-2', topicId: 'obs',
    question: 'Diferencia entre liveness y readiness probes en Kubernetes.',
    options: [
      'Son sinónimos.',
      'Liveness verifica el proceso (si falla, K8s reinicia el pod). Readiness verifica si está listo para tráfico (si falla, lo saca del Service sin reiniciar).',
      'Liveness es para HTTP, readiness para TCP.',
      'Readiness solo se usa al arrancar; liveness durante la vida.',
    ],
    correctIndex: 1,
    explanation: 'Confundirlas es la causa típica de reinicios en bucle. Liveness comprueba que el proceso vive (deadlock, hang); si falla, REINICIA. Readiness comprueba si puede atender (BD/broker disponibles); si falla, lo saca del Service hasta que vuelva.',
  },

  // ---- Algoritmos ----
  {
    id: 'mcq-algo-1', topicId: 'algo',
    question: 'La complejidad de un HashMap.get() en Java 8+ es…',
    options: [
      'O(n) siempre.',
      'O(log n) garantizado.',
      'O(1) promedio, O(log n) en el peor caso por bucket convertido a árbol.',
      'O(1) garantizado.',
    ],
    correctIndex: 2,
    explanation: 'O(1) promedio. Si un bucket tiene más de 8 entradas (muchas colisiones), Java lo convierte en árbol rojinegro → peor caso O(log n) en vez del O(n) clásico.',
  },
  {
    id: 'mcq-algo-2', topicId: 'algo',
    question: '¿Qué algoritmo usa Collections.sort() en Java?',
    options: [
      'Bubble sort.',
      'Quick sort puro.',
      'TimSort (híbrido merge + insertion, estable).',
      'Heap sort.',
    ],
    correctIndex: 2,
    explanation: '**TimSort**: O(n log n), estable, aprovecha runs ya ordenados. `Arrays.sort` para primitivos usa dual-pivot quicksort (no estable, pero más rápido en primitivos).',
  },
];

// ===== Segunda tanda: cobertura ampliada de TODOS los topics =====

MCQ.push(
  // ---- IA ----
  {
    id: 'mcq-ia-1', topicId: 'ia',
    question: '¿Qué es un LLM (Large Language Model)?',
    options: [
      'Un modelo basado en árboles de decisión entrenado con texto.',
      'Una base de datos vectorial de embeddings.',
      'Un modelo Transformer entrenado para predecir el siguiente token dada una secuencia.',
      'Un sistema de reglas heurísticas sobre lenguaje natural.',
    ],
    correctIndex: 2,
    explanation: 'Un LLM es un modelo basado en arquitectura **Transformer** entrenado sobre grandes corpus para predecir el **siguiente token**. Tiene parámetros (millones-billones), context window, tokenización y se afina con RLHF para alineamiento.',
  },
  {
    id: 'mcq-ia-2', topicId: 'ia',
    question: '¿Qué precaución NO es prioritaria al usar IA con código de una empresa privada?',
    options: [
      'No pegar código propietario en chats públicos sin acuerdo de no-training.',
      'No incluir secretos (API keys, datos personales) en prompts.',
      'Revisar siempre el output por posibles APIs/dependencias inventadas.',
      'Asegurarse de que el modelo sea el más grande disponible.',
    ],
    correctIndex: 3,
    explanation: 'El tamaño del modelo no es una precaución de seguridad. Las prioridades son: no filtrar código/secretos, revisar alucinaciones, respetar políticas de la empresa, verificar licencias.',
  },
  {
    id: 'mcq-ia-3', topicId: 'ia',
    question: 'Sobre el uso de IA en el día a día como desarrollador, ¿qué afirmación es más sensata?',
    options: [
      'Delegar decisiones de arquitectura a la IA para acelerar entregas.',
      'Aceptar el código generado sin revisión si pasa los tests.',
      'Usarla como apoyo (pair, refactor, exploración, docs) pero nunca delegar arquitectura, revisión final ni seguridad.',
      'Subir el repositorio completo a un chat público para mejor contexto.',
    ],
    correctIndex: 2,
    explanation: 'Patrón sano: pair programming, refactor con tests, exploración, docs, debugging — pero la **decisión** queda en la persona. No delegues arquitectura, revisión final, seguridad.',
  },

  // ---- Java (más) ----
  {
    id: 'mcq-java-4', topicId: 'java',
    question: '¿Se puede instanciar directamente una clase abstracta en Java?',
    options: [
      'Sí, igual que cualquier clase con un constructor público.',
      'No directamente — solo puedes instanciar una subclase concreta o una clase anónima que sobrescriba sus métodos abstractos.',
      'Solo si tiene al menos un método default.',
      'Sí, pero el resultado no sirve para nada.',
    ],
    correctIndex: 1,
    explanation: '`new ClaseAbstracta(){...}` (clase anónima) ya es crear una subclase implícita. Una abstracta a secas no se instancia.',
  },
  {
    id: 'mcq-java-5', topicId: 'java',
    question: 'Sobre interfaces y clases en Java, ¿qué afirmación es correcta?',
    options: [
      'Una clase EXTIENDE una interfaz; una interfaz IMPLEMENTA otra.',
      'Una clase IMPLEMENTA una interfaz; una interfaz EXTIENDE (puede ser múltiple) otra interfaz.',
      'Solo las interfaces pueden tener constructores.',
      'Las interfaces no pueden tener métodos default desde Java 17.',
    ],
    correctIndex: 1,
    explanation: 'Una clase `implements` una interfaz; una interfaz `extends` otra (incluso varias). En Java moderno una interfaz puede tener `default`, `static` y `private` methods.',
  },
  {
    id: 'mcq-java-6', topicId: 'java',
    question: 'Tras un map/flatMap, ¿qué hace `collect` y qué clase de colección devuelve?',
    options: [
      'Operación intermedia que devuelve siempre una List inmutable.',
      'Operación terminal que recopila el stream en una colección; los Collectors por defecto devuelven colecciones MUTABLES (toList(), toSet(), etc.).',
      'No hace nada visible si el stream está vacío.',
      'Solo funciona si el stream es paralelo.',
    ],
    correctIndex: 1,
    explanation: '`collect` es **terminal**; sin ella el stream no se ejecuta (lazy). Los Collectors estándar (`toList`, `toSet`, `toMap`, `groupingBy`) devuelven colecciones **mutables**. Para inmutables usa `toUnmodifiableList`/`Set`/`Map` (J10+).',
  },

  // ---- Spring (más) ----
  {
    id: 'mcq-spring-4', topicId: 'spring',
    question: '¿Para qué sirve un ViewResolver en Spring MVC?',
    options: [
      'Traduce el nombre lógico de vista (string que devuelve un @Controller) a una View concreta que renderiza (JSP, Thymeleaf…).',
      'Resuelve las dependencias del contexto de Spring al arrancar.',
      'Es el reemplazo moderno de @RestController.',
      'Decide qué controller atiende una petición HTTP.',
    ],
    correctIndex: 0,
    explanation: 'El `ViewResolver` traduce un nombre lógico (`"home"`) a un objeto `View` (`/WEB-INF/views/home.jsp`). En APIs REST con `@RestController` no se usa: el cuerpo se serializa directamente (JSON).',
  },
  {
    id: 'mcq-spring-5', topicId: 'spring',
    question: '¿Cómo ejecutarías una query SQL nativa con Spring Data JPA?',
    options: [
      'Con un método cuyo nombre contenga la query.',
      'Con `@Query(value = "SELECT ...", nativeQuery = true)` en el repositorio.',
      'No se puede; Spring Data solo permite JPQL.',
      'Usando @RestController con la query como parámetro.',
    ],
    correctIndex: 1,
    explanation: '`@Query` con `nativeQuery = true` te permite escribir SQL nativo. Útil cuando JPQL no expresa lo que necesitas (CTE, hints, dialecto específico).',
  },
  {
    id: 'mcq-spring-6', topicId: 'spring',
    question: 'Necesitas que un bloque se ejecute en una transacción independiente del resto y que su rollback no afecte a la transacción externa. ¿Qué propagación usas?',
    options: [
      'REQUIRED',
      'SUPPORTS',
      'REQUIRES_NEW',
      'NEVER',
    ],
    correctIndex: 2,
    explanation: '`REQUIRES_NEW` suspende la transacción actual y abre **una nueva independiente**. Su rollback no afecta a la externa (típico para logging/auditoría que debe persistir aunque el principal falle).',
  },
  {
    id: 'mcq-spring-7', topicId: 'spring',
    question: 'En Spring, `@Transactional` y `@Cacheable` se implementan internamente con…',
    options: [
      'Reflexión en cada llamada.',
      'Modificación del bytecode en tiempo de compilación.',
      'Proxies dinámicos (JDK o CGLib) en torno al bean — AOP.',
      'Llamadas directas al kernel del SO.',
    ],
    correctIndex: 2,
    explanation: 'Son **AOP**: Spring envuelve el bean en un **proxy dinámico** que intercepta las llamadas. De ahí el caveat de **self-invocation**: una llamada interna del mismo bean no pasa por el proxy y la anotación se ignora.',
  },

  // ---- Arquitectura (más) ----
  {
    id: 'mcq-arch-5', topicId: 'arch',
    question: '¿Para qué sirve la capa de infraestructura en arquitectura hexagonal?',
    options: [
      'Contiene la lógica de negocio principal.',
      'Define los puertos que el dominio expone.',
      'Aloja las implementaciones concretas acopladas a una tecnología (JPA, Kafka, clientes HTTP, controllers según convención).',
      'Es donde viven los DTOs del dominio.',
    ],
    correctIndex: 2,
    explanation: 'La infraestructura es el "**cómo**" técnico: implementa los puertos de salida del dominio (y expone los de entrada). Aísla lo volátil/tecnológico para que el dominio permanezca puro y testeable.',
  },
  {
    id: 'mcq-arch-6', topicId: 'arch',
    question: 'En hexagonal, ¿dónde va la interfaz de un repositorio y dónde su implementación?',
    options: [
      'Interfaz e implementación en infraestructura.',
      'Interfaz en domain/application (puerto de salida); implementación en infraestructura.',
      'Interfaz en infraestructura; implementación en domain.',
      'Ambas en application; nada en infraestructura.',
    ],
    correctIndex: 1,
    explanation: 'El **dominio** declara qué necesita (interfaz = puerto de salida). La **infraestructura** lo implementa (JPA, Mongo, in-memory…). Inversión de dependencias: el dominio no depende de la tecnología.',
  },
  {
    id: 'mcq-arch-7', topicId: 'arch',
    question: '¿Qué describe CQRS (Command Query Responsibility Segregation)?',
    options: [
      'Un patrón para cifrar las queries de la base de datos.',
      'Separar el modelo de escritura (commands, mutan estado e invariantes) del de lectura (queries, optimizado para consultar), posiblemente con almacenes distintos.',
      'Una alternativa a REST basada en gRPC.',
      'Una técnica para acelerar Hibernate.',
    ],
    correctIndex: 1,
    explanation: 'CQRS separa **escritura** de **lectura**. Útil con cargas asimétricas o read models complejos cross-BC; sincroniza ambos lados con eventos. Añade complejidad (eventual consistency).',
  },
  {
    id: 'mcq-arch-8', topicId: 'arch',
    question: 'Una Anti-Corruption Layer (ACL) sirve para…',
    options: [
      'Detectar inyecciones SQL en las peticiones entrantes.',
      'Traducir entre el modelo de otro bounded context o sistema externo y el tuyo, sin contaminar tu dominio.',
      'Bloquear el acceso a la BD desde código mal escrito.',
      'Auditar accesos por seguridad.',
    ],
    correctIndex: 1,
    explanation: 'La ACL aísla el modelo externo: traduce sus DTOs/conceptos a los tuyos en la frontera. Si el sistema externo cambia, el impacto queda contenido en la ACL.',
  },

  // ---- REST (más) ----
  {
    id: 'mcq-rest-3', topicId: 'rest',
    question: '¿Dónde se define el Content-Type de una petición/respuesta REST?',
    options: [
      'En la URL como query param.',
      'En el header HTTP `Content-Type` (y se controla en Spring con `produces`/`consumes`).',
      'En el método HTTP (GET/POST).',
      'En el código de estado (200/201/…).',
    ],
    correctIndex: 1,
    explanation: 'En el header `Content-Type`. En Spring: `produces` (qué devuelve) y `consumes` (qué acepta). El cliente también negocia con `Accept`.',
  },
  {
    id: 'mcq-rest-4', topicId: 'rest',
    question: '¿Para qué se usa `multipart/form-data`?',
    options: [
      'Para enviar JSON con metadatos adicionales.',
      'Para mensajes con múltiples destinatarios.',
      'Para enviar formularios con ficheros o campos mixtos; cada parte tiene su Content-Type.',
      'Para respuestas comprimidas con gzip.',
    ],
    correctIndex: 2,
    explanation: 'El formato típico de upload de archivos: cada parte (campo o fichero) lleva su propio Content-Type. Diferente de `application/json` (payload JSON) y `text/plain` (texto sin formato).',
  },
  {
    id: 'mcq-rest-5', topicId: 'rest',
    question: 'Tras crear con éxito un recurso vía POST, ¿qué código devuelve idealmente la API?',
    options: [
      '200 OK con el recurso en el body.',
      '201 Created + header `Location` con la URL del nuevo recurso.',
      '204 No Content para evitar transferir datos.',
      '202 Accepted siempre.',
    ],
    correctIndex: 1,
    explanation: '**201 Created** + header `Location` apuntando al nuevo recurso. 200 también se ve, pero 201 es más expresivo. 202 es para procesado asíncrono. 204 es para operaciones sin body (p.ej. DELETE).',
  },

  // ---- Seguridad (más) ----
  {
    id: 'mcq-sec-3', topicId: 'sec',
    question: '¿Cuál de estos NO es un claim "registered" del estándar JWT (RFC 7519)?',
    options: [
      'iss (issuer)',
      'sub (subject)',
      'exp (expiration)',
      'role (rol del usuario)',
    ],
    correctIndex: 3,
    explanation: 'Los **registered** son `iss`, `sub`, `aud`, `exp`, `iat`, `nbf`, `jti`. `role` es un claim **private** (acordado entre emisor y consumidor).',
  },
  {
    id: 'mcq-sec-4', topicId: 'sec',
    question: '¿Por qué se usan access token + refresh token en lugar de un único token de vida larga?',
    options: [
      'Para reducir el tamaño total enviado en cada petición.',
      'Porque uno es para web y el otro para móvil.',
      'El access token es corto (minutos) — si lo roban, ventana pequeña. El refresh es largo, guardado más seguro, y permite revocación.',
      'Es solo una convención sin beneficio real.',
    ],
    correctIndex: 2,
    explanation: 'Resuelve el dilema "token largo = inseguro / token corto = relogin constante". El access expira pronto; con el refresh (httpOnly cookie) renuevas sin pedir credenciales. Además da una vía de revocación.',
  },

  // ---- CORS (más) ----
  {
    id: 'mcq-cors-3', topicId: 'cors',
    question: 'Una petición PUT con `Content-Type: application/json` desde otro origen dispara…',
    options: [
      'Nada especial: el navegador envía la petición directamente.',
      'Un preflight OPTIONS previo para comprobar que el servidor permite el método/header/origen; solo si la respuesta es positiva se envía el PUT.',
      'Un downgrade automático a GET.',
      'Un error inmediato sin posibilidad de configuración.',
    ],
    correctIndex: 1,
    explanation: 'Las peticiones "no-simples" (PUT/DELETE/PATCH, headers custom, ciertos Content-Type) disparan un **preflight OPTIONS**. Si la respuesta tiene los `Access-Control-Allow-*` correctos, el navegador envía la real.',
  },
  {
    id: 'mcq-cors-4', topicId: 'cors',
    question: 'Un error de CORS vs un 403 Forbidden:',
    options: [
      'Son la misma cosa con nombre distinto.',
      'CORS es bloqueo del navegador por origen no permitido; 403 es decisión del backend (autenticado pero sin permiso para la operación).',
      'CORS siempre devuelve 403.',
      'Ambos los devuelve el servidor con el mismo status.',
    ],
    correctIndex: 1,
    explanation: 'CORS es una verificación del navegador (no es seguridad del servidor). 403 es una decisión del servidor sobre identidad/permisos. Son problemas en planos distintos.',
  },

  // ---- Async (más) ----
  {
    id: 'mcq-async-4', topicId: 'async',
    question: '¿Cuál de estos hace que un objeto sea thread-safe "por construcción", sin sincronización adicional?',
    options: [
      'Que sea un `record` o cualquier instancia con todos sus campos `final` e inmutables.',
      'Que sea un `HashMap`.',
      'Que sea un `ArrayList`.',
      'Que use `SimpleDateFormat` internamente.',
    ],
    correctIndex: 0,
    explanation: 'La **inmutabilidad** es la mejor vía a thread-safety. Records son inmutables por defecto. Los otros tres NO son thread-safe (HashMap, ArrayList, SimpleDateFormat son ejemplos típicos en entrevistas).',
  },
  {
    id: 'mcq-async-5', topicId: 'async',
    question: 'Sobre virtual threads y "pinning", ¿qué afirmación es correcta?',
    options: [
      'Los virtual threads nunca se bloquean.',
      'Si dentro de un `synchronized` haces I/O bloqueante, el virtual thread NO puede desmontarse y bloquea el carrier (pierdes la ventaja). Java 24+ lo relaja.',
      'El pinning solo ocurre en código nativo.',
      'Es un bug que ya está resuelto en Java 21.',
    ],
    correctIndex: 1,
    explanation: '**Pinning**: si bloqueas dentro de `synchronized` o JNI, el virtual no se puede desmontar → bloquea el carrier. Recomendado usar `ReentrantLock` sobre `synchronized` con I/O dentro (en J24+ se relaja). Monitorízalo con `-Djdk.tracePinnedThreads=full`.',
  },

  // ---- Mensajería (más) ----
  {
    id: 'mcq-msg-4', topicId: 'msg',
    question: 'En Kafka, ¿cuántos consumers activos por consumer group pueden procesar en paralelo un topic con 4 particiones?',
    options: [
      'Ilimitado, escalan independientemente.',
      'Como mucho 4 (uno por partición); consumers adicionales quedan inactivos.',
      'Como mucho 8 (2 por partición).',
      'Exactamente 1; los demás solo replican.',
    ],
    correctIndex: 1,
    explanation: 'El **paralelismo dentro de un grupo** está limitado por el nº de particiones: máx 4 consumers activos. Cada partición la consume **una sola** instancia del grupo a la vez. Más consumers en el grupo no aportan paralelismo.',
  },
  {
    id: 'mcq-msg-5', topicId: 'msg',
    question: 'En RabbitMQ, un exchange `fanout`…',
    options: [
      'Enruta solo a la cola cuya routing key coincida exactamente.',
      'Aplica patrones con comodines a la routing key (p.ej. `pedido.*.creado`).',
      'Hace broadcast del mensaje a TODAS las colas enlazadas, ignorando la routing key.',
      'Enruta según las cabeceras del mensaje.',
    ],
    correctIndex: 2,
    explanation: 'Fanout = broadcast. `direct` usa routing key exacta. `topic` usa patrones con `*` y `#`. `headers` enruta por cabeceras.',
  },
  {
    id: 'mcq-msg-6', topicId: 'msg',
    question: 'En un Schema Registry, "backward compatibility" significa que…',
    options: [
      'Un consumer con el esquema NUEVO puede leer mensajes producidos con el esquema VIEJO (p.ej. añadir un campo con default).',
      'Un consumer con el esquema VIEJO puede leer mensajes nuevos.',
      'Los mensajes viejos se borran al subir un esquema nuevo.',
      'El esquema nuevo invalida los anteriores.',
    ],
    correctIndex: 0,
    explanation: '**Backward**: el consumer nuevo lee lo viejo. **Forward**: el consumer viejo lee lo nuevo. **Full**: ambas. Añadir un campo con default es backward-compatible.',
  },

  // ---- BD (más) ----
  {
    id: 'mcq-db-4', topicId: 'db',
    question: '¿Cuál es la regla de la 2ª forma normal (2FN)?',
    options: [
      'Todos los valores son atómicos.',
      'Está en 1FN y no hay dependencias parciales de una clave compuesta (ningún atributo no clave depende solo de parte de la PK).',
      'Está en 1FN y no hay dependencias transitivas.',
      'Todas las tablas tienen una FK.',
    ],
    correctIndex: 1,
    explanation: '2FN: 1FN + no dependencias parciales. Si la PK es `(pedido_id, producto_id)` y `nombre_producto` depende solo de `producto_id`, viola 2FN → sácalo a otra tabla.',
  },
  {
    id: 'mcq-db-5', topicId: 'db',
    question: 'La integridad referencial garantiza que…',
    options: [
      'Los datos están normalizados a 3FN.',
      'Toda FK apunta a una fila existente en la tabla referenciada (no se inserta una FK inválida ni se borra una fila referenciada).',
      'No hay valores NULL en la tabla.',
      'Las consultas devuelven siempre la misma cardinalidad.',
    ],
    correctIndex: 1,
    explanation: 'La BD lo hace cumplir con la constraint `FOREIGN KEY`. Políticas: `ON DELETE CASCADE`, `SET NULL`, `RESTRICT`. Sin ella, FKs huérfanas → datos inconsistentes.',
  },
  {
    id: 'mcq-db-6', topicId: 'db',
    question: 'El nivel de aislamiento REPEATABLE READ evita…',
    options: [
      'Solo dirty reads.',
      'Dirty reads y non-repeatable reads (releer la misma fila no cambia), pero PUEDE permitir phantom reads (nuevas filas que cumplen el WHERE).',
      'Todas las anomalías posibles.',
      'No evita nada.',
    ],
    correctIndex: 1,
    explanation: 'REPEATABLE READ: no dirty, no non-repeatable. Pueden aparecer **phantoms**. SERIALIZABLE es el único que evita TODAS las anomalías (a costa de bloqueos/abortos).',
  },

  // ---- SQL (más) ----
  {
    id: 'mcq-sql-4', topicId: 'sql',
    question: 'Un INNER JOIN entre dos tablas donde hay exactamente 3 coincidencias (cardinalidad 1:1) devuelve…',
    options: [
      '3 filas.',
      'Solo las filas de la tabla izquierda.',
      'Todas las filas de ambas tablas.',
      'Depende del orden de las tablas.',
    ],
    correctIndex: 0,
    explanation: 'INNER JOIN devuelve la **intersección**: solo filas con coincidencia. Con 3 matches 1:1, devuelve 3.',
  },
  {
    id: 'mcq-sql-5', topicId: 'sql',
    question: 'Sobre NULL en agregados SQL, ¿qué afirmación es correcta?',
    options: [
      'COUNT(*) y COUNT(col) devuelven siempre lo mismo.',
      'AVG(col) trata los NULL como 0 al promediar.',
      'COUNT(*) cuenta filas (incluso con NULLs); COUNT(col) cuenta filas donde col NO ES NULL.',
      'Los agregados fallan si hay un NULL en la columna.',
    ],
    correctIndex: 2,
    explanation: '`COUNT(*)` = filas. `COUNT(col)` ignora NULLs. `AVG`/`SUM` ignoran NULLs (no los tratan como 0). Y `NULL = NULL` da NULL, no `true` — usa `IS NULL`.',
  },
  {
    id: 'mcq-sql-6', topicId: 'sql',
    question: 'Buscar elementos por existencia en otra tabla con subqueries — diferencia clave entre IN y EXISTS:',
    options: [
      'IN es siempre más rápido que EXISTS.',
      '`NOT IN` con un subselect que contiene NULLs puede devolver resultado vacío inesperadamente; `NOT EXISTS` es seguro frente a NULLs.',
      'EXISTS solo funciona en PostgreSQL.',
      'No hay diferencia funcional entre ambos.',
    ],
    correctIndex: 1,
    explanation: '`NOT IN` con NULLs en el subselect te vacía el resultado (semántica de NULL). `EXISTS`/`NOT EXISTS` es robusto y suele ser más eficiente al parar en cuanto encuentra una fila.',
  },

  // ---- Perf (más) ----
  {
    id: 'mcq-perf-3', topicId: 'perf',
    question: '¿En qué caso un índice PERJUDICA más que ayuda?',
    options: [
      'En una columna muy filtrada en queries.',
      'En una tabla pequeña con muchas escrituras o columna con muy baja selectividad (ej. boolean).',
      'En una columna usada en JOIN.',
      'En una PK.',
    ],
    correctIndex: 1,
    explanation: 'Índices cuestan: cada INSERT/UPDATE/DELETE los mantiene. En tablas pequeñas el seq scan es más barato; en baja selectividad (sexo, activo) apenas filtra → el optimizador hará seq scan igualmente.',
  },
  {
    id: 'mcq-perf-4', topicId: 'perf',
    question: 'Tienes el problema "N+1" en JPA (1 query para listar entidades + N queries para una relación lazy). ¿Solución más típica?',
    options: [
      'Llamar `flush()` manualmente entre queries.',
      'Eliminar todas las relaciones lazy.',
      'Usar `JOIN FETCH` en JPQL, `@EntityGraph`, o `@BatchSize` para agrupar lazies en pocas queries `IN (...)`.',
      'Migrar todo a SQL nativo.',
    ],
    correctIndex: 2,
    explanation: 'JOIN FETCH / @EntityGraph traen la relación de una vez. @BatchSize agrupa lazies. A veces una proyección DTO es lo más limpio. Cuidado con JOIN FETCH de varias colecciones (producto cartesiano).',
  },
  {
    id: 'mcq-perf-5', topicId: 'perf',
    question: 'Un "covering index" / index-only scan significa que…',
    options: [
      'El índice cubre toda la tabla con todas las filas.',
      'El índice contiene todas las columnas que la query necesita; el motor responde sin tocar el heap (la tabla).',
      'Es un índice que se aplica a todas las queries del esquema.',
      'Es un índice replicado en todas las réplicas.',
    ],
    correctIndex: 1,
    explanation: 'Si el índice incluye las columnas del WHERE, SELECT y ORDER BY, el motor hace **index-only scan** sin heap fetch (random I/O caro). En Postgres puedes usar `INCLUDE` para columnas no-filtro.',
  },

  // ---- Testing (más) ----
  {
    id: 'mcq-test-3', topicId: 'test',
    question: '¿Cuál es la secuencia correcta del ciclo TDD?',
    options: [
      'Refactor → Test → Code.',
      'Code → Test → Deploy.',
      'Red (test que falla) → Green (código mínimo para pasar) → Refactor (limpiar manteniendo tests).',
      'Test → Code → Test → Deploy.',
    ],
    correctIndex: 2,
    explanation: 'TDD es **Red-Green-Refactor**. Test que define comportamiento → código mínimo que pasa → limpiar el diseño sin romper tests. Es técnica de DISEÑO, no solo de testing.',
  },
  {
    id: 'mcq-test-4', topicId: 'test',
    question: '¿Qué estructura sigue un buen test (AAA / Given-When-Then)?',
    options: [
      'Setup → Sleep → Assert.',
      'Given (arrange, prepara) → When (act, ejecuta lo que pruebas) → Then (assert, verifica).',
      'Try → Catch → Finally.',
      'Init → Run → Cleanup.',
    ],
    correctIndex: 1,
    explanation: 'AAA = Arrange-Act-Assert. Given-When-Then es la variante BDD. Cada sección separada visualmente (línea en blanco). Probar **comportamiento**, no implementación.',
  },
  {
    id: 'mcq-test-5', topicId: 'test',
    question: '¿Para qué se usa Testcontainers en tests?',
    options: [
      'Para mockear todas las dependencias en memoria.',
      'Para arrancar BBDD/brokers reales en Docker durante el test → integración fiel (mejor que H2, que miente con dialectos).',
      'Para medir cobertura.',
      'Para empaquetar la app en contenedores en CI.',
    ],
    correctIndex: 1,
    explanation: 'Testcontainers arranca Postgres/Kafka/RabbitMQ reales en contenedores efímeros para tests de integración fieles. Mejor que H2 (engaña con dialectos) o mocks.',
  },
  {
    id: 'mcq-test-6', topicId: 'test',
    question: 'En pruebas de rendimiento, ¿qué métrica refleja mejor la experiencia del usuario lento?',
    options: [
      'La latencia media.',
      'La latencia mínima.',
      'Percentiles altos (p95/p99) — un p99 alto significa que 1 de cada 100 usuarios tiene una mala experiencia.',
      'El número total de peticiones procesadas.',
    ],
    correctIndex: 2,
    explanation: 'La media oculta los outliers. **p95/p99** te dicen cómo de mal lo pasa el peor 5/1%. Herramientas: JMeter, Gatling, k6, Locust. Se integran con SLOs en CI.',
  },

  // ---- Redis (más) ----
  {
    id: 'mcq-redis-2', topicId: 'redis',
    question: 'Si Redis se llena (maxmemory) y has activado una política de eviction LRU, ¿qué hace?',
    options: [
      'Rechaza todas las nuevas escrituras.',
      'Descarta las claves menos usadas RECIENTEMENTE para hacer hueco.',
      'Borra el dataset entero.',
      'Persiste a disco automáticamente.',
    ],
    correctIndex: 1,
    explanation: 'LRU = Least Recently Used. Variantes: `allkeys-lru` (todas), `volatile-lru` (solo con TTL). Otras políticas: LFU (frecuencia), `noeviction` (rechaza), `volatile-ttl` (las que expiran antes).',
  },
  {
    id: 'mcq-redis-3', topicId: 'redis',
    question: '¿Cómo implementarías un lock distribuido básico en Redis?',
    options: [
      '`GET lock:x` y si no existe `SET lock:x 1`.',
      '`SET lock:x <token-único> NX PX <ttl>` (atómico: solo si no existe + TTL para evitar deadlock). Liberar con script Lua que comprueba el token.',
      '`INCR lock_counter` y si vale 1 has adquirido.',
      'Redis no permite locks distribuidos.',
    ],
    correctIndex: 1,
    explanation: '`SET ... NX PX` es atómico (solo si no existe + TTL). El token único evita liberar el lock de otro. Redisson encapsula esto. Para corrección estricta a veces es mejor un lock en BD.',
  },
  {
    id: 'mcq-redis-4', topicId: 'redis',
    question: 'El patrón "cache-aside" funciona así:',
    options: [
      'La caché siempre se escribe primero, luego la BD.',
      'La app consulta la caché; si miss, lee de la BD y guarda en caché (lo más común).',
      'La caché replica activamente las escrituras de la BD.',
      'La caché vive aparte y la app la ignora.',
    ],
    correctIndex: 1,
    explanation: 'Cache-aside (lazy loading): consulta caché → si miss → lee BD → guarda en caché → devuelve. Riesgo: primera lectura lenta y stale (mitigado con TTL + invalidación por evento).',
  },

  // ---- Contracts (más) ----
  {
    id: 'mcq-contracts-2', topicId: 'contracts',
    question: 'En contract-first con `openapi-generator`, ¿qué genera para Spring Boot típicamente?',
    options: [
      'El controller completo y los servicios.',
      'Una interfaz Java por operación + DTOs (modelos) + validaciones. El controller la `implements`.',
      'Toda la BD con sus tablas.',
      'Un cliente JavaScript para el frontend.',
    ],
    correctIndex: 1,
    explanation: 'Genera **interfaz + DTOs**; tu controller la implementa. Si el YAML cambia de forma incompatible, **no compila** → detección temprana de breaking changes. También puede generar el cliente para los consumidores.',
  },
  {
    id: 'mcq-contracts-3', topicId: 'contracts',
    question: 'En contract testing con Pact (consumer-driven), ¿quién define el contrato?',
    options: [
      'El proveedor del servicio.',
      'El consumidor define un "pact" con lo que espera de la API; el contrato se verifica contra el proveedor en SU pipeline.',
      'Un equipo de QA externo.',
      'Se genera automáticamente desde OpenAPI.',
    ],
    correctIndex: 1,
    explanation: '**Consumer-driven**: el consumidor declara expectativas. Si el proveedor rompe algo que un consumer usa, **falla SU build**. Detecta breaking changes antes de desplegar, sin E2E.',
  },

  // ---- Patterns (más) ----
  {
    id: 'mcq-patterns-3', topicId: 'patterns',
    question: '¿Cuándo es legítimo usar Singleton?',
    options: [
      'Para cualquier clase que aparezca en varios sitios.',
      'Para evitar tener que inyectar dependencias.',
      'Cuando hay una única instancia real por definición (pool de conexiones, logger, registry, caché de config) — y aún así, mejor como bean Spring que con `getInstance()` estático.',
      'Nunca; es siempre un antipatrón.',
    ],
    correctIndex: 2,
    explanation: 'Válido cuando la unicidad es por diseño. En Spring, un `@Component` ya es singleton gestionado y se inyecta — sin variable global, sin acceso estático. Eso evita las pegas clásicas del Singleton.',
  },
  {
    id: 'mcq-patterns-4', topicId: 'patterns',
    question: '¿Cuándo usarías Builder en lugar de Factory Method?',
    options: [
      'Para construir un objeto complejo paso a paso, con muchos parámetros (especialmente opcionales) — evitas constructores telescópicos.',
      'Cuando la creación es trivial.',
      'Cuando hay una única implementación.',
      'Siempre que crees instancias en Spring.',
    ],
    correctIndex: 0,
    explanation: 'Builder brilla con objetos complejos y muchos parámetros opcionales. Lombok `@Builder` lo genera. Factory Method oculta el `new` concreto cuando hay variantes; Abstract Factory crea **familias** consistentes de objetos relacionados.',
  },
  {
    id: 'mcq-patterns-5', topicId: 'patterns',
    question: 'Para una transacción que cruza varios microservicios, ¿qué patrón se prefiere hoy frente a 2PC?',
    options: [
      'Bloquear todos los servicios hasta que el global se complete.',
      'Saga: secuencia de transacciones locales con acciones compensatorias si un paso falla (coreografía o orquestación).',
      'Hacer un único Big Service que lo haga todo dentro de una sola transacción.',
      'Replicar la BD y operar localmente.',
    ],
    correctIndex: 1,
    explanation: '2PC/XA escala mal y acopla servicios. **Saga** asume consistencia eventual: cada servicio hace su tx local + emite evento; si falla, compensación que deshace lo anterior. Coreografía (eventos) u orquestación (coordinador).',
  },

  // ---- Observabilidad (más) ----
  {
    id: 'mcq-obs-3', topicId: 'obs',
    question: 'En Prometheus/Micrometer, ¿qué tipo de métrica usas para "número total de peticiones procesadas"?',
    options: [
      'Counter (solo sube, monotonic).',
      'Gauge (sube y baja).',
      'Histogram (distribución).',
      'Summary.',
    ],
    correctIndex: 0,
    explanation: 'Counter para cosas que solo suben (peticiones totales, errores). Gauge para valores que suben y bajan (sesiones activas, threads). Histogram/Summary para distribuciones (latencia con percentiles).',
  },
  {
    id: 'mcq-obs-4', topicId: 'obs',
    question: '¿Por qué son mejores los logs estructurados (JSON) que el texto plano?',
    options: [
      'Son más pequeños en disco.',
      'Tienen campos (timestamp, level, traceId, service…) que permiten **buscar, agregar y correlacionar** (con OpenSearch/Loki).',
      'Los lee el sistema operativo automáticamente.',
      'No requieren rotación de ficheros.',
    ],
    correctIndex: 1,
    explanation: 'Texto JSON con campos → buscable (filtra por `service=pagos AND status=500 AND p>500ms`), agregable, correlacionable con `traceId` (enlaza un log con su span). En Spring se hace con logstash-logback-encoder + MDC.',
  },
  {
    id: 'mcq-obs-5', topicId: 'obs',
    question: 'Para propagar el trace_id entre servicios en una arquitectura distribuida se usa…',
    options: [
      'Una variable global compartida vía Redis.',
      'Un header HTTP estándar (`traceparent`, W3C Trace Context) — y metadata Kafka para mensajería; OpenTelemetry lo gestiona.',
      'Una columna en la BD principal.',
      'No se propaga; cada servicio genera el suyo.',
    ],
    correctIndex: 1,
    explanation: 'El **trace context** estándar W3C va en el header `traceparent`. OpenTelemetry propaga automáticamente por HTTP/Kafka/etc. Así los spans de los distintos servicios se unen en una sola traza.',
  },
  {
    id: 'mcq-obs-6', topicId: 'obs',
    question: 'En Resilience4j, ¿qué estados tiene un Circuit Breaker?',
    options: [
      'Activo / Inactivo.',
      'Closed (peticiones pasan), Open (peticiones rechazadas para no martillear el servicio caído), Half-Open (prueba si recuperó).',
      'Encendido / Apagado / Esperando.',
      'No tiene estados; siempre permite o bloquea.',
    ],
    correctIndex: 1,
    explanation: 'Closed (todo va), Open (cortado tras X% de fallos, rechaza inmediato), Half-Open (deja pasar algunas pruebas; si van bien → Closed, si fallan → Open). Combina con retry + timeout + bulkhead.',
  },

  // ---- Algoritmos (más) ----
  {
    id: 'mcq-algo-3', topicId: 'algo',
    question: 'En un grafo no ponderado, ¿qué algoritmo encuentra el camino más corto en aristas entre dos nodos?',
    options: [
      'DFS recursivo.',
      'BFS por niveles con una cola.',
      'Dijkstra.',
      'Floyd-Warshall.',
    ],
    correctIndex: 1,
    explanation: '**BFS** explora por niveles → la primera vez que alcanzas el destino, es por el camino más corto en nº de aristas. DFS no garantiza el más corto. Dijkstra/Bellman-Ford son para grafos ponderados.',
  },
  {
    id: 'mcq-algo-4', topicId: 'algo',
    question: '¿Cuál es la complejidad de una búsqueda binaria sobre un array ordenado de n elementos?',
    options: [
      'O(n)',
      'O(log n)',
      'O(n log n)',
      'O(1)',
    ],
    correctIndex: 1,
    explanation: 'Búsqueda binaria divide el rango por la mitad en cada paso → O(log n). Es por qué los índices B-tree de BD permiten consultas tan rápidas.',
  },
  {
    id: 'mcq-algo-5', topicId: 'algo',
    question: '¿Por qué ConcurrentHashMap es más eficiente que `Collections.synchronizedMap(new HashMap<>())` en alta concurrencia?',
    options: [
      'Es exactamente igual, solo cambia el nombre.',
      'ConcurrentHashMap bloquea por bucket (segmentación) y permite lecturas sin bloqueo, mientras que synchronizedMap sincroniza todos los métodos serializando el acceso.',
      'Solo funciona con claves String.',
      'synchronizedMap es un alias de ConcurrentHashMap.',
    ],
    correctIndex: 1,
    explanation: '`ConcurrentHashMap` permite alta paralelización: lecturas sin lock, escrituras con locks finos por bucket. `synchronizedMap` sincroniza cada método → serializa todo el acceso, mucho menos escalable.',
  },
);

// ===== Tercera tanda: cc (Claude Code) + k8s + extras Spring Cloud / gRPC =====

MCQ.push(
  // ---- Claude Code ----
  {
    id: 'mcq-cc-1', topicId: 'cc',
    question: '¿En qué se diferencia Claude Code de GitHub Copilot?',
    options: [
      'Solo en el modelo subyacente (Claude vs OpenAI).',
      'Copilot es agentic; Claude Code es solo autocomplete.',
      'Claude Code es agentic (ejecuta comandos, lee/modifica ficheros, navega web, gestiona git); Copilot es principalmente autocomplete en el editor.',
      'Son productos equivalentes.',
    ],
    correctIndex: 2,
    explanation: 'Claude Code es **agentic**: hace cosas, no solo sugiere. Loop think→act→observe, herramientas (Bash, Read, Edit, etc.), subagents, hooks, MCP. Copilot/Tabnine son autocomplete dentro del editor.',
  },
  {
    id: 'mcq-cc-2', topicId: 'cc',
    question: '¿Qué deberías meter en CLAUDE.md de un proyecto?',
    options: [
      'El código fuente más importante.',
      'Las convenciones, decisiones arquitectónicas, comandos comunes y reglas estrictas del equipo.',
      'La historia de git con los principales commits.',
      'Credenciales y URLs de los entornos.',
    ],
    correctIndex: 1,
    explanation: 'CLAUDE.md = memoria del proyecto. Mete convenciones, decisiones, comandos, reglas. **NO**: código (lo lee), git history (lo saca con `git log`), secretos.',
  },
  {
    id: 'mcq-cc-3', topicId: 'cc',
    question: '¿Cuándo es valioso usar plan mode en Claude Code?',
    options: [
      'En cualquier tarea, por pequeña que sea.',
      'Solo cuando vas a editar más de 10 ficheros.',
      'En cambios grandes/invasivos, refactors transversales o acciones de riesgo alto: planifica antes de tocar, revisas, y solo aplicas si te parece bien.',
      'Solo si trabajas sin tests.',
    ],
    correctIndex: 2,
    explanation: 'Plan mode separa diseño de ejecución. Útil en refactors grandes, migraciones, infra. En fixes triviales sobra. El plan generado puede ir a una ADR o al PR description.',
  },
  {
    id: 'mcq-cc-4', topicId: 'cc',
    question: '¿Para qué se usan los subagents?',
    options: [
      'Para reemplazar al desarrollador en decisiones de arquitectura.',
      'Para aislar contexto de investigaciones largas, paralelizar trabajo independiente y especializar prompts/herramientas según el rol.',
      'Para ahorrar dinero siempre, independientemente de la tarea.',
      'Para conectarse a APIs externas.',
    ],
    correctIndex: 1,
    explanation: 'Subagents: aislar contexto (la búsqueda no contamina el hilo principal), paralelizar (varias investigaciones), especializar (test-writer, code-reviewer, architect). Para conectar a APIs externas, eso es **MCP**, no subagents.',
  },
  {
    id: 'mcq-cc-5', topicId: 'cc',
    question: '¿Qué resuelve MCP (Model Context Protocol)?',
    options: [
      'La compresión de prompts para reducir tokens.',
      'Un estándar abierto para que un agente LLM se conecte a fuentes y herramientas externas (Jira, GitHub, BBDD, APIs) con un protocolo común.',
      'La autenticación entre Claude y la API.',
      'Un sistema de plugins propietario de Anthropic.',
    ],
    correctIndex: 1,
    explanation: 'MCP es **estándar abierto**: cualquier LLM que lo hable usa el mismo conector. Ya hay SDK oficial. El servidor MCP gestiona auth/secrets, no el prompt. Vs plugins propietarios → MCP es multi-modelo.',
  },
  {
    id: 'mcq-cc-6', topicId: 'cc',
    question: '¿Qué NO deberías delegar a Claude Code?',
    options: [
      'Generar tests JUnit a partir de una clase.',
      'Refactorizar nombres en varios ficheros con tests verdes.',
      'Decisiones críticas de seguridad (auth, criptografía) sin verificar a mano y a fondo, y decisiones de arquitectura sin discusión.',
      'Buscar APIs en una librería desconocida.',
    ],
    correctIndex: 2,
    explanation: 'Las alucinaciones en seguridad son catastróficas; las decisiones de arquitectura no las firma una IA. Lo demás es legítimo siempre que **revises** el output.',
  },
  // ---- Kubernetes ----
  {
    id: 'mcq-k8s-1', topicId: 'k8s',
    question: '¿Cuándo usarías un StatefulSet en vez de un Deployment?',
    options: [
      'Siempre, porque es más nuevo.',
      'Cuando los pods son intercambiables y stateless.',
      'Cuando los pods necesitan identidad estable, orden de arranque y/o almacenamiento per-pod (BBDD, Kafka brokers, Keycloak HA, Mongo ReplicaSet).',
      'Cuando quieres uno por nodo.',
    ],
    correctIndex: 2,
    explanation: 'StatefulSet = identidad estable (`app-0`, `app-1`), orden, PVC por pod. Para BBDD, Kafka, sistemas con estado. Deployment = pods stateless intercambiables. DaemonSet = uno por nodo (DaemonSets, no StatefulSets).',
  },
  {
    id: 'mcq-k8s-2', topicId: 'k8s',
    question: '¿Por qué usar Ingress en vez de un LoadBalancer por servicio?',
    options: [
      'Ingress es más rápido que LoadBalancer.',
      'Ingress se sirve gratis en cualquier clúster sin extras.',
      'Una sola IP/LoadBalancer expone N servicios HTTP por host/path; termina TLS en un solo punto; reglas avanzadas (rate limit, rewrite, headers). Un LoadBalancer por servicio escala y cuesta mucho peor.',
      'LoadBalancer no soporta TLS.',
    ],
    correctIndex: 2,
    explanation: 'Ingress es la capa HTTP de entrada con reglas por host/path sobre Services internos. Una IP, muchos servicios públicos. LoadBalancer por servicio se vuelve caro e inmanejable con 10+ servicios. Para TCP no-HTTP sigue siendo LoadBalancer.',
  },
  {
    id: 'mcq-k8s-3', topicId: 'k8s',
    question: 'Sobre Network Policies en Kubernetes, ¿qué es cierto?',
    options: [
      'Por defecto los pods están aislados entre sí.',
      'Por defecto los pods se ven entre todos; las Network Policies introducen segmentación L3/L4 y requieren un CNI que las soporte (Calico, Cilium).',
      'Sustituyen a un firewall externo.',
      'Solo funcionan en Kubernetes managed (GKE/EKS).',
    ],
    correctIndex: 1,
    explanation: 'K8s por defecto = red plana. NetworkPolicies = firewall por etiquetas/namespaces, modelo zero-trust si arrancas con `default-deny-all`. Requieren CNI compatible (Flannel básico no las soporta).',
  },
  {
    id: 'mcq-k8s-4', topicId: 'k8s',
    question: '¿Qué es un Operator en Kubernetes (Strimzi, CNPG)?',
    options: [
      'Un proxy delante de la API de K8s.',
      'Un Pod que ejecuta comandos administrativos manualmente.',
      'Un controller custom que reconcilia recursos custom (CRDs) — codifica el know-how de operar un sistema complejo (Kafka, Postgres HA, cert-manager).',
      'Una versión enterprise de Kubernetes.',
    ],
    correctIndex: 2,
    explanation: 'Un Operator + CRDs amplía K8s con tus propios tipos (`KafkaCluster`, `PostgresCluster`). Tú declaras un YAML y el operator se encarga de los StatefulSets/Services/Secrets necesarios. Strimzi opera Kafka; CNPG opera Postgres HA.',
  },
  // ---- Spring Cloud / arch ----
  {
    id: 'mcq-arch-9', topicId: 'arch',
    question: 'Spring Cloud Gateway está construido sobre…',
    options: [
      'Spring MVC (servlet, bloqueante).',
      'Spring WebFlux (reactivo, no bloqueante).',
      'Tomcat puro.',
      'Apache Camel.',
    ],
    correctIndex: 1,
    explanation: 'Spring Cloud Gateway es WebFlux (reactivo). Es el reemplazo moderno de Zuul 1 (bloqueante). Define routes con predicates + filters en YAML o programáticamente.',
  },
  // ---- gRPC ----
  {
    id: 'mcq-rest-6', topicId: 'rest',
    question: '¿Cuándo elegirías gRPC sobre REST?',
    options: [
      'Para una API pública consumida desde navegadores y `curl`.',
      'Para comunicación de alta frecuencia / baja latencia entre microservicios internos, con tipado fuerte y streaming nativo.',
      'Cuando necesitas cache HTTP estándar.',
      'Cuando el equipo no quiere mantener un .proto.',
    ],
    correctIndex: 1,
    explanation: 'gRPC brilla **entre microservicios internos**: binario (HTTP/2 + Protobuf), cliente generado type-safe, streaming bidireccional. Mal para navegadores (gRPC-Web requiere proxy) y cache HTTP estándar. Patrón común: REST hacia fuera, gRPC dentro.',
  },
  {
    id: 'mcq-msg-7', topicId: 'msg',
    question: 'Debezium hace CDC leyendo…',
    options: [
      'La salida de los logs de la aplicación.',
      'El binlog de MySQL / WAL de Postgres / oplog de Mongo, y publica los cambios a Kafka.',
      'Únicamente eventos publicados manualmente por la app.',
      'Snapshots periódicos completos de las tablas.',
    ],
    correctIndex: 1,
    explanation: 'Debezium = CDC sobre los logs internos de la BD (WAL/binlog/oplog). Publica eventos `before/after` a Kafka. Resuelve outbox sin polling y sincronización entre sistemas con baja latencia.',
  },
);

// ===== Cuarta tanda: ampliación de seguridad (Keycloak, authN/authZ, Spring Security) =====

MCQ.push(
  {
    id: 'mcq-sec-5', topicId: 'sec',
    question: '¿Cuál es la diferencia entre autenticación y autorización?',
    options: [
      'Son sinónimos: ambos validan al usuario.',
      'Autenticación = ¿quién eres? (401 si falla). Autorización = ¿qué puedes hacer? (403 si te falta permiso).',
      'Autenticación es solo para frontend; autorización solo para backend.',
      'Autenticación es para usuarios humanos; autorización es para máquinas.',
    ],
    correctIndex: 1,
    explanation: '**AuthN** verifica identidad → 401 si no eres quien dices. **AuthZ** comprueba permisos sobre acciones/recursos → 403 si no te dejan. Siempre se hace authN antes que authZ. El bug clásico de "IDOR" es authN OK + authZ ausente.',
  },
  {
    id: 'mcq-sec-6', topicId: 'sec',
    question: 'OIDC vs OAuth2: ¿cuál es la relación correcta?',
    options: [
      'OIDC es un competidor de OAuth2 que lo sustituye.',
      'OAuth2 es solo para login; OIDC para acceso a APIs.',
      'OIDC es una capa de identidad SOBRE OAuth2: añade un `id_token` (JWT) que prueba la identidad del usuario. Es lo que usas para "login con Google", etc.',
      'Son protocolos para sistemas completamente diferentes.',
    ],
    correctIndex: 2,
    explanation: 'OAuth2 = autorización delegada (access token a APIs). OIDC añade `id_token` con la identidad del usuario → resuelve el LOGIN. Los flujos OIDC son los de OAuth2 (Authorization Code + PKCE). "Iniciar sesión con X" = OIDC.',
  },
  {
    id: 'mcq-sec-7', topicId: 'sec',
    question: 'En Keycloak, ¿qué es un realm?',
    options: [
      'El nombre del servidor donde está desplegado.',
      'Un tenant aislado: tiene sus propios usuarios, clients, roles y políticas. Una empresa puede tener uno para empleados y otro para clientes.',
      'Un tipo de protocolo (OIDC/SAML).',
      'El proveedor de identidad externo (LDAP, Google).',
    ],
    correctIndex: 1,
    explanation: 'Un **realm** = tenant. Aislado, con sus propios usuarios, clients (apps), roles, groups, identity providers. Realms distintos no comparten nada salvo el master realm administrativo. El Proveedor de Identidad es algo distinto (federación).',
  },
  {
    id: 'mcq-sec-8', topicId: 'sec',
    question: '¿Por qué NO se deben usar MD5 o SHA-256 para guardar contraseñas?',
    options: [
      'No están disponibles en Java estándar.',
      'Solo funcionan para texto en inglés.',
      'Son demasiado rápidos: un atacante con la BD filtrada puede hacer billones de hashes/seg en GPU y crackear passwords débiles. Necesitas funciones lentas y memory-hard: bcrypt, Argon2, scrypt.',
      'No producen hashes únicos.',
    ],
    correctIndex: 2,
    explanation: 'MD5/SHA-* están diseñados para ser **rápidos** (lo opuesto a lo que quieres para passwords). Usa bcrypt (cost factor 12+), **Argon2** (recomendado nuevo: ganador del PHC, memory-hard) o scrypt. Spring Security: `BCryptPasswordEncoder`/`Argon2PasswordEncoder`.',
  },
  {
    id: 'mcq-sec-9', topicId: 'sec',
    question: '¿Cuándo elegirías ABAC sobre RBAC?',
    options: [
      'Cuando los roles del sistema son fijos y claros (admin/user/viewer).',
      'Cuando las reglas dependen del contexto y atributos (hora, propietario del recurso, departamento, MFA activo), no solo del rol.',
      'Cuando hay muchos usuarios.',
      'ABAC es siempre la mejor opción.',
    ],
    correctIndex: 1,
    explanation: 'RBAC (roles + permisos) es simple y suficiente cuando los permisos son uniformes. **ABAC** modela reglas con **atributos del sujeto/recurso/acción/contexto** ("el dueño del pedido", "solo en horario laboral"). Implementación moderna: Open Policy Agent (OPA) + Rego.',
  },
  {
    id: 'mcq-sec-10', topicId: 'sec',
    question: 'Sobre WebAuthn / passkeys (FIDO2), ¿qué afirmación es correcta?',
    options: [
      'Es solo otra forma de OTP por SMS.',
      'Resuelve el problema de phishing por construcción: la clave firma un challenge ligado al ORIGEN real, así un sitio falso no obtiene una firma válida.',
      'Requiere SMS para funcionar.',
      'Es más débil que TOTP.',
    ],
    correctIndex: 1,
    explanation: 'WebAuthn usa criptografía de clave pública con el origen ligado al challenge → **phishing-resistant**. Mucho más fuerte que SMS/TOTP/push. Es el camino al "sin contraseñas" (passkeys). Keycloak lo soporta nativo.',
  },
);

export function mcqByTopic(topicId: string): McqQuestion[] {
  return MCQ.filter((q) => q.topicId === topicId);
}

