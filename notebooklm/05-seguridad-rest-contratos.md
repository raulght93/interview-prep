# Seguridad · REST · CORS · Contratos de API

> OAuth2, OIDC, JWT, Keycloak, Spring Security, CORS/CSRF, OpenAPI, AsyncAPI, Pact.

## Chuletas (puntos clave)

### REST

- Content-Type = media type del body (header; produces/consumes en Spring). json/text-plain/multipart.
- PUT: reemplazo total, idempotente · PATCH: parcial, no necesariamente idempotente.
- Seguros: GET/HEAD/OPTIONS. Idempotentes: +PUT/DELETE. POST no idempotente.
- CRUD: GET /x, GET /x/{id}, POST /x (201+Location), PUT/PATCH /x/{id}, DELETE /x/{id} (204).
- OpenAPI: responses→content→schema. openapi-generator → interfaz que el controller implementa.

### SEC

- AuthN (¿quién eres? 401) vs AuthZ (¿qué puedes? 403). AuthN antes que AuthZ; AuthZ en cada operación.
- OAuth2 = autorización delegada. OIDC = OAuth2 + id_token (login). SAML = XML + SSO empresarial.
- Flujos OAuth2: Auth Code + PKCE (apps/SPAs), Client Credentials (M2M), Refresh, Device.
- Keycloak: Realm (tenant) · Client (app) · Users · Roles (realm/client) · Groups · Identity Providers.
- JWT = header.payload.signature Base64Url (NO cifrado, decodificable). Access corto + refresh largo.
- Spring Security: FilterChain → AuthenticationManager → SecurityContext → AuthorizationManager.
- @EnableMethodSecurity + @PreAuthorize (SpEL) / @PostAuthorize / @Secured / @RolesAllowed.
- RBAC (roles+permisos) · ABAC (atributos+contexto, OPA/Rego) · ReBAC (relaciones).
- Passwords: NUNCA MD5/SHA-256 (rápidos). Usa bcrypt (cost 12+), Argon2 (PHC winner), scrypt.
- MFA: SMS (débil) < TOTP < Push < WebAuthn/passkeys (phishing-resistant por origin binding).
- CSRF = navegador envía cookie automáticamente. Defensas: token, SameSite, JWT en header.
- XSS = JS inyectado. Defensas: escape de salida, CSP, httpOnly en cookies, sanitización HTML.

### CORS

- CORS = mecanismo del NAVEGADOR (same-origin). No es seguridad del servidor ni autorización.
- Falta Access-Control-Allow-Origin → el navegador bloquea la respuesta. Preflight OPTIONS para no-simples.
- 401 = no autenticado (identifícate). 403 = autenticado sin permiso.
- 404 = no existe. 500 = error del servidor (5xx servidor, 4xx cliente).

### CONTRACTS

- OpenAPI: spec REST (endpoints, schemas, responses). Contract-first vs code-first.
- openapi-generator → interfaz + DTOs; el controller la implementa. Breaking change → no compila.
- AsyncAPI = OpenAPI para eventos (Kafka/Rabbit): channels, publish/subscribe, bindings.
- Versionado: /v1, aditivo (no rompe), deprecación con gracia. Schema Registry: compat backward/forward/full.
- Contract testing (Pact): el consumidor define lo que espera; falla el build del proveedor si rompe.

## Flashcards: Seguridad + REST + Contratos

### REST (14 preguntas)

**Pregunta 1:** ¿Cuál es el Content-Type de una petición/respuesta REST cuando devuelves un 200? ¿Qué tipo de contenido puede devolver?

**Respuesta:** No hay uno fijo: depende de lo que devuelvas. Convención REST estándar:

[ver código en la app]

[ver código en la app]

Error frecuente: devolver 200 en un POST de creación. El 201 con el Location header es lo que esperan los clientes REST bien escritos.

---

**Pregunta 2:** ¿Dónde se define el Content-Type?

**Respuesta:** En el header HTTP Content-Type de la petición o respuesta. Indica el formato del body.

[ver código en la app]

[ver código en la app]

Headers relacionados:
- Content-Type: describe el body que envío
- Accept: describe el formato que quiero recibir
- Content-Encoding: compresión (gzip, br) — distinto a Content-Type

---

**Pregunta 3:** ¿Para qué sirven application/json, text/plain y multipart/form-data?

**Respuesta:** [ver código en la app]

[ver código en la app]

Negociación de contenido: el cliente declara lo que acepta en el header Accept; el servidor elige el mejor match. Si no hay ninguno compatible → 406 Not Acceptable.

---

**Pregunta 4:** ¿Qué problemas pueden aparecer si no defines correctamente el Content-Type? ¿Cómo estableces que tu servicio va a devolver JSON?

**Respuesta:** Cuando el cliente pide Accept: application/xml y el servidor no tiene un HttpMessageConverter que produzca XML, Spring lanza HttpMediaTypeNotAcceptableException → 406 Not Acceptable.

[ver código en la app]

[ver código en la app]

Diagnóstico: si ves 406 inesperado, revisa los produces del endpoint y los MessageConverter registrados con actuator/mappings o debuggeando ContentNegotiationStrategy.

---

