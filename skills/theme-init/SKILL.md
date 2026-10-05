---
name: theme-init
description: Scaffold a Shopify Online Store 2.0 theme directory with the full folder layout (assets, config, layout, locales, sections, snippets, templates, blocks), a starter settings_schema.json, and a working layout/theme.liquid. Use when the user asks to start a new Shopify theme, create an OS 2.0 theme skeleton, or initialize a Shopify theme project.
argument-hint: "[theme-name]"
allowed-tools: Read Write Glob
---

# Scaffold a Shopify Online Store 2.0 theme

Create a Shopify Online Store 2.0 theme with the canonical folder layout, a usable `settings_schema.json`, and a valid `layout/theme.liquid`. The output passes `shopify theme check` with zero errors.

## Inputs

`$ARGUMENTS` is an optional theme name. If empty, ask the user for one. Use a kebab-case slug for the folder name (for example `my-store-theme`).

## Workflow

1. Confirm the target directory with the user. Default to `./<theme-name>` under the current working directory.
2. Check with Glob whether the target directory already contains a theme (look for `config/settings_schema.json`). If it does, ask before overwriting.
3. Announce each file you will write.
4. Create every directory and file listed in the layout below.
5. After writing, print the Shopify CLI commands to serve and push the theme.

## Required folder layout

```
<theme-name>/
  assets/
    theme.css
    theme.js
  blocks/
    text.liquid
  config/
    settings_schema.json
    settings_data.json
  layout/
    theme.liquid
  locales/
    en.default.json
  sections/
    header.liquid
    footer.liquid
    header-group.json
    footer-group.json
    main-index.liquid
    main-product.liquid
    main-collection.liquid
    main-page.liquid
    main-cart.liquid
    main-404.liquid
  snippets/
    meta-tags.liquid
  templates/
    index.json
    product.json
    collection.json
    page.json
    404.json
    cart.json
```

Every section referenced by a JSON template or a section group file must exist as a `.liquid` file in `sections/`. Every `main-*.liquid` file below is the default body for its template. Every group JSON file lists the sections that render inside the group tag in `layout/theme.liquid`.

## Example files to write

### `config/settings_schema.json`

```json
[
  {
    "name": "theme_info",
    "theme_name": "Starter Theme",
    "theme_version": "0.1.0",
    "theme_author": "Your Name",
    "theme_documentation_url": "",
    "theme_support_url": ""
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "color",
        "id": "color_background",
        "label": "Background",
        "default": "#ffffff"
      },
      {
        "type": "color",
        "id": "color_text",
        "label": "Text",
        "default": "#121212"
      },
      {
        "type": "color",
        "id": "color_accent",
        "label": "Accent",
        "default": "#0a6cff"
      }
    ]
  },
  {
    "name": "Typography",
    "settings": [
      {
        "type": "font_picker",
        "id": "font_body",
        "label": "Body font",
        "default": "helvetica_n4"
      },
      {
        "type": "font_picker",
        "id": "font_heading",
        "label": "Heading font",
        "default": "helvetica_n7"
      }
    ]
  }
]
```

### `config/settings_data.json`

```json
{
  "current": {
    "color_background": "#ffffff",
    "color_text": "#121212",
    "color_accent": "#0a6cff",
    "font_body": "helvetica_n4",
    "font_heading": "helvetica_n7"
  },
  "presets": {
    "Default": {
      "color_background": "#ffffff",
      "color_text": "#121212",
      "color_accent": "#0a6cff",
      "font_body": "helvetica_n4",
      "font_heading": "helvetica_n7"
    }
  }
}
```

### `layout/theme.liquid`

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="{{ settings.color_background }}">
    <title>
      {{ page_title }}
      {%- if current_tags %} &ndash; tagged "{{ current_tags | join: ', ' }}"{% endif -%}
      {%- if current_page != 1 %} &ndash; Page {{ current_page }}{% endif -%}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>

    {% if page_description %}
      <meta name="description" content="{{ page_description | escape }}">
    {% endif %}

    {% render 'meta-tags' %}

    <link rel="canonical" href="{{ canonical_url }}">
    <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>

    {{ content_for_header }}

    {{ 'theme.css' | asset_url | stylesheet_tag }}
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
  </head>
  <body class="template-{{ template | replace: '.', '-' | handleize }}">
    <a class="skip-link" href="#MainContent">{{ 'accessibility.skip_to_content' | t }}</a>
    {% sections 'header-group' %}
    <main id="MainContent" role="main">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
  </body>
