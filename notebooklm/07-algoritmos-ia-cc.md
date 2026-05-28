# Algoritmos · Inteligencia Artificial · Claude Code

> Big-O, estructuras de datos, LLMs, RAG, prompt injection, Claude Code agentic.

## Chuletas (puntos clave)

### ALGO

- Big-O: O(1)<log n<n<n log n<n²<2ⁿ. Identifica el peor caso asintótico.
- ArrayList: get O(1), insert end amortized O(1), insert middle O(n). LinkedList rara vez es la mejor.
- HashMap: O(1) promedio. Java 8+: bucket con árbol rojinegro si >8 entradas → O(log n) peor caso.
- TreeMap/TreeSet: O(log n), ordenado. PriorityQueue: heap binario, O(log n).
- BFS = cola, camino más corto en aristas. DFS = pila/recursión, ciclos, topológico. Ambos O(V+E).
- Memoization (top-down) y DP (bottom-up): subestructura óptima + subproblemas solapados.
- Java sort: Arrays.sort primitivos = dual-pivot quicksort; Collections.sort = TimSort (estable).
- Patrones: two pointers, sliding window, divide y vencerás, greedy, backtracking.
- Concurrentes: ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue, LongAdder.

### CC

- Agentic (ejecuta) > autocomplete. Loop think→act→observe.
- CLAUDE.md: memoria del proyecto. Reglas/convenciones/comandos. NO código, NO secrets, NO git history.
- Subagents: aislan contexto, paralelizan, especializan (test-writer, architect).
- Plan mode para cambios grandes; aprobación humana antes de aplicar.
- Hooks: scripts en eventos (PreToolUse/PostToolUse/Stop).
- MCP = estándar abierto para integrar fuentes externas (Jira, GitHub, BBDD).
- NO delegues: arquitectura, revisión final, seguridad, código propietario en chats públicos.
- Verifica siempre: tests + build verde + lee el diff. La IA puede alucinar APIs.

## Flashcards: Algoritmos + IA + Claude Code

### ALGO (10 preguntas)

**Pregunta 1:** ¿Qué es la notación Big-O y cuándo importa?

**Respuesta:** Big-O describe cómo crece el tiempo o espacio de un algoritmo en función del tamaño de la entrada n, ignorando constantes y términos menores. Se centra en el peor caso asintótico.

Clases comunes (de mejor a peor): O(1) constante · O(log n) logarítmica (búsqueda binaria) · O(n) lineal · O(n log n) (sort eficiente) · O(n²) cuadrática · O(2ⁿ) exponencial · O(n!) factorial.

Cuándo importa: cuando n puede crecer mucho. Un O(n²) con n=100 es 10.000 operaciones (vale); con n=10⁶, es 10¹² (no termina). En entrevistas de arquitectura no te piden resolver LeetCode hard, pero sí que identifiques la complejidad de un loop anidado o por qué un índice en BD baja una query de O(n) a O(log n).

---

**Pregunta 2:** Estructuras lineales: ¿array, lista enlazada, stack, queue, deque?

**Respuesta:** [ver código en la app]

- ArrayList: la opción default en Java. Cache-friendly (memoria contigua), acceso por índice O(1). Insertar al final es amortizado O(1) (realloc ocasional). Insertar en medio cuesta O(n) por el desplazamiento.
- LinkedList: rara vez la mejor opción en Java vs ArrayList (peor rendimiento real por caché misses, overhead de objetos). Solo gana cuando tienes la referencia al nodo Y necesitas insert/delete O(1) en el interior.
- Stack: usa Deque<T> con ArrayDeque — la clase Stack está obsoleta (sincronizada, hereda de Vector).
- Queue / Deque: ArrayDeque es la implementación general. Para concurrencia: LinkedBlockingQueue, ArrayBlockingQueue.
- PriorityQueue: heap binario — extrae siempre el mínimo (o máximo con comparador). Útil para tareas priorizadas, Dijkstra, scheduling.

💡 Regla: ArrayList para la mayoría de los casos. ArrayDeque para pilas y colas. PriorityQueue cuando necesitas orden por prioridad. LinkedList casi nunca.

---

**Pregunta 3:** ¿Cómo funciona un HashMap? ¿Por qué su acceso es "O(1) promedio"?

**Respuesta:** Un HashMap usa una tabla hash: aplica hash(key) al objeto, lo reduce módulo el tamaño del array de buckets, y guarda la entrada ahí. Lookup/insert/delete son O(1) en promedio.

