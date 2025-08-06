# Liqid Case Study – Engineering Challenge

## 1. Context

This project simulates an application for a wealth management platform. It integrates with a mock API service called **dataX** that provides portfolio allocation and financial summary data.

The goal is to:

- Ingest and merge the allocation and summary data from dataX apis
- Apply validation and transformation rules
- Persist enriched and structured results in a SQLite database
- Build an API that performs secure syncing and enrichment

Please take up to 7 days to work on the challenge, but don't spend more than 2-3h on finishing it.
It's easy to spend more time, but try to set prorities what you're looking at.
Your solution will be used as the basis for a more in-depth technical discussion around software development concepts and architecture.

If you run into any (technical) issues during the coding challenge, feel free to contact one / both of us:

- Swag: [swagata.chatterjee@liqid.de](mailto:swagata.chatterjee@liqid.de)
- Christian: [christian.ost@liqid.de](mailto:christian.ost@liqid.de)

## Getting Started

### Understanding the tools

The project uses the following tools and technologies:

#### Mock Data Service (dataX)

- **json-server** (v1.0.0-beta.3): Creates a mock REST API

#### API

- **TypeScript**: For type safety and better developer experience
- **Hono**: Modern, fast, and type-safe web framework
- **Vitest**: Test runner
- **Node.js**: Runtime environment

#### Database

- **SQLite**: Lightweight, serverless database
- **Prisma**: Type-safe ORM for database operations
- Includes schema management and migrations

### Understanding the Data Source

This project uses a custom `datax` service that mimics a real financial data provider.

#### Running the Mock API

At the root of the project `liqid-backend-casestudy`:

```bash
npm install
npm run datax
```

Once the steps run successfully, it will indicate `JSON Server started on PORT :3000`

Now the data is available at: `http://localhost:3000`. Please keep the terminal running.

#### API Endpoints

- `GET /products`: Returns the list of current products
- `GET /allocations`: Returns the list of allocations for a certain product

##### Sample `/allocations` Response

```json
[
  {
    "id": "datax_1",
    "allocation": {
      "name": "ETF 20",
      "assetClass": [
        {
          "name": "Commodities",
          "region": [
            {
              "name": "DE",
              "security": {
                "isin": "ISIN4881",
                "count": 32
              }
            }
          ]
        }
      ]
    }
  }
]
```

##### Sample `/products` Response

```json
[
  {
    "id": "datax_1",
    "profit": 5000.0,
    "currentAmount": 25000.0,
    "productType": "WEALTH",
    "investedAmount": 20000.0
  }
]
```

#### 2.b Running the Backend API

```bash
npm run start
```

### Database

- Refer to the **schema.prisma** file for the database schema and expected data types
- Use the Prisma client from `src/database.ts` to save your data to the included SQL database
  - Check the Prisma documentation for additional support, e.g. for doing transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions

## Problem Statements

### Sync Allocation and Summary Data

Implement the `/sync` api in `index.ts`

- Retrieves the allocation data from the datax APIs : `/allocations` and `/products`
- Consolidates the information from both datasets and persists them in the database. Please note that the information retrieved from each of the endpoints for each products can be corelated using the "id" attritbute. See below for business rules to what should be stored.

Implement the `/products` api in `index.ts`

- Queries the database and provides a JSON output of the aggregated data for all products

### Apply Business Validations:

Prevent the following erronous data to be persisted in the database:

- If the data for a product retrieved by `/products` does not contain appropriate "productType" information
- If either allocation and/or product data is missing for a product (e.g. a product / allocation which cannot be found in both responses)
- Ensure that the operation to save the product and child allocations are **atomic** in nature

### Testing and logging:

- Implement unit tests in the `index.test.ts`
- Implement structured logging wherever applicable (refer to `logger.ts`)

### Submission Guidelines:

- Once the implementation is complete, please zip the entire project directory and upload it to a Google Drive folder shared with the email address provided above.
