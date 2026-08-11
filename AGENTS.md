# AGENTS.md

## Project Stack

Target stack for the full roadmap (see `ROADMAP.md`), not current state — only Postgres and pgAdmin exist today, in `docker-compose.yml`.

- Frontend: Angular
- Backend: Spring Boot, Java 21
- Data: PostgreSQL, Redis
- Messaging: RabbitMQ
- Infra: Docker, Kubernetes (k3s), AWS free tier
- Observability: Prometheus, Grafana
- CI/CD: GitHub Actions

## Commands

Run everything from the repository root.

- Infra: `docker compose up -d` — Postgres `5432`, pgAdmin `5050`.
- Backend tests: `./backend/mvnw -f backend/pom.xml test` — requires Postgres running (see Backend).
- Frontend: `cd frontend`, then `ng serve` (`4200`), `ng build`, `npx ng test --watch=false`.

## Layout

- `backend/` (Spring Boot, base package `com.raymi.backend`) · `frontend/` (Angular) · `docs/` (per-phase plans) · `ROADMAP.md` (phase order and checkpoints).
- Package by feature on both sides, not layer-first: `com.raymi.backend.health` holds its controller and DTO together; `frontend/src/app/health/` holds its component. No `controllers/`, `services/`, `models/` folders.

## Conventions

- All Markdown must pass markdownlint before being considered done.
- Any implementation plan proposed before writing code must be written to `docs/` as a Markdown file (e.g. `docs/plan-<phase>-<feature>.md`), not left in the chat. It is committed with the work it describes, so reviewers can see the reasoning behind a change.

## Backend

- The backend process's working directory must be the repository root (not `backend/`) — required for `.env`-loading dependencies (`springboot4-dotenv`) to find the file.
- Spring Boot 4 needs `me.paulschwarz:springboot4-dotenv` (not the generic `spring-dotenv`) to auto-load `.env` — the generic artifact resolves fine but its loader never registers on Boot 4.
- This project runs Spring Boot 4.1.0 / Spring Security 7.x / Spring Framework 7.x — new majors where most tutorials and docs still target Boot 2/3 and Security 5/6, so package paths and method signatures can be stale (e.g. `@WebMvcTest` lives in `org.springframework.boot.webmvc.test.autoconfigure`, not the old `org.springframework.boot.test.autoconfigure.web.servlet`; `HttpSecurity.build()` no longer declares `throws Exception`). Verify against the real jar in `~/.m2` with `javap -classpath <jar> <class>` before trusting a snippet.
- Maven Surefire forks the test JVM with `workingDirectory=${basedir}` (i.e. `backend/`), so `.env` isn't found there no matter where you invoke `mvnw` from. `backend/pom.xml` compensates with `<workingDirectory>${project.basedir}/..</workingDirectory>` — a temporary fix that makes `mvn test` require Postgres running; replace it with Testcontainers when Flyway migrations arrive.
- Mockito's inline mock maker self-attaches a Java agent by default, which JDK dynamic-agent-loading restrictions (JEP 451) are phasing out. `backend/pom.xml` already resolves `mockito-core` via `maven-dependency-plugin` and passes it as `-javaagent` through `maven-surefire-plugin`'s `argLine` — don't remove this or the self-attach warnings come back.

## Local Infrastructure (docker-compose.yml)

- Ports: Postgres `5432`, pgAdmin `5050` — kept off `8080`, which is reserved for the Spring Boot backend.
- Env vars come from root `.env` (gitignored); `.env.example` is the committed template — update it when adding new variables, never `.env` itself (see Security).
- Pin image versions (e.g. `postgres:16-alpine`); don't use `:latest`.

## Security

- NEVER read or write any `.env` file (including `.env.local`, `.env.production`, etc.). Do not open them, do not edit them, do not print their contents. If a task seems to require it, stop and ask whoever is running the session to handle that file themselves.

## Dependency Changes

- Before recommending a library or version, verify it against the current official docs or Maven Central and state the exact version. Do not guess versions.

## Behavior

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