Problemas:
- Colisiones (dos claves con el mismo bucket): se resuelven con encadenamiento (lista enlazada por bucket; en Java 8+ árbol rojinegro si la lista crece >8 → O(log n) en el peor caso, mejor que O(n)) o open addressing.
- Si la tabla se llena (load factor > 0.75 en Java) se rehashea: tabla nueva al doble + reasignar todas las entradas (O(n) puntual).
- equals y hashCode consistentes: si dos objetos son iguales (equals), sus hashCodes deben coincidir; si no, no los encuentras en el map.

HashSet es un HashMap con valores dummy. LinkedHashMap mantiene orden de inserción. TreeMap ordena por clave (O(log n)).

💡 Analogía: un armario con etiquetas. En vez de abrir cajón por cajón buscando tus calcetines (lista, O(n)), miras la etiqueta y vas directo (HashMap, O(1)). El lío sólo aparece cuando dos cosas chocan en la misma etiqueta (colisión) — entonces tienes que mirar 2-3 cosas dentro del cajón.

---

**Pregunta 4:** Árboles binarios, BST y heap: ¿en qué se diferencian?

**Respuesta:** - Árbol binario: cada nodo tiene como mucho 2 hijos. Estructura genérica.
- BST (Binary Search Tree): para cada nodo, los izquierdos son menores y los derechos mayores → búsqueda/inserción O(log n) si está balanceado. Sin balanceo se degenera a O(n) (lista enlazada). Variantes auto-balanceadas: AVL, rojinegro (el de TreeMap/TreeSet en Java).
- Heap (binario): árbol completo donde la raíz es el máximo (max-heap) o mínimo (min-heap); insertar/quitar la raíz es O(log n), peek O(1). Implementado como array. Es la base de PriorityQueue y de heap sort.
- B-Tree / B+Tree: árboles n-arios balanceados; los usan las BD para índices porque minimizan accesos a disco (muchas claves por nodo).
- Trie: árbol de prefijos para strings; búsqueda por prefijo O(longitud_clave).

---

**Pregunta 5:** Grafos: representación, BFS vs DFS, ¿cuándo cada uno?

**Respuesta:** Representación:
- Lista de adyacencia (Map<Nodo, List<Nodo>>): O(V+E) memoria; ideal para grafos dispersos. Lo más común.
- Matriz de adyacencia (boolean[V][V]): O(V²) memoria; para grafos densos o consultar "¿arista A↔B?" en O(1).

BFS vs DFS sobre el mismo grafo:
[ver código en la app]

[ver código en la app]

Ambos O(V+E). BFS para camino más corto (saltos mínimos); DFS para ciclos, orden topológico, componentes conexas. Para grafos ponderados: Dijkstra (pesos positivos) o Bellman-Ford (negativos).

---

**Pregunta 6:** Recursión, memoization y programación dinámica.

**Respuesta:** Recursión: una función que se llama a sí misma sobre un subproblema más pequeño + caso base. Elegante para árboles, grafos, divide y vencerás. Riesgo: stack overflow si la profundidad es muy grande; algunos lenguajes optimizan tail calls, Java no.

Memoization (top-down): cacheas el resultado de cada subproblema para no recomputarlo. Convierte un exponencial en polinómico — ej. Fibonacci ingenuo es O(2ⁿ); memoizado es O(n).

Programación dinámica (DP) (bottom-up): rellenas una tabla desde los casos base hasta el problema final. Misma idea que memoization, pero iterativa (sin recursión).

Condiciones para DP: subestructura óptima (la solución del problema se compone de soluciones de subproblemas) y subproblemas solapados (los mismos subproblemas aparecen una y otra vez). Ejemplos: Fibonacci, mochila, edit distance, longest common subsequence.

En entrevistas de arquitectura raramente piden resolver DP, pero reconocer que un problema es DP es la pista que esperan.

---

**Pregunta 7:** Algoritmos de ordenación: ¿cuáles conoces y cuál usa Java?

