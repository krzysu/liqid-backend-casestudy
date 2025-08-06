import { describe, test, expect, beforeEach, vi } from "vitest";
import { ProductType } from "@prisma/client";
import { ProductWithAllocations } from "./types";

// Mock all services before imports
vi.mock("./services/dataXService", () => ({
  dataXService: {
    fetchAllData: vi.fn(),
  },
}));

vi.mock("./services/dataProcessingService", () => ({
  dataProcessingService: {
    mergeProductAndAllocations: vi.fn(),
  },
}));

vi.mock("./services/syncService", () => ({
  syncService: {
    saveProductsToDatabase: vi.fn(),
    getProductsWithAllocations: vi.fn(),
  },
}));

vi.mock("./logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import services after mocking
import { dataXService } from "./services/dataXService";
import { dataProcessingService } from "./services/dataProcessingService";
import { syncService } from "./services/syncService";

// Import the app after mocks are set up
import { app } from "./index";

describe("API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    test("should return health status", async () => {
      const response = await app.request("/health");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: "running" });
    });
  });

  describe("GET /sync", () => {
    test("should successfully sync data when valid products exist", async () => {
      const mockAllocations = [
        { id: "test_1", allocation: { name: "Test", assetClass: [] } },
      ];
      const mockProducts = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];
      const mockProcessedProducts = [
        {
          id: "test_1",
          type: ProductType.WEALTH,
          profit: 1000,
          currentAmount: 5000,
          investedAmount: 4000,
          allocations: [],
        },
      ];
      const mockSyncResult = {
        success: true,
        productsProcessed: 1,
        allocationsProcessed: 1,
        errors: [],
      };

      vi.mocked(dataXService.fetchAllData).mockResolvedValue({
        allocations: mockAllocations,
        products: mockProducts,
      });
      vi.mocked(dataProcessingService.mergeProductAndAllocations).mockReturnValue(
        mockProcessedProducts
      );
      vi.mocked(syncService.saveProductsToDatabase).mockResolvedValue(
        mockSyncResult
      );

      const response = await app.request("/sync");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(dataXService.fetchAllData).toHaveBeenCalledTimes(1);
      expect(dataProcessingService.mergeProductAndAllocations).toHaveBeenCalledWith(
        mockProducts,
        mockAllocations
      );
      expect(syncService.saveProductsToDatabase).toHaveBeenCalledWith(
        mockProcessedProducts
      );
      expect(data).toEqual({
        success: true,
        message: "Sync completed successfully",
        productsProcessed: 1,
        allocationsProcessed: 1,
      });
    });

    test("should return error when no valid products found", async () => {
      vi.mocked(dataXService.fetchAllData).mockResolvedValue({
        allocations: [],
        products: [],
      });
      vi.mocked(dataProcessingService.mergeProductAndAllocations).mockReturnValue([]);

      const response = await app.request("/sync");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(syncService.saveProductsToDatabase).not.toHaveBeenCalled();
      expect(data).toEqual({
        success: false,
        message: "No valid products found to sync",
        productsProcessed: 0,
        allocationsProcessed: 0,
      });
    });

    test("should handle errors during sync process", async () => {
      const error = new Error("Network error");
      vi.mocked(dataXService.fetchAllData).mockRejectedValue(error);

      const response = await app.request("/sync");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: "Sync process failed",
        error: "Network error",
      });
    });
  });

  describe("GET /products", () => {
    test("should return products from database", async () => {
      const mockProducts: ProductWithAllocations[] = [
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
      ];

      vi.mocked(syncService.getProductsWithAllocations).mockResolvedValue(
        mockProducts
      );

      const response = await app.request("/products");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(syncService.getProductsWithAllocations).toHaveBeenCalledTimes(1);
      expect(data).toEqual({
        products: mockProducts,
        count: 1,
      });
    });

    test("should return empty array when no products exist", async () => {
      vi.mocked(syncService.getProductsWithAllocations).mockResolvedValue([]);

      const response = await app.request("/products");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: "No products found. Please run /sync first.",
        products: [],
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      vi.mocked(syncService.getProductsWithAllocations).mockRejectedValue(error);

      const response = await app.request("/products");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Failed to fetch products",
        error: "Database connection failed",
      });
    });
  });
});