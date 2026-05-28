# Testing Avanzado — Testcontainers, WireMock, BDD y Estrategia

## La pirámide de testing en arquitectura hexagonal

En hexagonal, cada capa tiene tests con distintas características:

```
         ╔══════════════╗
         ║  E2E / API   ║  ← Pocos. Lentos. Postman/RestAssured contra entorno real.
         ╚══════════════╝
      ╔══════════════════════╗
      ║  Integración         ║  ← Medios. Testcontainers + WireMock.
      ║  (adaptadores)       ║    Verifica que los adaptadores funcionan con infra real.
      ╚══════════════════════╝
   ╔════════════════════════════╗
   ║  Unitarios                 ║  ← Muchos. Rápidos. Sin infra.
   ║  (dominio + casos de uso)  ║    Given/When/Then + Object Mothers + Mockito.
   ╚════════════════════════════╝
```

**Regla en hexagonal**: el dominio y los casos de uso son puras funciones
(entradas → salidas), así que los tests unitarios son muy limpios.
Los adaptadores (JPA, Kafka, REST clients) se testean con integración + infra real.
**Nunca mockear el repositorio JPA** cuando testeas un adaptador — usa Testcontainers.

---

## 1. Object Mothers — Builders de test

Un **Object Mother** es una clase de factory que crea objetos del dominio para tests.
Centraliza la creación y evita duplicación de `new Entidad(...)` por todo el código.

```java
// EventoAccesoMother.java — en src/test/java/...
public class EventoAccesoMother {

    public static EventoAcceso porDefecto() {
        return new EventoAcceso(
            SensorIdMother.porDefecto(),
            Instant.parse("2024-01-15T10:30:00Z"),
            TipoAcceso.ENTRADA,
            AreaId.of("ZONA-A")
        );
    }

    public static EventoAcceso deZonaRestringida() {
        return new EventoAcceso(
            SensorIdMother.porDefecto(),
            Instant.now(),
            TipoAcceso.ENTRADA,
            AreaId.of("ZONA-RESTRINGIDA")
        );
    }

    public static EventoAcceso conTimestamp(Instant timestamp) {
        return new EventoAcceso(
            SensorIdMother.porDefecto(),
            timestamp,
            TipoAcceso.ENTRADA,
            AreaId.of("ZONA-A")
        );
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private SensorId sensorId = SensorIdMother.porDefecto();
        private Instant timestamp = Instant.now();
        private TipoAcceso tipo = TipoAcceso.ENTRADA;
        private AreaId areaId = AreaId.of("ZONA-A");

        public Builder sensorId(SensorId id) { this.sensorId = id; return this; }
        public Builder enZonaRestringida() { this.areaId = AreaId.of("ZONA-RESTRINGIDA"); return this; }

        public EventoAcceso build() {
            return new EventoAcceso(sensorId, timestamp, tipo, areaId);
        }
    }
}
```

Los Object Mothers viven en `src/test` y se comparten entre módulos de test.
Combinados con Given/When/Then hacen los tests muy legibles.

---

## 2. Tests unitarios — Given/When/Then

Estructura clara para cada test:

```java
@ExtendWith(MockitoExtension.class)
class RegistrarAccesoUseCaseTest {

    @Mock private EventoAccesoRepositoryPort repositoryPort;
    @Mock private EventoPublisherPort publisherPort;
    @InjectMocks private RegistrarAccesoUseCase useCase;

    @Test
    @DisplayName("Dado un evento de acceso válido, cuando se registra, entonces se persiste y se publica")
    void givenValidAccessEvent_whenRegister_thenPersistsAndPublishes() {
        // Given
        var comando = RegistrarAccesoCommandMother.porDefecto();
        var eventoEsperado = EventoAccesoMother.porDefecto();
        when(repositoryPort.save(any())).thenReturn(eventoEsperado);

        // When
        var resultado = useCase.ejecutar(comando);

        // Then
        assertThat(resultado).isEqualTo(eventoEsperado);
        verify(repositoryPort).save(argThat(e -> e.sensorId().equals(comando.sensorId())));
        verify(publisherPort).publicar(eventoEsperado);
    }

    @Test
    @DisplayName("Dado un sensor no registrado, cuando se registra acceso, entonces lanza SensorNoEncontradoException")
    void givenUnknownSensor_whenRegister_thenThrows() {
        // Given
        var comando = RegistrarAccesoCommandMother.conSensorDesconocido();
        when(repositoryPort.save(any())).thenThrow(new SensorNoEncontradoException(comando.sensorId()));

        // When / Then
        assertThatThrownBy(() -> useCase.ejecutar(comando))
            .isInstanceOf(SensorNoEncontradoException.class)
            .hasMessageContaining(comando.sensorId().value());

        verifyNoInteractions(publisherPort); // no publicó si falló
    }
}
```

