# Robo-Advisor Order Splitter API

REST API that acts as an order splitter for a robo-advisor. Given a model portfolio (stocks with allocation percentages) and a total investment amount, the API splits the order into individual stock orders, determines execution timing based on US market hours, and stores historic orders in memory.

## Tech Stack

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| TypeScript | 5.x | Type safety |
| Express | 4.x | HTTP framework |
| Zod | 3.x | Request validation with TS type inference |
| dotenv | 16.x | Environment variable loading |
| Vitest | 1.x | Unit & integration test runner |
| supertest | 6.x | HTTP integration testing |
| tsx | 4.x | Dev runner with hot reload |

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm test` | Run all tests |

## API Endpoints

### POST `/api/v1/orders`

Create a new order by splitting a portfolio.

**Request Body:**
```json
{
  "portfolio": [
    { "ticker": "AAPL", "allocationPercent": 60 },
    { "ticker": "TSLA", "allocationPercent": 40, "marketPrice": 175.50 }
  ],
  "totalAmount": 100,
  "orderType": "BUY"
}
```

**Response (201):**
```json
{
  "orderId": "uuid",
  "orderType": "BUY",
  "status": "EXECUTED",
  "totalAmount": 100,
  "executionDate": "2026-04-01",
  "createdAt": "2026-04-01T10:30:00.000Z",
  "stocks": [
    { "ticker": "AAPL", "allocationPercent": 60, "pricePerShare": 100, "amount": 60, "quantity": 0.600 },
    { "ticker": "TSLA", "allocationPercent": 40, "pricePerShare": 175.50, "amount": 40, "quantity": 0.228 }
  ]
}
```

### GET `/api/v1/orders`

List all orders. Optional `?orderType=BUY|SELL` filter.

### GET `/api/v1/orders/:orderId`

Get a single order by ID.

## Request Examples

```bash
# Create a BUY order (default $100 price per share)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "allocationPercent": 60 },
      { "ticker": "TSLA", "allocationPercent": 40 }
    ],
    "totalAmount": 100,
    "orderType": "BUY"
  }'

# Create a BUY order with custom market price
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "allocationPercent": 60, "marketPrice": 213.50 },
      { "ticker": "TSLA", "allocationPercent": 40, "marketPrice": 175.50 }
    ],
    "totalAmount": 1000,
    "orderType": "BUY"
  }'

# Create a SELL order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "allocationPercent": 100 }
    ],
    "totalAmount": 500,
    "orderType": "SELL"
  }'

# List all orders
curl http://localhost:3000/api/v1/orders

# List only BUY orders
curl "http://localhost:3000/api/v1/orders?orderType=BUY"

# Get a specific order by ID
curl http://localhost:3000/api/v1/orders/<orderId>
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DEFAULT_STOCK_PRICE` | `100` | Fallback price per share when `marketPrice` is not provided |
| `DECIMAL_PLACES` | `3` | Decimal precision for share quantities |

## Market Hours

Orders are scheduled based on US Eastern Time (America/New_York):

- **Weekday 9:30 AM - 4:00 PM ET**: `EXECUTED` (today)
- **Weekday before 9:30 AM ET**: `SCHEDULED` (today)
- **Weekday after 4:00 PM ET**: `SCHEDULED` (next trading day)
- **Saturday**: `SCHEDULED` (next Monday)
- **Sunday**: `SCHEDULED` (next Monday)

Note: US market holidays are not accounted for.