**Pregunta 5:** Si tienes un YAML de OpenAPI, ¿dónde defines qué devuelve cada endpoint? ¿Qué relación puede tener un REST controller con una interfaz generada desde OpenAPI?

**Respuesta:** En el bloque responses de cada operación, con el código HTTP como clave:

[ver código en la app]

[ver código en la app]

---

**Pregunta 6:** ¿Qué tendrías que hacer si en vez de devolver JSON necesitas devolver XML con el mismo payload?

**Respuesta:** 1. Añadir jackson-dataformat-xml al classpath.
2. Spring Boot auto-configura un MappingJackson2XmlHttpMessageConverter.
3. El endpoint responde XML cuando el cliente envía Accept: application/xml.

[ver código en la app]

[ver código en la app]

Salida XML:
[ver código en la app]

Cuándo usarlo: integración con sistemas legacy SOAP/XML. En nuevas APIs, quédate con JSON.

---

**Pregunta 7:** ¿Qué diferencia hay entre un PUT y un PATCH?

**Respuesta:** - PUT: reemplazo total del recurso. Es idempotente (mismas llamadas → mismo resultado). Si omites un campo, se borra.
- PATCH: modificación parcial. Solo mandas los campos que cambian.

[ver código en la app]

[ver código en la app]

Regla práctica: en Agata Next los conectores usan PATCH para actualizar configuración sin forzar al cliente a mandar todo el objeto.

---

**Pregunta 8:** ¿Qué verbos HTTP son idempotentes y seguros? ¿Por qué importa?

**Respuesta:** [ver código en la app]

- Seguro: no muta estado del servidor.
- Idempotente: múltiples llamadas idénticas producen el mismo resultado que una sola.

Implicación práctica: los clientes HTTP pueden reintentar automáticamente GET/PUT/DELETE ante timeout; nunca deben reintentar POST sin control de idempotencia (riesgo de duplicados).

---

**Pregunta 9:** ¿Qué URLs y verbos usarías para el CRUD de una entidad restaurant?

**Respuesta:** Convención REST para el recurso restaurants:
[ver código en la app]
Reglas: sustantivos en plural, nunca verbos en la URL (/getRestaurants ❌); la jerarquía expresa relaciones (/restaurants/{id}/reviews); usa query params para filtrar/paginar/ordenar (?city=madrid&page=2&sort=name); y códigos correctos (200/201/204/404).

---

**Pregunta 10:** ¿Qué es HATEOAS y el modelo de madurez de Richardson?

**Respuesta:** Modelo de madurez de Richardson clasifica APIs HTTP en 4 niveles:
- Nivel 0: HTTP como transporte solamente (un único endpoint, un solo verbo — SOAP-ish).
- Nivel 1: recursos (URLs distintas por entidad: /pedidos, /pedidos/123).
- Nivel 2: verbos HTTP correctos (GET/POST/PUT/DELETE) + códigos de estado. La mayoría de "APIs REST" reales se quedan aquí.
- Nivel 3 (HATEOAS): las respuestas incluyen enlaces a las siguientes acciones posibles. El cliente "navega" por la API descubriendo qué puede hacer.

HATEOAS (Hypermedia As The Engine Of Application State): un GET /pedidos/123 devolvería el pedido + enlaces (pagar, cancelar, linea-añadir) según el estado actual. Spring HATEOAS lo soporta con EntityModel/Link.

En práctica: el nivel 3 es la "verdadera" REST de Roy Fielding, pero rara vez se aplica porque añade complejidad sin payoff claro en APIs internas. Útil para APIs públicas con clientes muy diversos que deben adaptarse al flujo.

---

**Pregunta 11:** ¿Qué es la negociación de contenido (content negotiation)?

**Respuesta:** El cliente declara qué formato/idioma/codificación prefiere y el servidor elige el mejor de los que ofrece:
- Accept: application/json → el servidor responde JSON si lo soporta.
- Accept: application/json, application/xml;q=0.8 → JSON preferido (q=1 implícito), XML como fallback (q=0.8 es el "peso").
- Accept-Language: es-ES, en;q=0.7 → idioma del recurso.
- Accept-Encoding: gzip, br → compresión soportada.

En Spring lo gestionan los HttpMessageConverters: con produces = {APPLICATION_JSON, APPLICATION_XML} el endpoint puede servir ambos; Spring elige según el Accept. Si el cliente pide algo no soportado → 406 Not Acceptable. Si manda algo no soportado en el body → 415 Unsupported Media Type.

Para devolver XML además de JSON solo necesitas añadir jackson-dataformat-xml y los DTOs pueden necesitar @JacksonXmlProperty para nombres. No tiene por qué condicionar el diseño del endpoint.

---

**Pregunta 12:** ¿Qué es gRPC y cuándo elegirlo sobre REST?

**Respuesta:** gRPC es un framework de RPC de Google sobre HTTP/2 y Protocol Buffers (Protobuf) como serialización binaria. Define el contrato en un .proto, genera cliente y servidor en N lenguajes.

[ver código en la app]

Ventajas sobre REST/JSON:
- Binario: Protobuf serializa ~3-10× más pequeño que JSON y es más rápido de parsear.
- HTTP/2: multiplexing, header compression, streaming bidireccional.
- Cliente generado: type-safe en N lenguajes desde el mismo .proto.
- Streaming: cliente, servidor o bidireccional — más expresivo que pollos/SSE.

