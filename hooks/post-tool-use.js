#!/usr/bin/env node
let input = "";
process.stdin.on("data", c => input += c);
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    if (data.tool_name !== "Bash") return process.exit(0);
    const cmd = (data.tool_input && data.tool_input.command) || "";
    const stderr = (data.tool_response && data.tool_response.stderr) || "";
    const stdout = (data.tool_response && data.tool_response.stdout) || "";
    const notes = [];

    if (/\bshopify\s+app\s+build\b/.test(cmd)) {
      notes.push("After `shopify app build`: inspect `dist/function.wasm` size. Shopify enforces a 128 KB input and output limit on function responses; the wasm itself can be larger, but keep bundles under 256 KB for cold-start reasons.");
    }
    if (/\bshopify\s+app\s+deploy\b/.test(cmd)) {
      notes.push("App deploy kicked off. Deploys are draft-first; version is created but not live until the user publishes it from the Partner Dashboard. Confirm in the dashboard before declaring success.");
    }
    if (/\bshopify\s+theme\s+push\b/.test(cmd)) {
      notes.push("Theme pushed. Before making it live, preview in Online Store admin. Run `/shopify-devkit:theme-audit ./` locally on the next iteration for performance and security regressions.");
    }
    if (/\bshopify\s+theme\s+dev\b/.test(cmd)) {
      notes.push("Theme dev server started. `/shopify-devkit:theme-audit ./` can be run in parallel to surface Liquid or accessibility issues while you iterate.");
    }
    if (/\bcargo\s+build\b/.test(cmd) && /wasm32-unknown-unknown/.test(cmd) && /error|failed/i.test(stderr + stdout)) {
      notes.push("Rust Wasm build failed. Confirm the current target is installed (`rustup target add wasm32-unknown-unknown`), keep the Shopify CLI-generated build block, and inspect the current `shopify_function` crate guidance. See `/shopify-devkit:doctor` for a quick environment check.");
    }

    if (notes.length > 0) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: notes.join("\n") }
      }));
    }
  } catch (e) {}
  process.exit(0);
});
