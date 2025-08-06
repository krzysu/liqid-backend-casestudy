# Implementation Plan for Liqid Case Study

## Overview
Implement a wealth management platform backend that syncs data from dataX API, validates it, and persists it in SQLite database.

## Tasks

### 1. Data Types & Interfaces
- Define TypeScript interfaces for dataX API responses
- Create types for allocations and products data structures
- Ensure type safety throughout the application

### 2. Data Fetching Service
- Create service module to fetch data from dataX APIs
- Implement methods for `/allocations` and `/products` endpoints
- Add error handling and retry logic

### 3. Sync Endpoint Implementation (`/sync`)
- Fetch data from both dataX endpoints concurrently
- Merge allocation and product data using the `id` field
- Transform nested allocation structure into flat database records
- Handle data correlation between products and allocations

### 4. Business Validation Logic
- Validate productType exists and is valid (WEALTH or PRIVATE_EQUITY)
- Ensure both allocation and product data exist for each item
- Skip invalid/incomplete data and log warnings
- Implement validation as separate, testable functions

### 5. Database Operations
- Use Prisma transactions for atomic operations
- Save products and their allocations together
- Handle cascade deletion properly
- Clear existing data before sync (optional)

### 6. Products Endpoint Implementation (`/products`)
- Query all products with their allocations from database
- Format response according to requirements
- Return aggregated JSON response

### 7. Structured Logging
- Add info logs for successful operations
- Add warning logs for validation failures
- Add error logs for exceptions
- Use context objects for better log tracing

### 8. Testing
- Unit tests for validation logic
- Unit tests for data transformation
- API endpoint tests for `/sync`
- API endpoint tests for `/products`
- Integration tests for full flow

## Technical Decisions

### API Communication
- Use native `fetch` API for HTTP requests to dataX
- Base URL: `http://localhost:3000`
- Handle network errors gracefully

### Data Processing
- Correlation key: `id` field from both endpoints
- Flatten nested allocation structure for database storage
- Each allocation record includes: assetClass, region, ISIN, count

### Database Strategy
- Use Prisma transactions for atomicity
- Product-Allocation relationship with cascade delete
- Clear and resync approach for data updates

### Error Handling
- Graceful degradation for partial data
- Detailed error messages in logs
- HTTP appropriate status codes

## Implementation Order
1. Create types and interfaces
2. Build dataX service layer
3. Implement sync endpoint with basic functionality
4. Add validation logic
5. Implement atomic database operations
6. Build products endpoint
7. Add comprehensive logging
8. Write and run tests
9. Integration testing

## Success Criteria
- Data correctly synced from dataX to database
- Invalid data properly filtered out
- Atomic operations ensure data consistency
- All tests passing
- Structured logging provides clear audit trail