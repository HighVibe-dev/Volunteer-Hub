---
name: Spring Boot on Replit
description: How to configure Spring Boot to work with Replit's DATABASE_URL and port management
---

## DATABASE_URL format issue

Replit provides DATABASE_URL as `postgresql://user:pass@host/dbname?sslmode=disable`.
Spring Boot + HikariCP needs `jdbc:postgresql://...`.

**Fix:** Create a `DataSourceConfig.java` `@Bean @Primary DataSource` that converts the URL — DO NOT set `spring.datasource.url` in `application.properties` (causes conflict).

**Why:** Replit's helium postgres uses the libpq URI format, not JDBC format. HikariCP refuses to accept it.

**How to apply:** Any Spring Boot project on Replit needs DataSourceConfig.java. Remove `spring.datasource.url` and `spring.datasource.driver-class-name` from application.properties.

## Port conflict

Port 8080 is taken by the default api-server artifact. Use 8099 instead.

Supported workflow ports: 3000, 3001, 3002, 3003, 4200, 5000, 5173, 6000, 6800, 8000, 8008, 8080, 8099, 9000

## Lombok annotationProcessorPaths

The `<annotationProcessorPaths>` in maven-compiler-plugin needs an explicit `<version>` for Lombok (e.g., `1.18.32`). The managed version from spring-boot-starter-parent is NOT inherited here.

## Spring property syntax

Use `${PORT:8099}` (colon, no hyphen) in application.properties. Shell syntax `${PORT:-8099}` does NOT work in Spring property files.
