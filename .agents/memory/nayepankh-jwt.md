---
name: NayePankh JWT secret handling
description: How JwtUtil generates a signing key at startup without a hardcoded secret
---

# JWT Secret Handling — JwtUtil

## Rule
No hardcoded secret in application.properties or in code. `jwt.secret` is set as `${JWT_SECRET:}` (empty default). `JwtUtil` uses `@PostConstruct` to initialize the signing key:

- If `JWT_SECRET` env var is set → use it directly as bytes for HMAC key
- If empty → generate two concatenated UUIDs as an ephemeral random key and log a `WARN`

**Why:** Code reviewers reject any hardcoded fallback. The random key approach is safe for dev (tokens invalidate on restart) and forces the team to set `JWT_SECRET` in production to get stable sessions.

**How to apply:** Set `JWT_SECRET` as a Replit Secret (minimum 64 chars, base64 or random) before deploying to production.

## Key files
- `artifacts/volunteer-hub-api/src/main/java/com/nayepankh/volunteerhub/security/JwtUtil.java`
- `artifacts/volunteer-hub-api/src/main/resources/application.properties` — `jwt.secret=${JWT_SECRET:}`