</html>
```

### `snippets/meta-tags.liquid`

```liquid
{% if page_image %}
  <meta property="og:image" content="{{ page_image | image_url: width: 1200 }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
{% endif %}
<meta property="og:site_name" content="{{ shop.name | escape }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:title" content="{{ page_title | escape }}">
<meta property="og:type" content="{% if template contains 'product' %}product{% else %}website{% endif %}">
<meta name="twitter:card" content="summary_large_image">
```

### `sections/header.liquid`

```liquid
<header class="site-header" role="banner">
  <a class="site-header__logo" href="{{ routes.root_url }}">
    {% if section.settings.logo %}
      {{ section.settings.logo | image_url: width: 400 | image_tag: alt: shop.name, loading: 'eager', widths: '200,400' }}
    {% else %}
      <span>{{ shop.name }}</span>
    {% endif %}
  </a>
  <nav class="site-header__nav" aria-label="{{ 'accessibility.main_navigation' | t }}">
    <ul>
      {% for link in section.settings.menu.links %}
        <li><a href="{{ link.url }}">{{ link.title | escape }}</a></li>
      {% endfor %}
    </ul>
  </nav>
</header>

{% schema %}
{
  "name": "Header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo"
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "Main menu",
      "default": "main-menu"
    }
  ],
  "enabled_on": {
    "groups": ["header"]
  }
}
{% endschema %}
```

### `sections/footer.liquid`

```liquid
<footer class="site-footer" role="contentinfo">
  <p>&copy; {{ 'now' | date: '%Y' }} {{ shop.name | escape }}</p>
</footer>

{% schema %}
{
  "name": "Footer",
  "settings": [],
  "enabled_on": {
    "groups": ["footer"]
  }
}
{% endschema %}
```

### `sections/header-group.json`

```json
{
  "type": "header",
  "name": "Header group",
  "sections": {
    "header": {
      "type": "header",
      "settings": {}
    }
  },
  "order": ["header"]
}
```

### `sections/footer-group.json`

```json
{
  "type": "footer",
  "name": "Footer group",
  "sections": {
    "footer": {
      "type": "footer",
      "settings": {}
    }
  },
  "order": ["footer"]
}
```

### `sections/main-index.liquid`

```liquid
<div class="section-main-index" role="region">
  {% for block in section.blocks %}
    {% render block %}
  {% endfor %}
</div>

{% schema %}
{
  "name": "Home page",
  "tag": "section",
  "class": "main-index",
  "blocks": [
    { "type": "@app" },
    { "type": "@theme" }
  ],
  "presets": [
    { "name": "Home page" }
  ]
}
{% endschema %}
```

### `sections/main-product.liquid`

```liquid
<section class="product" data-product-id="{{ product.id }}">
  <div class="product__media">
    {% if product.featured_image %}
      {{
        product.featured_image
        | image_url: width: 1500
        | image_tag:
            alt: product.featured_image.alt | default: product.title,
            loading: 'eager',
            fetchpriority: 'high',
            widths: '375, 750, 1100, 1500'
      }}
    {% endif %}
  </div>

  <div class="product__details">
    <h1 class="product__title">{{ product.title | escape }}</h1>

    <p class="product__price">
      {{ product.selected_or_first_available_variant.price | money }}
    </p>

    {% form 'product', product, id: 'ProductForm', class: 'product__form' %}
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
      <label for="Quantity">{{ 'products.quantity' | t | default: 'Quantity' }}</label>
      <input
        id="Quantity"
        type="number"
        name="quantity"
        value="1"
        min="1"
        aria-label="Quantity"
      >
      <button type="submit" class="product__buy" aria-label="Add to cart">
        {{ 'products.add_to_cart' | t | default: 'Add to cart' }}
      </button>
    {% endform %}

    <div class="product__description">
      {{ product.description }}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product page",
  "tag": "section",
  "class": "main-product",
  "settings": [],
  "presets": [
    { "name": "Product page" }
  ]
}
{% endschema %}
```

### `sections/main-collection.liquid`

```liquid
<section class="collection" aria-labelledby="CollectionHeading">
  <h1 id="CollectionHeading" class="collection__title">{{ collection.title | escape }}</h1>

  {% paginate collection.products by 24 %}
    <ul class="collection__grid">
      {% for product in collection.products %}
        <li class="collection__item">
          <a href="{{ product.url }}">
            {% if product.featured_image %}
              {{
                product.featured_image
                | image_url: width: 600
                | image_tag:
                    alt: product.title,
                    loading: 'lazy',
                    widths: '200, 400, 600'
              }}
            {% endif %}
            <h2>{{ product.title | escape }}</h2>
            <p>{{ product.price | money }}</p>
          </a>
        </li>
      {% else %}
        <li>{{ 'collections.empty' | t | default: 'No products in this collection yet.' }}</li>
      {% endfor %}
    </ul>

    {% if paginate.pages > 1 %}
      <nav class="pagination" aria-label="Pagination">
        {{ paginate | default_pagination }}
      </nav>
    {% endif %}
  {% endpaginate %}
</section>

{% schema %}
{
  "name": "Collection page",
  "tag": "section",
  "class": "main-collection",
  "settings": [],
  "presets": [
    { "name": "Collection page" }
  ]
}
{% endschema %}
```

### `sections/main-page.liquid`

```liquid
<article class="page" aria-labelledby="PageHeading">
  <h1 id="PageHeading">{{ page.title | escape }}</h1>
  <div class="page__content rte">
    {{ page.content }}
  </div>
</article>