Desventajas:
- No es navegador-friendly sin gRPC-Web (proxy de traducción).
- Debug/observabilidad más difícil (binario; necesitas tooling: grpcurl, BloomRPC).
- Cache HTTP estándar no aplica como con REST/GET.

Cuándo elegir:
- Comunicación entre microservicios internos alta-frecuencia/baja-latencia → gRPC.
- API pública para terceros / navegadores / curl → REST/JSON (o ambos: REST hacia fuera, gRPC dentro).
- Polyglot (varios lenguajes) → gRPC reduce fricción con el codegen.

---

**Pregunta 13:** REST vs gRPC vs GraphQL: ¿cuándo cada uno?

**Respuesta:** Cada uno resuelve un problema distinto:

- REST + JSON: el estándar. Verbo + URL + JSON. Universal (cualquier cliente, cualquier proxy, cualquier cache HTTP). Curva baja. Sufre cuando hay N+1 calls del frontend (necesitas varios endpoints para componer una vista) o over/under-fetching.

- gRPC: RPC binario sobre HTTP/2 con Protobuf. Brutal entre microservicios internos (latencia, throughput, type-safety). Streaming nativo. Mal para clientes navegador y caches HTTP.

- GraphQL: el cliente declara qué campos quiere; un solo endpoint resuelve la query componiendo internamente. Resuelve el over/under-fetching y N+1 del lado cliente. Complejo en backend (resolvers, N+1 server-side, autorización campo a campo, caché difícil). Ideal cuando hay muchos consumidores con necesidades distintas (mobile, web, partners) — Apollo, Hasura.

Reglas de bolsillo:
- API pública / interoperabilidad → REST.
- Microservicios internos (latencia, fuerte tipado) → gRPC.
- Frontend único que pide datos heterogéneos → REST sigue ganando por simplicidad; GraphQL solo si el problema lo justifica.
- Múltiples frontends con vistas dispares → GraphQL puede compensar la complejidad.

No es excluyente: muchas empresas usan REST hacia fuera, gRPC dentro y GraphQL en el BFF.

---

**Pregunta 14:** Protocol Buffers: evolución de schemas sin romper consumidores.

**Respuesta:** Protobuf define mensajes con campos numerados:

[ver código en la app]

Reglas de evolución compatible (claves para no romper):
- Nunca reuses un número de campo (mejor reserved 3; que reciclarlo).
- Añadir campos nuevos con número nuevo: compatible — los consumidores viejos ignoran lo que no conocen.
- Quitar campos: marca como reserved para que nadie lo reuse.
- Renombrar campos: cambia el nombre pero mantén el número (la wire format usa el número, no el nombre).
- Cambiar tipo: solo si son compatibles binariamente (int32↔int64↔uint32, sí; int32↔string, no).

Protobuf no garantiza por sí solo "backward compatible" — depende de cómo lo evoluciones. Schema Registry (Confluent, Apicurio) puede validar la evolución y bloquear cambios que rompan.

Vs JSON Schema: Protobuf es binario y eficiente; JSON Schema describe payloads JSON. Para Kafka, ambos son válidos con Schema Registry; depende del ecosistema del consumidor.

---

### SEC (18 preguntas)

**Pregunta 1:** ¿Para qué se usa un token JWT? ¿Sólo en servicios JSON o también otras cosas?

**Respuesta:** Un JWT transporta información firmada (y opcionalmente cifrada con JWE) entre partes. Uso típico: autenticación/autorización stateless — el servidor emite el token tras login y el cliente lo envía en cada petición (header Authorization: Bearer ...); el servidor valida la firma sin consultar sesión en BD.

No es exclusivo de JSON ni REST. Se usa para: APIs REST y gRPC, OIDC (ID tokens), single sign-on, intercambio seguro de info entre servicios, magic links, password reset tokens, webhooks firmados.

💡 Analogía: una pulsera de festival. Te la ponen al entrar (login), cada control la mira (valida la firma) y te deja pasar sin llamar a recepción a verificar quién eres. Si te la quitas o pasa el día — fuera. Y el guardia puede leer lo que dice (nombre, zona VIP) — por eso no escribirías tu PIN ahí dentro.

---

**Pregunta 2:** ¿Qué son los claims de un JWT y para qué se usan?

**Respuesta:** Un JWT (JSON Web Token) tiene tres partes separadas por puntos: header.payload.signature. Los claims son los campos del payload (la parte central), codificados en base64.

[ver código en la app]

Claims estándar (RFC 7519): iss, sub, aud, exp, iat, nbf, jti.
Claims personalizados: los que defines tú (roles, tenant, permisos, etc.).

[ver código en la app]

💡 Los claims NO están cifrados (solo codificados en base64) — no metas datos sensibles (contraseñas, tarjetas, PII) en el JWT. Solo pon lo mínimo necesario para autorizar.

---

**Pregunta 3:** ¿Los JWT se pueden decodificar?

**Respuesta:** Sí, el payload es solo base64url — cualquiera puede decodificarlo sin necesidad de la clave secreta.

[ver código en la app]

