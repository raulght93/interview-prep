# IaC, CI/CD, Jenkins y SonarQube

## Contexto real del proyecto

En Agata Next se usa:
- **OpenTofu** (fork open-source de Terraform) para provisionar infraestructura
  en Proxmox: VMs, redes, el cluster RKE2.
- **Ansible** para configurar las máquinas y desplegar servicios sobre K8s.
- **Bitbucket Pipelines** como CI/CD principal con Docker.
- El stack de monitorización incluye Prometheus + Grafana + OpenSearch.

Jenkins y SonarQube son el estándar en empresas medianas/grandes con equipos Java.

---

## 1. OpenTofu / Terraform — IaC declarativa

### Modelo mental

Terraform/OpenTofu es **declarativo**: describes el estado deseado de la
infraestructura, y la herramienta calcula los cambios necesarios para llegar ahí.

```hcl
# main.tf — provisionar una VM en Proxmox
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.50"
    }
  }
  backend "s3" {
    # State almacenado en MinIO (S3-compatible interno)
    endpoint = "http://minio.agata.local:9000"
    bucket   = "terraform-state"
    key      = "agata-next/cluster/terraform.tfstate"
    region   = "us-east-1" # requerido por el cliente S3
  }
}

resource "proxmox_virtual_environment_vm" "rke2_worker" {
  count     = var.worker_count  # variable
  name      = "rke2-worker-${count.index + 1}"
  node_name = "proxmox-node-01"

  cpu { cores = 8 }
  memory { dedicated = 16384 }  # 16GB

  disk {
    datastore_id = "local-lvm"
    size         = 100 # GB
    interface    = "scsi0"
  }

  network_device {
    bridge  = "vmbr0"
    model   = "virtio"
  }

  initialization {
    ip_config {
      ipv4 {
        address = "10.9.43.${count.index + 20}/24"
        gateway = "10.9.43.1"
      }
    }
    user_account {
      keys = [file("~/.ssh/id_ed25519.pub")]
    }
  }
}

output "worker_ips" {
  value = proxmox_virtual_environment_vm.rke2_worker[*].ipv4_addresses
}
```

### Ciclo de vida

```bash
tofu init         # descarga providers y configura backend
tofu plan         # muestra qué cambiaría (DRY RUN)
tofu apply        # aplica los cambios (pide confirmación)
tofu destroy      # destruye la infraestructura
tofu state list   # lista los recursos en el state
tofu import       # importa infra existente al state
```

**State**: Terraform guarda el estado actual en un archivo `terraform.tfstate`.
Con remote backend (S3/MinIO), el state se comparte entre el equipo y se puede
bloquear (evita applies concurrentes).

### Variables, locals y módulos

```hcl
# variables.tf
variable "worker_count" {
  type        = number
  description = "Número de worker nodes"
  default     = 4
}

variable "environment" {
  type    = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging or prod."
  }
}

# locals.tf — valores calculados
locals {
  cluster_name = "agata-${var.environment}"
  common_tags  = { environment = var.environment, project = "agata-next" }
}

# Módulos — reutilizar bloques de infra:
module "rke2_cluster" {
  source        = "./modules/rke2"
  worker_count  = var.worker_count
  environment   = var.environment
}
```

---

## 2. Ansible — Configuración y despliegue

Ansible es **imperativo por naturaleza** (tareas en orden) pero con operaciones
**idempotentes** (ejecutar dos veces da el mismo resultado). Sin agente en los nodos:
usa SSH.

### Inventario

```ini
# inventory/prod.ini
[rke2_masters]
rke2-master-01 ansible_host=10.9.43.10
rke2-master-02 ansible_host=10.9.43.11
rke2-master-03 ansible_host=10.9.43.12

[rke2_workers]
rke2-worker-01 ansible_host=10.9.43.20
rke2-worker-02 ansible_host=10.9.43.21

[k8s_cluster:children]
rke2_masters
rke2_workers

[k8s_cluster:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/agata-deploy
```

### Playbook

```yaml
# playbooks/install-rke2.yml
---
- name: Instalar y configurar RKE2
  hosts: rke2_masters
  become: true
  roles:
    - common        # configuración base del SO
    - rke2-server   # instalación RKE2 en masters

- name: Unir workers al cluster
  hosts: rke2_workers
  become: true
  roles:
    - common
    - rke2-agent   # agente RKE2 en workers
```

### Role — estructura estándar

```
roles/rke2-server/
├── tasks/
│   └── main.yml        ← Lista de tareas
├── handlers/
│   └── main.yml        ← Handlers (ej: restart rke2)
├── templates/
│   └── rke2-config.j2  ← Jinja2 templates
├── vars/
│   └── main.yml        ← Variables del rol
└── defaults/
    └── main.yml        ← Valores por defecto
```

