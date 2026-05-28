# Spring Security, OAuth2 y Keycloak

## Contexto real del proyecto

En Agata Next, Keycloak actúa como Identity Provider (IdP) centralizado:
- SSO para el frontend (Next.js + next-auth), Grafana, Zabbix y los microservicios backend.
- Los microservicios Spring Boot actúan como **OAuth2 Resource Servers**: validan
  el JWT emitido por Keycloak en cada request.
- Comunicación M2M (microservicio → microservicio): Client Credentials flow con
  tokens de servicio, sin usuario.
- mTLS entre servicios como capa adicional (zero trust).

---

## 1. Spring Security — Fundamentos

Spring Security intercepta requests con una cadena de filtros (FilterChain).
El orden importa: la autenticación se verifica antes que la autorización.

### SecurityFilterChain (Spring Security 5.7+)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable()) // APIs REST stateless: desactivar CSRF
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/api/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/entities/**").hasRole("VIEWER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
            )
            .build();
    }
}
```

### SecurityContext y autenticación

`SecurityContextHolder` guarda el contexto de seguridad del thread actual
(por defecto ThreadLocal, compatible con Virtual Threads).

```java
// Obtener el usuario autenticado desde cualquier bean:
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();
Collection<? extends GrantedAuthority> roles = auth.getAuthorities();

// En un JwtAuthenticationToken (OAuth2 Resource Server):
JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) auth;
String userId = jwtAuth.getToken().getClaimAsString("sub");
```

---

## 2. OAuth2 Resource Server con JWT

### Configuración mínima

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.agata.local/realms/agata
          # Spring descarga automáticamente el JWKS desde el well-known endpoint
```

Con `issuer-uri`, Spring Security:
1. Descarga el `/.well-known/openid-configuration` del realm de Keycloak.
2. Obtiene el endpoint `jwks_uri` y descarga las claves públicas.
3. En cada request, valida la firma del JWT con esas claves.
4. Verifica `iss` (issuer), `exp` (expiración) y `aud` (audience si se configura).

### JwtAuthenticationConverter — extraer roles de Keycloak

Por defecto, Spring Security espera roles en el claim `scope`. Keycloak los pone
en `realm_access.roles` (roles del realm) y `resource_access.<client>.roles` (del cliente).
Hay que mapear esto a `GrantedAuthority`:

```java
@Bean
public JwtAuthenticationConverter jwtAuthConverter() {
    var converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        List<String> roles = new ArrayList<>();

        // Roles del realm
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null) {
            roles.addAll((List<String>) realmAccess.get("roles"));
        }

        // Roles del cliente específico
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess != null) {
            Map<String, Object> clientRoles = (Map<String, Object>) resourceAccess.get("agata-backend");
            if (clientRoles != null) {
                roles.addAll((List<String>) clientRoles.get("roles"));
            }
        }

        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toList());
    });
    return converter;
}
```

### Acceso a claims del JWT en un controller

```java
@RestController
public class EntityController {

    @GetMapping("/api/entities")
    public List<EntityDto> getEntities(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        List<String> roles = jwt.getClaimAsStringList("roles");
        return entityService.findByUser(userId);
    }
}
```

### Method Security

```java
@Configuration
@EnableMethodSecurity // necesario para @PreAuthorize
public class MethodSecurityConfig {}

@Service
public class EntityService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteEntity(String id) { /* solo ADMIN */ }

    @PreAuthorize("hasAnyRole('VIEWER', 'EDITOR')")
    public EntityDto findById(String id) { /* VIEWER o EDITOR */ }

    @PreAuthorize("@entityAcl.canAccess(authentication, #id)")
    public EntityDto findByIdWithAcl(String id) { /* ACL custom */ }
}
```

El `@entityAcl.canAccess(...)` llama a un bean Spring, permitiendo lógica de
autorización compleja (comprobar ownership, tenant, etc.).

---

## 3. OAuth2 Client — M2M con Client Credentials

Para que un microservicio llame a otro microservicio de forma segura,
usando Client Credentials (sin usuario):

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          agata-backend:
            client-id: agata-connector-service
            client-secret: ${KEYCLOAK_CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: openid, read:entities
        provider:
          agata-backend:
            token-uri: https://keycloak.agata.local/realms/agata/protocol/openid-connect/token
```

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(ReactiveOAuth2AuthorizedClientManager clientManager) {
        var oauth2 = new ServerOAuth2AuthorizedClientExchangeFilterFunction(clientManager);
        oauth2.setDefaultClientRegistrationId("agata-backend");

        return WebClient.builder()
            .filter(oauth2) // añade el Bearer token automáticamente
            .build();
    }
}