{% schema %}
{
  "name": "Page",
  "tag": "section",
  "class": "main-page",
  "settings": [],
  "presets": [
    { "name": "Page" }
  ]
}
{% endschema %}
```

### `sections/main-cart.liquid`

```liquid
<section class="cart" aria-labelledby="CartHeading">
  <h1 id="CartHeading">{{ 'cart.title' | t | default: 'Your cart' }}</h1>

  {% if cart.item_count == 0 %}
    <p>{{ 'cart.empty' | t | default: 'Your cart is empty.' }}</p>
  {% else %}
    {% form 'cart', cart, id: 'CartForm' %}
      <ul class="cart__items">
        {% for line_item in cart.items %}
          <li class="cart__item">
            <a href="{{ line_item.url }}">{{ line_item.product.title | escape }}</a>
            <span>{{ line_item.final_price | money }}</span>
            <label for="Qty-{{ line_item.key }}">Quantity</label>
            <input
              id="Qty-{{ line_item.key }}"
              name="updates[{{ line_item.key }}]"
              type="number"
              min="0"
              value="{{ line_item.quantity }}"
              aria-label="Quantity for {{ line_item.product.title | escape }}"
            >
          </li>
        {% endfor %}
      </ul>
      <p class="cart__total">{{ 'cart.subtotal' | t | default: 'Subtotal' }}: {{ cart.total_price | money }}</p>
      <button type="submit" name="checkout" aria-label="Checkout">
        {{ 'cart.checkout' | t | default: 'Checkout' }}
      </button>
    {% endform %}
  {% endif %}
</section>

{% schema %}
{
  "name": "Cart page",
  "tag": "section",
  "class": "main-cart",
  "settings": [],
  "presets": [
    { "name": "Cart page" }
  ]
}
{% endschema %}
```

### `sections/main-404.liquid`

```liquid
<section class="not-found" aria-labelledby="NotFoundHeading">
  <h1 id="NotFoundHeading">{{ '404.title' | t | default: 'Page not found' }}</h1>
  <p>{{ '404.body' | t | default: "The page you were looking for does not exist." }}</p>
  <a href="{{ routes.root_url }}">{{ '404.back' | t | default: 'Back to home' }}</a>
</section>

{% schema %}
{
  "name": "404 page",
  "tag": "section",
  "class": "main-404",
  "settings": [],
  "presets": [
    { "name": "404 page" }
  ]
}
{% endschema %}
```

### `blocks/text.liquid`

```liquid
<div class="block-text" {{ block.shopify_attributes }}>
  {{ block.settings.text }}
</div>

{% schema %}
{
  "name": "Text",
  "settings": [
    {
      "type": "richtext",
      "id": "text",
      "label": "Text",
      "default": "<p>Add your text.</p>"
    }
  ]
}
{% endschema %}
```

### `templates/index.json`

```json
{
  "sections": {
    "main": {
      "type": "main-index",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `templates/product.json`

```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `templates/collection.json`

```json
{
  "sections": {
    "main": {
      "type": "main-collection",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `templates/page.json`

```json
{
  "sections": {
    "main": {
      "type": "main-page",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `templates/cart.json`

```json
{
  "sections": {
    "main": {
      "type": "main-cart",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `templates/404.json`

```json
{
  "sections": {
    "main": {
      "type": "main-404",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### `locales/en.default.json`

```json
{
  "accessibility": {
    "skip_to_content": "Skip to content",
    "main_navigation": "Main navigation"
  },
  "general": {
    "search": {
      "placeholder": "Search"
    }
  },
  "products": {
    "quantity": "Quantity",
    "add_to_cart": "Add to cart"
  },
  "collections": {
    "empty": "No products in this collection yet."
  },
  "cart": {
    "title": "Your cart",
    "empty": "Your cart is empty.",
    "subtotal": "Subtotal",
    "checkout": "Checkout"
  },
  "404": {
    "title": "Page not found",
    "body": "The page you were looking for does not exist.",
    "back": "Back to home"
  }
}
```

Every translation key referenced from a `main-*.liquid` file with the `| t` filter must exist in this file. `shopify theme check` raises `TranslationKeyExists` warnings when a key is used but undefined. Keep this file in sync as you add new sections.

### `assets/theme.css`

```css
:root {
  --color-background: #ffffff;
  --color-text: #121212;
  --color-accent: #0a6cff;
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: var(--color-text);
  background: var(--color-background);
}
.skip-link {
  position: absolute;
  left: -10000px;
}
.skip-link:focus {
  left: 8px;
  top: 8px;
  background: var(--color-background);
  padding: 8px 12px;
}
```

### `assets/theme.js`

```javascript
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.remove('no-js');
  });
})();
```

## Next steps to print to the user

```bash
cd <theme-name>
shopify theme dev
```

To push to a development store:

```bash
shopify theme push --development
```

## Do not

- Do not include `node_modules`, a package.json, or any build tooling. Online Store 2.0 themes do not need them.
- Do not hardcode shop names, domains, or access tokens in any file.
- Do not add templates with a `.liquid` extension when a JSON template is required for OS 2.0 sections.
- Do not overwrite an existing theme without explicit user confirmation.