**Respuesta:** - Bubble / Insertion / Selection sort: O(n²) — solo educativos o para n diminuto.
- Merge sort: O(n log n) garantizado, estable, requiere O(n) extra. Divide y vencerás.
- Quick sort: O(n log n) promedio, O(n²) peor caso (con pivote malo). No estable. Muy rápido en la práctica.
- Heap sort: O(n log n) garantizado, in-place, no estable. Usa un heap.
- Tim sort: híbrido merge + insertion. Es el que usa Arrays.sort para objetos y Collections.sort en Java. Estable, O(n log n), aprovecha runs ya ordenados.
- Counting / Radix / Bucket sort: lineales O(n+k) en condiciones especiales (claves enteras acotadas).

En entrevistas: saber que Arrays.sort de primitivos usa quicksort dual-pivot y Collections.sort usa Timsort. Para BD, no ordenas en Java si puedes; lo haces en SQL con índice.

---

**Pregunta 8:** Patrones algorítmicos comunes: two pointers, sliding window, divide y vencerás, greedy.

**Respuesta:** - Two pointers: dos índices que se mueven sobre un array (mismo o extremos opuestos). Resuelve "¿hay dos elementos que sumen X?" en O(n) sobre array ordenado.
- Sliding window: una ventana de tamaño fijo o variable que se desliza. Resuelve "máximo / suma en una subarray de tamaño K" o "subarray con suma ≤ X" en O(n).
- Divide y vencerás: divides el problema en mitades, resuelves recursivamente, combinas. Merge sort, búsqueda binaria, mediana en tiempo lineal. T(n) = 2·T(n/2) + O(n) → O(n log n).
- Greedy: tomas la decisión localmente óptima en cada paso. Funciona cuando hay propiedad greedy (Huffman, Kruskal/Prim para árbol de expansión mínima, scheduling por earliest deadline).
- Backtracking: exploras una opción, si falla revierte y prueba otra. N-Queens, Sudoku.

Regla: si te dan un array y piden O(n) o O(n log n), piensa two pointers / sliding window / sort + binary search.

---

**Pregunta 9:** Estructuras de datos concurrentes en Java: ¿cuándo cada una?

**Respuesta:** - ConcurrentHashMap: alternativa thread-safe a HashMap. Lectura sin bloqueo, escritura con locks por bucket → muy paralelizable. Ideal para cachés en memoria, contadores por clave (computeIfAbsent, merge).
- CopyOnWriteArrayList: cada escritura copia el array entero. Caro escribir, lectura sin coste. Para listas que se leen muchísimo y se escriben poco (ej. listeners).
- ConcurrentLinkedQueue / ConcurrentLinkedDeque: lock-free.
- BlockingQueue (LinkedBlockingQueue, ArrayBlockingQueue): productor-consumidor; put/take bloquean cuando vacía/llena. Base de los thread pools (ExecutorService).
- Atomic: AtomicInteger, AtomicReference, AtomicLong — operaciones CAS (Compare-And-Swap) sin bloqueos.
- LongAdder / LongAccumulator: contadores escalables (mejor que AtomicLong con muchos hilos escribiendo).

No uses Hashtable/Vector (sincronizados pero serializan todo). Y Collections.synchronizedMap(new HashMap<>()) no es lo mismo que ConcurrentHashMap (locks por método, no por bucket).

---

**Pregunta 10:** ¿Cuándo importan los algoritmos en una entrevista de arquitectura backend?

**Respuesta:** Raramente te piden resolver LeetCode hard. Lo que sí esperan:
- Reconocer la complejidad de tu código: "esto es O(n²) sobre la lista de pedidos — si tienes 10k pedidos, son 10⁸ operaciones, no escala".
- Elegir la estructura correcta: "para deduplicar mensajes por id uso un Set, no recorrer una lista".
- Entender por qué un índice en BD es O(log n) sobre un B-tree y por qué un seq scan es O(n).
- Detectar cuellos algorítmicos en código que ya existe (loops anidados, N+1).
- Saber el coste de operaciones comunes en colecciones Java.

En entrevistas de arquitectura pura suelen preguntar más por diseño (BCs, mensajería, persistencia) que por algoritmos. Pero si te ponen un problema ("¿cómo deduplicarías 10M de mensajes Kafka?") deben verte llegar a una respuesta razonada en términos de complejidad y memoria (HyperLogLog, bloom filter, Redis SETs…).

---

### CC (15 preguntas)

**Pregunta 1:** ¿Qué es Claude Code y en qué se diferencia de Copilot o Cursor?

**Respuesta:** Claude Code es el CLI agentico oficial de Anthropic para tareas de desarrollo: no solo sugiere código, ejecuta — lee y modifica ficheros, lanza comandos en la shell, busca en el repo, llama a APIs, navega webs, gestiona git. Hablas en lenguaje natural y resuelve la tarea de extremo a extremo.

