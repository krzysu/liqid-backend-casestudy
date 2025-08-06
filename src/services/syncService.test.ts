import { describe, test, expect, beforeEach, vi } from "vitest";
import { SyncService } from "./syncService";
import { prismaClient } from "../database";
import { ProcessedProduct } from "../types";
import { ProductType } from "@prisma/client";

// Mock the database module
vi.mock("../database", () => ({
  prismaClient: {
    allocation: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock the logger
vi.mock("../logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SyncService", () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService();
    vi.clearAllMocks();
  });

  describe("saveProductsToDatabase", () => {
    test("should save products and allocations in a transaction", async () => {
      const processedProducts: ProcessedProduct[] = [
        {
          id: "test_1",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [
            {
              productId: "test_1",
              assetClass: "Stocks",
              region: "US",
              securityIsin: "US123",
              securityCount: 100,
            },
          ],
        },
      ];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          allocation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
          product: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prismaClient.$transaction).mockImplementation(mockTransaction);

      const result = await syncService.saveProductsToDatabase(processedProducts);

      expect(result.success).toBe(true);
      expect(result.productsProcessed).toBe(1);
      expect(result.allocationsProcessed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prismaClient.$transaction).toHaveBeenCalledTimes(1);
    });

    test("should handle multiple products with multiple allocations", async () => {
      const processedProducts: ProcessedProduct[] = [
        {
          id: "test_1",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [
            {
              productId: "test_1",
              assetClass: "Stocks",
              region: "US",
              securityIsin: "US123",
              securityCount: 100,
            },
            {
              productId: "test_1",
              assetClass: "Bonds",
              region: "EU",
              securityIsin: "EU456",
              securityCount: 50,
            },
          ],
        },
        {
          id: "test_2",
          type: ProductType.PRIVATE_EQUITY,
          profit: 2000,
          currentAmount: 10000,
          investedAmount: 8000,
          allocations: [
            {
              productId: "test_2",
              assetClass: "Real Estate",
              region: "Asia",
              securityIsin: "AS789",
              securityCount: 200,
            },
          ],
        },
      ];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          allocation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
          product: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prismaClient.$transaction).mockImplementation(mockTransaction);

      const result = await syncService.saveProductsToDatabase(processedProducts);

      expect(result.success).toBe(true);
      expect(result.productsProcessed).toBe(2);
      expect(result.allocationsProcessed).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    test("should handle transaction failure and rollback", async () => {
      const processedProducts: ProcessedProduct[] = [
        {
          id: "test_1",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [
            {
              productId: "test_1",
              assetClass: "Stocks",
              region: "US",
              securityIsin: "US123",
              securityCount: 100,
            },
          ],
        },
      ];

      const error = new Error("Transaction failed");
      vi.mocked(prismaClient.$transaction).mockRejectedValueOnce(error);

      await expect(syncService.saveProductsToDatabase(processedProducts)).rejects.toThrow("Transaction failed");
    });

    test("should handle empty products array", async () => {
      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          allocation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
          product: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prismaClient.$transaction).mockImplementation(mockTransaction);

      const result = await syncService.saveProductsToDatabase([]);

      expect(result.success).toBe(true);
      expect(result.productsProcessed).toBe(0);
      expect(result.allocationsProcessed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("getProductsWithAllocations", () => {
    test("should fetch all products with their allocations", async () => {
      const mockProducts = [
        {
          id: "test_1",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [
            {
              id: "alloc_1",
              productId: "test_1",
              assetClass: "Stocks",
              region: "US",
              securityIsin: "US123",
              securityCount: 100,
            },
          ],
        },
        {
          id: "test_2",
          type: ProductType.PRIVATE_EQUITY,
          profit: 2000,
          currentAmount: 10000,
          investedAmount: 8000,
          allocations: [
            {
              id: "alloc_2",
              productId: "test_2",
              assetClass: "Bonds",
              region: "EU",
              securityIsin: "EU456",
              securityCount: 200,
            },
          ],
        },
      ];

      vi.mocked(prismaClient.product.findMany).mockResolvedValueOnce(mockProducts);

      const result = await syncService.getProductsWithAllocations();

      expect(result).toEqual(mockProducts);
      expect(prismaClient.product.findMany).toHaveBeenCalledWith({
        include: {
          allocations: true,
        },
        orderBy: {
          id: "asc",
        },
      });
    });

    test("should handle empty database", async () => {
      vi.mocked(prismaClient.product.findMany).mockResolvedValueOnce([]);

      const result = await syncService.getProductsWithAllocations();

      expect(result).toEqual([]);
      expect(prismaClient.product.findMany).toHaveBeenCalledTimes(1);
    });

    test("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      vi.mocked(prismaClient.product.findMany).mockRejectedValueOnce(error);

      await expect(syncService.getProductsWithAllocations()).rejects.toThrow("Database connection failed");
    });

    test("should fetch products ordered by id", async () => {
      const mockProducts = [
        {
          id: "a_product",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [],
        },
        {
          id: "b_product",
          type: ProductType.PRIVATE_EQUITY,
          profit: 2000,
          currentAmount: 10000,
          investedAmount: 8000,
          allocations: [],
        },
      ];

      vi.mocked(prismaClient.product.findMany).mockResolvedValueOnce(mockProducts);

      const result = await syncService.getProductsWithAllocations();

      expect(result[0].id).toBe("a_product");
      expect(result[1].id).toBe("b_product");
      expect(prismaClient.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            id: "asc",
          },
        })
      );
    });
  });
});