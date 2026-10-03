# Shoplist

A static shopping list page for comparing online clothes purchases in GBP and Ghana cedis.

## Edit your list

Add items in `data/items.json`:

```json
{
  "id": "unique-item-id",
  "url": "https://www.boohooman.com/product/example",
  "category": "Shirt",
  "size": "M",
  "length": "Regular",
  "notes": "Black"
}
```

Optional fields:

- `priceGbp`: Use this when the product page price cannot be detected.
- `title`: Use this to override the page title.
- `image`: Use this to override the OG/product image.
- `brand`: Use this to override the detected brand.

The page loads product metadata in the browser through Microlink. It has no database and can be deployed as static files on Netlify.

BoohooMAN sometimes blocks public metadata readers. When that happens, the app still derives the product image from BoohooMAN product URLs, and you can add `priceGbp` in the JSON for exact totals.
