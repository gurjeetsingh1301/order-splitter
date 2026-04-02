# Robo-Advisor Order Splitter API Documentation

Base URL: `http://localhost:3000/api/v1`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Create a new split order |
| `GET` | `/orders` | List all orders |
| `GET` | `/orders/:orderId` | Get a single order by ID |

---

## POST /orders

Creates a new order by splitting a portfolio allocation into individual stock orders. Execution date and status are determined by US market hours (America/New_York).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `portfolio` | `StockAllocation[]` | Yes | Non-empty array of stock allocations. Must sum to exactly 100%. |
| `totalAmount` | `number` | Yes | Total investment amount in USD. Must be positive. |
| `orderType` | `"BUY" \| "SELL"` | Yes | Order direction. |

#### StockAllocation Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticker` | `string` | Yes | Stock ticker symbol (e.g. `"AAPL"`). |
| `allocationPercent` | `number` | Yes | Percentage of total amount to allocate. Must be positive. |
| `marketPrice` | `number` | No | Current price per share. Defaults to `$100` if omitted. |

### Example Request

```http
POST /api/v1/orders
Content-Type: application/json

{
  "portfolio": [
    { "ticker": "AAPL", "allocationPercent": 60 },
    { "ticker": "TSLA", "allocationPercent": 40, "marketPrice": 175.50 }
  ],
  "totalAmount": 100,
  "orderType": "BUY"
}
```

### Response — 201 Created

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | UUID identifying the order. |
| `orderType` | `"BUY" \| "SELL"` | Order direction. |
| `status` | `"EXECUTED" \| "SCHEDULED"` | `EXECUTED` if placed during market hours; `SCHEDULED` otherwise. |
| `totalAmount` | `number` | Total investment amount. |
| `executionDate` | `string` | ISO date (`YYYY-MM-DD`) in ET when the order executes. |
| `createdAt` | `string` | ISO 8601 timestamp when the order was created. |
| `stocks` | `StockOrder[]` | Per-stock breakdown. |

#### StockOrder Object

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | `string` | Stock ticker symbol. |
| `allocationPercent` | `number` | Percentage allocated to this stock. |
| `pricePerShare` | `number` | Price used for quantity calculation. |
| `amount` | `number` | Dollar amount allocated to this stock. |
| `quantity` | `number` | Number of shares (amount / pricePerShare, rounded to `DECIMAL_PLACES`). |

```json
{
  "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "orderType": "BUY",
  "status": "EXECUTED",
  "totalAmount": 100,
  "executionDate": "2026-04-01",
  "createdAt": "2026-04-01T14:30:00.000Z",
  "stocks": [
    {
      "ticker": "AAPL",
      "allocationPercent": 60,
      "pricePerShare": 100,
      "amount": 60,
      "quantity": 0.6
    },
    {
      "ticker": "TSLA",
      "allocationPercent": 40,
      "pricePerShare": 175.50,
      "amount": 40,
      "quantity": 0.228
    }
  ]
}
```

### Response — 400 Bad Request

Returned when validation fails (missing fields, allocations not summing to 100, non-positive amount, etc.).

```json
{
  "error": "Validation failed",
  "details": [
    "Allocation percentages must sum to exactly 100"
  ]
}
```

---

## GET /orders

Returns a list of all stored orders. Optionally filter by order type.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderType` | `"BUY" \| "SELL"` | No | Filter results to only BUY or SELL orders. |

### Example Requests

```http
GET /api/v1/orders
GET /api/v1/orders?orderType=BUY
GET /api/v1/orders?orderType=SELL
```

### Response — 200 OK

Returns an array of `OrderResponse` objects (same shape as POST response). Returns `[]` if no orders exist.

```json
[
  {
    "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "orderType": "BUY",
    "status": "EXECUTED",
    "totalAmount": 100,
    "executionDate": "2026-04-01",
    "createdAt": "2026-04-01T14:30:00.000Z",
    "stocks": [...]
  }
]
```

---

## GET /orders/:orderId

Retrieves a single order by its UUID.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string` | UUID of the order to retrieve. |

### Example Request

```http
GET /api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### Response — 200 OK

Returns the matching `OrderResponse` object.

```json
{
  "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "orderType": "BUY",
  "status": "EXECUTED",
  "totalAmount": 100,
  "executionDate": "2026-04-01",
  "createdAt": "2026-04-01T14:30:00.000Z",
  "stocks": [...]
}
```

### Response — 404 Not Found

```json
{
  "error": "Order not found"
}
```

---

## Status Logic

Order `status` and `executionDate` are determined by the current time in **America/New_York (ET)**:

| Condition | Status | Execution Date |
|-----------|--------|----------------|
| Weekday, 9:30 AM – 4:00 PM ET | `EXECUTED` | Today |
| Weekday, before 9:30 AM ET | `SCHEDULED` | Today (executes at market open) |
| Weekday, after 4:00 PM ET (Mon–Thu) | `SCHEDULED` | Next day |
| Friday, after 4:00 PM ET | `SCHEDULED` | Next Monday |
| Saturday | `SCHEDULED` | Next Monday |
| Sunday | `SCHEDULED` | Next Monday |

> US market holidays are not accounted for.

---

## Amount Splitting

- Each stock's `amount = floor(totalAmount * allocationPercent / 100, 2 decimal places)`
- The **last stock** in the portfolio absorbs any remainder so all amounts sum exactly to `totalAmount`
- Share `quantity = round(amount / pricePerShare, DECIMAL_PLACES)` — configurable via `DECIMAL_PLACES` env var (default: `3`)

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error — see `details` array |
| `404` | Order not found |
| `500` | Internal server error |

---

## cURL Examples

```bash
# Create a BUY order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "allocationPercent": 60 },
      { "ticker": "TSLA", "allocationPercent": 40, "marketPrice": 175.50 }
    ],
    "totalAmount": 100,
    "orderType": "BUY"
  }'

# List all orders
curl http://localhost:3000/api/v1/orders

# List only SELL orders
curl "http://localhost:3000/api/v1/orders?orderType=SELL"

# Get order by ID
curl http://localhost:3000/api/v1/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479
```
