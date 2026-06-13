---
name: NayePankh native query gotchas
description: PostgreSQL-specific issues encountered when writing native Spring Data JPA queries in the volunteer hub API
---

# Native Query Gotchas — NayePankh API

## Rule 1: null parameters cause bytea type inference
When a JPQL query uses `(:param IS NULL OR LOWER(column) = LOWER(:param))` and `:param` is null at runtime, PostgreSQL infers the parameter type as `bytea`, causing:
`ERROR: function lower(bytea) does not exist`

**Fix:** Switch to a native query and cast explicitly:
```sql
LOWER(CAST(:param AS TEXT))
```

**Why:** JPQL null parameters have no type binding; native queries with explicit CAST avoid the inference problem.

## Rule 2: Hibernate appends Pageable sort using Java field names in native queries
When using Spring Data's `Page<T> nativeQuery(Pageable pageable)`, Hibernate appends the sort clause from Pageable using Java camelCase field names (e.g. `u.createdAt`), which don't exist in the SQL column space (actual: `u.created_at`).

**Fix:** Pass an unsorted Pageable to native query methods:
```java
Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
repo.nativeQuery(..., unsorted);
```
The native query should contain its own `ORDER BY` clause.

**How to apply:** Any `nativeQuery = true` repository method that takes Pageable.

## Rule 3: Table names in native queries must match @Table annotation
Entity `Attendance` has `@Table(name = "attendances")`. Native queries using `FROM attendance` (without the "s") fail.
Always check the `@Table(name = ...)` annotation before writing native SQL.
