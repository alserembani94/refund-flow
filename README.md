# Welcome to my Refund Flow App

## Introduction
This is a part of the assignment to create a refund flow. The requirements are to develop a single-page app for simulating a refund flow.

## Models
These are the models used in the code. You can also refer to `/src/types` for all models.

```ts
// This is an assumption that items are listed on the client side
type Item = {
  name: string;
  unit_price: number;
};

type 
```

## API Endpoints
In general, there are 3 endpoints, in which is simulated through `/src/api`:

1. `GET /orders`

The specs are as follows:
```
Method: GET
Path: /orders
Response: {
  order_id: string;
  status: "completed" | "refunded";
  created_at: string;
}
```

2. `GET /orders/:id`
The specs are as follows:
```
Method: GET
Path: /orders/:id
Response: {
  order_id: string;
  status: OrderStatus;
  staff_id: string;
  currency: Currency;
  delivery_fee: number;
  delivery_fee_status: PaymentStatus;
  created_at: string;
  items: Line[];
}