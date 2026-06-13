---
name: NayePankh Volunteer Hub API
description: Production Spring Boot backend for NayePankh Foundation volunteer management
---

## Runtime
- Port: 8099 (default), context path: /api
- Workflow name: "NayePankh API"
- Command: `cd artifacts/volunteer-hub-api && mvn spring-boot:run`
- Swagger UI: http://localhost:8099/api/swagger-ui.html (39 documented endpoints)
- Health: GET /api/health

## Key entities
User, VolunteerProfile, Skill, VolunteerSkill, Event, EventRequirement, EventApplication, Attendance, Certificate, Notification, AuditLog

## Badge thresholds
NONE<10h, BRONZE≥10h, SILVER≥50h, GOLD≥100h, PLATINUM≥200h

## Roles
ROLE_VOLUNTEER, ROLE_COORDINATOR, ROLE_ADMIN

## JWT
- Stored in `jwt.secret` property (env var JWT_SECRET or 64-char default)
- Access token: 24h, Refresh: 7d
- Claims: userId, role, sub(email)

## Frontend (Task #2 - pending)
React + Vite + Tailwind CSS. Blocked on this backend task. API base URL: /api at port 8099.