Implicaciones:
- No metas datos sensibles en claims (contraseña, datos de tarjeta, PII).
- Usa TTL corto (15-60min) + refresh token — no puedes invalidar un JWT antes de que expire (a menos que implementes una denylist, lo que mata la ventaja de stateless).
- Para tokens cifrados: usa JWE (JSON Web Encryption), donde el payload SÍ está cifrado. Menos común pero útil cuando el token pasa por intermediarios no confiables.

[ver código en la app]

---

**Pregunta 4:** ¿Qué diferencia hay entre access token y refresh token? ¿Por qué dos?

**Respuesta:** [ver código en la app]

[ver código en la app]

Por qué la separación:
- El access token va en cada petición a múltiples servicios → más superficie de exposición. Si dura poco, el daño es limitado.
- El refresh token solo viaja al IdP (un endpoint seguro) → puedes revocarlo, hacerle tracking, detectar reúso sospechoso.

[ver código en la app]

💡 Refresh token rotation: Keycloak puede emitir un nuevo refresh token en cada renovación (invalida el anterior). Si alguien roba el token y lo usa primero, el siguiente intento legítimo falla → alerta de compromiso.

---

**Pregunta 5:** ¿Qué flujos OAuth2 hay y cuándo usar cada uno?

**Respuesta:** Authorization Code + PKCE (el estándar para apps de usuario):
[ver código en la app]
PKCE evita que un atacante que intercepte el code pueda canjearlo (necesita el code_verifier que solo conoce la app).

Client Credentials (machine-to-machine, sin usuario):
[ver código en la app]
Muy útil para llamadas backend-a-backend, jobs programados, integraciones.

Resumen de flujos:
- Authorization Code + PKCE (el estándar moderno): SPAs y apps móviles. PKCE evita interceptación del code.
- Client Credentials: machine-to-machine, sin usuario. Backend interno.
- Device Authorization (RFC 8628): dispositivos sin input (TV, IoT). Código en pantalla; login en otro dispositivo.
- Refresh Token Grant: renueva el access token cuando expira.
- Resource Owner Password Credentials: usuario+password directos a la app. Deprecado.
- Implicit Flow: deprecado desde OAuth 2.1.

💡 Tip: si te preguntan "¿con qué flujo me autentico desde una SPA?" la respuesta clavada es Authorization Code + PKCE. Y si dicen "sin login interactivo" → Client Credentials. Eso lo mete Agata Next con Keycloak.

💡 Analogía: Authorization Code + PKCE es como dejar la maleta en consigna del aeropuerto: te dan un código pero también te sellan un papelito (verifier); para recogerla necesitas el código Y el papelito. Si te roban el código en el camino, no les sirve sin el papelito.

---

**Pregunta 6:** CSRF y XSS: ¿qué son y cómo se previenen?

**Respuesta:** - CSRF (Cross-Site Request Forgery): una página maliciosa hace que tu navegador envíe una petición autenticada a otro sitio donde estás logueado (cookies se envían automáticamente). Defensa estándar: CSRF token (Spring Security lo añade por defecto en sesiones web), SameSite=Strict/Lax en cookies (mitiga la mayoría hoy), y en APIs stateless con JWT en Authorization header ya no aplica (las cookies no se mandan automáticamente al header).
- XSS (Cross-Site Scripting): el atacante inyecta JS en una página que tú renderizas → ejecuta en el contexto del usuario, puede robar tokens del localStorage. Defensa: escapar siempre la salida (Thymeleaf/React lo hacen por defecto si no usas dangerouslySetInnerHTML/th:utext), Content Security Policy (CSP) restrictiva, HttpOnly en cookies (que JS no las pueda leer), sanitizar HTML rico con librerías (OWASP Java HTML Sanitizer, DOMPurify).

Las dos son del top OWASP 10. En backend tu trabajo es: validar entrada, escapar salida, headers de seguridad (X-Content-Type-Options, X-Frame-Options/CSP, Strict-Transport-Security).

---

**Pregunta 7:** ¿Cómo gestionas secretos (credenciales, claves) en una app?

**Respuesta:** Reglas básicas:
- Nunca commitees secretos al repositorio. Usa .gitignore, escáneres (gitleaks, GitHub secret scanning).
- Variables de entorno para configuración por entorno (Spring lee ${ENV_VAR:default} o application-{profile}.yml).

Producción seria:
- HashiCorp Vault: gestor centralizado con rotación automática, ACLs, audit log. Spring Cloud Vault lo integra.
- Secrets de Kubernetes: nativos pero base64 (no cifrados); para cifrar en el repo usa Sealed Secrets (Bitnami) o External Secrets Operator que los pull desde Vault/AWS Secrets Manager.
- Cloud-native: AWS Secrets Manager / Azure Key Vault / GCP Secret Manager con SDKs.

Buenas prácticas:
- Rotación periódica (los gestores buenos lo automatizan).
- Least privilege: cada servicio solo accede a los secretos que necesita.
- No los logues nunca (cuidado con toString() de configs).
- mTLS / IAM roles cuando puedas evitar credenciales (auth basada en identidad de la VM/pod).

---

**Pregunta 8:** ¿Qué es mTLS y dónde aplica?

**Respuesta:** mTLS (mutual TLS) = TLS de doble dirección: no solo el cliente verifica al servidor (TLS normal con certificado del servidor), sino que el servidor también verifica al cliente mediante un certificado X.509 que el cliente presenta. Ambos lados se autentican criptográficamente.

