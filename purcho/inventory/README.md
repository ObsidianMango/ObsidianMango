# Purcho · Inventory to Order

A separate inventory-first version of the Purcho order desk. Static HTML, CSS and JavaScript; no build step or dependencies.

## Using it

1. Choose Little Silver or Fair Haven.
2. Select **Have it**, choose **Out**, or enter on-hand quantities in cases.
3. Set a target stock level for each product. The default is 1 case. A target of 0 excludes that product.
4. Tap **Make my order**. If products are uncounted, either treat them as empty or generate an order from counted products only.
5. Edit quantities, remove lines, add products or notes, then copy, share, or download the list. Lists are grouped by supplier.

Order quantities are `max(0, ceil(target − onHand))`, in whole cases. Fractional inventory counts are supported. Changing inventory does not overwrite an edited draft; regeneration replaces manual edits after confirmation and preserves notes.

Stock counts, targets and order drafts are separate for each store and saved in this browser's localStorage under `purcho-inventory-v1`. This does not sync between devices or submit orders to suppliers. Export and restore backups from the menu.

The original 53-product catalog and supplier photography come from `purcho/unified/`. The original order desk is unchanged. All icons, including SVG favicon, PNG browser fallback, `.ico`, and iPhone home-screen icon, are included.

## Checking the calculation

With Node.js, run `npm test` from this directory. No installation is needed.

Serve this folder over HTTP to run it; ES modules require an HTTP origin.
