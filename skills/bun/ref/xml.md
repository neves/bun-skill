Docs: `/docs/runtime/xml`

```ts
import { XML } from "bun";
const data = XML.parse(`<order id="A1"><item sku="tea">Tea</item></order>`);
// { order: { "@id": "A1", item: { "@sku": "tea", "#text": "Tea" } } } — all values are strings
const xml = XML.stringify(data, null, 2);
```
