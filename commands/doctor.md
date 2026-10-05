---
description: Check the local Shopify toolchain. Reports Shopify CLI version, Node version, npm version, and the current Rust WebAssembly target if Rust is installed. Use before scaffolding a function or running a theme audit to confirm the environment is ready.
allowed-tools: Bash(shopify version *) Bash(node --version *) Bash(npm --version *) Bash(rustc --version *) Bash(rustup target list *) Bash(cargo --version *)
---

# Shopify environment check

Run a fixed diagnostic of the local Shopify and related toolchains.

## Steps

1. Shopify CLI installed:

```bash
shopify version 2>&1
```

If missing, report and suggest `npm install -g @shopify/cli @shopify/theme`. The plugin's theme and app skills scaffold files but need the CLI to build and deploy.

2. Node and npm (required for checkout UI extensions and JavaScript functions):

```bash
node --version 2>&1
npm --version 2>&1
```

Report the versions. Require Node 20.12 or later for the JavaScript function and checkout UI extension workflows.

3. Rust and cargo (only needed for Rust Shopify Functions):

```bash
rustc --version 2>&1
cargo --version 2>&1
```

4. Rust WebAssembly target installed (only if rustup is available):

```bash
rustup target list --installed 2>&1 | grep -E "wasm32-unknown-unknown" 2>&1
```

If Rust is installed but `wasm32-unknown-unknown` is not listed, tell the user: `rustup target add wasm32-unknown-unknown`.

## Output format

```
Shopify environment
-------------------
Shopify CLI:      3.63.1
Node:             v20.14.0
npm:              10.8.1
Rust:             1.76.0 (optional)
cargo:            1.76.0 (optional)
wasm32-unknown-unknown: installed (optional, needed for current Rust Functions templates)

Next steps: environment looks healthy. Try:
- /shopify-devkit:theme-init <handle>
- /shopify-devkit:shopify-function product-discount rust
- /shopify-devkit:theme-audit ./
```

If something is missing, print the exact error line and a one-line fix hint.

## Do not

- Do not print Shopify access tokens, admin API keys, or `.env` values.
- Do not install any tool automatically. Report what is missing and the install command; let the user decide.
- Do not run `shopify app deploy` or any deploy subcommand. This command is read-only.