### @Mock vs @MockBean vs @SpyBean

| | `@Mock` (Mockito) | `@MockBean` (Spring) | `@SpyBean` (Spring) |
|-|-------------------|----------------------|---------------------|
| Contexto Spring | No | Sí | Sí |
| Comportamiento real | No | No | Sí (salvo lo que sobreescribas) |
| Velocidad | Muy rápido | Lento (levanta contexto) | Lento |
| Uso | Tests unitarios | Tests integración Spring | Verificar llamadas a beans reales |

**Regla**: usar `@Mock` + `@ExtendWith(MockitoExtension.class)` en tests unitarios.
`@MockBean` solo cuando el test levanta un contexto Spring (`@SpringBootTest`, `@WebMvcTest`).

### Mockito — stubs y verificaciones

```java
// Stubbing:
when(repo.findById("123")).thenReturn(Optional.of(user));
when(repo.findById("999")).thenReturn(Optional.empty());
when(repo.save(any())).thenThrow(new DataIntegrityViolationException("dup key"));
doAnswer(inv -> { logCalls.add(inv.getArgument(0)); return null; })
    .when(publisher).publicar(any());

// Argumentos:
verify(repo).save(argThat(u -> u.getName().equals("Alice")));
verify(publisher, times(2)).publicar(any());
verify(publisher, never()).publicar(any());
verify(repo, atLeastOnce()).findById(anyString());

// Captor — capturar el argumento real:
var captor = ArgumentCaptor.forClass(EventoAcceso.class);
verify(publisher).publicar(captor.capture());
assertThat(captor.getValue().sensorId()).isEqualTo(expectedSensorId);

// Mockito strict stubs (recomendado):
@ExtendWith(MockitoExtension.class) // ya activa strict stubs
// Falla si un stub no se usa (evita tests con stubs de más)
```

---

## 3. Testcontainers — Infra real en tests

Testcontainers levanta contenedores Docker reales durante los tests de integración.
Los adaptadores se testean contra la base de datos, Kafka o servicio real (no mocks).

### Setup básico con Spring Boot

```java
@SpringBootTest
@Testcontainers
class EventoAccesoMongoRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired
    private EventoAccesoRepositoryPort repository;

    @Test
    void givenEventoAcceso_whenSave_thenCanBeRetrieved() {
        // Given
        var evento = EventoAccesoMother.porDefecto();

        // When
        repository.save(evento);
        var found = repository.findById(evento.id());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().sensorId()).isEqualTo(evento.sensorId());
    }
}
```

### Reutilización del contenedor entre tests (patrón recomendado)

Levantar un contenedor por test es lento. Con `static` + `@Container` se levanta
una vez por clase. Para compartir entre múltiples clases de test:

```java
// AbstractIntegrationTest.java
@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static final MongoDBContainer MONGO = new MongoDBContainer("mongo:7.0");

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.6.0")
    );

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", MONGO::getReplicaSetUrl);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }
    // Los containers son static → se levantan una vez para toda la JVM
}

// Test que hereda:
class EventoRepositoryTest extends AbstractIntegrationTest { /* ... */ }
class KafkaAdapterTest extends AbstractIntegrationTest { /* ... */ }
```

### Contenedores disponibles

- `MongoDBContainer` — MongoDB ReplicaSet.
- `KafkaContainer` — Apache Kafka (Confluent).
- `PostgreSQLContainer` — PostgreSQL.
- `GenericContainer` — cualquier imagen Docker:
  ```java
  new GenericContainer<>("redis:7.2").withExposedPorts(6379)
  ```

### Testcontainers + Kafka

```java
@Container
static final KafkaContainer KAFKA = new KafkaContainer(
    DockerImageName.parse("confluentinc/cp-kafka:7.6.0")
);

@Test
void givenEventoCreado_whenConsumed_thenEstadoActualizado() throws Exception {
    // Given — publicar evento en Kafka
    var evento = EventoAccesoMother.porDefecto();
    kafkaTemplate.send("eventos-acceso", evento.id().value(), evento);

    // When — esperar a que el consumer lo procese
    await().atMost(10, TimeUnit.SECONDS)
        .untilAsserted(() -> {
            var result = repository.findById(evento.id());
            assertThat(result).isPresent();
        });
}
```

---

## 4. WireMock — Stub de APIs externas

WireMock simula servidores HTTP externos. Esencial para testear adaptadores
que llaman a APIs de terceros sin depender de ellas en los tests.

### Setup con Spring Boot