```yaml
# roles/rke2-server/tasks/main.yml
---
- name: Descargar instalador RKE2
  get_url:
    url: https://get.rke2.io
    dest: /tmp/install-rke2.sh
    mode: '0755'

- name: Instalar RKE2 server
  command: /tmp/install-rke2.sh
  environment:
    INSTALL_RKE2_TYPE: server
    INSTALL_RKE2_VERSION: "v1.28.8+rke2r1"
  args:
    creates: /usr/local/bin/rke2  # idempotente: no ejecuta si ya existe

- name: Copiar configuración
  template:
    src: rke2-config.j2
    dest: /etc/rancher/rke2/config.yaml
  notify: restart rke2  # llama al handler

- name: Habilitar e iniciar RKE2
  systemd:
    name: rke2-server
    enabled: true
    state: started
```

---

## 3. Jenkins — CI/CD Enterprise

Jenkins es el servidor de CI/CD más extendido en entornos enterprise Java.
Pipeline as Code con `Jenkinsfile` (Groovy).

### Jenkinsfile declarativo

```groovy
pipeline {
    agent {
        docker {
            image 'eclipse-temurin:21-jdk'
            args '-v /root/.m2:/root/.m2' // cachear Maven
        }
    }

    environment {
        SONAR_TOKEN    = credentials('sonar-token')
        DOCKER_CREDS   = credentials('docker-registry')
        APP_VERSION    = "${env.BUILD_NUMBER}-${env.GIT_COMMIT[0..7]}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build y Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh './mvnw test -Dtest="**/*Test" -Dsurefire.failIfNoSpecifiedTests=false'
                    }
                    post {
                        always {
                            junit 'target/surefire-reports/*.xml'
                            jacoco(execPattern: 'target/jacoco.exec')
                        }
                    }
                }
                stage('Compile') {
                    steps {
                        sh './mvnw compile -DskipTests'
                    }
                }
            }
        }

        stage('Integration Tests') {
            steps {
                sh './mvnw verify -Dtest="**/*IT" -DfailIfNoTests=false'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''./mvnw sonar:sonar \
                        -Dsonar.projectKey=agata-connector \
                        -Dsonar.branch.name=${BRANCH_NAME} \
                        -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml'''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                    // Si SonarQube falla el Quality Gate → el pipeline se aborta
                }
            }
        }

        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                sh """
                    docker build -t agata-registry.local/connector:${APP_VERSION} .
                    docker tag agata-registry.local/connector:${APP_VERSION} \
                               agata-registry.local/connector:latest
                """
            }
        }

        stage('Push Image') {
            when { branch 'main' }
            steps {
                sh """
                    echo ${DOCKER_CREDS_PSW} | docker login agata-registry.local -u ${DOCKER_CREDS_USR} --password-stdin
                    docker push agata-registry.local/connector:${APP_VERSION}
                    docker push agata-registry.local/connector:latest
                """
            }
        }

        stage('Deploy to Staging') {
            when { branch 'main' }
            steps {
                sh "helm upgrade --install connector ./helm/connector --set image.tag=${APP_VERSION} -n agata-staging"
            }
        }
    }

    post {
        failure {
            emailext(
                subject: "FAILED: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Build failed. Check ${env.BUILD_URL}",
                to: 'dev-team@agata.local'
            )
        }
        always {
            cleanWs()
        }
    }
}
```

### Tipos de pipelines Jenkins

**Declarativo** (mostrado arriba): estructura fija (`pipeline`, `stages`, `steps`).
Más legible, recomiendado para la mayoría de casos.

**Scripted** (Groovy puro): más flexible, pero menos estructurado. Para pipelines
muy complejos.

**Multibranch Pipeline**: crea automáticamente un pipeline por rama del repo.
Detecta Jenkinsfiles en cada rama. Ideal para feature branches.

**Jenkins Shared Libraries**: código Groovy reutilizable entre pipelines.
`@Library('agata-pipeline-utils')`. Evita duplicación en proyectos con múltiples
microservicios.

---

## 4. SonarQube — Calidad de Código

SonarQube analiza el código fuente para detectar:
- **Bugs**: código que probablemente tiene un comportamiento incorrecto.
- **Vulnerabilidades**: código con potencial problema de seguridad.
- **Code Smells**: código funcionalmente correcto pero difícil de mantener.
- **Security Hotspots**: código que requiere revisión humana de seguridad.
- **Cobertura de código** (con JaCoCo): % de código ejecutado por tests.
- **Duplicaciones**: código duplicado.

### Quality Gate

Un **Quality Gate** es un conjunto de umbrales que el código debe superar
para que el pipeline continúe. El Quality Gate por defecto de SonarQube requiere:
- Cobertura de código en código nuevo ≥ 80%.
- 0 Bugs en código nuevo.
- 0 Vulnerabilidades en código nuevo.
- 0 Security Hotspots sin revisar.
- Duplicación en código nuevo < 3%.

