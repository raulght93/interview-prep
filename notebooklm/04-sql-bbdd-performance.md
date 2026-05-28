# SQL · Bases de Datos · Performance

> Modelado relacional, normalización, ACID, MongoDB, joins, índices, planes de ejecución.

## Teoría

### DB

Modelado relacional. Una clave primaria identifica unívocamente cada fila; una clave foránea referencia la PK de otra tabla. Una relación N:M se modela con tres tablas: las dos entidades + tabla de unión con dos FKs y PK compuesta.

Normalización. 1FN: valores atómicos. 2FN: en 1FN y no hay dependencias parciales de una clave compuesta. 3FN: en 2FN y sin dependencias transitivas. Mnemotécnico: 1FN atómico · 2FN toda la clave · 3FN nada más que la clave.

ACID e aislamiento. A=atomicidad, C=consistencia, I=aislamiento, D=durabilidad. Niveles de aislamiento: READ UNCOMMITTED (dirty reads), READ COMMITTED (no dirty), REPEATABLE READ (la misma fila no cambia, puede haber phantoms), SERIALIZABLE (sin anomalías).

NoSQL documental: MongoDB. Almacena documentos JSON/BSON. Modelar va por patrones de acceso: embebes lo que se lee/escribe junto, referencias por id cuando el sub-doc crece sin límite.

Persistencia políglota. En microservicios: relacional para transaccional, documental para agregados, Redis/Valkey para caché/sesiones/locks, Neo4j para grafos, OpenSearch para full-text. En Agata Next conviven Mongo + Neo4j + Valkey + PostgreSQL — cada uno por su caso de uso.

### SQL

Joins combinan filas de varias tablas. INNER devuelve solo la intersección. LEFT devuelve todas las filas de la tabla izquierda + las casadas de la derecha (NULLs donde no haya match). FULL devuelve ambos lados. CROSS es el producto cartesiano (peligroso). SELF JOIN une una tabla consigo misma.

Las preguntas trampa con números. Tabla A(5) LEFT JOIN B(10): la respuesta no es 5 a secas: es al menos 5 (más si una fila de A casa con varias de B). INNER JOIN con 3 coincidencias = 3. LEFT JOIN ≥ INNER siempre.

WHERE filtra filas, HAVING filtra grupos. El orden lógico: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT. ORDER BY 1 ordena por la primera columna del SELECT.

NULL es "desconocido", no un valor. NULL = NULL da NULL; usa IS NULL. COUNT(*) cuenta filas; COUNT(col) ignora NULLs. AVG ignora NULLs (no los trata como 0).

Subqueries vs joins. EXISTS es seguro frente a NULLs y suele ser más eficiente que IN con subqueries grandes. NOT IN con un subselect que tiene NULLs puede vaciar el resultado inesperadamente — usa NOT EXISTS.

### PERF

PreparedStatement vs Statement plano. El PreparedStatement parametriza la query: los valores van separados del SQL (anti-SQL-injection), el motor parsea y planifica una sola vez (plan cache), y los setX tipados evitan errores.

Plan de ejecución. EXPLAIN (estimación) y EXPLAIN ANALYZE (ejecuta y muestra coste real) en Postgres. Lee el árbol de operaciones de adentro hacia afuera: hojas son accesos (seq scan, index scan, index-only scan), nodos intermedios son joins y operaciones.

Qué buscar. Full table scans inesperados sobre tablas grandes. Índices no usados por estadísticas obsoletas (corre ANALYZE) o función sobre la columna. Joins ineficientes. Estimación vs filas reales muy distintas.

Índices. El B-tree es el general (igualdad, rangos, ORDER BY). Los índices compuestos (a, b) se usan para filtros por a o por a+b, pero no por solo b (regla del prefijo más a la izquierda). Un covering index contiene todas las columnas que la query necesita → index-only scan sin tocar la tabla. Cuando un índice perjudica: tablas pequeñas, columnas con baja selectividad, mucho escritor.

N+1 en JPA: cargas N entidades con 1 query y luego al acceder a una relación lazy se disparan N queries más. Soluciones: JOIN FETCH o @EntityGraph para traer la relación de una vez, @BatchSize para agrupar lazies.

## Chuletas (puntos clave)

### DB

- N:M = 3 tablas (unión con 2 FKs + PK compuesta). PK identifica; FK referencia (integridad referencial).
- 1FN atómico · 2FN toda la clave (no parciales) · 3FN nada más que la clave (no transitivas).
- Índice compuesto: orden importa (prefijo más a la izquierda).
- ACID: Atomicidad, Consistencia, Aislamiento, Durabilidad.
- MVCC (Postgres/Oracle): varias versiones por fila, lectores no bloquean escritores.
- Deadlock = dos tx esperándose. Evita: orden consistente de locks, tx cortas, reintentos con backoff.
- Mongo: documental, embeber vs referenciar según acceso. Persistencia políglota.
- Neo4j (grafo): nodos+relaciones con propiedades, recorridos O(salto). Cypher: (a:Tipo)-[:REL]->(b).

### SQL

