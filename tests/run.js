#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const HOOK = path.join(__dirname, "..", "hooks", "session-start.js");
const POST_TOOL_HOOK = path.join(__dirname, "..", "hooks", "post-tool-use.js");
const FIXTURES = path.join(__dirname, "fixtures");

const names = fs.readdirSync(FIXTURES).filter(n =>
  fs.statSync(path.join(FIXTURES, n)).isDirectory()
);

let pass = 0, fail = 0;
for (const name of names) {
  const cwd = path.join(FIXTURES, name);
  const expPath = path.join(cwd, ".expected-context");
  const expected = fs.existsSync(expPath) ? fs.readFileSync(expPath, "utf8").trim() : null;

  let out = "";
  try {
    const result = spawnSync(process.execPath, [HOOK], { cwd, encoding: "utf8" });
    if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
    out = result.stdout;
  } catch (e) {
    console.log(`FAIL ${name}: hook crashed: ${e.message}`);
    fail++;
    continue;
  }

  const trimmed = out.trim();

  if (expected === "none") {
    if (trimmed === "") {
      console.log(`PASS ${name} (silent)`);
      pass++;
    } else {
      console.log(`FAIL ${name}: expected silent, got: ${trimmed.slice(0, 80)}`);
      fail++;
    }
    continue;
  }

  if (trimmed === "") {
    console.log(`FAIL ${name}: hook was silent but expected context`);
    fail++;
    continue;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const ctx = parsed.hookSpecificOutput && parsed.hookSpecificOutput.additionalContext;
    if (!ctx) {
      console.log(`FAIL ${name}: missing additionalContext`);
      fail++;
      continue;
    }
    if (expected && !ctx.includes(expected)) {
      console.log(`FAIL ${name}: expected context to contain "${expected}"`);
      console.log(`  actual: ${ctx.slice(0, 160)}`);
      fail++;
      continue;
    }
    console.log(`PASS ${name}`);
    pass++;
  } catch (e) {
    console.log(`FAIL ${name}: invalid JSON: ${e.message}`);
    fail++;
  }
}

const postToolCases = [
  {
    name: "post-tool build",
    input: { tool_name: "Bash", tool_input: { command: "shopify app build" }, tool_response: {} },
    expected: "inspect `dist/function.wasm` size",
  },
  {
    name: "post-tool failed Rust Wasm build",
    input: {
      tool_name: "Bash",
      tool_input: { command: "cargo build --target=wasm32-unknown-unknown --release" },
      tool_response: { stderr: "error: target not installed" },
    },
    expected: "rustup target add wasm32-unknown-unknown",
  },
  {
    name: "post-tool ignores unrelated commands",
    input: { tool_name: "Bash", tool_input: { command: "git status" }, tool_response: {} },
    expected: null,
  },
];

for (const test of postToolCases) {
  const result = spawnSync(process.execPath, [POST_TOOL_HOOK], {
    encoding: "utf8",
    input: JSON.stringify(test.input),
  });
  const output = result.stdout.trim();

  if (result.error || result.status !== 0) {
    console.log(`FAIL ${test.name}: hook crashed`);
    fail++;
    continue;
  }
  if (test.expected === null) {
    if (output === "") {
      console.log(`PASS ${test.name}`);
      pass++;
    } else {
      console.log(`FAIL ${test.name}: expected no output`);
      fail++;
    }
    continue;
  }
  try {
    const parsed = JSON.parse(output);
    const context = parsed.hookSpecificOutput && parsed.hookSpecificOutput.additionalContext;
    if (typeof context === "string" && context.includes(test.expected)) {
      console.log(`PASS ${test.name}`);
      pass++;
    } else {
      console.log(`FAIL ${test.name}: expected context containing "${test.expected}"`);
      fail++;
    }
  } catch (error) {
    console.log(`FAIL ${test.name}: invalid JSON: ${error.message}`);
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
