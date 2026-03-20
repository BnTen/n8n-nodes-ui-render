# n8n-nodes-ui-render

Turn your n8n data into clean, good-looking HTML reports (tables, charts, timelines, and even a chat-style UI).

This node sits between your data workflow and `Respond to Webhook`, so you can ship a ready-to-view page with one step.

![UI Render preview](icons/demo.png)

## What it renders
- `table` - a responsive HTML table
- `list` - a card-based list
- `chart` - `bar`, `line`, `pie`, plus `donut` and `polar`
- `sectionText` - a “title + paragraph” section (supports placeholders)
- `chat` - a nice chat UI from an array of messages

## Presets (global look & layout)
Pick a preset and the page will automatically adapt its spacing/typography/palette:
- `ExecutiveDashboard`
- `SalesReport` (centered, more “serious” header)
- `OpsTable` (multi-block charts are grouped into a grid)
- `ActivityFeed` (list blocks become a timeline)

## Quick n8n setup
Typical flow:
`Webhook` -> `Data Nodes` -> `UI Render` -> `Respond to Webhook`

In `Respond to Webhook`:
- Response body: `{{$json.html}}`
- Response headers: `Content-Type: text/html; charset=utf-8`

## Placeholders you can use
In text fields (titles, subtitles, section text, etc.):
- `{{item.field}}`
- `{{meta.generatedAt}}`
- `{{stats.count}}`

## Chart mapping (chart template)
To build a chart you choose:
- Labels mode: `field` or `array`
- Values mode: `field` or `array`

Then set the corresponding fields:
- Labels: `chartLabelField` or `chartLabelsArray`
- Values: `chartValueField` or `chartValuesArray`

## Multi-block layout (your “dashboard builder” mode)
When `Page Composition Mode = Multi Blocks`, you can stack multiple blocks on the same page:
- Block types: `table`, `list`, `chart`, `text`
- Order matters (the renderer keeps your order)

And presets can add structure:
- `OpsTable`: only `chart` blocks are grouped into a responsive grid.

## Chat template (public “chat UI”)
For `Template Type = chat`, the node reads a list of messages from your data item.

By default, it expects:
- `messages` = array
- each message has: `role`, `content`, optional `timestamp`

You can rename the fields via:
- `Chat — Messages Field`
- `Chat — Role Field`
- `Chat — Content Field`
- `Chat — Timestamp Field`

## Safety (important)
- Dynamic values are HTML-escaped by default (safer for untrusted data).
- If you enable `Advanced — Allow Unsafe HTML`, you opt into raw HTML injection. Only use it with trusted content.

## License
MIT