- INNER = intersección. LEFT/RIGHT = + filas sueltas del lado con NULLs. CROSS = producto cartesiano.
- LEFT A(5)→B(10): ≥5. INNER 3 matches: 3.
- WHERE filtra filas (antes de agrupar) · HAVING filtra grupos (tras agregar).
- ORDER BY 1 = primera columna del SELECT (proyección, no tabla).
- NULL: NULL=NULL → NULL (usar IS NULL). COUNT(*) cuenta filas; COUNT(col) ignora NULLs.
- Orden lógico: FROM→WHERE→GROUP BY→HAVING→SELECT→DISTINCT→ORDER BY→LIMIT.

### PERF

- PreparedStatement: anti-injection + plan cache + tipado + legibilidad.
- Plan de ejecución: árbol con coste estimado (EXPLAIN/EXPLAIN ANALYZE). Lee de dentro afuera.
- Buscas: seq scans inesperados, índices no usados, joins/sorts caros, estimado vs real distinto.
- Índices: B-tree (general), hash (=), GIN (jsonb/fulltext). Perjudica: escrituras, baja selectividad, tablas pequeñas.
- Covering index / index-only scan. N+1: JOIN FETCH / @EntityGraph / @BatchSize.

## Flashcards: SQL + BBDD + Performance

### DB (18 preguntas)

**Pregunta 1:** ¿Con qué gestores de bases de datos has trabajado?

**Respuesta:** Respuesta personal. Estructura sugerida:

[ver código en la app]

Guión de respuesta:
> "En Agata Next usamos un mix: MongoDB para el modelo de dominio de cada conector (esquema flexible, queries por tenant), PostgreSQL CNPG para datos transaccionales y el Outbox Pattern, Valkey (fork de Redis) para caché y locks distribuidos, Neo4j para el grafo de dependencias entre conectores, y OpenSearch para logs y búsqueda full-text."

Puntos que valora el entrevistador:
- Sabes elegir el almacén según el modelo de acceso, no por moda.
- Has trabajado con al menos 2 tipos distintos.
- Conoces los trade-offs: ACID vs BASE, consistencia vs disponibilidad (CAP).

---

**Pregunta 2:** Si tienes que modelar en BD una relación N a M (empleado-empresa), ¿cómo lo haces? ¿Cuántas tablas?

**Respuesta:** Tres tablas: las dos entidades + una tabla de unión (junction/intermediate table) con dos FKs.

[ver código en la app]

La clave primaria compuesta evita duplicados. Si la relación tiene atributos propios (fecha, rol, etc.), van en la tabla intermedia. En JPA se modela con @ManyToMany (sin atributos extra) o con una entidad propia + dos @ManyToOne (cuando hay atributos).

---

**Pregunta 3:** ¿Qué es la tercera forma normal?

**Respuesta:** 3FN: la tabla está en 2FN y no hay dependencias transitivas — ningún atributo no-clave depende de otro atributo no-clave.

[ver código en la app]

Propósito: eliminar redundancia y anomalías de actualización (cambiar el nombre de "Acme" requeriría actualizar múltiples filas). La 3FN es el estándar mínimo para OLTP. OLAP/data warehouses a veces usan esquemas desnormalizados intencionalmente para rendimiento.

---

**Pregunta 4:** ¿Puedo tener un índice por dos columnas a la vez?

**Respuesta:** Sí, se llaman índices compuestos (multicolumn): CREATE INDEX idx ON tabla(col1, col2). El motor los recorre como una estructura ordenada por (col1, col2).

[ver código en la app]

Orden de columnas importa: pon primero la de mayor selectividad si las consultas son por columna única, o la de igualdad primero si combinas igualdad + rango.

[ver código en la app]

En Agata Next (PostgreSQL CNPG): índices compuestos en tablas de eventos por (aggregate_id, version) — búsqueda por aggregate Y ordenación por versión. El planificador los usa con EXPLAIN (ANALYZE, BUFFERS) para confirmar "Index Scan" vs "Seq Scan".

---

**Pregunta 5:** ¿Cuándo puedo tener un HAVING sin un GROUP BY en una query?

**Respuesta:** Cuando hay función de agregado sobre todo el conjunto (sin agrupar). El motor lo trata como un único grupo implícito:

[ver código en la app]

Devuelve 0 o 1 fila según se cumpla la condición. Es válido en SQL estándar pero raro en práctica; lo más habitual es usar una subquery o un WHERE.

---

**Pregunta 6:** ¿Qué son la 1FN y la 2FN (antes de llegar a la 3FN)?

**Respuesta:** Las formas normales son reglas para eliminar redundancia y anomalías en tablas relacionales:

[ver código en la app]

Resumen de las formas normales más comunes:
- 1FN: valores atómicos (sin listas, sin grupos repetidos).
- 2FN: 1FN + no dependencias parciales de la PK compuesta.
- 3FN: 2FN + no dependencias transitivas (A→B→C donde A es la PK y C depende de B, no de A directamente). La más usada en diseño real.
- BCNF: variante de 3FN más estricta para ciertos casos raros.
- 4FN/5FN: raramente necesarias en práctica.

---

**Pregunta 7:** ¿Qué diferencia hay entre clave primaria y clave foránea? ¿Qué es la integridad referencial?

**Respuesta:** [ver código en la app]

Referencial integrity (integridad referencial):
[ver código en la app]

¿Cómo afectan al rendimiento?
- Los FK no crean índice automáticamente en PostgreSQL → al hacer JOIN o buscar por FK, puede haber Seq Scan si no lo creas.
- Agregar FK con NOT VALID en producción (valida sin lock de tabla completo) y luego VALIDATE CONSTRAINT en mantenimiento.