Usos típicos:
- Comunicación entre microservicios internos: cada servicio tiene su certificado emitido por una CA interna; sin certificado válido, no entras. Es la base del zero trust dentro del clúster (a menudo gestionado por un service mesh como Istio o Linkerd, que inyecta sidecars y rota los certificados automáticamente).
- APIs B2B sensibles (banca, sanidad) donde no basta con un API key o JWT.
- Acceso a Kafka desde clientes, con certificados gestionados por Strimzi.
- Conexiones a BD críticas.

Ventaja: identidad fuerte basada en certificados, no en secretos compartidos. Coste: gestión del ciclo de vida de los certificados (emisión, rotación, revocación). Sin automatización (cert-manager, Vault PKI, mesh) es operacionalmente caro.

---

**Pregunta 9:** ¿Diferencia entre autenticación y autorización?

**Respuesta:** Dos cosas distintas que se confunden con frecuencia:

- Autenticación (authN): ¿quién eres? El sistema verifica tu identidad. Login con usuario+contraseña, validar un JWT, autenticar con un certificado mTLS, presentar un API key. El resultado: el sistema sabe quién eres (o falla).
- Autorización (authZ): ¿qué puedes hacer? Una vez autenticado, el sistema decide si tienes permiso para una acción/recurso concreto. Roles (ADMIN, USER), scopes OAuth2, políticas ABAC, listas de control de acceso.

Fallar al distinguirlas es causa habitual de vulnerabilidades:
- 401 Unauthorized = problema de authN (no sé quién eres).
- 403 Forbidden = problema de authZ (sé quién eres pero no te dejo).
- IDOR (Insecure Direct Object Reference): el bug clásico de "olvidé comprobar que el usuario es dueño del pedido /pedidos/123" — authN correcta pero authZ ausente.

Regla: siempre se hace authN antes que authZ. Y la authZ se comprueba en cada operación, no solo al login.

---

**Pregunta 10:** OIDC vs OAuth2 vs SAML: ¿qué hace cada uno?

**Respuesta:** - OAuth2 (RFC 6749): protocolo de autorización delegada. Una app obtiene un access_token para llamar a una API en nombre del usuario, sin que el usuario le dé sus credenciales. No dice quién es el usuario — solo permite acceso.
- OIDC (OpenID Connect): capa de identidad sobre OAuth2. Añade un id_token (JWT firmado) que prueba la identidad del usuario al cliente. Es lo que usas para hacer login en webs y apps modernas ("Iniciar con Google"). Los flujos son los de OAuth2 (Authorization Code + PKCE).
- SAML 2.0: estándar XML más antiguo, dominante en entornos empresariales (LDAP/AD, Okta clásico, federation B2B). Resuelve SSO: una redirección XML firmada que prueba al consumidor (Service Provider) que el usuario está autenticado en el Identity Provider.

Regla:
- Apps nuevas (web/mobile) → OIDC.
- Acceso a APIs sin login de usuario (machine-to-machine) → OAuth2 client credentials.
- Integración con sistemas legacy / corporativos que ya hablan SAML → SAML.
- Keycloak los soporta los tres simultáneamente (típico de un IAM moderno).

💡 Analogía: dejas a tu casero entrar a regar las plantas mientras estás de vacaciones.
- OAuth2: le das la llave para regar (permiso a UNA acción concreta). No le das un DNI, ni necesita saber tu nombre completo, ni quién eres.
- OIDC: como OAuth2 + le enseñas el DNI con foto al darle la llave ("y por cierto, soy yo"). Ahora sí sabe quién eres → eso es login.
- SAML: la misma idea, pero con un sobre firmado por un notario en formato XML (el estándar empresarial veterano).

---

**Pregunta 11:** Keycloak: ¿qué es y qué conceptos hay que conocer?

**Respuesta:** Keycloak es un IAM (Identity and Access Management) open-source. Centraliza autenticación, gestión de usuarios y emisión de tokens; expone OIDC, OAuth2 y SAML.

Conceptos clave:
- Realm: tenant / espacio aislado. Cada realm tiene sus usuarios, clients, roles y políticas. Una empresa puede tener un realm corporate para empleados y otro customers para usuarios externos.
- Client: la aplicación que se integra con Keycloak (tu frontend, tu API, Grafana, Zabbix). Cada cliente con su client_id, redirect URIs permitidos, flujos habilitados y settings de tokens.
- User: el usuario. Puede tener credenciales locales o ser federado desde LDAP/AD/social.
- Roles: pueden ser realm-level (admin, operator) o client-level (grafanaadmin solo aplica a Grafana). Los composite roles agrupan otros.
- Groups: agrupaciones de usuarios con roles asignados; mucho mejor que asignar roles uno a uno.
- Identity Providers: federación con LDAP/AD/social (Google, Microsoft, otro Keycloak).
- Protocol mappers: deciden qué información del usuario va a los claims del token.

En Agata Next: Realm agata, clients para Frontend (OIDC PKCE), Grafana (OAuth2), Zabbix (SAML); StatefulSet de 3 réplicas con caché Infinispan distribuida + Postgres (CNPG).

---

