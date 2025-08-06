import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { DataXService } from "./dataXService";
import { DataXAllocationResponse, DataXProductResponse } from "../types";

// Mock the logger
vi.mock("../logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("DataXService", () => {
  let dataXService: DataXService;
  const mockBaseUrl = "http://localhost:3000";

  beforeEach(() => {
    dataXService = new DataXService(mockBaseUrl);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchAllocations", () => {
    test("should fetch allocations successfully", async () => {
      const mockAllocations: DataXAllocationResponse[] = [
        {
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
                      isin: "US123",
                      count: 100,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllocations,
      } as Response);

      const result = await dataXService.fetchAllocations();

      expect(result).toEqual(mockAllocations);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/allocations`);
    });

    test("should handle fetch failure for allocations", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(dataXService.fetchAllocations()).rejects.toThrow(
        "Failed to fetch allocations: 500 Internal Server Error"
      );
    });

    test("should handle network error for allocations", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      await expect(dataXService.fetchAllocations()).rejects.toThrow("Network error");
    });

    test("should handle empty allocations response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await dataXService.fetchAllocations();

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/allocations`);
    });
  });

  describe("fetchProducts", () => {
    test("should fetch products successfully", async () => {
      const mockProducts: DataXProductResponse[] = [
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
          currentAmount: 10000,
          productType: "PRIVATE_EQUITY",
          investedAmount: 8000,
        },
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      } as Response);

      const result = await dataXService.fetchProducts();

      expect(result).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/products`);
    });

    test("should handle fetch failure for products", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(dataXService.fetchProducts()).rejects.toThrow(
        "Failed to fetch products: 404 Not Found"
      );
    });

    test("should handle network error for products", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Connection refused"));

      await expect(dataXService.fetchProducts()).rejects.toThrow("Connection refused");
    });

    test("should handle empty products response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await dataXService.fetchProducts();

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/products`);
    });
  });

  describe("fetchAllData", () => {
    test("should fetch both allocations and products concurrently", async () => {
      const mockAllocations: DataXAllocationResponse[] = [
        {
          id: "test_1",
          allocation: {
            name: "Test Allocation",
            assetClass: [],
          },
        },
      ];

      const mockProducts: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllocations,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts,
        } as Response);

      const result = await dataXService.fetchAllData();

      expect(result.allocations).toEqual(mockAllocations);
      expect(result.products).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/allocations`);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/products`);
    });

    test("should handle failure when fetching allocations fails", async () => {
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error("Allocations fetch failed"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

      await expect(dataXService.fetchAllData()).rejects.toThrow("Allocations fetch failed");
    });

    test("should handle failure when fetching products fails", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockRejectedValueOnce(new Error("Products fetch failed"));

      await expect(dataXService.fetchAllData()).rejects.toThrow("Products fetch failed");
    });

    test("should handle both endpoints failing", async () => {
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error("Allocations error"))
        .mockRejectedValueOnce(new Error("Products error"));

      await expect(dataXService.fetchAllData()).rejects.toThrow();
    });

    test("should fetch large datasets successfully", async () => {
      const mockAllocations: DataXAllocationResponse[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test_${i}`,
        allocation: {
          name: `Allocation ${i}`,
          assetClass: [],
        },
      }));

      const mockProducts: DataXProductResponse[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test_${i}`,
        profit: i * 100,
        currentAmount: i * 1000,
        productType: i % 2 === 0 ? "WEALTH" : "PRIVATE_EQUITY",
        investedAmount: i * 800,
      }));

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllocations,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts,
        } as Response);

      const result = await dataXService.fetchAllData();

      expect(result.allocations).toHaveLength(100);
      expect(result.products).toHaveLength(100);
    });
  });

  describe("constructor", () => {
    test("should use default base URL when not provided", () => {
      const serviceWithDefaultUrl = new DataXService();
      expect(serviceWithDefaultUrl).toBeDefined();
    });

    test("should use custom base URL when provided", () => {
      const customUrl = "http://custom-api.com";
      const serviceWithCustomUrl = new DataXService(customUrl);
      expect(serviceWithCustomUrl).toBeDefined();
    });
  });
});