[ver código en la app]

💡 En JPA: @ManyToOne genera una FK en la BD. Sin @Index extra, puede necesitar un índice manual dependiendo del patrón de consulta.

---

**Pregunta 8:** ¿Qué significan las propiedades ACID de una transacción?

**Respuesta:** - A — Atomicidad: todo o nada; si un paso falla, se revierte la transacción entera (rollback).
- C — Consistencia: la transacción lleva la BD de un estado válido a otro válido (respeta constraints, FKs, triggers, invariantes).
- I — Aislamiento: las transacciones concurrentes no se pisan; el resultado es como si se ejecutaran en algún orden serie (modulado por el nivel de aislamiento).
- D — Durabilidad: una vez commiteada, persiste aunque se caiga el sistema (WAL/redo log).

Ejemplo clásico — transferencia bancaria:
[ver código en la app]
Sin ACID:
- Sin A: si crashea entre los 2 updates → A perdió 100 y B no ganó nada (catástrofe).
- Sin C: una constraint saldo >= 0 la viola → estado inválido.
- Sin I: otra tx leyendo en medio vería 99 (uno restado, otro no sumado).
- Sin D: commit + corte de luz → cambios perdidos.

Mismo flujo en Java/Spring (delegando la atomicidad al PlatformTransactionManager):
[ver código en la app]

Las BD relacionales (Postgres, Oracle, MySQL InnoDB) las garantizan; muchas NoSQL relajan C/I a favor de disponibilidad y escala (teorema CAP, modelo BASE). MongoDB desde 4.0 soporta transacciones multi-documento pero con coste — la regla sigue siendo modelar agregados para que un cambio quepa en un solo documento.

💡 Tip de entrevista: si te preguntan por ACID, dilo claro y rápido. La C es la más confusa: NO es "datos correctos", es "respeta las reglas de integridad" (constraints, invariantes). Atomicidad ≠ Consistencia.

---

**Pregunta 9:** ¿Qué niveles de aislamiento existen y qué anomalías evita cada uno?

**Respuesta:** [ver código en la app]

Las anomalías visualmente:
[ver código en la app]

Reglas prácticas:
- READ COMMITTED es el default sensato. La mayoría de apps funcionan bien aquí.
- REPEATABLE READ si necesitas que la misma fila NO cambie a media transacción (típico en informes que recorren registros). Postgres con MVCC casi te lo da gratis.
- SERIALIZABLE solo si la corrección lo exige (financiero, contabilidad, reservas con disponibilidad limitada). Caro en concurrencia.
- En Spring lo subes con @Transactional(isolation = Isolation.REPEATABLE_READ).

💡 Caso real (Avanttic, Oracle 19c): para evitar dobles asignaciones de números de factura tuve que subir a SERIALIZABLE el método de "siguiente número". Alternativa más limpia: una secuencia de Oracle, que ya es atómica → casi siempre prefieres usar la herramienta nativa que subir aislamiento.

💡 Tip: las anomalías están en el estándar SQL-92 pero Postgres tiene una rareza: su "REPEATABLE READ" es realmente "snapshot isolation" y NO produce phantoms para queries normales, solo en write skew. Su SERIALIZABLE añade detección de write skew.

---

**Pregunta 10:** ¿Qué diferencia hay entre un índice clustered y uno non-clustered?

**Respuesta:** [ver código en la app]

En PostgreSQL: no hay distinción explícita. La PK crea automáticamente un índice B-Tree único. El "clustered scan" existe como operación (CLUSTER tabla USING indice), pero no se mantiene automáticamente. Index-only scan (con INCLUDE) es la alternativa práctica.

En MySQL InnoDB: la PK siempre es el clustered index. Si no defines PK, MySQL elige una columna UNIQUE NOT NULL o crea una PK oculta. Esto explica por qué en MySQL las PKs autoincrementales son mucho más eficientes que UUIDs aleatorios para tablas grandes (los UUIDs rompen el orden físico → page splits frecuentes).

---

**Pregunta 11:** ¿Cuándo usarías MongoDB (documental) en vez de una relacional? ¿Cómo modelas?

**Respuesta:** MongoDB guarda documentos (JSON/BSON) agrupados en colecciones, sin esquema rígido. Encaja cuando:
- Los datos son jerárquicos/agregados que se leen juntos (un pedido con sus líneas en un solo documento) → menos joins.
- El esquema evoluciona rápido o es heterogéneo.
- Necesitas escalado horizontal (sharding) y alta velocidad de escritura.

Modelado (distinto al relacional): embeber vs referenciar. Embebes lo que se lee/escribe junto y es propiedad del agregado (línea de pedido dentro del pedido); referencias (guardas el id) cuando la relación es N:M, el sub-documento crece sin límite, o se consulta por separado. No normalizas a 3FN: modelas según los patrones de acceso. Trade-off: sin joins ni transacciones multi-documento clásicas (aunque Mongo moderno las soporta), y duplicación controlada.

---

**Pregunta 12:** ¿Qué es la persistencia políglota y cuándo combinarías varias BBDD?

