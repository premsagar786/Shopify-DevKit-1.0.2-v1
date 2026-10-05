---
name: theme-audit
description: Audit a Shopify theme for render-blocking Liquid, missing asset_url filters, direct output of user data without escape, oversized image uploads, excessive section count, and missing accessibility attributes on forms. Use when the user asks to audit a theme, review a theme for performance or security, find Liquid issues, or check a theme before deploying.
argument-hint: "[theme-path]"
allowed-tools: Read Grep Glob
---

# Audit a Shopify theme

Scan a theme directory and report performance, security, and accessibility issues with file paths, line numbers, and concrete fixes. This skill is read-only. It never modifies theme files.

## Inputs

`$ARGUMENTS` is an optional theme path. Default to the current working directory if the user runs the audit from inside a theme repo.

## Detection steps

1. Confirm the path contains a theme. Use Glob for `config/settings_schema.json`. If missing, ask the user for the correct path.
2. Run the six checks below. Each check uses Grep with a specific pattern. Collect file paths and line numbers.
3. Produce the report in the format described at the bottom.

## Check 1: render-blocking Liquid

Patterns that block page render:

- Synchronous asset tags in `layout/theme.liquid` without `async` or `defer`.
- Inline scripts inside sections that block parsing.
- `content_for_header` placed after page content.

Two-pass approach. The default ripgrep build used by Grep does not support lookahead, so match broadly then filter.

1. Find every external script tag in `layout/*.liquid`:
   - pattern: `<script\b[^>]*src=`
   - glob: `layout/*.liquid`
   - read the full line. Flag as render-blocking if it contains neither `defer` nor `async` nor `type="module"`.
2. Find inline scripts inside sections:
   - pattern: `<script\b(?:(?!src=).)*>`  can be written as the simpler `<script[^>]*>` and then filter lines that have no `src=` attribute.
   - glob: `sections/*.liquid`
   - ignore matches whose line contains `type="application/ld+json"` since these are SEO data blocks, not executable code.

Report entries in this check must include the exact script tag and recommend `defer` or moving the script to `assets/` and referencing it from `layout/theme.liquid` with `| asset_url | script_tag`.

## Check 2: missing asset_url filters

Any reference to a file in `/assets/` must pass through `asset_url`, `stylesheet_tag`, `script_tag`, `image_url`, `img_url`, or `file_url`. Hardcoded paths bypass the CDN and break staging.

Patterns (run with Grep, glob `**/*.liquid`):

- `['"]/assets/[^'"]+['"]`  matches quoted hardcoded asset paths.
- `src=['"]/cdn/shop/`  matches direct CDN URLs that should use a filter instead.

For each match, read the surrounding line. Ignore matches inside a Liquid comment (`{% comment %}` ... `{% endcomment %}`). Report entries must show the hardcoded path and recommend the filter replacement, for example `{{ 'theme.css' | asset_url }}`.

## Check 3: direct output of user data without escape (XSS)

Any Liquid output of a variable that can contain user input must pass through `escape` or be rendered inside a safe HTML attribute with `escape`.

High-risk variables:

- `customer.*`, `order.note`, `line_item.properties[*]`, `cart.note`, `product.metafields.*`.
- `block.settings.text`, `section.settings.text` if the field is a `text` or `textarea` (a `richtext` field is sanitized by Shopify).

Pattern (run with Grep, glob `**/*.liquid`):

- `\{\{\s*(customer|order|cart\.note|line_item\.properties)`

For each match, read the full line or Liquid output tag. Flag the finding when the output does not contain `| escape`, `| json`, `| url_encode`, or `| escape_once`. Ignore matches that are inside HTML attribute values already bounded by `| escape`.

Also audit `{{ block.settings.<key> }}` and `{{ section.settings.<key> }}`. For each such match:

1. Read the sibling `{% schema %}` block in the same file.
2. Find the settings entry whose `id` equals `<key>`.
3. If its `type` is `text` or `textarea` and the output has no escape filter, flag it.
4. If its `type` is `richtext`, `inline_richtext`, or `html`, skip it. Shopify sanitizes rich text.

## Check 4: oversized image uploads

Look for image filters called without a width or with a width over 3000. Shopify serves up to 5760 pixels, but most storefronts only need 2000.

Patterns (run with Grep, glob `**/*.liquid`):

- `\|\s*image_url\b`  find every `image_url` call; then filter matches where the same filter chain does not contain `width:` at all.
- `\|\s*image_url:\s*width:\s*([3-9][0-9]{3}|[0-9]{5,})`  matches widths of 3000 or larger.
- `\|\s*img_url:\s*['"]master['"]`  matches the legacy `img_url: 'master'` call that downloads the original full-resolution upload.

Recommend `image_url: width: 2000` as the default upper bound and `widths: '375, 750, 1100, 1500, 2000'` on `image_tag` for responsive delivery.

## Check 5: excessive section count on a single template

Open each JSON template in `templates/`. Parse it as JSON. Count keys in `sections`. Shopify soft-caps at 25 sections per page because each section adds a Liquid render pass.

For each template where `sections` has more than 25 keys, flag the template with the count and the section handles.

## Check 6: missing accessibility attributes on forms

Every `<form>` block in a theme must include:

- A descriptive `aria-label` or a visible `<legend>` or `<h1>`/`<h2>` immediately before the form.
- Inputs that are `type="text"`, `type="email"`, `type="tel"`, `type="password"`, or `type="search"` must have either a visible `<label for="...">` or an `aria-label`.
- Submit buttons must have visible text or `aria-label`.

Two-pass approach. Default ripgrep does not support lookahead, so match broadly then inspect each match.

1. Patterns (run with Grep, glob `**/*.liquid`):
   - `<form\b`  find every form element.
   - `<input\b[^>]*type=['"](text|email|tel|password|search)['"]`  find text-like inputs.
   - `<button\b[^>]*type=['"]submit['"]`  find submit buttons.
2. For each match, read the full tag and the adjacent lines. Flag when:
   - A form has no `aria-label`, no `aria-labelledby`, and no `<legend>` or heading element in the surrounding 5 lines.
   - An input has no `aria-label` and no `<label for="...">` that references its `id` anywhere in the same file.
   - A submit button has no `aria-label` and no text content between `>` and `</button>`.

## Report format

Write the report to the conversation. Do not create a file.

```
Shopify theme audit

Theme: <path>
Files scanned: <n>

Summary
  Render-blocking Liquid:    <count>
  Missing asset_url:         <count>
  XSS risk:                  <count>
  Oversized images:          <count>
  Section count warnings:    <count>
  Form accessibility:        <count>

Findings

1. [severity] <one-line description>
   File: <path>:<line>
   Evidence:
     <quoted line>
   Fix:
     <one sentence or diff>

2. ...
```

Severity scale: `critical` (XSS), `high` (render-blocking, XSS elsewhere), `medium` (missing asset_url, oversized images), `low` (accessibility, section count).

## Example finding

```
3. [critical] Customer note rendered without escape.
   File: sections/order-confirmation.liquid:42
   Evidence:
     <p class="note">{{ order.note }}</p>
   Fix:
     <p class="note">{{ order.note | escape }}</p>
```

## Do not

- Do not modify any theme file. The audit is read-only.
- Do not print the contents of `config/settings_data.json`. It may contain shop-specific data.
- Do not treat every hardcoded asset path as a finding if the theme uses `{{ 'filename.css' | asset_url }}` elsewhere with the same filename. Report only the unfiltered paths.
- Do not mark `article.content`, `page.content`, or richtext settings as XSS risks. Shopify sanitizes these server-side.
