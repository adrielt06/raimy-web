# AGENTS.md

## Project Stack

- Frontend: Angular
- Backend: Spring Boot, Java 21
- Data: PostgreSQL, Redis
- Messaging: RabbitMQ
- Infra: Docker, Kubernetes (k3s), AWS free tier
- Observability: Prometheus, Grafana
- CI/CD: GitHub Actions

## Conventions

- All Markdown must pass markdownlint before being considered done.

## Backend

- The backend process's working directory must be the repository root (not `backend/`) — required for `.env`-loading dependencies (`springboot4-dotenv`) to find the file.
- Spring Boot 4 needs `me.paulschwarz:springboot4-dotenv` (not the generic `spring-dotenv`) to auto-load `.env` — the generic artifact resolves fine but its loader never registers on Boot 4.

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

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

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

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