**Respuesta:** Persistencia políglota: usar el almacén adecuado para cada necesidad dentro del sistema, en vez de forzar todo en una sola BD. Ejemplos de combinación:
- Relacional (Postgres/Oracle) para datos transaccionales con integridad fuerte.
- Documental (MongoDB) para agregados que se leen juntos y esquema flexible.
- Redis como caché, sesiones, rate limiting o locks distribuidos.
- Búsqueda (Elasticsearch) para full-text.
- Object storage (S3/MinIO) para ficheros/binarios.

En microservicios encaja con database-per-service: cada servicio elige su almacén. Coste: más piezas que operar, consistencia eventual entre ellas y sincronización (eventos/CDC). La regla: justifícalo por el patrón de acceso, no por coleccionar tecnologías.

---

**Pregunta 13:** ¿Qué es Neo4j y para qué se usa una BD de grafos?

**Respuesta:** Neo4j es la BD de grafos más conocida. Modela los datos como nodos (entidades con etiquetas y propiedades) conectados por relaciones (también con tipo, dirección y propiedades). A diferencia de una relacional donde un join es "unir tablas", aquí seguir una relación es O(1) (es un puntero físico): perfecto cuando lo que importa son las conexiones y haces consultas profundas (3-N saltos).

Casos donde brilla:
- Redes sociales / recomendaciones ("amigos de amigos").
- Detección de fraude (cadenas de transacciones).
- Knowledge graphs y motores semánticos.
- Topología/GIS de activos: en Ágata Next se usa para modelar la red de cámaras, sensores y elementos del puerto y sus relaciones espaciales/operativas.
- Recorridos de dependencias (servicios, paquetes).

No sustituye a tu BD principal: convive con relacional/documental cuando el valor está en las relaciones, no en los registros.

---

**Pregunta 14:** ¿Qué es Cypher y cómo se escribe una query típica en Neo4j?

**Respuesta:** Cypher es el lenguaje declarativo de Neo4j: "dibujas" patrones de nodos y relaciones con sintaxis ASCII-art.

- Nodo: (p:Persona {nombre: 'Raúl'}) — la etiqueta :Persona, propiedades entre llaves.
- Relación dirigida: (a)-[:CONOCE]->(b). Sin dirección: (a)-[:CONOCE]-(b).
- Camino de varios saltos: (a)-[:CONOCE*2..3]->(b) (entre 2 y 3 saltos).

Query: amigos de amigos de Raúl que no son sus amigos directos:
[ver código en la app]
Operaciones: MATCH (busca patrón), WHERE (filtra), RETURN (proyecta), CREATE/MERGE (inserta/upsert), SET/REMOVE, WITH (pipeline entre cláusulas). Hay índices por etiqueta+propiedad para acelerar MATCH.

---

**Pregunta 15:** ¿Cuándo elegir Neo4j frente a relacional o documental?

**Respuesta:** Decide por la forma de los datos y sobre todo por el patrón de acceso:
- Relacional (Postgres/MySQL): integridad fuerte, transacciones, datos tabulares, joins simples y pocos. Default razonable.
- Documental (Mongo): agregados que se leen juntos, esquema flexible, escala horizontal (sharding).
- Grafo (Neo4j): las relaciones son protagonistas. Recorridos de varios saltos, caminos, vecindarios, ciclos, comunidades. En relacional son joins en cadena (lentos y verbosos); en Neo4j son operaciones O(salto) nativas.

[ver código en la app]

Señales de que Neo4j encaja:
- La query natural es "dame X relacionado con Y a N saltos cumpliendo Z".
- Las relaciones tienen propiedades (peso, fecha, tipo).
- El modelo evoluciona y aparecen nuevos tipos de relación con frecuencia.
- Recorridos recursivos / caminos más cortos / vecindarios / detección de comunidades.

No lo uses como BD principal por defecto: lo normal es políglota — relacional/documental como almacén primario y Neo4j para el subdominio donde la red importa. Justo lo que hace Agata Next (Mongo es el principal, Neo4j para topología GIS/relaciones de entidades).

---

**Pregunta 16:** ¿Qué es MVCC (Multi-Version Concurrency Control)?

**Respuesta:** MVCC es la estrategia que usan Postgres, Oracle y otras BD para que lectores no bloqueen escritores y viceversa. En vez de bloquear filas al leerlas, la BD mantiene varias versiones de cada fila: cada transacción ve un snapshot consistente del estado de la BD en el momento que empezó (o en cada query, según el nivel de aislamiento).

Mecánica simplificada:
- Cada fila lleva metadatos de versión (xmin/xmax en Postgres).
- Cuando actualizas, NO se borra la fila vieja: se marca como obsoleta y se inserta la nueva.
- Lectores ven la versión visible a su transacción → no esperan locks de escritura.
- Un proceso de mantenimiento (VACUUM en Postgres) limpia versiones obsoletas que ya no ve ninguna transacción activa.

Ventajas: alta concurrencia, lecturas consistentes sin bloqueo. Coste: hinchazón de tablas/índices ("bloat") si VACUUM no va al día, y queries de larga duración impiden limpiar versiones (visibilidad atrás).

💡 Analogía: Wikipedia. Tú estás leyendo un artículo mientras otro lo edita. Tú ves la versión publicada hasta que él guarda; los siguientes lectores verán la nueva. Nadie tiene que esperar a que el editor termine para poder leer. Las versiones viejas se conservan en el historial (hasta que alguien lo limpie).

