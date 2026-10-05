# Changelog

All notable changes to this plugin are documented here.

The format is based on Keep a Changelog, and this plugin uses semantic versioning.

## [1.0.2] - 2026-07-28

### Changed

- Removed personal email addresses from the distributable manifest, privacy policy, and license.
- Reworked the README into a product guide with a Claude workflow diagram, macOS and Windows ZIP installation instructions, and a Docker validation snapshot.
- Updated Function and Checkout UI extension guidance to use Shopify API version `2026-07` for new scaffolds.
- Replaced retired Rust Function guidance (`cargo-wasi`, `wasm32-wasi`, and legacy macros) with a current CLI-first workflow and `wasm32-unknown-unknown` build target.

### Added

- PostToolUse hook test cases for a Shopify build, a failed current Rust Wasm build, and unrelated command silence.

## [1.0.1] - 2026-04-19

### Added

- `PRIVACY.md` with data-handling disclosure for marketplace submission (Claude Code, local hooks, GitHub hosting, Anthropic product terms).

## [1.0.0] - 2026-04-18

### Added

- Initial release.
- Skill `theme-init`: scaffold a Shopify Online Store 2.0 theme directory with config, layout, sections, snippets, templates, and blocks.
- Skill `liquid-section`: generate a Liquid section with settings schema, blocks, and presets.
- Skill `shopify-function`: scaffold a Shopify Function for product discount, cart transform, delivery customization, or payment customization, in Rust or JavaScript.
- Skill `checkout-ui-ext`: scaffold a checkout UI extension with extension.toml and a React entry point.
- Skill `theme-audit`: audit a theme for render-blocking Liquid, missing asset_url filters, XSS from unescaped output, oversized images, excessive sections, and missing form accessibility.
- Skill `admin-api-query`: generate idiomatic GraphQL queries and mutations for the Shopify Admin API with cursor pagination and fragments.
- Agent `liquid-author`: specialized Liquid template author.
- Agent `shopify-function-author`: specialized Shopify Functions author.
- Command `doctor`: real toolchain check. Reports Shopify CLI version, Node and npm versions, Rust and cargo versions, and whether the `wasm32-wasi` target is installed.
- Hook `session-start`: Node.js detector that inspects cwd for `shopify.app.toml`, `shopify.theme.toml`, the Online Store 2.0 theme layout, or subdirectories under `extensions/` containing `shopify.extension.toml`. Injects a one-line context note so Claude knows which skills apply.
- Command `dev`: starts `shopify app dev` with port-conflict recovery, tunnel URL extraction, and common first-run failure hints.
- Hook `post-tool-use`: PostToolUse hook that reacts to `shopify app build`, `shopify app deploy`, `shopify theme push`, and `cargo wasi build` with a short follow-up note covering wasm size limits, draft-first deploy flow, and common Rust build failures.
- Tests: `tests/run.js` with fixture directories that invoke the SessionStart hook against synthetic cwds and assert expected output.
- CI: `.github/workflows/validate.yml` runs required-file checks, plugin.json parse, skill/agent/command frontmatter, hook script syntax, em-dash scan, and the hook fixture tests on every push and PR.
- Reference file `reference/function-api-limits.md`: documents Shopify Function runtime constraints (128 KB input/output, 5 ms billed time, 11 M fuel, no network, allowed and blocked APIs per language, input query and output schema rules). Read by `shopify-function` on-demand only.
- Command `full-audit`: opt-in workflow command that chains doctor, theme-audit, and extension-toml checks into one combined report. Read-only.
