---
name: Axios baseURL double-path with generated client + proxy architecture
description: Why api.ts must NOT have baseURL, and how the proxy chain works between api-server and Spring Boot
---

## Rule 1: No baseURL on the axios instance
The `api` axios instance in `artifacts/volunteer-hub-web/src/lib/api.ts` must NOT have `baseURL: "/api"`.

**Why:** The generated API client already returns full paths like `/api/auth/register`. Axios `buildFullPath` combines baseURL + url unless url is an absolute URL (has http/https scheme). Since `/api/auth/register` has no scheme, axios combines: `/api` + `/api/auth/register` = `/api/api/auth/register` — doubling the prefix.

## Rule 2: Proxy architecture — api-server → Spring Boot
Replit routes all `/api/*` browser requests to the api-server artifact (port 8099). Spring Boot must NOT run on the same port. The working architecture:

- **api-server** (port 8099): Express proxy middleware in `app.ts` forwards all `/api/*` requests to Spring Boot at port 8080
- **Spring Boot** (port 8080): configured via `server.port=${SPRING_PORT:8080}` in `application.properties`
- **NayePankh API workflow**: `waitForPort = 8080`

**Why:** Replit's artifact system assigns PORT=8099 to the api-server artifact (it has `paths=["/api"]` in artifact.toml). Running Spring Boot on the same port causes a startup conflict — whichever process starts second fails. The api-server proxy is the correct gateway.

**How to apply:** If Spring Boot needs to move to a different port, update BOTH `application.properties` (SPRING_PORT default) AND `configureWorkflow({ waitForPort })` AND the `SPRING_BOOT_PORT` constant in `artifacts/api-server/src/app.ts`.
