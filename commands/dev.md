---
description: Start the Shopify app dev server with automatic port-conflict recovery and a reminder about tunnel URLs. Runs `shopify app dev` and watches for common first-run failures (port in use, unlinked app, missing CLI).
argument-hint: "[--port <n>]"
allowed-tools: Bash(shopify app dev *) Bash(shopify app info *) Bash(shopify version *) Bash(netstat *) Bash(lsof *) Read
---

# Start the Shopify app dev server

Run `shopify app dev`, handle the common first-run failures, and surface the preview URL once it prints.

## Inputs

`$ARGUMENTS` can include `--port <n>` to override the default port (9292 for apps, 9293 for theme).

## Pre-flight

1. Confirm Shopify CLI is installed:

```bash
shopify version 2>&1
```

If missing, stop and suggest `npm install -g @shopify/cli @shopify/theme`. Do not proceed.

2. Confirm the cwd is a Shopify app root. Read `shopify.app.toml`:

If the file is missing, stop and suggest running this command from the app root, or running `shopify app init` first.

3. Show the current app config so the user confirms which store they are about to bind to:

```bash
shopify app info 2>&1 | head -20
```

## Run

```bash
shopify app dev
```

If the user passed `--port <n>`, add that flag.

## Watch for common failures

- **Port already in use**: CLI prints `Error: Port 9292 is already in use`. The fix is either to stop whatever is on that port or pass `--port 9294`. On Linux or macOS, show what is holding the port:
  ```bash
  lsof -i :9292 2>&1
  ```
  On Windows:
  ```bash
  netstat -ano | findstr :9292
  ```

- **App not linked to a Partner org**: CLI prints `No apps found for the current account`. Suggest `shopify auth logout` then re-run.

- **Tunnel URL not printed within 60s**: the Cloudflare tunnel can be slow. Tell the user to be patient and try `shopify app dev --tunnel-url <custom>` if they have a stable tunnel already running.

## On success

Extract the preview URL from the CLI output (look for `Preview URL:` or `App URL:` lines) and print:

```
Shopify app dev is running.
Preview URL:  <url>
Install URL:  <url>

Next:
- Open the preview URL in a browser logged into the dev store.
- `/shopify-devkit:theme-audit ./` can be run in parallel for Liquid and accessibility issues.
- Press Ctrl+C in the dev terminal to stop.
```

## Do not

- Do not run `shopify app deploy` or any publish-level command. This is for local dev only.
- Do not print the Shopify access token. The CLI may log it to the terminal; if it appears, warn the user and do not echo it back.
- Do not kill processes holding a port without user confirmation. Report the PID and command and let the user decide.