Diferencias con otras herramientas:
- Copilot / Tabnine: autocompletado dentro del editor (token-by-token). No ejecuta, solo sugiere.
- Cursor: IDE-fork con LLM integrado; muy bueno para edición conversacional y multi-archivo, pero menos orientado a workflows largos con shell/git.
- Claude Code: CLI / extensión IDE; agentic real (loop think→act→observe), subagents especializados, hooks, MCP (Model Context Protocol) para integrarse con tu stack, plan mode para diseñar antes de tocar.

Disponible como CLI, VS Code/JetBrains, web (claude.ai/code). Los modelos: Opus (más capaz, más lento/caro), Sonnet (equilibrio), Haiku (rápido/barato).

💡 Analogía: un becario senior infatigable que ha leído toda la documentación del mundo, escribe mucho código rápido y nunca se queja. Pero sigue siendo un becario: tú revisas su trabajo, tú decides la arquitectura, tú firmas las decisiones de seguridad. Si lo dejas solo con el push a producción, ya sabes.

---

**Pregunta 2:** ¿Qué es CLAUDE.md y qué deberías y NO deberías meter ahí?

**Respuesta:** CLAUDE.md es la memoria del proyecto que se inyecta automáticamente en cada conversación. Jerarquía (todos se cargan, del más global al más específico):

[ver código en la app]

Mete: convenciones del equipo, decisiones arquitectónicas ("el dominio NO depende de Spring"), comandos comunes, estándares de testing.

NO metas: código (lo ve directamente), historia de git (git log es mejor), secretos (.env, API keys), datos que cambian rápido (mejor que los descubra leyendo).

💡 Un buen CLAUDE.md sustituye a un onboarding de horas: cualquier nuevo miembro del equipo que lo lea ya conoce las reglas, y Claude las aplica automáticamente.

---

**Pregunta 3:** Slash commands / skills: ¿qué son y cuándo crear uno propio?

**Respuesta:** Los slash commands (también llamados skills) son comandos invocables con /nombre que llevan un prompt + tools permitidos + instrucciones. Encapsulan flujos repetitivos.

Integrados típicos: /init (genera un CLAUDE.md inicial), /review (revisa un PR), /security-review, /simplify, etc.

Cuándo crear uno propio:
- Workflow recurrente del proyecto que sigue siempre los mismos pasos ("añadir un nuevo conector siguiendo las reglas").
- Tarea con prompt largo que mecanizas ("genera tests para esta clase con Object Mothers y Given/When/Then").
- Reglas estrictas que la IA debe seguir sin variación.

Estructura típica de un skill personalizado: fichero markdown en .claude/commands/ (o ~/.claude/commands/ si es global) con frontmatter (description, allowed tools) + body con instrucciones detalladas. Lo invocas con /nombre.

Ventaja: codifica el "cómo lo hacemos aquí" — cualquiera del equipo lo invoca y obtiene el mismo flujo.

---

**Pregunta 4:** ¿Qué son los subagents y para qué se usan?

**Respuesta:** Subagents son agentes especializados con su propio system prompt y conjunto de herramientas. Sirven para:

[ver código en la app]

Tipos integrados: general-purpose (investigaciones multi-paso), Explore (búsqueda en codebase), Plan (diseño de implementación).

Regla: usa subagents para preguntas abiertas que requieran ≥3 búsquedas. Para una sola lectura puntual, lee directamente — abrir un subagent tiene overhead de contexto.

---

**Pregunta 5:** ¿Qué es el plan mode y cuándo es valioso?

**Respuesta:** Plan mode es un modo donde Claude diseña un plan de cambios antes de ejecutar nada — sin escribir/modificar ficheros. Tú revisas el plan, lo discutes, y solo cuando aceptas (ExitPlanMode) empieza a aplicarlo.

Valor:
- Cambios grandes o invasivos: refactors transversales, migraciones, rediseños.
- Cuando quieres alinear antes de coste de implementación.
- Code review previo: detectas mal diseño en el plan, no después.
- Riesgo alto: tocar producción, BBDD, infra.

NO necesitas plan mode para tareas pequeñas (un fix puntual, un test). Forzarlo para todo es ralentizar sin valor.

