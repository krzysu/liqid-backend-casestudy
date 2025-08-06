import { describe, test, expect, beforeEach } from "vitest";
import { ValidationService } from "./validationService";
import { DataXAllocationResponse, DataXProductResponse, DataXAllocation, DataXAssetClass } from "../types";

describe("ValidationService", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("validateProductType", () => {
    test("should return true for valid product types", () => {
      expect(validationService.validateProductType("WEALTH")).toBe(true);
      expect(validationService.validateProductType("PRIVATE_EQUITY")).toBe(true);
    });

    test("should return false for invalid product types", () => {
      expect(validationService.validateProductType("INVALID")).toBe(false);
      expect(validationService.validateProductType("")).toBe(false);
      expect(validationService.validateProductType(undefined)).toBe(false);
    });
  });

  describe("validateProduct", () => {
    test("should validate a valid product", () => {
      const product: DataXProductResponse = {
        id: "test_1",
        profit: 1000,
        currentAmount: 5000,
        productType: "WEALTH",
        investedAmount: 4000,
      };

      const result = validationService.validateProduct(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should invalidate product with missing ID", () => {
      const product: DataXProductResponse = {
        id: "",
        profit: 1000,
        currentAmount: 5000,
        productType: "WEALTH",
        investedAmount: 4000,
      };

      const result = validationService.validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Product ID is missing");
    });

    test("should invalidate product with invalid product type", () => {
      const product: DataXProductResponse = {
        id: "test_1",
        profit: 1000,
        currentAmount: 5000,
        productType: "INVALID_TYPE",
        investedAmount: 4000,
      };

      const result = validationService.validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid or missing product type"))).toBe(true);
    });

    test("should invalidate product with non-numeric values", () => {
      const product = {
        id: "test_1",
        profit: "not a number" as unknown as number,
        currentAmount: 5000,
        productType: "WEALTH",
        investedAmount: 4000,
      };

      const result = validationService.validateProduct(product as DataXProductResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Profit must be a number");
    });

    test("should invalidate product with missing numeric fields", () => {
      const product = {
        id: "test_1",
        profit: 1000,
        currentAmount: "invalid" as unknown as number,
        productType: "WEALTH",
        investedAmount: null as unknown as number,
      };

      const result = validationService.validateProduct(product as DataXProductResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Current amount must be a number");
      expect(result.errors).toContain("Invested amount must be a number");
    });
  });

  describe("validateAllocation", () => {
    test("should validate a valid allocation", () => {
      const allocation: DataXAllocationResponse = {
        id: "test_1",
        allocation: {
          name: "Test Allocation",
          assetClass: [
            {
              name: "Stocks",
              region: [
                {
                  name: "US",
                  security: {
                    isin: "US123456789",
                    count: 100,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = validationService.validateAllocation(allocation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should invalidate allocation with missing ID", () => {
      const allocation: DataXAllocationResponse = {
        id: "",
        allocation: {
          name: "Test",
          assetClass: [],
        },
      };

      const result = validationService.validateAllocation(allocation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Allocation ID is missing");
    });

    test("should invalidate allocation with missing allocation data", () => {
      const allocation = {
        id: "test_1",
        allocation: null as unknown as DataXAllocation,
      };

      const result = validationService.validateAllocation(allocation as DataXAllocationResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Allocation data is missing");
    });

    test("should invalidate allocation with missing asset class", () => {
      const allocation = {
        id: "test_1",
        allocation: {
          name: "Test",
          assetClass: null as unknown as DataXAssetClass[],
        },
      };

      const result = validationService.validateAllocation(allocation as DataXAllocationResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset class data is missing or invalid");
    });

    test("should invalidate allocation with missing security ISIN", () => {
      const allocation: DataXAllocationResponse = {
        id: "test_1",
        allocation: {
          name: "Test",
          assetClass: [
            {
              name: "Stocks",
              region: [
                {
                  name: "US",
                  security: {
                    isin: "",
                    count: 100,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = validationService.validateAllocation(allocation);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Security ISIN is missing"))).toBe(true);
    });

    test("should invalidate allocation with non-numeric security count", () => {
      const allocation: DataXAllocationResponse = {
        id: "test_1",
        allocation: {
          name: "Test",
          assetClass: [
            {
              name: "Stocks",
              region: [
                {
                  name: "US",
                  security: {
                    isin: "US123",
                    count: "not a number" as unknown as number,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = validationService.validateAllocation(allocation);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Security count must be a number"))).toBe(true);
    });

    test("should validate complex nested allocation structure", () => {
      const allocation: DataXAllocationResponse = {
        id: "test_1",
        allocation: {
          name: "Complex Allocation",
          assetClass: [
            {
              name: "Stocks",
              region: [
                {
                  name: "US",
                  security: {
                    isin: "US123",
                    count: 100,
                  },
                },
                {
                  name: "EU",
                  security: {
                    isin: "EU456",
                    count: 50,
                  },
                },
              ],
            },
            {
              name: "Bonds",
              region: [
                {
                  name: "Asia",
                  security: {
                    isin: "AS789",
                    count: 200,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = validationService.validateAllocation(allocation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateDataPairing", () => {
    test("should validate correctly paired data", () => {
      const products: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
        {
          id: "test_2",
          profit: 2000,
          currentAmount: 6000,
          productType: "PRIVATE_EQUITY",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "test_1",
          allocation: {
            name: "Test 1",
            assetClass: [],
          },
        },
        {
          id: "test_2",
          allocation: {
            name: "Test 2",
            assetClass: [],
          },
        },
      ];

      const result = validationService.validateDataPairing(products, allocations);
      expect(result.get("test_1")?.isValid).toBe(true);
      expect(result.get("test_2")?.isValid).toBe(true);
      expect(result.size).toBe(2);
    });

    test("should detect products without allocations", () => {
      const products: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
        {
          id: "test_orphan",
          profit: 2000,
          currentAmount: 6000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "test_1",
          allocation: {
            name: "Test",
            assetClass: [],
          },
        },
      ];

      const result = validationService.validateDataPairing(products, allocations);
      expect(result.get("test_1")?.isValid).toBe(true);
      expect(result.get("test_orphan")?.isValid).toBe(false);
      expect(result.get("test_orphan")?.errors[0]).toContain("has no corresponding allocation data");
    });

    test("should detect allocations without products", () => {
      const products: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "test_1",
          allocation: {
            name: "Test 1",
            assetClass: [],
          },
        },
        {
          id: "test_orphan",
          allocation: {
            name: "Orphan",
            assetClass: [],
          },
        },
      ];

      const result = validationService.validateDataPairing(products, allocations);
      expect(result.get("test_1")?.isValid).toBe(true);
      expect(result.get("test_orphan")?.isValid).toBe(false);
      expect(result.get("test_orphan")?.errors[0]).toContain("has no corresponding product data");
    });

    test("should handle empty arrays", () => {
      const result = validationService.validateDataPairing([], []);
      expect(result.size).toBe(0);
    });

    test("should handle mixed valid and invalid pairings", () => {
      const products: DataXProductResponse[] = [
        {
          id: "valid_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
        {
          id: "product_orphan",
          profit: 2000,
          currentAmount: 6000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "valid_1",
          allocation: {
            name: "Valid",
            assetClass: [],
          },
        },
        {
          id: "allocation_orphan",
          allocation: {
            name: "Orphan",
            assetClass: [],
          },
        },
      ];

      const result = validationService.validateDataPairing(products, allocations);
      expect(result.size).toBe(3);
      expect(result.get("valid_1")?.isValid).toBe(true);
      expect(result.get("product_orphan")?.isValid).toBe(false);
      expect(result.get("allocation_orphan")?.isValid).toBe(false);
    });
  });
});