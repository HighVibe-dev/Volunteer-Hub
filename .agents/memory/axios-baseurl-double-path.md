---
name: Axios baseURL double-path with generated client
description: Why the axios instance in api.ts must NOT have baseURL set when used with the generated API client
---

## The rule
The `api` axios instance in `artifacts/volunteer-hub-web/src/lib/api.ts` must NOT have `baseURL: "/api"`.

**Why:** The generated API client (`lib/api-client-react`) already returns full paths like `/api/auth/register`. When `customFetchViaAxios` passes that full path to `_axiosInstance.request({ url })`, axios calls `buildFullPath(baseURL, url)`. Since `/api/auth/register` is not an absolute URL (no scheme), axios combines them: `/api` + `/api/auth/register` = `/api/api/auth/register` — doubling the prefix. Spring Boot then sees `/api/auth/register` after stripping its own context path, which is a protected endpoint — returns 403. Never a visible error message, just a silent auth-access failure.

**How to apply:** Keep the axios instance created without `baseURL`. The interceptors (Bearer token, 401 redirect) still work — they only care about request/response metadata, not the URL.