**Pregunta 12:** Arquitectura de Spring Security: FilterChain, AuthenticationManager y SecurityContext.

**Respuesta:** Spring Security funciona como una cadena de filtros HTTP insertada antes de los controllers. Cada request atraviesa N filtros que pueden autenticar, autorizar o rechazar.

[ver código en la app]

Piezas clave:
- SecurityFilterChain: la cadena ordenada de filtros. Configurable con un SecurityFilterChain bean (forma moderna desde Spring Security 6).
- AuthenticationManager: valida credenciales/tokens. Delegación a AuthenticationProviders (uno por mecanismo: JWT, DAO con BCrypt, LDAP).
- SecurityContext (en SecurityContextHolder, con ThreadLocal): contiene el Authentication actual — quién es el usuario, qué authorities tiene. Disponible durante toda la request.
- AuthorizationManager: evalúa si el Authentication actual puede acceder al recurso.

Configuración mínima moderna para una API stateless con JWT:
[ver código en la app]

Cuidado con virtual threads + SecurityContextHolder: por defecto usa ThreadLocal, que se propaga raro con Loom. Spring 6.1+ lo gestiona bien, pero asegúrate de no llevarte el contexto manualmente a otro hilo sin DelegatingSecurityContextRunnable.

---

**Pregunta 13:** ¿Cómo aplicas autorización fina a nivel de método?

**Respuesta:** Spring Security permite autorización declarativa dentro del código, no solo en la URL:

[ver código en la app]