---

**Pregunta 17:** ¿Qué es un deadlock en BD y cómo se evita?

**Respuesta:** Un deadlock ocurre cuando dos (o más) transacciones se bloquean mutuamente: T1 tiene un lock sobre la fila A y espera B; T2 tiene B y espera A. Nadie avanza. La BD detecta el ciclo en su grafo de espera y mata una de las transacciones (devuelve un error tipo deadlock detected); la app debe reintentar.

Causas habituales: actualizar las mismas filas en orden distinto desde varios procesos, transacciones largas que tocan muchas filas, escaladas de lock (row → page → table).

Prevención:
- Acceder a recursos siempre en el mismo orden (p.ej. ordenar por id antes de actualizar).
- Transacciones cortas y con scope mínimo.
- Usar SELECT ... FOR UPDATE en el orden correcto cuando necesitas bloquear varias filas.
- Niveles de aislamiento más bajos (READ COMMITTED) reducen exposición.
- Reintentos con backoff en la aplicación cuando la BD mata por deadlock (es esperable, no excepcional).

Monitoriza: la BD expone métricas de deadlocks (Postgres: pg_stat_database.deadlocks).

💡 Analogía: dos coches en un puente de una sola dirección, frente a frente. Ninguno cede → atascados. La solución es la misma regla para todos ("el de la derecha siempre cede") — en BD: pedir locks siempre en el mismo orden, ordenando por id antes de actualizar.

---

**Pregunta 18:** Data lakehouse y data mesh: arquitecturas de datos modernas.

**Respuesta:** Evolución de las arquitecturas de datos (más allá de las BD operacionales):

- Data warehouse (Snowflake, Redshift, BigQuery): datos estructurados y modelados (estrella/copo de nieve) para analítica. Caro y rígido pero rápido en queries SQL grandes.
- Data lake (S3, HDFS): datos crudos de cualquier formato (parquet, JSON, vídeo). Barato pero "data swamp" si nadie lo gobierna.
- Data lakehouse (Databricks/Delta Lake, Apache Iceberg, Apache Hudi): lo mejor de ambos. Datos sobre object storage (S3) con formato columnar (Parquet) y una capa de metadatos (Delta/Iceberg/Hudi) que añade transacciones ACID, time travel, schema enforcement, particionado. Consultable por motores SQL (Spark, Trino, Athena) directamente sobre el object storage.

Data mesh (Zhamak Dehghani): paradigma organizativo, no técnico. En vez de un equipo central de "big data" que todo el mundo espera, cada bounded context posee sus datos como un producto: equipo de Pagos publica un dataset versionado y documentado de "pagos confirmados"; otros lo consumen como una API. Principios: ownership descentralizado, datos como producto, plataforma self-serve, gobernanza federada.

Conexión con event-driven: los eventos de Kafka (vía CDC o publicación directa) alimentan el lakehouse → ETL más simple. En sistemas reales encaja con el patrón outbox/CDC → Kafka → S3 (parquet) → analytics.

---

### SQL (12 preguntas)

**Pregunta 1:** Tabla A (5 registros) LEFT JOIN tabla B (10 registros). ¿Cuántos registros devuelve? ¿Y al revés?

**Respuesta:** LEFT JOIN A ⟕ B: devuelve al menos 5 filas (una por cada fila de A).

[ver código en la app]

Respuesta que esperan: 5 (suponiendo 1:1), pero correcto es "al menos 5, dependiendo de las cardinalidades". El LEFT garantiza no perder filas de la tabla izquierda; las que no tienen match reciben NULLs.

💡 Mnemónico: LEFT JOIN = "quiero TODOS de la izquierda, con o sin pareja. Los que no tienen pareja van con NULLs." INNER JOIN = "solo los que tienen pareja en ambos lados."

---

**Pregunta 2:** ¿Cuántos registros devuelve un INNER JOIN entre dos tablas si solo hay 3 coincidencias? ¿Qué hace un INNER JOIN?

**Respuesta:** 3 filas si cada id de la tabla A coincide con exactamente 1 fila de B. Si hay coincidencias múltiples, se multiplica.

[ver código en la app]

Resultado: 3 filas (solo las filas con coincidencia en ambas tablas).

Variante: si B tuviera 2 filas con id=1 → el JOIN devolvería 4 filas (producto cartesiano de los matches). INNER JOIN no garantiza cardinalidad; depende de los datos.

---

**Pregunta 3:** Si haces ORDER BY 1, ¿por qué columna estás ordenando? ¿De qué tabla?

**Respuesta:** Por la primera columna del SELECT si usas ORDER BY 1. Es posicional (1-indexed). Si la query es SELECT nombre, edad FROM users ORDER BY 2, ordena por edad.

[ver código en la app]

Regla práctica: no uses ORDER BY 1, ORDER BY 2 en código de producción. Si alguien reordena el SELECT, el ORDER BY cambia silenciosamente de semántica y nadie lo detecta hasta que falla.

Truco de entrevista: pregunta frecuente con GROUP BY — recuerda que ORDER BY puede referenciar columnas que NO están en el SELECT (a diferencia de GROUP BY).

---

**Pregunta 4:** ¿Qué tipos de JOIN existen y en qué se diferencian?

**Respuesta:** [ver código en la app]

