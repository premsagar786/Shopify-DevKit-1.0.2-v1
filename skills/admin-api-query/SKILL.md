---
name: admin-api-query
description: Generate an idiomatic Shopify Admin API GraphQL query or mutation with cursor pagination, fragments, and the correct permissions. Use when the user asks to query the Admin API, list products or orders, build a GraphQL query for Shopify, or write a mutation to update shop data.
argument-hint: "[operation description]"
allowed-tools: Read Write Grep Glob
---

# Generate a Shopify Admin API GraphQL query or mutation

Produce an Admin API GraphQL operation that follows Shopify's style: typed variables, cursor-based pagination with `pageInfo`, reusable fragments, and the minimum required set of fields. The operation targets the pinned API version configured by the app; for a new scaffold, use `2026-07`.

## Inputs

`$ARGUMENTS` is a plain-English description of the operation. Example: `list the first 50 products with their variants` or `update a product's status to draft`.

## Workflow

1. Read the description. Decide whether the operation is a query or a mutation.
2. Identify the entity and the fields the user actually needs. Ask if the description is ambiguous.
3. Pick the correct scope permissions. Print them at the top of the output as a comment. Do not omit this step, because operations fail without the right scopes.
4. Write the operation to a file if the user asks. Default to `graphql/<operation-name>.graphql` relative to the current directory. Announce the write first.
5. Print a usage example with `curl` against the app's pinned Admin API path. Use `/admin/api/2026-07/graphql.json` only when scaffolding a new app that has not selected a version.

## Style rules

1. Operations are named. Use PascalCase matching the operation purpose: `ListProducts`, `UpdateProductStatus`.
2. Variables are typed and required where the field requires them. Use `$first: Int!` not `$first: Int`.
3. Pagination uses `first`/`after` with a `pageInfo { hasNextPage endCursor }` block. Never use `offset` or `page` parameters on connections.
4. Break reusable field sets into fragments. Keep the main operation readable.
5. Request `userErrors { field message }` on every mutation. Skipping it hides partial failures.
6. Never request `__typename` unless the operation needs it. It adds bytes and a pointless leaf field.

## Example: list products with variants

Required access scope: `read_products`.

```graphql
# scope: read_products

query ListProducts($first: Int!, $after: String, $query: String) {
  products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        ...ProductSummary
        variants(first: 50) {
          edges {
            node {
              ...VariantSummary
            }
          }
        }
      }
    }
  }
}

fragment ProductSummary on Product {
  id
  handle
  title
  status
  vendor
  productType
  totalInventory
  updatedAt
  featuredImage {
    url(transform: { maxWidth: 600 })
    altText
  }
}

fragment VariantSummary on ProductVariant {
  id
  sku
  title
  price
  compareAtPrice
  inventoryQuantity
  selectedOptions {
    name
    value
  }
}
```

Variables:

```json
{
  "first": 50,
  "after": null,
  "query": "status:active"
}
```

## Example: update a product's status

Required access scope: `write_products`.

```graphql
# scope: write_products

mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
  productUpdate(input: { id: $id, status: $status }) {
    product {
      id
      handle
      status
      updatedAt
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:

```json
{
  "id": "gid://shopify/Product/1234567890",
  "status": "DRAFT"
}
```

## Example: bulk query for large result sets

Use a bulk operation when the result set is over a few thousand records. Bulk operations run on Shopify's side and return a downloadable JSONL file.

Required access scope: `read_orders` for the example below.

```graphql
# scope: read_orders

mutation StartOrderExport {
  bulkOperationRunQuery(
    query: """
      {
        orders {
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { id email }
              lineItems {
                edges {
                  node {
                    id
                    title
                    quantity
                    variant { id sku }
                  }
                }
              }
            }
          }
        }
      }
    """
  ) {
    bulkOperation {
      id
      status
      createdAt
    }
    userErrors {
      field
      message
    }
  }
}
```

Poll with:

```graphql
query PollBulkOperation {
  currentBulkOperation {
    id
    status
    errorCode
    objectCount
    url
    partialDataUrl
    completedAt
  }
}
```

## Usage with curl

```bash
curl -s -X POST "https://$SHOP_DOMAIN/admin/api/2026-07/graphql.json" \
  -H "X-Shopify-Access-Token: $SHOPIFY_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "query": "query ListProducts($first: Int!, $after: String) { products(first: $first, after: $after) { pageInfo { hasNextPage endCursor } edges { node { id title handle } } } }",
  "variables": { "first": 10, "after": null }
}
JSON
```

Never print the value of `$SHOPIFY_ADMIN_TOKEN` into the conversation.

## Cost and throttle checklist

The Admin API charges a "cost" per operation. Every response includes an `extensions.cost` block.

1. Queries that return connections cost `2 + (first * child_cost)`. Keep `first` under 50 unless the result needs more.
2. The rate limit is 1000 cost points per 60 seconds for standard plans. Check `extensions.cost.throttleStatus.currentlyAvailable` and sleep when it drops below 100.
3. Bulk operations do not count against the rate limit. Prefer them for exports over 1000 rows.

## Do not

- Do not request `nodes` and `edges` together on the same connection. Pick one.
- Do not embed shop-scoped IDs directly in the query. Pass them as variables.
- Do not skip `userErrors` on any mutation. A mutation can return `product: null` with validation errors that are only visible in `userErrors`.
- Do not use deprecated fields. Check the Admin API change log for the target version before recommending a field.
