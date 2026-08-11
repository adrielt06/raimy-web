# Hoja de Ruta — Portal de Videojuegos (Raymi)

Portal web para una comunidad de videojuegos: noticias y calendario de eventos,
torneos con inscripción, packs de fiestas con solicitud de presupuesto y, más
adelante, cobro de inscripciones.

Los códigos `RFx.x` referencian los requerimientos funcionales del PRD del
producto.

## Estado actual

**Fase 0 — Setup y esqueleto**, en curso. Ya funciona el esqueleto full-stack:
Postgres en Docker Compose, backend Spring Boot con `GET /api/health`, y Angular
consumiéndolo con CORS validado. Queda Swagger UI para cerrar la fase.

## Cómo usar este documento

- Las fases son **secuenciales**: cada una depende de la anterior.
- Cada fase tiene **Objetivo** · **Alcance** · **Listo cuando** (checkpoints
  verificables).
- Los checkpoints se marcan `[x]` a medida que se cumplen.
- Todo plan de implementación que se proponga antes de escribir código se
  escribe en `docs/` y se commitea con el trabajo que describe. Ver
  [`docs/README.md`](docs/README.md).

## Mapa general

| # | Fase | Alcance | Estado |
| - | ---- | ------- | ------ |
| 0 | Setup y esqueleto | Monorepo, Docker Compose, health endpoint, Swagger | En curso |
| 1 | Modelo de datos + primer CRUD | Esquema completo, Flyway, CRUD de noticias | Pendiente |
| 2 | Autenticación y roles | JWT + refresh, Spring Security, guards Angular | Pendiente |
| 3 | Dominio del producto | Packs, torneos, inscripciones, calendario, CMS | Pendiente |
| 4 | Caché con Redis | Cache-aside sobre lecturas frecuentes | Pendiente |
| 5 | Mensajería async | RabbitMQ, emails desacoplados, idempotencia | Pendiente |
| 6 | Pagos (Mercado Pago) | Cobro de inscripciones, webhooks *(opcional)* | Pendiente |
| 7 | Contenedores y Kubernetes | Imágenes multi-stage, k3s en Proxmox | Pendiente |
| 8 | Observabilidad | Actuator, Prometheus, Grafana | Pendiente |
| 9 | CI/CD completo | GitHub Actions: build, test, deploy | Pendiente |
| 10 | Cloud — AWS free tier | S3, RDS, EC2 | Pendiente |

---

## Fase 0 — Setup y esqueleto

**Objetivo:** los dos proyectos corriendo y comunicándose, sin lógica de negocio
todavía.

**Alcance:**

- Monorepo: `backend/` y `frontend/` en el mismo repositorio.
- Backend con Spring Initializr: Java 21, Spring Boot 4.1.0, dependencias
  `Spring Web`, `Spring Data JPA`, `PostgreSQL Driver`, `Validation`,
  `Spring Security`, `Flyway`, `Lombok`.
- Frontend Angular 22: standalone components, signals, control flow `@if`/`@for`.
- Docker Compose local con PostgreSQL y pgAdmin.
- Endpoint `GET /api/health` consumido y mostrado por Angular — valida CORS y la
  conexión entre las dos mitades.
- Swagger/OpenAPI activo en el backend.

**Listo cuando:**

- [x] `docker compose up` levanta Postgres.
- [x] Angular muestra el estado de `/api/health` traído del backend.
- [ ] Swagger UI accesible en `/swagger-ui.html`.

---

## Fase 1 — Modelo de datos + primer CRUD

**Objetivo:** modelar la base y construir el primer módulo entero, de la DB al
front. El dominio elegido es **Noticias** (RF4.1) por ser el más simple.

**Alcance:**

- Modelo entidad-relación completo, aunque las tablas se creen de a poco:
  `usuario`, `rol`, `torneo`, `inscripcion` (N:N), `pack`,
  `solicitud_presupuesto`, `noticia`, `evento`.