```properties
# sonar-project.properties
sonar.projectKey=agata-connector
sonar.projectName=Agata Connector
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.binaries=target/classes
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
sonar.exclusions=**/generated/**,**/*Config.java
sonar.test.exclusions=**/test/**
```

### Integración Maven

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
```

```bash
# Análisis con Maven:
./mvnw verify sonar:sonar \
  -Dsonar.host.url=http://sonar.agata.local \
  -Dsonar.token=${SONAR_TOKEN}
```

### Supresión justificada (último recurso)

```java
@SuppressWarnings("java:S2068") // SonarQube: hardcoded password
private static final String DEFAULT_TEST_PASSWORD = "test-only-not-real";

@SuppressWarnings("java:S112") // RuntimeException: justificado porque...
```

---

## 5. GitHub Actions / Bitbucket Pipelines

Alternativa cloud-native a Jenkins. Configuración declarativa en YAML.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }

      - uses: actions/cache@v4
        with:
          path: ~/.m2/repository
          key: maven-${{ hashFiles('**/pom.xml') }}

      - name: Build and Test
        run: ./mvnw verify

      - name: SonarQube
        run: ./mvnw sonar:sonar -Dsonar.token=${{ secrets.SONAR_TOKEN }}

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: target/surefire-reports/
```

```yaml
# bitbucket-pipelines.yml (usado en Agata)
image: eclipse-temurin:21-jdk

pipelines:
  default:
    - step:
        name: Build & Test
        caches: [maven]
        script:
          - ./mvnw verify
        artifacts:
          - target/surefire-reports/**

  branches:
    main:
      - step:
          name: Build & Push Docker
          services: [docker]
          script:
            - docker build -t $DOCKER_REGISTRY/connector:$BITBUCKET_BUILD_NUMBER .
            - docker push $DOCKER_REGISTRY/connector:$BITBUCKET_BUILD_NUMBER
```

---

## 6. Patrones DevOps clave

### GitOps

El estado del cluster se describe en Git. Una herramienta (ArgoCD, Flux)
sincroniza el cluster con el repositorio. Cualquier cambio se hace via PR:
nunca `kubectl apply` manual en producción.

```
Dev hace PR → Merge en main → ArgoCD detecta cambio en Helm chart
→ Sincroniza el cluster → Rollout del deployment
```

### Trunk-Based Development

Una única rama principal (`main`). Features en ramas cortas (<1 día) mergeadas
frecuentemente. Feature flags para código en desarrollo. CI permanente.
Opuesto a GitFlow (ramas de feature largas).

### Semantic Versioning y conventional commits

```
feat: add sensor event processing     → minor version bump (1.1.0)
fix: correct kafka offset handling    → patch version bump (1.0.1)
feat!: redesign connector API         → major version bump (2.0.0)
BREAKING CHANGE: removed old endpoint
```

Con `semantic-release` o similar, la versión se calcula automáticamente
del historial de commits.

---

## 7. Preguntas de entrevista — IaC y CI/CD

¿Qué es la "infraestructura como código" y por qué es importante?
> Gestionar la infraestructura (servidores, redes, K8s, DNS) mediante archivos
> de configuración versionados en Git, en lugar de acciones manuales.
> Ventajas: reproducibilidad (el mismo código da la misma infra), auditoría
> (Git history), revisión de cambios (PRs), rollback (git revert).

¿Cuál es la diferencia entre Terraform/OpenTofu y Ansible?
> Terraform: provisioning declarativo de infra (VMs, redes, cloud resources).
> Define el ESTADO FINAL y calcula el diff. Fuerte en idempotencia y gestión
> de estado remoto. Ansible: configuración y despliegue imperativo (tareas
> en orden). Fuerte en orquestación de procesos y configuración de SO.
> En práctica: Terraform crea la VM, Ansible la configura.

¿Qué es un Quality Gate en SonarQube?
> Conjunto de umbrales de calidad que el código nuevo debe cumplir para que
> el pipeline continúe. Típico: cobertura ≥ 80%, 0 bugs críticos, 0
> vulnerabilidades. El pipeline se configura con `waitForQualityGate abortPipeline: true`
> para detener el deploy si no se supera.

¿Qué es GitOps?
> Modelo operacional donde el estado deseado del sistema se describe en Git
> y una herramienta (ArgoCD, Flux) sincroniza el estado real con el deseado.
> Operaciones de producción via PRs, no comandos manuales. Auditoría completa.

¿Diferencia entre Jenkins pipeline declarativo y scripted?
> Declarativo: estructura fija con `pipeline { stages { stage { steps {} } } }`.
> Más legible, validación en tiempo de parsing, recomendado. Scripted: Groovy
> puro, más flexible para lógica compleja, pero menos legible y sin validación
> previa. Hoy en día casi siempre declarativo, con scripted solo cuando el
> declarativo no llega.
