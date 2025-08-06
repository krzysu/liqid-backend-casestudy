# Manual tests:

## 1. Start the dataX mock API server (in one terminal)

npm run datax

## 2. Start the backend API server (in another terminal)

npm run start

## 3. Test the sync endpoint - syncs data from dataX to database

curl -s http://localhost:4000/sync | jq

## 4. Test the products endpoint - get all products from database

curl -s http://localhost:4000/products | jq

## 5. View specific fields from products response

curl -s http://localhost:4000/products | jq '{ count: .count,
first_product: .products[0] }'