- Primera migración Flyway (`V1__init.sql`).
- Entidades JPA y repositorios para `noticia`.
- CRUD de noticias completo: entidad → repositorio → servicio → controlador REST.
- DTOs con MapStruct y Bean Validation (`@NotBlank`, `@Size`).
- Angular: servicio HTTP, listado y vista de detalle.
- Tests de integración con Testcontainers contra un Postgres real.

**Decisiones técnicas:**

- **Todo cambio de esquema es una migración Flyway versionada.** Nunca
  `ddl-auto=update`.
- **Las entidades JPA no se exponen en la API.** Siempre DTOs.
- Al llegar acá, los tests del backend pasan a correr contra Testcontainers en
  lugar de la base de desarrollo (ver `AGENTS.md`, sección Backend).

**Listo cuando:**

- [ ] El esquema se crea 100% por Flyway.
- [ ] CRUD de noticias funciona de punta a punta (Angular ↔ API ↔ Postgres).
- [ ] Hay tests de integración verdes corriendo contra Testcontainers.

---

## Fase 2 — Autenticación y roles

**Objetivo:** autenticación propia, sin depender de un proveedor externo.

**Alcance:**

- Registro y login (RF1.1), con hash de contraseña bcrypt o argon2.
- JWT de acceso más refresh token.
- Spring Security: filtro JWT, `SecurityFilterChain`, roles `PLAYER` / `ADMIN`,
  autorización a nivel método con `@PreAuthorize` (RF1.3).
- Formulario de perfil (RF1.2): nombre, nick, edad, contacto.
- Angular: formularios de login y registro, HTTP interceptor que inyecta el JWT,
  route guards sobre las rutas de admin, manejo de logout y refresh.

**Listo cuando:**

- [ ] Un usuario se registra, inicia sesión y recibe JWT + refresh.
- [ ] Las rutas `/admin/**` rechazan a un `PLAYER` (403) y aceptan a un `ADMIN`.
- [ ] Angular protege las vistas de admin y renueva el token al expirar.

---

## Fase 3 — Dominio del producto

**Objetivo:** las features de negocio del PRD. Es la fase con el modelado
relacional más denso.

**Alcance:**

- Packs de fiestas (RF2.1): CRUD de admin y vista pública.
- Solicitud de presupuesto (RF2.3) y CTA a WhatsApp (RF2.2).
- Torneos (RF3.1): listado con reglas y fechas.
- Inscripciones (RF3.2): relación N:N `usuario`↔`torneo` dentro de una
  transacción que controla cupo y evita duplicados. Requiere sesión activa.
- Embed de Challonge (RF3.3).
- Calendario de eventos (RF4.2) con filtros presencial/online/stream (RF4.3),
  con paginación.
- Panel CMS de admin (RF4.1): plantilla estandarizada para cargar noticias y
  eventos.

**Listo cuando:**

- [ ] Un jugador logueado se inscribe a un torneo y no puede inscribirse dos
      veces.
- [ ] El admin publica noticias y eventos desde el panel.
- [ ] El calendario filtra por las tres categorías.

---

## Fase 4 — Caché con Redis

**Objetivo:** bajar la latencia de las lecturas frecuentes que ya existen
(noticias, calendario).

**Alcance:**

- Redis sumado al Docker Compose.
- Patrón cache-aside sobre el feed de noticias y el listado del calendario:
  lecturas frecuentes, escrituras raras.
- Invalidación de caché cuando el admin publica o edita.
- *(Extra)* rate-limiting en `/login` o blacklist de tokens al hacer logout.

**Listo cuando:**

- [ ] La segunda lectura del feed pega a Redis, verificable por logs o latencia.
- [ ] Publicar una noticia invalida la caché correspondiente.

---

## Fase 5 — Mensajería asíncrona (RabbitMQ)

**Objetivo:** sacar los procesos lentos de la request del usuario.

**Alcance:**

