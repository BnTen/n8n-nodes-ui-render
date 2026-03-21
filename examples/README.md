# Example payloads for **UI Render**

In n8n, **each input item** is usually **one row** for `table`, `list`, and `chart` (when labels/values use **field** mode).  
If your upstream node returns a single item with a `rows` array, use a **Code** node to expand it (see below).

| File | Use case |
|------|-----------|
| [payload-table-row.json](payload-table-row.json) | One table row (one n8n item). |
| [payload-table-rows-bulk.json](payload-table-rows-bulk.json) | Wrapper with `rows[]` — expand with Code node before UI Render. |
| [payload-chart-row.json](payload-chart-row.json) | One chart point (one n8n item) when using label/value **fields**. |
| [payload-chart-rows-bulk.json](payload-chart-rows-bulk.json) | Wrapper with `rows[]` for chart field mode — expand first. |
| [payload-chart-donut-array.json](payload-chart-donut-array.json) | Reference values for **array** mode (see file — values go in node parameters). |
| [payload-list-row.json](payload-list-row.json) | One list / timeline row (one n8n item). |
| [payload-section-text.json](payload-section-text.json) | Sample **item** fields; set **Section Text** title/body in the node using `{{item.*}}` / `{{meta.*}}` / `{{stats.*}}` (see `_readme` in the file). |
| [payload-chat.json](payload-chat.json) | Chat template: `messages` array on the item. |

## Expand `rows` into multiple items (Code node)

```javascript
const rows = $input.first().json.rows ?? [];
return rows.map((row) => ({ json: row }));
```

Connect **Code → UI Render** with **Input mode = Aggregate items** (default) so all rows are rendered together.
