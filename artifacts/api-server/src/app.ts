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

app.use("/api/healthz", router);

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

  req.pipe(proxyReq, { end: true });
});

export default app;
