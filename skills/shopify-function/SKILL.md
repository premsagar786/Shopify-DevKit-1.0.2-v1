---
name: shopify-function
description: Scaffold a Shopify Function (product discount, cart transform, delivery customization, or payment customization) in Rust or JavaScript. Generates shopify.extension.toml, the input GraphQL query, and the run entry point. Use when the user asks to create a Shopify Function, a product discount function, a cart transform, a delivery customization, or a payment customization.
argument-hint: "[type] [language]"
allowed-tools: Read Write Edit Glob Bash(shopify app generate extension *) Bash(shopify app function typegen *) Bash(shopify app build *)
---

# Scaffold a Shopify Function

Create a Shopify Function extension from the installed Shopify CLI template, then make the requested implementation in its `shopify.extension.toml`, input GraphQL query, and source entry point. The CLI template is the source of truth for package versions, target names, and generated type bindings.

## Inputs

`$ARGUMENTS` takes an optional type and language: `<type> <language>`.

- Types: `product-discount`, `cart-transform`, `delivery-customization`, `payment-customization`.
- Languages: `rust` or `javascript`.

## Workflow

1. If type is missing, ask: "What type of Shopify Function do you want: product discount, cart transform, delivery customization, or payment customization?"
2. If language is missing, ask: "Rust or JavaScript?"
3. Confirm the parent Shopify app directory. Functions live under `extensions/<function-name>/`.
4. Ask for a function handle in kebab-case (for example `volume-discount`).
5. Confirm before running the Shopify CLI generator. From the app root, run `shopify app generate extension`, choose the requested Function API and language, and use the requested handle. Never overwrite an existing extension directory.
6. Read the generated `shopify.extension.toml`, `Cargo.toml` or `package.json`, input query, and source files before editing. Keep their package versions and build configuration unless the installed CLI has generated an invalid file.
7. Announce each requested file change. Fetch only the GraphQL fields used by the implementation, write the no-op result explicitly, and keep the generated target/export names intact.
8. Run `shopify app function typegen` and `shopify app build` only after the user approves the generated writes. Report build errors without deploying.

## shopify.extension.toml (shared)

```toml
api_version = "2026-07"

[[extensions]]
name = "Volume discount"
handle = "volume-discount"
type = "function"

  [[extensions.targeting]]
  target = "purchase.product-discount.run"
  input_query = "src/run.graphql"
  export = "run"

  [extensions.build]
  command = "cargo build --target=wasm32-unknown-unknown --release"
  path = "target/wasm32-unknown-unknown/release/volume_discount.wasm"
  watch = ["src/**/*.rs"]

  [extensions.ui.paths]
  create = "/products"
  details = "/products"
```

Replace the `target` line per function type:

- Product discount: `purchase.product-discount.run`
- Cart transform: `cart.transform.run`
- Delivery customization: `purchase.delivery-customization.run`
- Payment customization: `purchase.payment-customization.run`

For JavaScript, replace the build block with:

```toml
  [extensions.build]
  command = "npm run build"
  path = "dist/function.wasm"
  watch = ["src/**/*.js"]
```

## Input query: `src/run.graphql`

Product discount:

```graphql
query RunInput {
  cart {
    lines {
      id
      quantity
      merchandise {
        __typename
        ... on ProductVariant {
          id
          product {
            id
          }
        }
      }
    }
  }
  discountNode {
    metafield(namespace: "volume_discount", key: "config") {
      value
    }
  }
}
```

Cart transform:

```graphql
query RunInput {
  cart {
    lines {
      id
      quantity
      merchandise {
        __typename
        ... on ProductVariant {
          id
          product {
            id
          }
        }
      }
    }
  }
}
```

Delivery customization:

```graphql
query RunInput {
  cart {
    deliveryGroups {
      id
      deliveryOptions {
        handle
        title
      }
    }
    deliveryAddress {
      countryCode
      provinceCode
      zip
    }
  }
}
```

Payment customization:

```graphql
query RunInput {
  cart {
    cost {
      totalAmount {
        amount
        currencyCode
      }
    }
    paymentMethods {
      id
      name
    }
  }
}
```

## Rust implementation contract

Use the Rust source and `Cargo.toml` emitted by the current Shopify CLI. Do not replace it with the retired `generate_types!` / `shopify_function_target` API. Current templates use the `shopify_function` 1.x-or-later type-generation and entrypoint macros. If the generated source targets an older crate or the app is being migrated, stop and use Shopify's current migration guide before changing logic.

For a current Rust template, the function module is built with `cargo build --target=wasm32-unknown-unknown --release`; `cargo-wasi` and the `wasm32-wasi` target are retired for current Rust toolchains. The Shopify CLI optimizes the Wasm module during app builds.

## Example JavaScript entry: `src/run.js`

```javascript
import { DiscountApplicationStrategy } from "../generated/api";

const NO_DISCOUNT = {
  discounts: [],
  discountApplicationStrategy: DiscountApplicationStrategy.First,
};

export function run(input) {
  const configValue = input.discountNode?.metafield?.value ?? "{}";
  let config;
  try {
    config = JSON.parse(configValue);
  } catch {
    config = {};
  }
  const minQuantity = Number.isFinite(config.minQuantity) ? config.minQuantity : 3;
  const percentage = Number.isFinite(config.percentage) ? config.percentage : 10;

  const targets = input.cart.lines
    .filter((line) => line.quantity >= minQuantity)
    .filter((line) => line.merchandise.__typename === "ProductVariant")
    .map((line) => ({
      productVariant: {
        id: line.merchandise.id,
      },
    }));

  if (targets.length === 0) return NO_DISCOUNT;

  return {
    discounts: [
      {
        message: `${percentage}% volume discount`,
        targets,
        value: { percentage: { value: percentage } },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
```

## package.json for JavaScript

```json
{
  "name": "volume-discount",
  "version": "0.1.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "src/run.js",
  "scripts": {
    "shopify": "npm exec -- shopify",
    "typegen": "npm exec -- shopify app function typegen",
    "build": "npm exec -- shopify-function-javy-build src/run.js -o dist/function.wasm",
    "preview": "npm exec -- shopify app function run"
  },
  "devDependencies": {
    "@shopify/shopify_function": "1.0.1",
    "javy-cli": "0.1.2"
  }
}
```

The build is a two-step process managed by the Shopify CLI. When you run `shopify app build` at the app root, the CLI invokes javy for each JavaScript function and writes `dist/function.wasm`. The local `build` script above is only for running the compile step outside the CLI. Keep the `shopify` script so you can call any Shopify CLI subcommand through the function's own package.

## Build and deploy commands

Generate the input and output types first. Running `shopify app function typegen` produces `schema.graphql` at the extension root and the `generated/` directory of typed bindings that both the Rust macro and the JavaScript import path rely on. Without it, the build fails with "schema.graphql not found" or a missing module error on `../generated/api`.

For Rust, install the current Wasm target once:

```bash
rustup target add wasm32-unknown-unknown
```

For every language, from the app root:

```bash
shopify app function typegen
shopify app build
shopify app deploy
```

## Reference

When debugging a function that was rejected, throttled, or truncated in production, consult `reference/function-api-limits.md` in the plugin root. It documents the current package and build guidance plus input/output, sandbox, and schema considerations. Read on-demand only when a function misbehaves.

## Do not

- Do not use `api_version = "latest"`. Pin a specific API version.
- Do not put business logic in the input query. Fetch only the fields the function needs. Shopify enforces a 128 KB output limit and logs every over-limit call.
- Do not call external HTTP endpoints from a function. Functions run in a sandbox with no network access.
- Do not commit `generated/` directories or `target/` builds.