// Uso:
webClient.get()
    .uri("http://entities-service/api/entities/{id}", entityId)
    .retrieve()
    .bodyToMono(EntityDto.class);
```

Spring gestiona el ciclo de vida del token: lo cachea y lo renueva cuando caduca.

---

## 4. Keycloak — Conceptos clave

### Realm

Un realm es un espacio de identidad aislado: tiene sus propios usuarios, roles,
clientes y políticas. En Agata: un realm `agata` para producción,
otro `agata-dev` para desarrollo. Equivalente a un "tenant".

### Clients

Un client en Keycloak representa una aplicación:
- **Frontend (SPA)**: public client (no tiene client_secret), usa PKCE.
- **Backend (confidential)**: tiene client_secret, puede hacer Client Credentials.
- **Service account**: permite al client hacer llamadas M2M.

### Roles

Dos tipos:
- **Realm roles**: comunes a todos los clients del realm (ej: `ADMIN`, `VIEWER`).
- **Client roles**: específicos de un client (ej: `agata-frontend:editor`).

**Composite roles**: un rol que agrupa otros. Útil para `ADMIN` que incluye `EDITOR` + `VIEWER`.

### Scopes y claims

Los scopes controlan qué claims van en el access_token. Configurables
con **Protocol Mappers** en Keycloak:
- `User Attribute Mapper`: añade un atributo de usuario al token.
- `Hardcoded Claim Mapper`: añade un claim fijo.
- `Group Membership Mapper`: añade grupos del usuario.
- `Audience Mapper`: añade `aud` para que el Resource Server valide a quién va dirigido.

### PKCE (Proof Key for Code Exchange)

Para SPAs y apps móviles donde no se puede guardar el client_secret de forma segura.
El cliente genera un `code_verifier` (random), calcula `code_challenge = SHA256(code_verifier)`,
envía el challenge al authorization endpoint. Al intercambiar el code por el token,
envía el verifier. Keycloak verifica que el verifier coincide con el challenge original.
Previene ataques de interceptación del authorization code.

---

## 5. OIDC vs OAuth2 vs SAML

**OAuth2**: protocolo de **autorización** delegada. Permite que una app acceda
a recursos de otra app en nombre del usuario. El resultado es un `access_token`.
OAuth2 no dice nada sobre quién es el usuario.

**OpenID Connect (OIDC)**: extensión de OAuth2 para **autenticación**. Añade el
`id_token` (JWT con información del usuario: sub, email, name) y el endpoint `/userinfo`.
Con OIDC sabes quién es el usuario. Keycloak implementa OIDC.

**SAML 2.0**: estándar más antiguo (XML) para **SSO empresarial**. El IdP genera
una "aserción" firmada en XML que el SP (Service Provider) valida. Más común en
entornos enterprise con Active Directory/LDAP. Keycloak soporta SAML como IdP y como SP.

| | OAuth2 | OIDC | SAML |
|-|--------|------|------|
| Formato token | Opaco/JWT | JWT (id_token) | XML Assertion |
| Caso de uso | Autorización delegada | Autenticación/SSO | SSO enterprise |
| Complejidad | Media | Media | Alta |
| Ecosistema | APIs REST | Moderno | Legacy enterprise |

**Flujos OAuth2 relevantes:**
- **Authorization Code + PKCE**: web/mobile con usuario. El más seguro.
- **Client Credentials**: M2M sin usuario.
- **Device Flow**: dispositivos sin browser (IoT).
- ~~Implicit~~: deprecado.
- ~~Resource Owner Password~~: deprecado (envia credenciales al cliente).

---

## 6. JWT — Estructura y validación

Un JWT tiene tres partes separadas por `.`: `Header.Payload.Signature`.
Cada parte está en Base64URL.

**Header**: tipo de token y algoritmo de firma.
```json
{ "alg": "RS256", "typ": "JWT", "kid": "key-id-123" }
```

**Payload** (claims):
```json
{
  "sub": "user-uuid",
  "iss": "https://keycloak.agata.local/realms/agata",
  "aud": "agata-backend",
  "exp": 1717000000,
  "iat": 1716996400,
  "preferred_username": "raul.garcia",
  "realm_access": { "roles": ["VIEWER", "EDITOR"] }
}
```

**Signature**: `RS256` = PKCS1v15 con SHA-256 y clave privada del IdP.
El Resource Server verifica con la clave pública del JWKS endpoint.

**Claims importantes**:
- `sub`: subject (ID del usuario).
- `iss`: issuer (debe coincidir con el realm de Keycloak).
- `aud`: audience (debe coincidir con el client_id del Resource Server).
- `exp`: expiration (Unix timestamp).
- `iat`: issued at.
- `jti`: JWT ID (previene replay si se guarda en blacklist).

**Validación de `aud`** en Spring Security:

```java
// En application.yml:
spring.security.oauth2.resourceserver.jwt.audiences: agata-backend
```

Si no se valida `aud`, cualquier token del mismo realm sirve para todos los servicios.

---

## 7. mTLS — Mutual TLS entre microservicios

En mTLS (zero trust), tanto el cliente como el servidor presentan certificados.
Garantiza que solo servicios con certificado emitido por la CA interna pueden llamarse.

Implementación típica con Kubernetes:
- **cert-manager** genera y renueva certificados automáticamente.
- **Service Mesh** (Istio, Linkerd): intercepta todo el tráfico y aplica mTLS
  de forma transparente (sidecar proxy), sin cambios en el código de la app.
- Sin service mesh: configurar `trust-manager` en Spring Boot con el truststore de la CA.

```yaml
# application.yml — mTLS en Spring Boot
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    trust-store: classpath:truststore.p12
    trust-store-password: ${TRUSTSTORE_PASSWORD}
    client-auth: need # exige certificado del cliente