```java
@SpringBootTest
@WireMockTest(httpPort = 8089)
class ExternalSensorAdapterTest {

    @Autowired
    private ExternalSensorPort sensorPort;

    @Test
    void givenSensorApi_whenGetStatus_thenReturnsCorrectData(WireMockRuntimeInfo wm) {
        // Given — configurar el stub
        stubFor(get(urlEqualTo("/api/sensors/S-001"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBodyFile("sensor-response.json"))); // src/test/resources/__files/

        // When
        var status = sensorPort.getStatus("S-001");

        // Then
        assertThat(status.isOnline()).isTrue();
        assertThat(status.lastSeen()).isNotNull();
    }

    @Test
    void givenSensorApiDown_whenGetStatus_thenThrowsServiceException() {
        // Given — simular error 503
        stubFor(get(urlMatching("/api/sensors/.*"))
            .willReturn(aResponse().withStatus(503)));

        // When/Then
        assertThatThrownBy(() -> sensorPort.getStatus("S-001"))
            .isInstanceOf(ExternalServiceException.class);
    }

    @Test
    void givenSlowApi_whenGetStatus_thenTimeoutHandled() {
        // Given — simular timeout
        stubFor(get(urlEqualTo("/api/sensors/S-001"))
            .willReturn(aResponse()
                .withFixedDelay(6000))); // 6s > timeout del cliente

        assertThatThrownBy(() -> sensorPort.getStatus("S-001"))
            .isInstanceOf(ServiceTimeoutException.class);
    }
}
```

### Verificación con WireMock

```java
// Verificar que se llamó exactamente 1 vez:
verify(exactly(1), getRequestedFor(urlEqualTo("/api/sensors/S-001"))
    .withHeader("Authorization", containing("Bearer")));

// Verificar que NO se llamó:
verify(0, postRequestedFor(urlMatching("/api/.*")));
```

### WireMock + Resilience4j (circuit breaker)

Puedes simular escenarios de fallo para testear el circuit breaker:

```java
@Test
void givenConsecutiveFailures_whenCircuitBreakerOpens_thenFallbackActivates() {
    // Simular 5 fallos consecutivos
    stubFor(get(anyUrl()).willReturn(aResponse().withStatus(500)));

    // Llamar 5 veces para abrir el circuit breaker
    IntStream.range(0, 5).forEach(i -> {
        assertThatThrownBy(() -> sensorPort.getStatus("S-001"));
    });

    // El circuit breaker debería estar abierto ahora
    var status = circuitBreakerRegistry.circuitBreaker("sensorApi").getState();
    assertThat(status).isEqualTo(CircuitBreaker.State.OPEN);
}
```

---

## 5. BDD con Cucumber

**Behavior-Driven Development**: los tests se escriben en lenguaje natural
(Gherkin) que puede entender el negocio. Los features se escriben antes del código.

### Archivo .feature (Gherkin)

```gherkin
# src/test/resources/features/registro-acceso.feature
Feature: Registro de acceso de sensores

  Background:
    Given el sistema tiene el sensor "S-001" registrado en la zona "ZONA-A"

  Scenario: Acceso válido a zona normal
    Given el sensor "S-001" intenta acceder a "ZONA-A"
    When se procesa el evento de acceso
    Then el acceso se registra con estado "PERMITIDO"
    And se publica un evento "acceso-registrado.v1" en Kafka

  Scenario: Acceso a zona restringida sin permisos
    Given el sensor "S-001" intenta acceder a "ZONA-RESTRINGIDA"
    And el sensor "S-001" no tiene permisos para zonas restringidas
    When se procesa el evento de acceso
    Then el acceso se registra con estado "DENEGADO"
    And se genera una alerta de seguridad

  Scenario Outline: Validación de tipos de acceso
    Given el sensor "<sensor>" intenta acceder con tipo "<tipo>"
    When se procesa el evento
    Then el resultado es "<resultado>"

    Examples:
      | sensor | tipo    | resultado |
      | S-001  | ENTRADA | PERMITIDO |
      | S-002  | SALIDA  | PERMITIDO |
      | S-999  | ENTRADA | SENSOR_DESCONOCIDO |
```

### Step Definitions (Java)

```java
@CucumberContextConfiguration
@SpringBootTest
@Testcontainers
public class CucumberSteps {

    @Autowired
    private RegistrarAccesoUseCase useCase;
    @Autowired
    private SensorRepository sensorRepository;
    @Autowired
    private KafkaTestConsumer kafkaConsumer;

    private EventoAcceso resultadoUltimoEvento;
    private Exception excepcionCapturada;

    @Given("el sistema tiene el sensor {string} registrado en la zona {string}")
    public void givenSensorRegistrado(String sensorId, String zona) {
        sensorRepository.save(SensorMother.builder()
            .id(SensorId.of(sensorId))
            .zona(ZonaId.of(zona))
            .build());
    }

    @When("se procesa el evento de acceso")
    public void whenProcessAccessEvent() {
        try {
            var comando = RegistrarAccesoCommandMother.delUltimoScenario();
            resultadoUltimoEvento = useCase.ejecutar(comando);
        } catch (Exception e) {
            excepcionCapturada = e;
        }
    }

    @Then("el acceso se registra con estado {string}")
    public void thenAccessRegisteredWithStatus(String estado) {
        assertThat(resultadoUltimoEvento.estado().name()).isEqualTo(estado);
    }

    @Then("se publica un evento {string} en Kafka")
    public void thenKafkaEventPublished(String eventType) {
        await().atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() ->
                assertThat(kafkaConsumer.getLastEvent().type()).isEqualTo(eventType));
    }
}
```

