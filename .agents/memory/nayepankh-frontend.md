---
name: NayePankh frontend patterns
description: Key patterns for the NayePankh Volunteer Hub React/Vite frontend — generated API hook usage, JWT auth setup, status enum casting
---

## Generated API Hook Requirements

Every `use*` query hook from `@workspace/api-client-react` **requires** `queryKey` in its options object — it's typed as required, not optional. Always use the corresponding `get*QueryKey` helper:

```tsx
const { data } = useGetSomething(id, {
  query: { enabled: !!id, queryKey: getGetSomethingQueryKey(id) }
});
```

## Status Enum Casting

Generated list hooks (listVolunteers, listEvents, listApplications) type their `status` params as specific const-enums — plain `string` is not assignable. Two patterns:

1. Import and cast: `import { ListEventsStatus } from "@workspace/api-client-react"` then `status: status as typeof ListEventsStatus[keyof typeof ListEventsStatus]`
2. Use the const directly: `status: ListEventsStatus.UPCOMING`

Same pattern applies to `GetLeaderboardPeriod`.

## JWT Auth Token Getter

`setAuthTokenGetter` must be called **once at app init** (in `main.tsx`, before `createRoot`) so the generated `customFetch` picks up the token for every request:

```tsx
import { setAuthTokenGetter } from "@workspace/api-client-react";
setAuthTokenGetter(() => localStorage.getItem("accessToken"));
```

Token is stored in `localStorage` under keys: `accessToken`, `refreshToken`, `user`.

## Route Structure (Wouter)

Uses Wouter with nested Switch pattern. Protected pages are wrapped in `<Layout>` with `<ProtectedRoute component={X} allowedRoles={[...]} />`. Role constants defined in `App.tsx`: `ADMIN`, `STAFF`, `ALL_ROLES`.

**Why:** The design subagent set this up; maintain it for consistency.

## Custom Fetch / ApiResponse Unwrapping

`lib/api-client-react/src/custom-fetch.ts` auto-unwraps Spring Boot's `ApiResponse<T>` envelope (`{ success, message, data, timestamp }`) — hooks return `data` directly, not the wrapper.
