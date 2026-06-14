import { type Request, type Response, type NextFunction } from "express";

const SPRING_BOOT_PORT = Number(process.env["SPRING_PORT"] ?? 8080);

/**
 * Middleware that enforces a valid JWT Bearer token by verifying it against
 * Spring Boot's /api/volunteers/me endpoint.
 *
 * Returns 401 if the Authorization header is missing or malformed.
 * Returns 401/403 if Spring Boot rejects the token.
 * Returns 503 if the upstream auth service is unreachable.
 */
export async function requireBearerAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized — Bearer token required" });
    return;
  }

  try {
    const verifyRes = await fetch(
      `http://localhost:${SPRING_BOOT_PORT}/api/volunteers/me`,
      { headers: { Authorization: auth } },
    );

    if (verifyRes.status === 200) {
      next();
      return;
    }

    const status = verifyRes.status === 403 ? 403 : 401;
    res.status(status).json({ error: "Unauthorized — invalid or expired token" });
  } catch {
    res.status(503).json({ error: "Auth service unavailable" });
  }
}