Ejemplos con la misma data — clientes(1,2,3) y pedidos(P1→c1, P2→c1, P3→c2):
[ver código en la app]

SELF JOIN — jerarquía empleado → jefe (misma tabla, alias distinto):
[ver código en la app]

Los OUTER se usan para "tráeme todo X aunque no tenga Y"; el INNER para "solo lo que casa". CROSS rara vez intencionado — si te aparece sin ON por error, las filas explotan.

💡 Tip antitrampa: si te preguntan "A(5) LEFT JOIN B(10), ¿cuántas filas?" — responde "al menos 5", no "5" a secas. La cardinalidad de la relación cambia el número (si una fila de A casa con 3 de B, son 3 filas).

💡 Trampa LEFT vs RIGHT en escritura: A LEFT JOIN B == B RIGHT JOIN A. Convención: usa siempre LEFT y reordena las tablas si hace falta — los RIGHT JOIN en código real son confusos para el lector.

---

**Pregunta 5:** ¿Qué diferencia hay entre WHERE y HAVING? ¿Cómo encaja GROUP BY?

**Respuesta:** WHERE filtra antes de agrupar (sobre filas individuales).
HAVING filtra después de agrupar (sobre el resultado del GROUP BY).

[ver código en la app]

Regla: si puedes poner la condición en WHERE → ponla ahí (el motor filtra filas antes de agrupar → más eficiente). HAVING solo cuando la condición depende de un agregado (COUNT, SUM, AVG, MAX, MIN) o de un resultado de GROUP BY.

[ver código en la app]

---

**Pregunta 6:** ¿En qué orden lógico ejecuta el motor las cláusulas de un SELECT?

**Respuesta:** El motor no ejecuta en el orden en que escribes la query. El orden lógico es:

[ver código en la app]

Consecuencias prácticas:
- No puedes usar un alias del SELECT en el WHERE (aún no existe).
- Puedes usar alias en ORDER BY (paso 7, después del SELECT).
- Los filtros en WHERE reducen el dataset antes del GROUP BY → siempre más eficiente que HAVING para condiciones que no dependen de agregados.
- Los índices se evalúan en los pasos 1-2; meterlos en WHERE o JOIN es clave para que los use.

---

**Pregunta 7:** ¿Cómo se comporta NULL en comparaciones y agregados? ¿COUNT(*) vs COUNT(col)?

**Respuesta:** NULL en SQL significa valor desconocido, no cero ni vacío. Esto tiene implicaciones que se olvidan fácilmente:

[ver código en la app]

NULL en agregados:
[ver código en la app]

Manejo:
[ver código en la app]

---

**Pregunta 8:** ¿Cuándo usar una subquery vs un JOIN? ¿Diferencia entre IN y EXISTS?

**Respuesta:** - JOIN cuando necesitas columnas de ambas tablas en el resultado. 
- Subquery cuando sólo quieres filtrar o calcular un valor derivado y no necesitas exponer la otra tabla.

IN vs EXISTS (filtrar por existencia en otra tabla):
- WHERE id IN (SELECT ...): materializa la lista; ojo, si la subquery devuelve NULLs con NOT IN el resultado puede vaciarse inesperadamente.
- WHERE EXISTS (SELECT 1 FROM ... WHERE ...): para en cuanto encuentra una fila (correlacionada); suele ser más eficiente con subconjuntos grandes y es seguro frente a NULLs.

En motores modernos el optimizador a menudo los reescribe a un semi-join equivalente, pero EXISTS/NOT EXISTS es la opción robusta por defecto.

---

**Pregunta 9:** ¿Diferencia entre INNER JOIN y RIGHT JOIN? ¿Cuál devuelve más tuplas?

**Respuesta:** [ver código en la app]

¿Cuál devuelve más filas?
- INNER JOIN: devuelve solo los matches → puede devolver 0 si no hay ninguno.
- RIGHT JOIN A B: garantiza todas las filas de B → al menos las filas de B.
- Si el RIGHT tiene filas sin match en A → aparecen con NULLs en las columnas de A.

[ver código en la app]

💡 Regla de dedo: evita RIGHT JOIN — cualquier A RIGHT JOIN B se escribe más claro como B LEFT JOIN A. El Right es semánticamente idéntico pero confunde la lectura.

---

**Pregunta 10:** ¿Qué son las window functions y un ejemplo (ROW_NUMBER, RANK)?

**Respuesta:** Las window functions ejecutan un cálculo sobre una "ventana" de filas relacionadas con la fila actual, sin colapsar los grupos como hace GROUP BY. Cada fila mantiene su identidad y obtiene un valor calculado.

Sintaxis: funcion() OVER (PARTITION BY ... ORDER BY ...).

Ejemplo — ranking de pedidos por cliente:
[ver código en la app]

Resultado:
[ver código en la app]

Funciones útiles:
- ROW_NUMBER(): 1, 2, 3... sin empates.
- RANK(): empates comparten número, salta el siguiente (1, 1, 3).
- DENSE_RANK(): empates comparten, no salta (1, 1, 2).
- LAG/LEAD(col, n): fila anterior/siguiente — útil para calcular diferencias entre filas consecutivas.
- SUM/AVG/COUNT sobre la ventana: corre acumulados sin agrupar.

