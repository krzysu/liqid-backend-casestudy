import { prismaClient } from "../database";
import { logger } from "../logger";
import { ProcessedProduct, SyncResult, ProductWithAllocations } from "../types";

export class SyncService {
  async saveProductsToDatabase(
    products: ProcessedProduct[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      productsProcessed: 0,
      allocationsProcessed: 0,
      errors: [],
    };

    try {
      logger.info({ count: products.length }, "Starting to save products to database");

      // Use a transaction to ensure atomicity
      await prismaClient.$transaction(async (tx) => {
        // Clear existing data first
        await tx.allocation.deleteMany({});
        await tx.product.deleteMany({});
        logger.info("Cleared existing data in transaction");

        // Save each product with its allocations
        for (const product of products) {
          try {
            // Create product
            await tx.product.create({
              data: {
                id: product.id,
                type: product.type,
                profit: product.profit,
                currentAmount: product.currentAmount,
                investedAmount: product.investedAmount,
              },
            });

            result.productsProcessed++;
            logger.info({ productId: product.id }, "Created product");

            // Create allocations for this product
            for (const allocation of product.allocations) {
              await tx.allocation.create({
                data: {
                  id: `${allocation.productId}_${allocation.assetClass}_${allocation.region}_${allocation.securityIsin}`,
                  productId: allocation.productId,
                  assetClass: allocation.assetClass,
                  region: allocation.region,
                  securityIsin: allocation.securityIsin,
                  securityCount: allocation.securityCount,
                },
              });

              result.allocationsProcessed++;
            }

            logger.info(
              { 
                productId: product.id, 
                allocationsCount: product.allocations.length 
              },
              "Created allocations for product"
            );
          } catch (error) {
            const errorMessage = `Failed to save product ${product.id}: ${error}`;
            logger.error({ error, productId: product.id }, errorMessage);
            result.errors.push(errorMessage);
            throw error; // This will rollback the transaction
          }
        }
      });

      result.success = true;
      logger.info(
        {
          productsProcessed: result.productsProcessed,
          allocationsProcessed: result.allocationsProcessed,
        },
        "Successfully saved all products to database"
      );
    } catch (error) {
      logger.error({ error }, "Failed to save products to database");
      result.errors.push(`Transaction failed: ${error}`);
      throw error;
    }

    return result;
  }

  async getProductsWithAllocations(): Promise<ProductWithAllocations[]> {
    try {
      logger.info("Fetching products with allocations from database");
      
      const products = await prismaClient.product.findMany({
        include: {
          allocations: true,
        },
        orderBy: {
          id: "asc",
        },
      });

      logger.info({ count: products.length }, "Successfully fetched products from database");
      return products;
    } catch (error) {
      logger.error({ error }, "Error fetching products from database");
      throw error;
    }
  }
}

export const syncService = new SyncService();