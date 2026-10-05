#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();

function has(rel) {
  try { return fs.existsSync(path.join(cwd, rel)); } catch { return false; }
}
function isDir(rel) {
  try { return fs.statSync(path.join(cwd, rel)).isDirectory(); } catch { return false; }
}

const findings = [];

if (has("shopify.app.toml")) {
  findings.push("- Shopify app detected (shopify.app.toml). Use `/shopify-devkit:shopify-function <type> <lang>` to scaffold a function extension or `/shopify-devkit:checkout-ui-ext` for a checkout UI extension.");
}

if (has("shopify.theme.toml")) {
  findings.push("- Shopify theme config detected. Use `/shopify-devkit:liquid-section <name>` to add a section or `/shopify-devkit:theme-audit ./` to scan for issues.");
}

if (isDir("sections") && isDir("snippets") && isDir("templates")) {
  findings.push("- Online Store 2.0 theme layout detected (sections, snippets, templates). Use `/shopify-devkit:theme-audit ./` for a performance and security review.");
}

if (isDir("extensions")) {
  try {
    const subs = fs.readdirSync(path.join(cwd, "extensions"))
      .filter(d => { try { return fs.statSync(path.join(cwd, "extensions", d)).isDirectory(); } catch { return false; } });
    const fns = subs.filter(d => has(path.join("extensions", d, "shopify.extension.toml")));
    if (fns.length > 0) {
      findings.push("- " + fns.length + " extension(s) under ./extensions. Use `/shopify-devkit:shopify-function` to scaffold another or audit existing ones.");
    }
  } catch {}
}

if (has("hydrogen.config.js") || has("hydrogen.config.ts")) {
  findings.push("- Hydrogen storefront config detected. Theme and function skills still apply, but Hydrogen-specific storefront work is not covered by this plugin's version 1.0 scope.");
}

if (findings.length > 0) {
  const text = [
    "Shopify DevKit plugin is active. Detected in " + cwd + ":",
    findings.join("\n"),
    "Run `/shopify-devkit:doctor` to check that shopify CLI, node, and the Rust wasm32-unknown-unknown target are installed."
  ].join("\n\n");
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: text
    }
  }));
}
process.exit(0);