Patrón sano:
1. Tarea pequeña → directa.
2. Tarea media → discusión + ejecución.
3. Tarea grande/arquitectónica → plan mode → revisión humana → aplicar.

En equipos: el plan generado puede pegarse en una ADR o un PR description, dejando trazabilidad.

---

**Pregunta 6:** ¿Qué son los hooks y para qué se usan?

**Respuesta:** Hooks son scripts shell que se ejecutan automáticamente en eventos del agente, configurados en settings.json. Eventos típicos: PreToolUse, PostToolUse, Stop, UserPromptSubmit, Notification.

Casos de uso reales:
- Auto-format después de editar (PostToolUse matchedo a Edit/Write): ejecuta prettier / gofmt / mvn spotless:apply sobre el fichero tocado.
- Validación: bloquear comandos peligrosos (rm -rf, git push --force) en PreToolUse si no se aprueban.
- Logging / auditoría: registrar qué hace el agente en un fichero local.
- Tests automáticos tras edición: ejecutar el test del módulo afectado y reportar.
- Notificaciones: Stop event → desktop notification cuando termine una tarea larga.

Los hooks reciben información del evento (ruta del fichero editado, comando a ejecutar) y pueden devolver señales que bloquean o continúan la operación.

Clave: úsalos para automatizar cosas que se te olvidan (lint, format), no para arquitectura. La complejidad de hooks puede convertirse en un mini-CI invisible.

---

**Pregunta 7:** ¿Qué es MCP (Model Context Protocol) y qué aporta?

**Respuesta:** MCP (Model Context Protocol) es un estándar abierto para que un agente LLM se conecte a fuentes de datos y herramientas externas de forma uniforme.

[ver código en la app]

Valor concreto:
- Claude lee issues de Jira, comenta PRs en GitHub, busca docs en Notion, consulta una BD interna — todo desde la conversación.
- Los secrets y permisos viven en el MCP server (auth OAuth, tokens), no en el prompt.
- Reusable: el mismo MCP de Jira sirve para todos los agentes/proyectos.

Ejemplo .claude/settings.json que registra MCPs:
[ver código en la app]
Luego en la conversación: "crea un ticket de Jira con resumen de este PR" → Claude llama al tool del MCP de Jira, autenticado con OAuth previo.

Vs los plugins propietarios de Cursor o Copilot: MCP es estándar abierto → cualquier LLM que lo hable usa el mismo conector. SDK oficial para construir servers (TypeScript, Python).

💡 Tip: empieza con MCPs read-only (consultar Jira/GitHub). Los de escritura (crear PRs, mover tickets) los habilitas cuando confíes — y aún así, deja confirmación humana para acciones destructivas.

💡 Analogía: si los plugins propietarios son cargadores con conector específico (USB-Apple, USB-Android), MCP es USB-C universal: cualquier dispositivo, cualquier cable, mismo protocolo.

---

**Pregunta 8:** ¿Cómo se gestionan permisos y settings.json en Claude Code?

**Respuesta:** El control vive en settings.json (a nivel usuario ~/.claude/settings.json y proyecto .claude/settings.json).

Modos de permiso (cómo se autoriza cada tool call):
- default: pregunta antes de cada acción no autorizada.
- acceptEdits: auto-aprueba edits a ficheros del proyecto (útil cuando confías).
- plan: solo planifica, no toca nada.
- bypassPermissions: "yolo mode" — autoriza todo (peligroso, solo para sandboxes).

Allow/deny granular:
[ver código en la app]
Así permites npm test automáticamente pero bloqueas comandos destructivos.

Variables de entorno, hooks, modelo por defecto, MCP servers — todo configurable en settings.json. El de proyecto se versiona; el de usuario es personal.

Reglas:
- En proyectos compartidos, versiona .claude/settings.json con los allows seguros (lint, tests) → menos prompts para todo el equipo.
- Para acciones destructivas (push --force, drop table), siempre pedir confirmación.

---

**Pregunta 9:** ¿Qué workflows funcionan bien con Claude Code?

**Respuesta:** Patrones reales en el día a día:

[ver código en la app]

La clave: Claude acelera lo mecánico (implementar el patrón conocido, escribir el test, aplicar el rename). Tú llevas el timón en decisiones, revisión y comprensión del código resultante.

---

**Pregunta 10:** ¿Qué NO hay que delegar a Claude Code?

**Respuesta:** Hay decisiones donde el atajo es caro:

