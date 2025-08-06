import { Context, Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "./logger";
import { dataXService } from "./services/dataXService";
import { dataProcessingService } from "./services/dataProcessingService";
import { syncService } from "./services/syncService";

const app = new Hono();

app.get("/health", (c: Context) => {
  return c.json({
    status: "running",
  });
});

/**
 * Sync the data from the source to the database
 */
app.get("/sync", async (c: Context) => {
  logger.info("[GET /sync] Endpoint called");

  try {
    // Fetch data from dataX API
    const { allocations, products } = await dataXService.fetchAllData();

    // Process and validate data
    const processedProducts = dataProcessingService.mergeProductAndAllocations(
      products,
      allocations
    );

    if (processedProducts.length === 0) {
      logger.warn("[GET /sync] No valid products to sync");
      return c.json(
        {
          success: false,
          message: "No valid products found to sync",
          productsProcessed: 0,
          allocationsProcessed: 0,
        },
        400
      );
    }

    // Save to database
    const syncResult = await syncService.saveProductsToDatabase(
      processedProducts
    );

    logger.info(
      {
        success: syncResult.success,
        productsProcessed: syncResult.productsProcessed,
        allocationsProcessed: syncResult.allocationsProcessed,
      },
      "[GET /sync] Completed"
    );

    return c.json({
      success: syncResult.success,
      message: syncResult.success
        ? "Sync completed successfully"
        : "Sync failed",
      productsProcessed: syncResult.productsProcessed,
      allocationsProcessed: syncResult.allocationsProcessed,
      errors: syncResult.errors.length > 0 ? syncResult.errors : undefined,
    });
  } catch (error) {
    logger.error({ error }, "[GET /sync] Failed");
    return c.json(
      {
        success: false,
        message: "Sync process failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get all products from the database
 */
app.get("/products", async (c: Context) => {
  logger.info("[GET /products] Endpoint called");

  try {
    const products = await syncService.getProductsWithAllocations();

    if (products.length === 0) {
      logger.info("[GET /products] No products found");
      return c.json({
        message: "No products found. Please run /sync first.",
        products: [],
      });
    }

    logger.info({ count: products.length }, "[GET /products] Completed");

    return c.json({
      products: products,
      count: products.length,
    });
  } catch (error) {
    logger.error({ error }, "[GET /products] Failed");
    return c.json(
      {
        message: "Failed to fetch products",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Export for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port: 4000,
    },
    (address) => {
      logger.info({ port: address.port }, "api running");
    }
  );
}
