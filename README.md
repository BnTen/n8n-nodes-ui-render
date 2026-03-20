# n8n-nodes-ui-render

Render professional HTML pages from n8n workflow data.
This node is designed to sit between your data nodes and `Respond to Webhook`.

## Features

- Templates: `table`, `list`, `chart` (`bar`, `line`, `pie`), `sectionText`, `chat`
- Dynamic placeholders in text fields: `{{item.field}}`, `{{meta.generatedAt}}`, `{{stats.count}}`
- Professional presets:
  - `ExecutiveDashboard`
  - `SalesReport`
  - `OpsTable`
  - `ActivityFeed`
- Rich customization as **flat parameters** (no collections): Page, Sections, Data, Style, Advanced — works reliably in the n8n editor
- Safe by default:
  - strict HTML escaping for injected data
  - `allowUnsafeHtml` opt-in for advanced usage

## Output Contract

- Always sets `json.html`
- Sets `json.contentType` to `text/html; charset=utf-8`
- Optionally sets `json.meta` when **Advanced — Include Meta in Output** is enabled

## Quick Start

```bash
npm install
npm run dev
```

## Typical n8n Flow

`Webhook` -> `Data Nodes` -> `UI Render` -> `Respond to Webhook`

In `Respond to Webhook`:

- **Response Body**: `{{$json.html}}`
- **Response Headers**: `Content-Type: text/html; charset=utf-8`

## Important Node Parameters

- **Template Type**: `table`, `list`, `chart`, `sectionText`, `chat`
- **Chart Type** (when Template Type is `chart`): `bar`, `line`, `pie`, `donut`, `polar`
- **Theme** / **Layout Density**: top-level selectors (reliable in the n8n UI)
- **Input Mode**:
  - `aggregateItems` -> one HTML document from all input items
  - `currentItem` -> one HTML document per item
- **Preset**: base visual profile
- **Page —** `pageTitle`, `pageSubtitle`, `pageMetaDescription`, `pageLogoUrl`
- **Sections —** show header / KPI / footer toggles and `sectionFooterText`
- **Data —** limit, fallback, and template-specific fields:
  - Table: `tableColumnsUi` (ordered fixedCollection), `tableOptionsUi`
  - List: `listPrimaryField`, `listPrimaryLabel`, `listSecondaryField`, `listSecondaryLabel`, `listOptionsUi`
  - Chart: `chartLabelsMode`, `chartLabelField` / `chartLabelsArray`, `chartValuesMode`, `chartValueField` / `chartValuesArray`, `chartOptionsUi`
- **Style —** colors, radius, shadow, font
- **Advanced —** unsafe HTML, custom CSS, include meta

### Node version 3

If you had an older workflow using previous parameter names/structures, reconfigure the node:
- Table uses `tableColumnsUi` (fixedCollection sortable + header alias) instead of the old comma-separated columns input.
- List and Chart use the v3 `list*` and `chart*` parameters (including `chartLabelsMode`/`chartValuesMode` for array support).

## Build and Lint

```bash
npm run lint
npm run build
```

## Local Self-Host Install

1. Build package:

```bash
npm run build
```

2. Pack and install in your n8n environment (or publish to npm and install from npm):

```bash
npm pack
```

3. Restart n8n and search for `UI Render` in the node panel.

## Security Notes

- HTML escaping is enabled by default for dynamic values.
- Enabling `allowUnsafeHtml` can expose XSS risks if your data is untrusted.
- Use `allowUnsafeHtml` only with controlled/sanitized sources.