- Decisiones de arquitectura: bounded contexts, qué se separa, qué tecnología. Una IA optimiza local, no estratégico. Aporta opciones, no las firma.
- Revisión final antes de un merge crítico. La IA escribió el código; revisarlo es responsabilidad humana.
- Seguridad: flujos de auth, criptografía, validación crítica, sanitización. Las alucinaciones aquí son catastróficas. Si Claude te genera código de seguridad, lee cada línea y verifica contra docs oficiales.
- Datos privados / propietarios en chats no corporativos: no pegues código de empresa en herramientas sin acuerdo de no-training.
- Confiar en cifras o APIs sin verificar: "el SLA de Redis es X", "esta librería tiene método Y" — alucinaciones frecuentes. Verifica.
- Cerrar sin entender: si el código que Claude generó no lo entiendes, no lo mergees. "Funciona" no es suficiente: tendrás que mantenerlo.
- Lógica de negocio crítica sin tests: si no hay tests, no hay forma de saber que sigue bien tras los cambios.
- Operaciones destructivas (drop, rm -rf, force push) sin confirmación humana.

Regla: la IA acelera lo conocido; lo desconocido o sensible lo conduces tú.

---

**Pregunta 11:** Cómo gestionar context window y coste: modelos, caching, compaction.

**Respuesta:** Cada conversación consume tokens (input + output). Coste lineal y limitado por el context window del modelo (las versiones modernas: 200k a 1M+ tokens).

Gestionar bien:
- Elige modelo por tarea: Opus (razonamiento profundo, refactors grandes), Sonnet (default equilibrado), Haiku (búsquedas rápidas, fixes triviales). Cambiar modelo es un comando.
- Prompt caching: Anthropic cachea prefijos de prompts entre llamadas (~5 min de TTL). Reduce coste y latencia drásticamente. El sistema lo hace automático para CLAUDE.md y prefijos repetidos.
- Subagents para no llenar contexto: una búsqueda grande devuelve un resumen al hilo principal, no el volcado. Mantiene el context window principal limpio.
- Compaction: cuando se llena el context, el sistema resume las primeras partes automáticamente. Útil pero pierde detalle — si una decisión clave queda en lo compactado, puede que la "olvide".
- Conversaciones nuevas para tareas independientes: no estires una conversación 10 horas si los temas no se relacionan.
- Hooks ligeros: si auto-ejecutas tests/lint en cada edit, ten en cuenta tokens del output.

Métrica útil: si pides la misma información cada 5 prompts, mejor meterla en CLAUDE.md (se cachea).

---

**Pregunta 12:** ¿Cómo creas un subagent custom para tu proyecto?

**Respuesta:** Crea un fichero markdown en .claude/agents/<name>.md (proyecto) o ~/.claude/agents/ (global). Estructura:

[ver código en la app]

Qué define un buen subagent:
- Scope estrecho: una responsabilidad clara. Si hace tests Y código de producción, mejor sepáralos.
- Tools acotadas: el test-writer no necesita acceso a la red (WebFetch); el architect quizás sí.
- Modelo apropiado: Sonnet por defecto; Opus para arquitecto.
- System prompt detallado: las reglas del proyecto sin ambigüedad.

Lo invocas con la herramienta Agent o por nombre. En Agata Next se usa este patrón para analist → developer → test-writer → architect.

---

**Pregunta 13:** ¿Para qué sirven las tareas en background?

**Respuesta:** Algunas tareas tardan minutos (build largo, tests de carga, deploy, scrape de docs). El modo background te permite lanzar la tarea y seguir trabajando; cuando termine, recibes una notificación.

Casos:
- Tests largos: mvn verify mientras sigues editando otro módulo.
- Builds: compilar mientras revisas el plan de la siguiente tarea.
- Subagents independientes: lanzar 2-3 investigaciones a la vez en paralelo.
- Watchers: dejar npm run dev corriendo y consultar logs cuando algo falle.

Reglas:
- No bloquees una conversación esperando un proceso largo — al fondo se está mejor.
- Para una sola tarea que define los siguientes pasos, foreground es más simple.
- Si una tarea genera mucha salida, mejor pedirle que lo escriba a un fichero y leerlo después — no inundar el contexto.

Claude Code soporta múltiples procesos background simultáneos; los identifica por id y puedes consultar su estado/salida en cualquier momento.

---

**Pregunta 14:** ¿Cómo verificas que un cambio hecho por Claude es correcto?