### Configuración Cucumber con Spring Boot

```java
@Suite
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.agata.connector.steps")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value = "pretty, html:target/cucumber-report.html")
public class CucumberTestRunner {}
```

---

## 6. @WebMvcTest — Tests de capa web

Para testear solo la capa HTTP sin levantar toda la aplicación:

```java
@WebMvcTest(EntityController.class)
class EntityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EntityService entityService; // reemplaza el bean real en el contexto

    @Test
    void givenValidEntityId_whenGet_thenReturnsDto() throws Exception {
        // Given
        var dto = EntityDtoMother.porDefecto();
        when(entityService.findById("123")).thenReturn(dto);

        // When/Then
        mockMvc.perform(get("/api/entities/123")
                .header("Authorization", "Bearer " + validJwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("123"))
            .andExpect(jsonPath("$.name").value(dto.name()))
            .andDo(print());
    }

    @Test
    void givenMissingAuth_whenGet_thenReturns401() throws Exception {
        mockMvc.perform(get("/api/entities/123"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void givenInvalidBody_whenCreate_thenReturns400() throws Exception {
        mockMvc.perform(post("/api/entities")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"\"}") // nombre vacío: viola validación
                .header("Authorization", "Bearer " + validJwt()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("name"));
    }
}
```

---

## 7. Contract Testing con Spring Cloud Contract

Para verificar que el productor y el consumidor de una API están alineados.
El consumidor define el contrato (stub); el productor verifica que lo cumple.

```groovy
// Contrato del consumidor (en el repo del productor):
// src/test/resources/contracts/get-entity.groovy
Contract.make {
    request {
        method GET()
        url '/api/entities/123'
        headers { header('Authorization', matching('Bearer .*')) }
    }
    response {
        status 200
        headers { contentType applicationJson() }
        body([id: '123', name: 'Test Entity', type: 'Desktop'])
        bodyMatchers {
            jsonPath('$.id', byType())
            jsonPath('$.name', byRegex('[a-zA-Z ]+'))
        }
    }
}
```

Spring Cloud Contract genera tests del productor y stubs WireMock para el consumidor.

---

## 8. Preguntas de entrevista — Testing

¿Qué es un Object Mother y por qué usarlo?
> Clase de factory que centraliza la creación de objetos de dominio para tests.
> Evita duplicación del setup, da nombres semánticos a variantes del objeto
> ("porDefecto", "enZonaRestringida") y facilita el mantenimiento: si cambia
> el constructor, cambias el Mother, no todos los tests.

¿Cuándo usar Testcontainers vs H2?
> H2 es rápido pero no es tu base de datos real. Hay DDL que funciona en PostgreSQL
> pero no en H2, índices específicos, comportamientos de transacciones. Testcontainers
> levanta PostgreSQL (o Mongo, o Kafka) real en Docker, garantizando que los tests
> de integración validan el comportamiento exacto de producción. El coste es
> tiempo de inicio del contenedor, amortizable con `static` containers compartidos.

¿Qué es el patrón de Arrange/Act/Assert (o Given/When/Then)?
> Estructura que hace los tests predecibles y legibles. Arrange/Given: preparar
> el estado inicial. Act/When: ejecutar la acción bajo test. Assert/Then: verificar
> el resultado. Un test con esta estructura deja claro QUÉ se está probando y
> POR QUÉ falla si falla.

¿Qué testearías en el dominio vs en los adaptadores?
> Dominio (casos de uso, entidades, value objects): tests unitarios puros,
> sin Spring, con Mockito para los puertos de salida. Rápidos, muchos.
> Adaptadores (JPA, Kafka, REST): tests de integración con Testcontainers/WireMock.
> Verifican que la traducción entre dominio y sistema externo es correcta.

¿@Mock vs @MockBean?
> `@Mock` de Mockito: no levanta contexto Spring, ultra-rápido, para tests unitarios.
> `@MockBean` de Spring Test: levanta (y reconstruye) el contexto Spring con el bean
> reemplazado por un mock. Lento, solo cuando el test necesita el contexto completo.
