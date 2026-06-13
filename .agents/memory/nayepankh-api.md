---
name: NayePankh Volunteer Hub API
description: Production Spring Boot backend for NayePankh Foundation volunteer management
---

## Runtime
- Port: 8099 (default), context path: /api
- Workflow name: "NayePankh API"
- Command: `cd artifacts/volunteer-hub-api && mvn spring-boot:run`
- Swagger UI: http://localhost:8099/api/swagger-ui.html (41 documented endpoints)
- Health: GET /api/health
- artifact.toml is at: `artifacts/volunteer-hub-api/.replit-artifact/artifact.toml`

## Key entities
User, VolunteerProfile, Skill, VolunteerSkill, Event, EventRequirement, EventApplication, Attendance, Certificate, Notification, AuditLog

## Badge thresholds
NONE<10h, BRONZE≥10h, SILVER≥50h, GOLD≥100h, PLATINUM≥200h

## Roles
ROLE_VOLUNTEER, ROLE_COORDINATOR, ROLE_ADMIN

## Auth endpoints
- POST /auth/register → always ROLE_VOLUNTEER (public)
- POST /auth/staff → ROLE_COORDINATOR or ROLE_ADMIN (admin-only, 403 to others)
- POST /auth/login → JWT tokens

## JWT
- Stored in `jwt.secret` property (JWT_SECRET env var, no hardcoded fallback)
- Access token: 24h, Refresh: 7d
- Claims: userId, role, sub(email)

## Java version constraint
GraalVM 22.3.1 provides Java 19 ONLY. Java 21 is not available as a Replit module.
pom.xml source/target=19. Cannot be changed without a different runtime.

## Application state machine
PENDING → APPROVED | REJECTED (coordinator/admin)
APPROVED → REJECTED (coordinator/admin)
REJECTED = terminal (cannot change)

## Certificate eligibility
Both conditions required: EventApplication.status=APPROVED AND Attendance.present=true
Generates for 0 volunteers if no one has attended yet.

## Volunteer filtering
GET /volunteers?city=&availability=&skillId=&search= (admin/coordinator only)
filterVolunteers() query joins with VolunteerProfile and VolunteerSkill.

## Monthly analytics
All monthly aggregation queries use native PostgreSQL DATE_TRUNC('month', ...) — NOT FUNCTION('MONTH', ...) JPQL.
DashboardService extracts timestamps as java.sql.Timestamp and converts to LocalDateTime.
