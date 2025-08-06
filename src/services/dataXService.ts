import { logger } from "../logger";
import { DataXAllocationResponse, DataXProductResponse } from "../types";

const DATAX_BASE_URL = "http://localhost:3000";

export class DataXService {
  private baseUrl: string;

  constructor(baseUrl: string = DATAX_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchAllocations(): Promise<DataXAllocationResponse[]> {
    try {
      logger.info("Fetching allocations from dataX API");
      const response = await fetch(`${this.baseUrl}/allocations`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch allocations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info({ count: data.length }, "Successfully fetched allocations");
      return data;
    } catch (error) {
      logger.error({ error }, "Error fetching allocations from dataX");
      throw error;
    }
  }

  async fetchProducts(): Promise<DataXProductResponse[]> {
    try {
      logger.info("Fetching products from dataX API");
      const response = await fetch(`${this.baseUrl}/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info({ count: data.length }, "Successfully fetched products");
      return data;
    } catch (error) {
      logger.error({ error }, "Error fetching products from dataX");
      throw error;
    }
  }

  async fetchAllData(): Promise<{
    allocations: DataXAllocationResponse[];
    products: DataXProductResponse[];
  }> {
    try {
      logger.info("Fetching all data from dataX API");
      
      // Fetch both endpoints concurrently
      const [allocations, products] = await Promise.all([
        this.fetchAllocations(),
        this.fetchProducts(),
      ]);

      logger.info(
        { allocationsCount: allocations.length, productsCount: products.length },
        "Successfully fetched all data from dataX"
      );

      return { allocations, products };
    } catch (error) {
      logger.error({ error }, "Error fetching data from dataX");
      throw error;
    }
  }
}

export const dataXService = new DataXService();