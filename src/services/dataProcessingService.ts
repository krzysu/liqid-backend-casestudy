import { ProductType } from "@prisma/client";
import { logger } from "../logger";
import {
  DataXAllocationResponse,
  DataXProductResponse,
  ProcessedAllocation,
  ProcessedProduct,
} from "../types";
import { validationService } from "./validationService";

export class DataProcessingService {
  processAllocations(
    allocation: DataXAllocationResponse
  ): ProcessedAllocation[] {
    const processedAllocations: ProcessedAllocation[] = [];

    if (!allocation.allocation?.assetClass) {
      return processedAllocations;
    }

    allocation.allocation.assetClass.forEach((assetClass) => {
      if (!assetClass.region) return;

      assetClass.region.forEach((region) => {
        if (!region.security) return;

        processedAllocations.push({
          productId: allocation.id,
          assetClass: assetClass.name,
          region: region.name,
          securityIsin: region.security.isin,
          securityCount: region.security.count,
        });
      });
    });

    return processedAllocations;
  }

  mergeProductAndAllocations(
    products: DataXProductResponse[],
    allocations: DataXAllocationResponse[]
  ): ProcessedProduct[] {
    const processedProducts: ProcessedProduct[] = [];
    
    // Create a map for quick allocation lookup
    const allocationMap = new Map<string, DataXAllocationResponse>();
    allocations.forEach((allocation) => {
      allocationMap.set(allocation.id, allocation);
    });

    // Validate data pairing
    const pairingValidation = validationService.validateDataPairing(products, allocations);

    products.forEach((product) => {
      // Skip if product doesn't have corresponding allocation
      const pairingResult = pairingValidation.get(product.id);
      if (!pairingResult?.isValid) {
        logger.warn(
          { productId: product.id, errors: pairingResult?.errors },
          "Skipping product due to pairing validation failure"
        );
        return;
      }

      // Validate product data
      const productValidation = validationService.validateProduct(product);
      if (!productValidation.isValid) {
        logger.warn(
          { productId: product.id, errors: productValidation.errors },
          "Skipping product due to validation failure"
        );
        return;
      }

      const allocation = allocationMap.get(product.id);
      if (!allocation) {
        logger.warn({ productId: product.id }, "No allocation found for product");
        return;
      }

      // Validate allocation data
      const allocationValidation = validationService.validateAllocation(allocation);
      if (!allocationValidation.isValid) {
        logger.warn(
          { productId: product.id, errors: allocationValidation.errors },
          "Skipping product due to allocation validation failure"
        );
        return;
      }

      // Process allocations
      const processedAllocations = this.processAllocations(allocation);

      if (processedAllocations.length === 0) {
        logger.warn(
          { productId: product.id },
          "No valid allocations found for product"
        );
        return;
      }

      // Create processed product
      processedProducts.push({
        id: product.id,
        type: product.productType as ProductType,
        profit: product.profit,
        currentAmount: product.currentAmount,
        investedAmount: product.investedAmount,
        allocations: processedAllocations,
      });

      logger.info(
        { 
          productId: product.id, 
          allocationsCount: processedAllocations.length 
        },
        "Successfully processed product"
      );
    });

    return processedProducts;
  }
}

export const dataProcessingService = new DataProcessingService();