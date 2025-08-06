import { Product, Allocation } from "@prisma/client";

// DataX API Response Types
export interface DataXSecurity {
  isin: string;
  count: number;
}

export interface DataXRegion {
  name: string;
  security: DataXSecurity;
}

export interface DataXAssetClass {
  name: string;
  region: DataXRegion[];
}

export interface DataXAllocation {
  name: string;
  assetClass: DataXAssetClass[];
}

export interface DataXAllocationResponse {
  id: string;
  allocation: DataXAllocation;
}

export interface DataXProductResponse {
  id: string;
  profit: number;
  currentAmount: number;
  productType: string;
  investedAmount: number;
}

// Internal Processing Types
export type ProcessedAllocation = Omit<Allocation, 'id'>;

export type ProcessedProduct = Product & {
  allocations: ProcessedAllocation[];
};

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  productsProcessed: number;
  allocationsProcessed: number;
  errors: string[];
}

// Database Types
export type ProductWithAllocations = Product & {
  allocations: Allocation[];
};