Anotaciones disponibles:
- @PreAuthorize: la expresión se evalúa antes del método. Acceso al Authentication, parámetros (#param), beans.
- @PostAuthorize: después, con acceso a returnObject. Útil para filtros sobre el resultado.
- @PreFilter/@PostFilter: filtra colecciones que entran/salen según una expresión por elemento.
- @Secured("ROLE_ADMIN") / @RolesAllowed(...): más simples, sin SpEL.

El SpEL (Spring Expression Language) permite reglas potentes pero cuidado con la complejidad: si la expresión se vuelve ilegible, mejor un método con un nombre claro: @PreAuthorize("@auth.canModify(#id, authentication)"). Reglas complejas viven mejor en un bean auth que en una anotación.

---

**Pregunta 14:** RBAC vs ABAC vs ReBAC: modelos de autorización.

**Respuesta:** Tres modelos según cómo se decide "¿puede X hacer Y sobre Z?":

- RBAC (Role-Based): a los usuarios se les asignan roles (admin/editor/viewer); a los roles, permisos. Lo más extendido. Sencillo y suficiente para sistemas con permisos uniformes. Limita cuando hay reglas contextuales ("solo el dueño del pedido", "solo en horario laboral").
- ABAC (Attribute-Based): la decisión se basa en atributos del sujeto (rol, departamento, MFA activo), del recurso (clasificación, propietario), de la acción y del contexto (hora, IP). Reglas: pedido.dueño == usuario.id AND hora ∈ horario_oficina. Estándar: XACML (verboso); en práctica con Open Policy Agent (OPA) y su lenguaje Rego. Más expresivo, más complejo.
- ReBAC (Relationship-Based): la autorización se modela como un grafo de relaciones. "X tiene relación R con Z". Popularizado por Google Zanzibar; implementaciones modernas: OpenFGA, SpiceDB. Brilla cuando los permisos derivan de relaciones ("el manager del autor del documento puede editarlo") — típico de Drive/GitHub.

Regla:
- App estándar con roles claros → RBAC.
- Reglas con contexto/atributos dinámicos → ABAC (OPA).
- Grafos de permisos / jerarquías profundas / sharing → ReBAC.

💡 Analogía: un hospital.
- RBAC: la bata blanca te identifica como médico, la verde como enfermero, la azul como admin. Tu rol = qué puedes hacer.
- ABAC: "un médico solo ve pacientes de SU servicio Y en SU turno". Permisos con contexto (atributos del usuario, del recurso, hora del día).
- ReBAC: "el médico tiene relación TRATA con el paciente desde la admisión X" — el permiso se deriva de las relaciones del grafo, no de un rol fijo.

---

**Pregunta 15:** SSO y Single Logout: ¿cómo funcionan?

**Respuesta:** SSO (Single Sign-On): el usuario hace login una vez y queda autenticado en todas las apps conectadas al mismo IdP (Keycloak). Cuando entras a otra app, te redirige al IdP; este ve que ya estás logueado (cookie de sesión SSO en el dominio del IdP) y te devuelve con un token.

[ver código en la app]

Single Logout (SLO): cerrar sesión en una app debe cerrarla en todas. Mecanismos:
- Front-channel: el IdP redirige el navegador a cada client con un frontchannel_logout_uri (vía iframes). Frágil con bloqueadores y third-party cookies.
- Back-channel: el IdP llama directamente a un endpoint server-to-server de cada client con un Logout Token (JWT). Más fiable, requiere endpoint expuesto.

Keycloak soporta ambos. Estrategia práctica: tokens cortos + refresh tokens revocables + back-channel logout. Si el access token sigue válido tras logout, el bug clásico es que se puede usar hasta que expire — de ahí TTLs bajos y validar contra el IdP en endpoints sensibles.

---

**Pregunta 16:** ¿Cómo se guardan contraseñas correctamente?

**Respuesta:** Nunca en plano y nunca con hashes rápidos (MD5, SHA-1, SHA-256 puro). Esos están diseñados para ser rápidos — un atacante con la BD filtrada puede probar billones de combinaciones por segundo en una GPU.

[ver código en la app]

[ver código en la app]

Claves adicionales:
- Salt único por password (los buenos algoritmos lo gestionan internamente).
- Pepper (secret global no en la BD): defensa extra si la BD se filtra.
- Ajustar cost factor conforme crece el hardware — lo que era seguro hace 5 años puede no serlo ahora.

---

**Pregunta 17:** ¿Cómo propagas la identidad del usuario entre microservicios?

**Respuesta:** Cuando una petición de usuario entra al sistema y atraviesa varios servicios, el receptor necesita saber quién es el usuario y con qué permisos.

[ver código en la app]

Reglas:
- mínimo privilegio: el servicio C no necesita los permisos completos del usuario.
- TTL corto en service tokens (minutos, no horas).
- Trace context + identidad para auditoría: logs con traceId + userId + serviceId.

En Agata Next: Keycloak 26.5 emite tokens con audience específico por microservicio; los conectores usan service accounts con roles mínimos; Spring Security valida audience en el JWT antes de aceptar la llamada.

---

**Pregunta 18:** MFA, TOTP, WebAuthn/passkeys: ¿qué elegir?

**Respuesta:** MFA (Multi-Factor Authentication) = combinar al menos dos de tres factores: algo que sabes (password), algo que tienes (móvil, llave), algo que eres (huella, cara). Sube enormemente la barra para un atacante: phishear la password no basta.

Métodos, de más débil a más fuerte:
- SMS / email OTP: lo más común pero el más débil. Vulnerable a SIM swap, intercepción, phishing. NIST lo desaconseja para sistemas sensibles.
- TOTP (Time-based OTP): códigos de 6 dígitos cada 30s, en una app autenticadora (Google Authenticator, Authy). RFC 6238. Mucho mejor que SMS, sin coste de operador. Susceptible a phishing en tiempo real si el usuario teclea el código en una página falsa.
- Push notifications (Duo, Okta Verify): apruebas en el móvil. Phishable también si el atacante te envía notificaciones legítimas.
- FIDO2 / WebAuthn / passkeys: criptografía de clave pública. La llave (Yubikey o passkey en el dispositivo) firma un challenge ligado al origen real. Phishing-resistant por construcción: un sitio falso no recibe la firma válida. Es el estándar moderno y el camino al "sin contraseñas".

Reglas:
- Para usuarios → WebAuthn / passkeys donde puedas, TOTP como mínimo.
- Evita SMS salvo como último recurso.
- Keycloak soporta TOTP y WebAuthn nativos; los configuras como required actions o flujos condicionales (MFA solo en operaciones sensibles).

---

### CORS (5 preguntas)

**Pregunta 1:** Si un front externo se conecta a tu backend y aparece un error de CORS, ¿qué está pasando? ¿Cuál es la raíz del problema?

**Respuesta:** CORS (Cross-Origin Resource Sharing) es un mecanismo del navegador que extiende la same-origin policy. Cuando JavaScript de un origen (https://web-a.com) intenta llamar a un backend de otro origen (https://api-b.com), el navegador exige que el servidor declare explícitamente que permite ese origen.

Si el server no devuelve los headers Access-Control-Allow-Origin (y compañía) o el preflight OPTIONS falla, el navegador bloquea la respuesta. La raíz: el servidor no está configurado para autorizar peticiones cross-origin desde ese front.

Nota: la petición sí sale y el server la procesa (en requests simples); lo que bloquea el navegador es el acceso del JS a la respuesta. CORS no es seguridad del servidor, es protección del navegador del usuario.

---

**Pregunta 2:** ¿Cómo puedes forzar un error de CORS desde una web no autorizada?

**Respuesta:** Si abres https://app.agata.io y su JS hace fetch("https://api.agata.io/datos"), el navegador detecta origen cruzado (dominio distinto) y añade cabeceras CORS a la petición.

[ver código en la app]

[ver código en la app]

---

**Pregunta 3:** ¿Qué diferencia hay entre un error de CORS y un problema de autorización?

**Respuesta:** Son problemas distintos que a veces se confunden:

[ver código en la app]

Un error CORS en una API pública siempre es un bug del servidor (falta o mala configuración del header). Un 401/403 también puede parecer un error CORS si la preflight OPTIONS falla por autenticación — muchas APIs no deberían exigir auth en OPTIONS.

[ver código en la app]

---

**Pregunta 4:** ¿Qué diferencia hay entre un 401 y un 403?

**Respuesta:** [ver código en la app]

Caso típico que confunde: devolver 403 cuando debería ser 404. Si un usuario pide GET /pedidos/123 y el pedido existe pero pertenece a otro usuario, hay dos opciones:
- 403: le dices que existe pero no tiene permiso → da información al atacante.
- 404: lo tratas como si no existiera → más seguro (no revelas que el recurso existe).

Elige 404 cuando la existencia del recurso es sensible.

[ver código en la app]

---

**Pregunta 5:** ¿Cuándo devuelve una API un 404? ¿Y un 500? ¿Un 500 es culpa del cliente o del servidor?

**Respuesta:** - 404 Not Found: el recurso pedido no existe (ruta no mapeada, ID inexistente).
- 403 Forbidden: el recurso existe pero el usuario autenticado no tiene permiso para acceder.
- 401 Unauthorized: no hay credenciales válidas (no autenticado); debería llamarse "Unauthenticated".

[ver código en la app]

[ver código en la app]

Truco de seguridad: a veces se devuelve 404 en vez de 403 para no revelar que el recurso existe (evitar enumeración). En Agata Next los endpoints de configuración devuelven 404 a usuarios sin rol ADMIN aunque el conector exista.

---

### CONTRACTS (6 preguntas)

**Pregunta 1:** ¿Qué es OpenAPI y qué es contract-first vs code-first?

**Respuesta:** OpenAPI (antes Swagger) es una especificación para describir APIs REST en formato YAML/JSON. Define endpoints, parámetros, schemas y respuestas de forma legible por máquinas.

[ver código en la app]

Usos:
- Generar código cliente (openapi-generator → SDK en Java, Python, TS).
- Generar documentación interactiva (Swagger UI, Redoc).
- Validar contratos en CI (tests de contrato con Pact o schema diff).
- Design-first: escribir el spec antes del código → alinear equipos.

---

**Pregunta 2:** ¿Cómo se relaciona un OpenAPI con el código en contract-first (codegen)?

**Respuesta:** Con openapi-generator (o swagger-codegen) generas, a partir del YAML, una interfaz Java por cada operación + los DTOs (modelos) y validaciones. Tu REST controller la implementa: el contrato es la fuente de verdad y el código se adapta.

[ver código en la app]

En hexagonal, todo esto vive en el borde/infraestructura: el dominio no sabe nada del YAML ni de los DTOs generados. El mapper (MapStruct) traduce entre el DTO generado y el comando del dominio.

💡 Agata Next: contrato-first en todos los endpoints. El YAML está en el repo, el openapi-generator-maven-plugin genera en el build, y los controllers implementan la interfaz generada. Breaking changes se detectan en el PR, no en producción.

---

**Pregunta 3:** ¿Qué es AsyncAPI y en qué se diferencia de OpenAPI?

**Respuesta:** AsyncAPI es el equivalente a OpenAPI pero para arquitecturas dirigidas por eventos / mensajería (Kafka, RabbitMQ, MQTT, WebSockets).

[ver código en la app]

Describe: channels (topics/colas), operaciones (publish/subscribe), los mensajes y sus payloads/schemas (JSON Schema, Avro, Protobuf), y los bindings del broker (config Kafka: partitions, retention).

Misma filosofía contract-first: documentar el contrato de los eventos, generar código/documentación, validar payloads.

En un sistema con microservicios + Kafka, sueles tener ambos: OpenAPI para las APIs REST síncronas + AsyncAPI para los eventos asíncronos.

💡 Agata Next: el proyecto mantiene AsyncAPI specs para los topics críticos (eventos de dispositivo, eventos de dominio DDD). El Schema Registry (Apicurio) valida que los producers respeten el esquema antes de publicar.

---

**Pregunta 4:** ¿Cómo versionas una API y manejas los breaking changes?

**Respuesta:** Un breaking change rompe a los consumidores existentes sin que lo sepan.

[ver código en la app]

Estrategias:
[ver código en la app]

En Agata Next: se usa Pact para consumer-driven contract tests — cada conector genera su contrato; el proveedor lo valida en CI antes de mergear cualquier cambio de API.

---

**Pregunta 5:** ¿Qué es un Schema Registry y por qué importa la evolución de esquemas en Kafka?

**Respuesta:** Un Schema Registry (Confluent, Apicurio) almacena y versiona los esquemas de los mensajes (Avro, Protobuf o JSON Schema) que circulan por los topics. El productor serializa con un schema id; el consumidor lo recupera del registry para deserializar. Evita meter el esquema en cada mensaje y desacopla a productores/consumidores.

La evolución de esquemas define qué cambios se permiten sin romper:
- Backward: un consumidor con el esquema nuevo puede leer datos viejos (p.ej. añadir campo con default).
- Forward: un consumidor con el esquema viejo puede leer datos nuevos.
- Full: ambas.

El registry valida la compatibilidad al registrar una versión nueva y rechaza cambios incompatibles → seguridad en sistemas event-driven donde productor y consumidor despliegan por separado.

---

**Pregunta 6:** ¿Qué es el consumer-driven contract testing (p.ej. Pact)?

**Respuesta:** En microservicios, los tests E2E entre servicios son lentos y frágiles. El contract testing verifica que dos servicios acuerdan un contrato sin desplegarlos juntos:

- Consumer-driven (Pact): el consumidor define qué espera de la API (un pact); ese contrato se verifica contra el proveedor en su propio pipeline. Si el proveedor rompe algo que un consumidor usa, falla su build.

Ventajas: detecta breaking changes antes de desplegar, cada servicio se testea aislado (rápido), y documenta las expectativas reales. Complementa a OpenAPI/AsyncAPI: el spec define la forma; el contract test verifica las interacciones concretas que un consumidor depende. Encaja en la cima de la pirámide en lugar de E2E.

---