**Respuesta:** Nunca confíes a ciegas. Capas de verificación:

1. Tests verdes: la red de seguridad principal. Si tu suite es buena, un test rojo te dice que algo se rompió. Si tu suite es pobre, este paso no protege.
2. Build verde: compila + lint + tipos pasan. Filtra muchas alucinaciones (APIs/métodos inventados).
3. Lee el diff completo: revisa cada cambio. No solo lo que tocó sino qué borró/movió. Un diff grande sin entenderlo es un riesgo.
4. Type checking: en Java/TS, el compilador caza muchas firmas inventadas.
5. Static analysis (SonarQube, SpotBugs, ESLint): bichos comunes y code smells.
6. Ejecútalo: corre el código contra un caso real (no solo unit tests).
7. Pregunta crítica: "¿esto tiene sentido en mi dominio?" — la IA puede generar código técnicamente correcto pero conceptualmente erróneo (saltarse una invariante del dominio).
8. Búsqueda inversa: ante una API sospechosa, busca en la doc oficial. Las alucinaciones más típicas: métodos con nombres plausibles que no existen, parámetros inventados, versiones equivocadas.

Para cambios críticos: plan mode primero. Y nunca commitees código de la IA que no entiendes — luego lo tienes que mantener.

---

**Pregunta 15:** ¿Cómo encaja Claude Code en un equipo (gobernanza, code review, ADRs)?

**Respuesta:** Buenas prácticas para que no sea "el cowboy del equipo":

- CLAUDE.md compartido (versionado en el repo): las convenciones del equipo viven aquí. Cuando alguien nuevo entra, ya las conoce; cuando Claude trabaja, las cumple.
- .claude/settings.json versionado con allows seguros (test, build, lint) y denys (push --force, drop). Reduce prompts para todos.
- Code review humano obligatorio para PRs sustanciales. Que Claude haya escrito el código no significa que esté revisado. Mismo proceso que para humanos.
- ADRs (Architecture Decision Records) cuando Claude propone (o aplica) un cambio arquitectónico. Plan mode + copy del plan en la ADR.
- Mensajes de commit con Co-Authored-By: Claude: trazabilidad de qué se generó con IA. Algunas empresas lo exigen por compliance.
- No copiar/pegar código propietario en chats públicos. Usar tooling corporativo (Claude for Work, Copilot Enterprise) con acuerdos de no-training.
- Política clara sobre cuándo se permite (refactor, tests) y cuándo no (auth, criptografía, decisiones de arquitectura sin discusión).
- Auditoría del uso (coste, % de líneas asistidas) sin convertirlo en métrica de productividad — la IA acelera lo conocido, no es un proxy de valor entregado.

---

### IA (6 preguntas)

**Pregunta 1:** ¿Qué es un LLM?

**Respuesta:** Un Large Language Model es un modelo de IA basado en arquitectura Transformer entrenado sobre corpus masivos de texto para predecir el token siguiente.

[ver código en la app]

Propiedades clave:
- Emergencia: capacidades no previstas aparecen al escalar (razonamiento, código).
- Context window: máximo de tokens que procesa en una sola llamada (GPT-4: 128k, Gemini: 1M).
- Temperature: controla aleatoriedad del muestreo (0 = determinista, 1+ = creativo).
- Tokens ≠ palabras: "unhappiness" → 3 tokens. Coste y límites van por tokens.

Modelos relevantes 2025: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3.1 405B (open source), Mistral Large.

En entrevista: menciona que los LLMs son stateless por petición — la "memoria" viene de meter el historial en el contexto (RAG, conversational memory).

---

**Pregunta 2:** ¿Qué estás haciendo ahora mismo con IA en tu entorno laboral?

**Respuesta:** Respuesta personal — prepara una real con tus casos concretos. Estructura sugerida:

1. Pair programming / code review
> "Uso Claude/Copilot para revisar PRs grandes buscando edge cases y para generar esqueletos de tests que luego refino."

2. Debugging
> "Le paso el stacktrace + el contexto del servicio y me ayuda a identificar la causa raíz más rápido que leyendo solo la doc."

3. Documentación y OpenAPI
> "Genero borradores de spec OpenAPI a partir del código del controller; ahorra el 80% del tiempo de escritura."

4. Exploración de tecnología nueva
> "Cuando evalúo una librería nueva, le pido que me muestre los patrones de uso típicos con ejemplos antes de leer la doc."

