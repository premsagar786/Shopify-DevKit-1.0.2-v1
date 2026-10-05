---
description: Run the full Shopify theme and app audit pass in one command. Chains doctor and theme-audit, plus checks app config if `shopify.app.toml` is present. Use before deploying a theme update or publishing an app version.
argument-hint: "[theme-or-app-dir]"
allowed-tools: Bash(shopify version *) Bash(node --version *) Bash(npm --version *) Bash(rustc --version *) Bash(cargo --version *) Bash(rustup target list *) Read Glob Grep
---

# Full Shopify audit

Run the plugin's audit-flavored skills in sequence and produce one combined report. This is the "do everything" command. Use only when explicitly asked.

## Inputs

`$ARGUMENTS` takes an optional path to a theme or app directory. Defaults to cwd.

## Workflow

Run each step. If a step fails, note it and continue.

### Step 1: Environment check (from `doctor`)

Same as `/shopify-devkit:doctor`. Report Shopify CLI, Node, npm, Rust, and the `wasm32-unknown-unknown` target.

### Step 2: Detect what is in cwd

Check for:

- `shopify.app.toml` -> app root
- `shopify.theme.toml` OR (`sections/` + `snippets/` + `templates/`) -> theme
- `extensions/` directory with `shopify.extension.toml` entries -> function or checkout extensions

### Step 3: Theme audit (from `theme-audit`), if theme

Same as `/shopify-devkit:theme-audit ./`. Report render-blocking Liquid, missing `asset_url`, unescaped output, oversized images, excessive sections, missing form accessibility.

### Step 4: App extension audit, if extensions present

For each `extensions/<handle>/`:

- Confirm `shopify.extension.toml` has a pinned `api_version` (not `"latest"`).
- For function extensions, read `src/run.graphql` (if present) and check input query size (each extra field costs bytes toward the 128 KB limit). Reference `reference/function-api-limits.md` if needed.
- For checkout UI extensions, confirm `extension.toml` targets are pinned.

## Output format

```
Shopify full audit
==================
Detected in <cwd>:
- App root (shopify.app.toml)
- Theme (sections/, snippets/, templates/)
- 2 extensions: volume-discount (function, Rust), upsell-banner (checkout UI)

Environment
-----------
Shopify CLI:      3.63.1
Node:             20.14.0
Rust + wasm32-unknown-unknown: installed

Theme audit
===========
Findings (5):
- sections/header.liquid: inline <script> without defer (blocks render)
- snippets/image.liquid: missing asset_url filter on 3 image references (line 12, 28, 45)
- sections/product-gallery.liquid: 8 sections rendered per page (Shopify recommends under 25)
- templates/product.liquid: unescaped {{ product.description }} (should be {{ product.description | escape }})
- Form in sections/contact.liquid: missing aria-label on input[name=email]

App and extensions audit
========================
volume-discount:
- api_version = "2026-07" (pinned, ok)
- input query fetches 6 fields (well under 128 KB limit, ok)

upsell-banner:
- api_version = "latest" (FAIL: must be pinned)
- targets include "purchase.checkout.block.render" (pinned, ok)

Suggested next steps
--------------------
1. Fix api_version in extensions/upsell-banner/shopify.extension.toml (change "latest" to the app's current pinned API version, for example "2026-07").
2. Escape {{ product.description }} in templates/product.liquid.
3. Add `defer` to the script tag in sections/header.liquid.

Reference
---------
For Function runtime rules and API limits, see `reference/function-api-limits.md`.
```

## Do not

- Do not run `shopify app deploy`, `shopify theme push`, or any publish command.
- Do not download or modify a theme from a live store.
- Do not include the full output of each skill. Keep the combined report under 80 lines.
- Do not audit generated artifacts (`dist/`, `.wasm`, `node_modules/`).
