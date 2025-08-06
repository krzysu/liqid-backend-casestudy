import { describe, test, expect, beforeEach } from "vitest";
import { DataProcessingService } from "./dataProcessingService";
import { DataXAllocationResponse, DataXProductResponse, DataXAllocation, DataXSecurity } from "../types";

describe("DataProcessingService", () => {
  let dataProcessingService: DataProcessingService;

  beforeEach(() => {
    dataProcessingService = new DataProcessingService();
  });

  describe("processAllocations", () => {
    test("should process nested allocations correctly", () => {
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
                {
                  name: "EU",
                  security: {
                    isin: "EU987654321",
                    count: 50,
                  },
                },
              ],
            },
            {
              name: "Bonds",
              region: [
                {
                  name: "UK",
                  security: {
                    isin: "UK111111111",
                    count: 200,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = dataProcessingService.processAllocations(allocation);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        productId: "test_1",
        assetClass: "Stocks",
        region: "US",
        securityIsin: "US123456789",
        securityCount: 100,
      });
      expect(result[1]).toEqual({
        productId: "test_1",
        assetClass: "Stocks",
        region: "EU",
        securityIsin: "EU987654321",
        securityCount: 50,
      });
      expect(result[2]).toEqual({
        productId: "test_1",
        assetClass: "Bonds",
        region: "UK",
        securityIsin: "UK111111111",
        securityCount: 200,
      });
    });

    test("should return empty array for allocation without asset classes", () => {
      const allocation: DataXAllocationResponse = {
        id: "test_1",
        allocation: {
          name: "Test",
          assetClass: [],
        },
      };

      const result = dataProcessingService.processAllocations(allocation);
      expect(result).toHaveLength(0);
    });

    test("should handle missing allocation data gracefully", () => {
      const allocation = {
        id: "test_1",
        allocation: null as unknown as DataXAllocation,
      };

      const result = dataProcessingService.processAllocations(allocation as DataXAllocationResponse);
      expect(result).toHaveLength(0);
    });

    test("should skip regions without security data", () => {
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
                    count: 100,
                  },
                },
                {
                  name: "EU",
                  security: null as unknown as DataXSecurity,
                },
              ],
            },
          ],
        },
      };

      const result = dataProcessingService.processAllocations(allocation);
      expect(result).toHaveLength(1);
      expect(result[0].region).toBe("US");
    });

    test("should handle deeply nested allocation structures", () => {
      const allocation: DataXAllocationResponse = {
        id: "complex_1",
        allocation: {
          name: "Complex Portfolio",
          assetClass: [
            {
              name: "Equity",
              region: [
                {
                  name: "North America",
                  security: {
                    isin: "US001",
                    count: 100,
                  },
                },
                {
                  name: "Europe",
                  security: {
                    isin: "EU001",
                    count: 75,
                  },
                },
                {
                  name: "Asia",
                  security: {
                    isin: "AS001",
                    count: 50,
                  },
                },
              ],
            },
            {
              name: "Fixed Income",
              region: [
                {
                  name: "Global",
                  security: {
                    isin: "GL001",
                    count: 200,
                  },
                },
              ],
            },
            {
              name: "Alternative",
              region: [
                {
                  name: "Emerging Markets",
                  security: {
                    isin: "EM001",
                    count: 25,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = dataProcessingService.processAllocations(allocation);
      expect(result).toHaveLength(5);
      
      const assetClasses = result.map(r => r.assetClass);
      expect(assetClasses).toContain("Equity");
      expect(assetClasses).toContain("Fixed Income");
      expect(assetClasses).toContain("Alternative");
      
      const regions = result.map(r => r.region);
      expect(regions).toContain("North America");
      expect(regions).toContain("Europe");
      expect(regions).toContain("Asia");
      expect(regions).toContain("Global");
      expect(regions).toContain("Emerging Markets");
    });
  });

  describe("mergeProductAndAllocations", () => {
    test("should merge valid products and allocations", () => {
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
            name: "Test",
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
        },
      ];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test_1");
      expect(result[0].type).toBe("WEALTH");
      expect(result[0].profit).toBe(1000);
      expect(result[0].currentAmount).toBe(5000);
      expect(result[0].investedAmount).toBe(4000);
      expect(result[0].allocations).toHaveLength(1);
      expect(result[0].allocations[0].securityIsin).toBe("US123456789");
    });

    test("should handle multiple products with allocations", () => {
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
          currentAmount: 10000,
          productType: "PRIVATE_EQUITY",
          investedAmount: 8000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "test_1",
          allocation: {
            name: "Test 1",
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
        {
          id: "test_2",
          allocation: {
            name: "Test 2",
            assetClass: [
              {
                name: "Bonds",
                region: [
                  {
                    name: "EU",
                    security: {
                      isin: "EU456",
                      count: 200,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("test_1");
      expect(result[0].type).toBe("WEALTH");
      expect(result[1].id).toBe("test_2");
      expect(result[1].type).toBe("PRIVATE_EQUITY");
    });

    test("should skip products with invalid data", () => {
      const products: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "INVALID_TYPE",
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

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      expect(result).toHaveLength(0);
    });

    test("should skip products without corresponding allocations", () => {
      const products: DataXProductResponse[] = [
        {
          id: "test_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      expect(result).toHaveLength(0);
    });

    test("should skip allocations without corresponding products", () => {
      const products: DataXProductResponse[] = [];

      const allocations: DataXAllocationResponse[] = [
        {
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
                      count: 100,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      expect(result).toHaveLength(0);
    });

    test("should skip products with empty allocations", () => {
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
            name: "Empty Allocation",
            assetClass: [],
          },
        },
      ];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      expect(result).toHaveLength(0);
    });

    test("should handle mixed valid and invalid products", () => {
      const products: DataXProductResponse[] = [
        {
          id: "valid_1",
          profit: 1000,
          currentAmount: 5000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
        {
          id: "invalid_1",
          profit: 2000,
          currentAmount: 6000,
          productType: "INVALID",
          investedAmount: 4000,
        },
        {
          id: "valid_2",
          profit: 3000,
          currentAmount: 7000,
          productType: "PRIVATE_EQUITY",
          investedAmount: 4000,
        },
        {
          id: "orphan_1",
          profit: 4000,
          currentAmount: 8000,
          productType: "WEALTH",
          investedAmount: 4000,
        },
      ];

      const allocations: DataXAllocationResponse[] = [
        {
          id: "valid_1",
          allocation: {
            name: "Valid 1",
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
        {
          id: "invalid_1",
          allocation: {
            name: "Invalid 1",
            assetClass: [
              {
                name: "Bonds",
                region: [
                  {
                    name: "EU",
                    security: {
                      isin: "EU456",
                      count: 50,
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          id: "valid_2",
          allocation: {
            name: "Valid 2",
            assetClass: [
              {
                name: "Real Estate",
                region: [
                  {
                    name: "Asia",
                    security: {
                      isin: "AS789",
                      count: 75,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = dataProcessingService.mergeProductAndAllocations(products, allocations);
      
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toContain("valid_1");
      expect(result.map(p => p.id)).toContain("valid_2");
      expect(result.map(p => p.id)).not.toContain("invalid_1");
      expect(result.map(p => p.id)).not.toContain("orphan_1");
    });
  });
});