Caso típico: "último pedido por cliente" sin subquery → filtra WHERE num = 1 (con CTE o subquery) sobre el ROW_NUMBER.

---

**Pregunta 11:** ¿Qué son las CTEs (WITH) y para qué sirven las recursivas?

**Respuesta:** Una CTE (Common Table Expression) es una subquery nombrada antes del SELECT principal, con WITH. Mejora legibilidad y permite reusar:
[ver código en la app]

CTE recursiva (WITH RECURSIVE): para datos jerárquicos/grafo en SQL — explosión de un árbol de categorías, jefe→empleados→sub-empleados, lista de materiales:
[ver código en la app]

Vs subqueries: las CTE son más legibles y se pueden referenciar varias veces. Postgres antes las "materializaba" (caja negra para el optimizer); desde PG12 son inlinables salvo que las marques MATERIALIZED.

---

**Pregunta 12:** ¿Cómo hago un UPSERT (insertar o actualizar) en SQL?

**Respuesta:** Insertar si no existe, actualizar si existe sin condiciones de carrera. Cada motor tiene su sintaxis:

PostgreSQL (ON CONFLICT):
[ver código en la app]

MySQL (ON DUPLICATE KEY UPDATE):
[ver código en la app]

SQL Server / Oracle: MERGE INTO ... USING ... ON ... WHEN MATCHED ... WHEN NOT MATCHED.

Usos típicos:
- Consumers idempotentes (Kafka at-least-once): el UPSERT por id de mensaje evita duplicar efectos en reintentos.
- Sincronización desde otra fuente sin saber si la fila ya existe.
- Counters/contadores atómicos.

Ventaja sobre "buscar y luego INSERT/UPDATE": atómico y sin la race condition de dos hilos comprobando a la vez.

---

### PERF (9 preguntas)

**Pregunta 1:** ¿Qué ventajas tiene usar un PreparedStatement? ¿Por qué se usaba?

**Respuesta:** 1. Seguridad: previene SQL injection. Los parámetros se envían separados del SQL y el motor los trata como datos, no como código.
2. Performance / plan cache: el motor parsea, planifica y optimiza una sola vez; ejecuciones posteriores reutilizan el plan. Útil con la misma query ejecutada muchas veces.
3. Tipado: pasas parámetros con tipos Java — evita errores de formato y quoting.

[ver código en la app]

En Spring / JPA: @Query con parámetros (?1, :nombre) usa internamente PreparedStatement. Si usas EntityManager.createNativeQuery o @Query(nativeQuery=true), también.

💡 Anti-patrón con JPA: entityManager.createQuery("SELECT p FROM Pedido p WHERE p.estado = '" + estado + "'") — concatenación en JPQL también es vulnerable. Siempre usa parámetros nombrados: WHERE p.estado = :estado.

---

**Pregunta 2:** ¿Has sacado alguna vez un plan de ejecución? ¿Qué es?

**Respuesta:** Respuesta personal — di sí si lo has tocado (PL/SQL en Avanttic, Postgres en mercado mayorista / Agata).

El plan de ejecución es la estrategia que el optimizador del motor decide para resolver una query: qué tablas lee, en qué orden, qué índices usa, qué algoritmo de join (nested loop, hash join, merge join), qué operaciones (seq scan, index scan, sort, hash, filter).

Cómo sacarlo:
[ver código en la app]

Salida típica de Postgres (de dentro hacia fuera):
[ver código en la app]

Qué leer:
- De adentro afuera, de derecha a izquierda: las hojas son accesos a tabla; la raíz, el resultado final.
- Index Scan (bueno) vs Seq Scan (sospechoso si la tabla es grande). Aquí el filtro pega contra idx_pedidos_estado_fecha — perfecto.
- Nested Loop vs Hash Join vs Merge Join: el optimizador elige según cardinalidad esperada. Nested Loop bien para 'pocos × pocos'; Hash Join para 'muchos × muchos'.
- cost = estimación abstracta (no ms). actual time son ms reales (con ANALYZE).
- rows estimadas vs reales: si difieren 10× → estadísticas obsoletas, corre ANALYZE tabla.
- loops=N: el nodo se ejecutó N veces. Multiplica actual time × loops para coste real.

Caso real que vimos optimizando: una query con JOIN daba Seq Scan de 2M filas porque la columna del WHERE estaba envuelta en LOWER(email). Solución: índice funcional CREATE INDEX ON usuarios(LOWER(email)) → Index Scan, query de 800ms a 5ms.

💡 Tip: en Postgres, https://explain.depesz.com/ o pgAdmin te visualizan el árbol con código de colores. Pega tu output ahí, te ahorra leerlo a pelo.

---

**Pregunta 3:** ¿Cuándo sacas un plan de ejecución? ¿Qué buscas en el árbol?

**Respuesta:** Cuándo: cuando una query es lenta, escala mal con el tamaño, sospechas que no usa un índice, o estás validando que un cambio (índice nuevo, refactor) ha tenido efecto.

Qué buscas:
- Full table scans (seq scan) inesperados sobre tablas grandes → falta de índice o el optimizador decidió que no compensa.
- Índices que esperabas usar pero no se usan (estadísticas obsoletas, función sobre la columna, cast implícito).
- Joins ineficientes (nested loop con muchas filas en el lado externo).
- Sorts y hash caros en memoria/disco.
- Estimaciones vs reales muy distintas (con EXPLAIN ANALYZE): suele indicar estadísticas obsoletas (ANALYZE).
- El coste de cada nodo y el coste acumulado.

