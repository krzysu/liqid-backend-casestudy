### Overall Architecture

The application is a Node.js server built with a modern, layered architecture that emphasizes separation of concerns. This design makes the codebase modular, scalable, and easy to maintain.

- **API Layer**: Built with **Hono**, this layer is responsible for handling incoming HTTP requests and routing them to the appropriate controllers. It defines the application's endpoints and manages the request/response cycle.
- **Service Layer**: This is the core of the application, containing all the business logic. It is divided into specialized services, each with a distinct responsibility:
  - `dataXService`: Handles all communication with the external `dataX` API.
  - `validationService`: Contains the logic for validating data integrity and enforcing business rules.
  - `dataProcessingService`: Responsible for transforming and structuring the raw data fetched from the `dataX` API.
  - `syncService`: Manages all database operations, including writing and reading data.
- **Data Access Layer**: This layer uses **Prisma** as an ORM to interact with the **SQLite** database. It provides a type-safe and intuitive way to perform database queries.
- **Logging**: The application uses **Pino** for structured, asynchronous logging, which is essential for monitoring and debugging in a production environment.
- **Testing**: The codebase is well-tested using **Vitest**, with a comprehensive suite of unit tests that mock dependencies to ensure that each component is tested in isolation.

### Key Components and Data Flow

#### 1. `index.ts` (API Entry Point)

This file sets up the Hono server and defines the following API endpoints:

- **`GET /health`**: A standard health check endpoint to confirm that the service is running.
- **`GET /sync`**: The primary endpoint that triggers the data synchronization process. It orchestrates the calls to the various services to fetch, process, and save the data.
- **`GET /products`**: Retrieves and returns all the processed and validated products from the database.

#### 2. `dataXService.ts`

This service is responsible for fetching data from the mock `dataX` API.

- It uses the native `fetch` API to make concurrent requests to the `/allocations` and `/products` endpoints, which is efficient and reduces the total time spent on I/O operations.
- It is designed to be configurable, allowing the base URL of the `dataX` API to be easily changed.

#### 3. `validationService.ts`

This service is crucial for maintaining data quality and enforcing the business rules defined in the problem statement.

- It validates that each product has a valid `productType`.
- It ensures that all required fields in the product and allocation data are present and have the correct data type.
- It performs a critical validation step to ensure that every product has a corresponding allocation and vice versa, preventing orphan data from being saved to the database.

#### 4. `dataProcessingService.ts`

This service takes the raw data from the `dataX` API and prepares it for storage in the database.

- It uses the `validationService` to filter out any invalid or unpaired data.
- It transforms the deeply nested allocation data into a flattened structure that is easier to work with and store in a relational database.
- It merges the product and allocation data into a single, unified data structure (`ProcessedProduct`).

#### 5. `syncService.ts`

This service handles all interactions with the database.

- The `saveProductsToDatabase` method uses a **Prisma transaction** to ensure that the entire data synchronization process is **atomic**. This means that if any part of the operation fails, the entire transaction is rolled back, preventing the database from being left in a partially updated state.
- Before saving the new data, it clears all existing data from the `product` and `allocation` tables to ensure that the database always reflects the latest data from the `dataX` API.
- The `getProductsWithAllocations` method provides a simple way to query all products and their associated allocations from the database.

### Data Flow Summary

The data flows through the application in a clear and logical sequence:

1.  A `GET` request to the `/sync` endpoint initiates the process.
2.  The `dataXService` fetches the raw data from the external API.
3.  The `dataProcessingService` validates and transforms the data, creating a clean and structured dataset.
4.  The `syncService` saves the processed data to the database in a single, atomic transaction.
5.  A `GET` request to the `/products` endpoint retrieves the data from the database and returns it to the user.

This well-designed architecture ensures that the application is robust, reliable, and easy to understand.
