import express from "express";
import cors from "cors";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : true,
    })
  );

  app.use("/api", router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