[ver código en la app]

---

**Pregunta 3:** ¿Cómo estás usando ChatGPT o herramientas de IA para refactorizar o resolver problemas técnicos?

**Respuesta:** Patrones útiles para trabajar con IA como co-piloto:

[ver código en la app]

Patrones que funcionan:
- Rubber duck con contexto: explícale el problema antes de preguntar — a menudo te das cuenta tú solo.
- Test-first con IA: pídele los tests primero; el código de producción que generes será más limpio.
- Incremental review: comparte diff pequeños, no PRs enteras.
- "¿Qué edge cases no he considerado?": pregunta explícita; no los ofrecerá sin pedírselo.

Limitaciones a tener en cuenta:
- Código desactualizado (corte de conocimiento). Siempre verifica contra la doc oficial.
- Alucinaciones en APIs poco usadas — testea todo.
- Sin ejecución real — el código puede compilar pero fallar en runtime.

---

**Pregunta 4:** ¿Qué precauciones tienes al usar IA con código de una empresa privada?

**Respuesta:** 1. No pegar código propietario en chats públicos (ChatGPT free, etc.); usar instancias privadas (Azure OpenAI, Bedrock, Vertex AI) con acuerdo de no entrenamiento o modelos on-premise (Llama local).
2. No credenciales ni secrets en el contexto nunca: .env, tokens, connection strings.
3. Revisar siempre el output antes de hacer commit — nunca "aceptar todo" ciegamente.
4. Verificar licencias del código generado si procede de ejemplos con copyright.

[ver código en la app]

En Agata Next: las llamadas a modelos IA van a través de Azure OpenAI (datos en región EU, sin retención para entrenamiento) y el equipo tiene prohibido pegar contratos o datos de cliente.

---

**Pregunta 5:** ¿Qué son los tokens, el context window y las alucinaciones?

**Respuesta:** - Token: la unidad mínima que el LLM "ve". No es una letra ni una palabra: es un fragmento (subword). En español aproximadamente 1 token ≈ 0,5-0,8 palabras. "hola" puede ser 1 token; "interoperabilidad" varios.
- Context window: cuántos tokens puede procesar el modelo a la vez (input + output). Es la "memoria a corto plazo" de la conversación. Hace unos años eran 4-8k; ahora hay modelos con 200k-1M+. Cuando se llena, se trunca o se hace compaction (resumen).
- Alucinación: el modelo genera contenido plausible pero falso — inventa una API, una versión, un dato, una librería. Pasa porque el modelo predice el token siguiente probable, no consulta una base de hechos. Mitigaciones: prompts con contexto explícito, RAG (recuperación con citas), verificación humana, restringir a fuentes confiables.

En entrevistas: si te preguntan por riesgos de IA en código, las alucinaciones son la primera respuesta (inventa firmas de métodos, parámetros, dependencias).

---

**Pregunta 6:** ¿Qué es RAG (Retrieval Augmented Generation)?

**Respuesta:** RAG es el patrón estándar para hacer que un LLM responda usando tu conocimiento sin reentrenarlo: en lugar de meter todo en el prompt o esperar que el modelo lo "sepa", recuperas los documentos relevantes y los adjuntas como contexto a la pregunta.

[ver código en la app]

Mejoras habituales:
- Rerank post-retrieval (con un modelo cross-encoder más caro pero más preciso sobre los top-20).
- Hybrid search: combinar similitud semántica + BM25 (palabras clave) — Elasticsearch/OpenSearch lo hacen bien.
- Query rewriting: el LLM reformula la pregunta del usuario antes de buscar (más términos relevantes).
- Chunking inteligente: por estructura (headings, secciones) en vez de N tokens fijos.
- Citations explícitas en la respuesta → el usuario verifica.

Ventajas: respuestas actualizadas sin reentrenar, citaciones, control de qué puede responder, baja alucinación. Es el patrón base de asistentes corporativos y "chat con tus documentos".

💡 Tip: para Java/Spring, Spring AI ya tiene abstracciones (VectorStore, EmbeddingClient, ChatClient) y soporta Pinecone, pgvector, Redis vector, etc.

💡 Analogía: es como un examen a libro abierto vs cerrado. Sin RAG, el LLM responde de memoria (alucina si no se acuerda). Con RAG, le das los libros relevantes abiertos justo en la página correcta — responde citando.

---
