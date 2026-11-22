import "./src/config/env.js";
import { createApp } from "./src/app.js";
import { seedDemo } from "./data/seeders/demoSeeder.js";

const app = createApp();
seedDemo();

const host = process.env.SERVER_HOST || "0.0.0.0";
const port = Number(process.env.SERVER_PORT || 3000);

const server = app.listen(port, host, () => {
  console.log(`AI Ticket It Backend escuchando en http://${host}:${port} (persistencia en memoria)`);
});

const shutdown = (signal) => {
  console.log(`${signal} recibido: cerrando el servidor`);
  server.close(() => {
    process.exit(0);
  });
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
