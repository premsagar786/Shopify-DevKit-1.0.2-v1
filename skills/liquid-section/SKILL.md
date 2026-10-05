---
name: liquid-section
description: Generate a Liquid section for a Shopify Online Store 2.0 theme with a settings schema, blocks, and presets that appear in the theme editor. Use when the user asks to create a new section, add a hero or featured collection, build a custom section, or scaffold a Liquid section file.
argument-hint: "[section-name]"
allowed-tools: Read Write Edit Glob
---

# Generate a Shopify Liquid section

Create a Liquid section file under `sections/` that includes HTML, a `{% schema %}` block with settings and blocks, and at least one preset so the section appears in the theme editor's "Add section" list.

## Inputs

`$ARGUMENTS` is an optional section handle (for example `featured-collection`). If empty, ask the user for the handle and purpose.

## Workflow

1. Ask the user: "What is the purpose of this section? (for example: hero banner, featured product, image with text, newsletter signup)". Do not skip this step. The purpose drives the settings schema.
2. Confirm the theme root. Look for `config/settings_schema.json` with Glob. If not found, ask the user to point to the theme root.
3. Confirm the section handle. It must be kebab-case. Examples: `hero-banner`, `featured-collection`, `image-with-text`.
4. Write the file to `sections/<handle>.liquid`. Announce the write before creating the file.
5. If the section is meant for a JSON template, tell the user which `templates/*.json` file to add it to and show the exact JSON snippet.

## Schema rules the section must follow

1. The `name` field is the display name in the editor. Capitalize normally.
2. Settings must include `type`, `id`, and `label`. Use `default` values where sensible.
3. For blocks, set `max_blocks` to a realistic limit (for example 3 for a hero, 12 for a product list).
4. Always include at least one `presets` entry so merchants can add the section.
5. Include `"tag": "section"` and a `"class"` to make CSS targeting predictable.
6. If the section should only appear in certain places, add `enabled_on` or `disabled_on` with `templates` or `groups`.

## Example: hero banner section

Write to `sections/hero-banner.liquid`:

```liquid
<section
  class="hero-banner hero-banner--{{ section.settings.height }}"
  style="background-color: {{ section.settings.background_color }};"
>
  {% if section.settings.image %}
    {{
      section.settings.image
      | image_url: width: 2000
      | image_tag:
          alt: section.settings.heading,
          loading: 'eager',
          fetchpriority: 'high',
          widths: '375, 750, 1100, 1500, 2000',
          sizes: '100vw',
          class: 'hero-banner__image'
    }}
  {% endif %}

  <div class="hero-banner__content" style="color: {{ section.settings.text_color }};">
    {% if section.settings.heading != blank %}
      <h1 class="hero-banner__heading">{{ section.settings.heading | escape }}</h1>
    {% endif %}
    {% if section.settings.subheading != blank %}
      <p class="hero-banner__subheading">{{ section.settings.subheading | escape }}</p>
    {% endif %}

    {% for block in section.blocks %}
      {% case block.type %}
        {% when 'button' %}
          <a
            class="hero-banner__button"
            href="{{ block.settings.link }}"
            {{ block.shopify_attributes }}
          >
            {{ block.settings.label | escape }}
          </a>
      {% endcase %}
    {% endfor %}
  </div>
</section>

{% schema %}
{
  "name": "Hero banner",
  "tag": "section",
  "class": "section-hero-banner",
  "settings": [
    {
      "type": "image_picker",
      "id": "image",
      "label": "Background image"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome to the store"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "Discover our new arrivals"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background color",
      "default": "#f4f4f4"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text color",
      "default": "#121212"
    },
    {
      "type": "select",
      "id": "height",
      "label": "Height",
      "options": [
        { "value": "small", "label": "Small" },
        { "value": "medium", "label": "Medium" },
        { "value": "large", "label": "Large" }
      ],
      "default": "medium"
    }
  ],
  "blocks": [
    {
      "type": "button",
      "name": "Button",
      "settings": [
        {
          "type": "text",
          "id": "label",
          "label": "Label",
          "default": "Shop now"
        },
        {
          "type": "url",
          "id": "link",
          "label": "Link"
        }
      ]
    }
  ],
  "max_blocks": 2,
  "presets": [
    {
      "name": "Hero banner",
      "blocks": [
        { "type": "button" }
      ]
    }
  ]
}
{% endschema %}
```

## Example: add the section to the home page JSON template

Edit `templates/index.json`:

```json
{
  "sections": {
    "hero": {
      "type": "hero-banner",
      "blocks": {
        "cta": {
          "type": "button",
          "settings": {
            "label": "Shop now",
            "link": "/collections/all"
          }
        }
      },
      "block_order": ["cta"],
      "settings": {
        "heading": "New season, fresh picks",
        "subheading": "Find your favorite new piece",
        "height": "large"
      }
    },
    "main": {
      "type": "main-index",
      "settings": {}
    }
  },
  "order": ["hero", "main"]
}
```

## Accessibility checks to apply

1. Every image has an `alt` attribute. Use the heading or a dedicated alt setting.
2. Headings follow a logical order. The hero is the only `<h1>` on a page.
3. Buttons and links have visible text or `aria-label`.
4. Color contrast between text and background meets WCAG AA. Warn the user if the default pair is below 4.5:1.

## Do not

- Do not output raw customer data without `escape`. Any `settings.text`, `block.settings.*`, or metafield that includes user content must be escaped.
- Do not use inline `<script>` that executes logic. Put scripts in `assets/` and reference them from `layout/theme.liquid` or a `javascript` schema entry.
- Do not omit the `presets` array. Without it, merchants cannot add the section in the editor.
- Do not write the section to a folder other than `sections/`.
