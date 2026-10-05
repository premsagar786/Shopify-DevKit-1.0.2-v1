# Shopify Functions: build and review reference

Use this reference only when a Function build, deployment, or production run needs diagnosis. Shopify Functions and their schemas evolve with the API version, so treat the installed Shopify CLI template and the target's versioned Shopify documentation as the source of truth.

## Current Rust build baseline

- Keep the Rust source and dependency versions produced by the installed Shopify CLI.
- Current Rust templates build for `wasm32-unknown-unknown` with `cargo build --target=wasm32-unknown-unknown --release`.
- Do not add `cargo-wasi`, `wasm32-wasi`, or legacy `generate_types!` / `shopify_function_target` macros to a current project. They are from retired templates.
- Shopify Functions compiled Wasm modules must be below 256 kB. Shopify CLI optimizes current modules during app builds; always run `shopify app build` before release.

## Design rules

1. Select only the GraphQL input fields used by the function. Fewer fields reduce work and make logs easier to inspect.
2. Return a valid no-op result for absent configuration, empty carts, and malformed merchant-provided JSON.
3. Keep output bounded. Do not create one operation or target per unbounded cart item without a deliberate cap.
4. Use the generated target and output types. Do not reuse examples from a different Function API or API version.
5. Treat Function networking as capability-specific. Do not add outbound calls unless the selected API and app configuration explicitly support them.

## Local verification

```bash
shopify app function typegen
shopify app build
shopify app function run --input tests/sample-input.json
```

Use a fixture for every meaningful rule path, then test the built app against a development store before publishing. Inspect function logs from `shopify app dev` when behavior differs from the fixture.

## Version pinning

`api_version` in `shopify.extension.toml` must be a released version and match the generated schema. Update it deliberately, regenerate types, build, and review the Shopify developer changelog before deployment. Never use `latest`, `unstable`, or an expired API version in a release.