---

**Pregunta 4:** ¿Qué representa el coste en un plan de ejecución? ¿Cómo afecta un índice al coste?

**Respuesta:** El coste en un plan de ejecución (EXPLAIN en PostgreSQL) es una estimación relativa del trabajo que el motor cree que tendrá que hacer: no son milisegundos, son unidades arbitrarias basadas en el número de páginas de disco a leer, CPU estimada y filas procesadas.

[ver código en la app]

Qué buscar en un plan:
- Seq Scan en tablas grandes → posible candidato a índice (si es filtrado).
- Hash Join vs Nested Loop vs Merge Join → el planner elige según cardinalidades estimadas.
- rows=X (estimado) vs rows=Y (real) muy distintos → estadísticas desactualizadas → ANALYZE tabla.
- loops=N → el nodo se ejecuta N veces (ojo con Nested Loop en tablas grandes).

[ver código en la app]

En Agata Next: queries críticas (proyecciones de OpenSearch, consultas de estado de dispositivo) tienen su plan documentado y se revisan con pg_stat_statements + alertas de Grafana si la latencia p99 sube.

---

**Pregunta 5:** ¿Qué tipos de índice hay y cuándo usar cada uno?

**Respuesta:** [ver código en la app]

[ver código en la app]

En Agata Next (PostgreSQL CNPG): índices B-Tree en FKs y campos de búsqueda frecuente, GIN en columnas JSONB de metadata de dispositivos, BRIN en tablas de eventos de telemetría (append-only, millones de filas).

---

**Pregunta 6:** ¿Cuándo un índice PERJUDICA en lugar de ayudar?

**Respuesta:** Un índice siempre tiene un coste — solo compensa si la ganancia en lecturas supera ese coste.

Cuándo perjudica:
[ver código en la app]

[ver código en la app]

---

**Pregunta 7:** ¿Qué es un covering index / index-only scan?

**Respuesta:** Un covering index (índice de cobertura) es un índice que contiene todas las columnas que necesita una query — así el motor obtiene los datos directamente del índice sin tocar la tabla (index-only scan).

[ver código en la app]

[ver código en la app]

Cuándo usarlo: queries de solo lectura muy frecuentes que devuelven pocas columnas de una tabla grande. No lo apliques a todo — el índice más grande consume más memoria y ralentiza escrituras.

---

**Pregunta 8:** ¿Qué es el problema N+1 de consultas y cómo se resuelve?

**Respuesta:** El N+1 ocurre cuando cargas una lista de N entidades con 1 query y luego, al acceder a una relación lazy de cada una, se dispara 1 query por elemento → 1 + N queries. Típico en JPA/Hibernate al recorrer pedido.getLineas() en un bucle.

Se detecta viendo el log de SQL (ráfaga de selects idénticos) o con EXPLAIN lo notas por el volumen.

Soluciones:
- JOIN FETCH en JPQL o @EntityGraph para traer la relación de una vez.
- @BatchSize / hibernate.default_batch_fetch_size: agrupa los lazy en pocas queries IN (...).
- A veces una proyección/DTO con un solo join es lo más limpio.

Cuidado: JOIN FETCH de varias colecciones a la vez multiplica filas (producto cartesiano).

💡 Analogía: tienes que cocinar un menú de 10 platos y vas a la cocina plato por plato preguntando la receta de cada uno (1 lista + 10 viajes = 11 idas). Mejor: pides el menú completo de una sola vez (1 viaje). N+1 es ese error en código.

---

**Pregunta 9:** Connection pool (HikariCP): por qué y cómo tunearlo.

**Respuesta:** Abrir/cerrar conexiones a la BD es caro (TCP + autenticación + setup). Una app sin pool gasta más tiempo abriendo conexiones que ejecutando SQL.

Un pool mantiene N conexiones abiertas y las presta y devuelve. HikariCP es el default de Spring Boot (rápido, ligero).

Parámetros clave:
- maximumPoolSize: tamaño máximo. Regla práctica: no más conexiones que cores de la BD × 2-4. Más conexiones ≠ más velocidad (la BD se satura). Default 10, suele bastar.
- minimumIdle: conexiones mantenidas abiertas siempre. Si tu carga es estable, igual a maximumPoolSize.
- connectionTimeout: cuánto espera para obtener una conexión antes de fallar (30s default). En aplicaciones críticas, bájalo (3-5s) para fallar rápido.
- idleTimeout / maxLifetime: rotación de conexiones (importante: maxLifetime debe ser < el timeout de la BD para evitar errores "connection closed").
- leakDetectionThreshold: detecta conexiones que la app pidió y no devolvió (bug).

Problema común: pool agotado por transacciones largas (@Transactional con I/O dentro) → contención. Mantén transacciones cortas y mide con métricas (Micrometer expone Hikari stats).

💡 Analogía: el parking de la oficina. 50 plazas para 200 empleados. Los que llegan usan las libres; los demás esperan o se van. Sin pool, cada empleado dejaría "su" plaza vacía la mayor parte del día — ineficiente. Si dimensionas mal: 5 plazas y todos esperan; 500 plazas y desperdicias espacio.

---
