import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import http from "http";
import router from "./routes";
import { logger } from "./lib/logger";

const SPRING_BOOT_PORT = Number(process.env["SPRING_PORT"] ?? 8080);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

app.use(express.json());
app.use("/api", router);

app.use("/api", (req: Request, res: Response) => {
  const options = {
    hostname: "localhost",
    port: SPRING_BOOT_PORT,
    path: `/api${req.url}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${SPRING_BOOT_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    logger.error({ err }, "Spring Boot proxy error");
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ success: false, message: "API server unavailable" }));
  });

  // express.json() consumes the stream body before this catch-all runs.
  // For requests with a parsed body (POST/PUT/PATCH), write it directly
  // instead of piping the already-exhausted stream.
  if (req.body !== undefined && typeof req.body === "object") {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.write(bodyData);
    proxyReq.end();
  } else {
    req.pipe(proxyReq, { end: true });
  }
});

export default app;