- RabbitMQ sumado al Compose.
- Al inscribirse a un torneo el backend publica un evento; un consumer envía el
  email de confirmación de forma asíncrona, sin que la request espere al mail.
- Idempotencia: procesar el mismo mensaje dos veces no manda dos emails.

**Listo cuando:**

- [ ] Inscribirse responde rápido y el email llega por un consumer separado.
- [ ] Reprocesar un mensaje no duplica el efecto.

---

## Fase 6 — Pagos con Mercado Pago *(opcional)*

**Objetivo:** cobrar la inscripción a torneos pagos. Corresponde a la fase 1.5
del PRD y se apoya en la infraestructura de la Fase 5.

**Alcance:**

- Cobro de inscripción a torneos pagos (RF3.4) con el SDK de Mercado Pago.
- Webhooks de confirmación de pago, reutilizando la idempotencia de la Fase 5.
- Estados de inscripción: `pendiente_pago` → `confirmada`.

**Listo cuando:**

- [ ] Un pago sandbox confirma la inscripción vía webhook.
- [ ] Un webhook repetido no rompe el estado.

---

## Fase 7 — Contenedores y Kubernetes

**Objetivo:** desplegar la aplicación completa en el homelab, sobre k3s.

**Alcance:**

- Dockerfiles multi-stage: backend (build Maven → runtime JRE) y frontend (build
  Angular → Nginx sirviendo estáticos).
- k3s en una VM de Proxmox, cluster single-node para empezar.
- Manifiestos de Kubernetes: Deployments, Services, Ingress, ConfigMaps y
  Secrets.
- Postgres, Redis y RabbitMQ dentro del cluster o como servicios externos.
- Escalado de réplicas del backend (RNF2 — arquitectura escalable).

**Listo cuando:**

- [ ] La app entera corre en k3s sobre Proxmox, accesible por Ingress.
- [ ] El backend escala a 3 réplicas y sigue funcionando.

---

## Fase 8 — Observabilidad

**Objetivo:** poder responder qué está haciendo el sistema en producción.

**Alcance:**

- Spring Boot Actuator y Micrometer exponiendo métricas.
- Prometheus scrapeando el backend; Grafana con dashboards de latencia,
  throughput, errores y uso de JVM.
- Logging estructurado en JSON.

**Listo cuando:**

- [ ] Grafana muestra métricas en vivo de la API.
- [ ] Se puede ver el impacto de la caché (Fase 4) en un panel.

---

## Fase 9 — CI/CD completo

**Objetivo:** automatizar build, test y despliegue.

**Alcance:**

- Pipeline en GitHub Actions: en cada push, build, tests con Testcontainers y
  lint.
- Build de imágenes Docker y push a GitHub Container Registry.
- Deploy automático a k3s en el merge a `main`.

**Listo cuando:**

- [ ] Un push corre los tests (incluido Testcontainers) y falla el build si están
      rojos.
- [ ] Un merge a `main` despliega solo a k3s.

---

## Fase 10 — Cloud: AWS free tier

**Objetivo:** llevar el proyecto a infraestructura gestionada, dentro del free
tier.

**Alcance:**

- S3 para las imágenes de noticias y packs, subidas desde el panel de admin.
  Se integra también hacia atrás en las fases de contenido.
- RDS PostgreSQL (free tier 12 meses) como base gestionada.
- EC2 t3.micro corriendo la aplicación: k3s single-node o docker-compose.
- *(Opcional)* dominio y HTTPS con Let's Encrypt sobre Nginx.

**Decisión de costos:** **EKS no entra en el free tier** — el control plane cuesta
unos US$0,10/h. Para no gastar, en AWS se usa **EC2 + k3s** (reutilizando la
Fase 7) o docker-compose. Requiere billing alerts configuradas.

**Listo cuando:**

- [ ] Las imágenes se guardan y se sirven desde S3.
- [ ] La app corre en EC2 contra RDS, accesible desde internet.
- [ ] Hay billing alerts configuradas para no pasarse del free tier.