```

---

## 8. CORS en APIs REST con Spring Security

CORS (Cross-Origin Resource Sharing) se gestiona antes de Spring Security.
Spring Security tiene integración nativa:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.agata.local", "http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}

// En SecurityFilterChain:
http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
```

El `OPTIONS` preflight no debe requerir autenticación:
```java
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
```

---

## 9. Preguntas de entrevista — Seguridad

¿Cuál es la diferencia entre autenticación y autorización?
> Autenticación: verificar quién es el usuario (¿eres quien dices ser?).
> Autorización: verificar qué puede hacer (¿tienes permiso?). En Spring Security:
> autenticación via OAuth2/JWT; autorización via `hasRole`, `@PreAuthorize`.

¿Cómo valida Spring Boot un JWT de Keycloak?
> Con `issuer-uri`, Spring descarga el JWKS endpoint del realm. Por cada request,
> extrae el JWT del header `Authorization: Bearer <token>`, verifica la firma RS256
> con la clave pública, valida `iss`, `exp` y `aud`. Si todo es correcto, crea
> un `JwtAuthenticationToken` y lo pone en el `SecurityContext`.

¿Qué es PKCE y por qué es necesario para SPAs?
> Proof Key for Code Exchange. Las SPAs no pueden guardar un client_secret de
> forma segura (el código JS es accesible). PKCE sustituye el secret por un
> code_verifier/code_challenge dinámico generado en cada flujo. Así, aunque
> un atacante intercepte el authorization code, no puede intercambiarlo por
> un token sin el code_verifier original.

¿Diferencia entre realm roles y client roles en Keycloak?
> Realm roles son globales al realm y se incluyen en `realm_access.roles` del JWT.
> Client roles son específicos de una aplicación y están en `resource_access.<client>.roles`.
> Composite roles agrupan otros roles para simplificar asignaciones.

¿Cómo implementarías multi-tenancy con Keycloak?
> Opción 1: un realm por tenant (aislamiento total, escalado costoso).
> Opción 2: un solo realm con grupos/atributos por tenant (más eficiente).
> En Spring Security, se extrae el tenant del JWT y se filtra a nivel de servicio.
> Con Spring Security multi-tenancy: `JwtIssuerAuthenticationManagerResolver`
> selecciona el AuthenticationManager según el `iss` del token.
