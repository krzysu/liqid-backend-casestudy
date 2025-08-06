import { ProductType } from "@prisma/client";
import { logger } from "../logger";
import {
  DataXAllocationResponse,
  DataXProductResponse,
  ValidationResult,
} from "../types";

export class ValidationService {
  validateProductType(productType: string | undefined): boolean {
    if (!productType) {
      return false;
    }
    
    const validTypes = Object.values(ProductType);
    return validTypes.includes(productType as ProductType);
  }

  validateProduct(product: DataXProductResponse): ValidationResult {
    const errors: string[] = [];

    if (!product.id) {
      errors.push("Product ID is missing");
    }

    if (!this.validateProductType(product.productType)) {
      errors.push(`Invalid or missing product type: ${product.productType}. Must be one of: ${Object.values(ProductType).join(", ")}`);
    }

    if (typeof product.profit !== "number") {
      errors.push("Profit must be a number");
    }

    if (typeof product.currentAmount !== "number") {
      errors.push("Current amount must be a number");
    }

    if (typeof product.investedAmount !== "number") {
      errors.push("Invested amount must be a number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateAllocation(allocation: DataXAllocationResponse): ValidationResult {
    const errors: string[] = [];

    if (!allocation.id) {
      errors.push("Allocation ID is missing");
    }

    if (!allocation.allocation) {
      errors.push("Allocation data is missing");
      return { isValid: false, errors };
    }

    if (!allocation.allocation.assetClass || !Array.isArray(allocation.allocation.assetClass)) {
      errors.push("Asset class data is missing or invalid");
    } else {
      allocation.allocation.assetClass.forEach((assetClass, assetIndex) => {
        if (!assetClass.name) {
          errors.push(`Asset class name is missing at index ${assetIndex}`);
        }

        if (!assetClass.region || !Array.isArray(assetClass.region)) {
          errors.push(`Region data is missing or invalid for asset class at index ${assetIndex}`);
        } else {
          assetClass.region.forEach((region, regionIndex) => {
            if (!region.name) {
              errors.push(`Region name is missing at asset class ${assetIndex}, region ${regionIndex}`);
            }

            if (!region.security) {
              errors.push(`Security data is missing at asset class ${assetIndex}, region ${regionIndex}`);
            } else {
              if (!region.security.isin) {
                errors.push(`Security ISIN is missing at asset class ${assetIndex}, region ${regionIndex}`);
              }
              if (typeof region.security.count !== "number") {
                errors.push(`Security count must be a number at asset class ${assetIndex}, region ${regionIndex}`);
              }
            }
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateDataPairing(
    products: DataXProductResponse[],
    allocations: DataXAllocationResponse[]
  ): Map<string, ValidationResult> {
    const validationResults = new Map<string, ValidationResult>();
    const productIds = new Set(products.map((p) => p.id));
    const allocationIds = new Set(allocations.map((a) => a.id));

    // Check for products without allocations
    products.forEach((product) => {
      if (!allocationIds.has(product.id)) {
        validationResults.set(product.id, {
          isValid: false,
          errors: [`Product ${product.id} has no corresponding allocation data`],
        });
        logger.warn({ productId: product.id }, "Product has no allocation data");
      }
    });

    // Check for allocations without products
    allocations.forEach((allocation) => {
      if (!productIds.has(allocation.id)) {
        validationResults.set(allocation.id, {
          isValid: false,
          errors: [`Allocation ${allocation.id} has no corresponding product data`],
        });
        logger.warn({ allocationId: allocation.id }, "Allocation has no product data");
      }
    });

    // Mark valid pairs
    productIds.forEach((id) => {
      if (allocationIds.has(id) && !validationResults.has(id)) {
        validationResults.set(id, {
          isValid: true,
          errors: [],
        });
      }
    });

    return validationResults;
  }
}

export const validationService = new ValidationService();