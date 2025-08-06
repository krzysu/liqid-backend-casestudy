import { Context, Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "./logger";
const app = new Hono();

app.get("/health", (c: Context) =>
  c.json({
    status: "running",
  }),
);

/**
 * Sync the data from the source to the database
 */
app.get("/sync", (c: Context) => {
  logger.info("Syncing data from the source to the database");
  return c.json({ message: "Hello LIQID" });
});

/**
 * Get all products from the database
 */
app.get("/products", (c: Context) => {
  logger.info("Getting all products from the database");
  return c.json({ message: "Hello LIQID" }, 403);
});

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  (address) => {
    logger.info({ port: address.port }, "api running");
  },
);
