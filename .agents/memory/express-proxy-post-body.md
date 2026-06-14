---
name: Express proxy POST body bug
description: express.json() consumes the request stream; the catch-all proxy must write req.body directly for POST/PUT/PATCH requests
---

## The Rule
In `artifacts/api-server/src/app.ts`, `express.json()` runs before the catch-all proxy. Once it parses the body, the `req` readable stream is exhausted. Piping that exhausted stream to the proxy request (`req.pipe(proxyReq)`) never sends `end`, causing Spring Boot to wait forever — the caller sees a timeout.

**Why:** Node.js streams can only be consumed once. After `express.json()` reads the stream, there is nothing left to pipe.

**How to apply:** The catch-all proxy checks `typeof req.body === "object"` and, if true, calls `JSON.stringify(req.body)`, sets `Content-Length`, writes it to `proxyReq`, then calls `proxyReq.end()`. GET/DELETE requests (no body) still use `req.pipe(proxyReq, { end: true })`.

File: `artifacts/api-server/src/app.ts`, lines 64–75.
