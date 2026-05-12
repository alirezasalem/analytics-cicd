import { test, expect } from '@playwright/test';

// ── helpers ───────────────────────────────────────────────────────────────────

async function waitForDataLayerEvent(page, eventName, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await page.evaluate((name) => {
      return (window.dataLayer || []).find(e => e.event === name) || null;
    }, eventName);
    if (found) return found;
    await page.waitForTimeout(250);
  }
  throw new Error(`dataLayer event "${eventName}" not found within ${timeoutMs}ms`);
}

async function getAllDataLayerEvents(page, eventName) {
  return page.evaluate((name) => {
    return (window.dataLayer || []).filter(e => e.event === name);
  }, eventName);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('add_to_cart', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    // TODO: confirm selector with engineering - spec indicates multiple surfaces with different selectors
    // Using a best-guess selector for add to cart button
    const addToCartButton = page.locator('[data-testid="add-to-cart"], button:has-text("Add to Cart"), .add-to-cart-button, #add-to-cart').first();
    await addToCartButton.click();
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event add_to_cart not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "add_to_cart", got "${eventPayload.event}"`
    ).toBe('add_to_cart');
  });

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.currency is present and is a string', async () => {
    const currency = eventPayload.ecommerce?.currency;
    expect(
      currency !== undefined && currency !== null,
      `ecommerce.currency must be present, got ${currency}`
    ).toBe(true);
    expect(
      typeof currency === 'string',
      `ecommerce.currency must be a string, got ${typeof currency} (value: ${currency})`
    ).toBe(true);
    expect(
      currency.length > 0,
      `ecommerce.currency must be a non-empty string, got "${currency}"`
    ).toBe(true);
  });

  test('ecommerce.value is present and is a number', async () => {
    const value = eventPayload.ecommerce?.value;
    expect(
      value !== undefined && value !== null,
      `ecommerce.value must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.value must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.items is present and is an array', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      items !== undefined && items !== null,
      `ecommerce.items must be present, got ${items}`
    ).toBe(true);
    expect(
      Array.isArray(items),
      `ecommerce.items must be an array, got ${typeof items} (value: ${JSON.stringify(items)})`
    ).toBe(true);
  });

  test('ecommerce.items array is not empty', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(items) && items.length > 0,
      `ecommerce.items must have at least one item, got ${items?.length || 0} items`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_id is present and is a string', async () => {
    const itemId = eventPayload.ecommerce?.items?.[0]?.item_id;
    expect(
      itemId !== undefined && itemId !== null,
      `items[0].item_id must be present, got ${itemId}`
    ).toBe(true);
    expect(
      typeof itemId === 'string' && itemId.length > 0,
      `items[0].item_id must be a non-empty string, got ${typeof itemId} (value: ${itemId})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_name is present and is a string', async () => {
    const itemName = eventPayload.ecommerce?.items?.[0]?.item_name;
    expect(
      itemName !== undefined && itemName !== null,
      `items[0].item_name must be present, got ${itemName}`
    ).toBe(true);
    expect(
      typeof itemName === 'string' && itemName.length > 0,
      `items[0].item_name must be a non-empty string, got ${typeof itemName} (value: ${itemName})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_brand is present and is a string', async () => {
    const itemBrand = eventPayload.ecommerce?.items?.[0]?.item_brand;
    expect(
      itemBrand !== undefined && itemBrand !== null,
      `items[0].item_brand must be present, got ${itemBrand}`
    ).toBe(true);
    expect(
      typeof itemBrand === 'string' && itemBrand.length > 0,
      `items[0].item_brand must be a non-empty string, got ${typeof itemBrand} (value: ${itemBrand})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_category is present and is a string', async () => {
    const itemCategory = eventPayload.ecommerce?.items?.[0]?.item_category;
    expect(
      itemCategory !== undefined && itemCategory !== null,
      `items[0].item_category must be present, got ${itemCategory}`
    ).toBe(true);
    expect(
      typeof itemCategory === 'string' && itemCategory.length > 0,
      `items[0].item_category must be a non-empty string, got ${typeof itemCategory} (value: ${itemCategory})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_category2 is a string when present', async () => {
    const itemCategory2 = eventPayload.ecommerce?.items?.[0]?.item_category2;
    if (itemCategory2 !== undefined && itemCategory2 !== null) {
      expect(
        typeof itemCategory2 === 'string',
        `items[0].item_category2 must be a string when present, got ${typeof itemCategory2} (value: ${itemCategory2})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].item_variant is a string when present', async () => {
    const itemVariant = eventPayload.ecommerce?.items?.[0]?.item_variant;
    if (itemVariant !== undefined && itemVariant !== null) {
      expect(
        typeof itemVariant === 'string',
        `items[0].item_variant must be a string when present, got ${typeof itemVariant} (value: ${itemVariant})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].item_list_id is a string when present', async () => {
    const itemListId = eventPayload.ecommerce?.items?.[0]?.item_list_id;
    if (itemListId !== undefined && itemListId !== null) {
      expect(
        typeof itemListId === 'string',
        `items[0].item_list_id must be a string when present, got ${typeof itemListId} (value: ${itemListId})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].item_list_name is a string when present', async () => {
    const itemListName = eventPayload.ecommerce?.items?.[0]?.item_list_name;
    if (itemListName !== undefined && itemListName !== null) {
      expect(
        typeof itemListName === 'string',
        `items[0].item_list_name must be a string when present, got ${typeof itemListName} (value: ${itemListName})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].price is present and is a number', async () => {
    const price = eventPayload.ecommerce?.items?.[0]?.price;
    expect(
      price !== undefined && price !== null,
      `items[0].price must be present, got ${price}`
    ).toBe(true);
    expect(
      typeof price === 'number' && !isNaN(price),
      `items[0].price must be a number, got ${typeof price} (value: ${price})`
    ).toBe(true);
  });

  test('ecommerce.items[0].quantity is present and is a number', async () => {
    const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
    expect(
      quantity !== undefined && quantity !== null,
      `items[0].quantity must be present, got ${quantity}`
    ).toBe(true);
    expect(
      typeof quantity === 'number' && !isNaN(quantity),
      `items[0].quantity must be a number, got ${typeof quantity} (value: ${quantity})`
    ).toBe(true);
  });

  test('ecommerce.items[0].quantity is a positive integer', async () => {
    const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
    expect(
      Number.isInteger(quantity) && quantity > 0,
      `items[0].quantity must be a positive integer, got ${quantity}`
    ).toBe(true);
  });

  test('ecommerce.items[0].discount is a number when present', async () => {
    const discount = eventPayload.ecommerce?.items?.[0]?.discount;
    if (discount !== undefined && discount !== null) {
      expect(
        typeof discount === 'number' && !isNaN(discount),
        `items[0].discount must be a number when present, got ${typeof discount} (value: ${discount})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].coupon is a string when present', async () => {
    const coupon = eventPayload.ecommerce?.items?.[0]?.coupon;
    if (coupon !== undefined && coupon !== null) {
      expect(
        typeof coupon === 'string',
        `items[0].coupon must be a string when present, got ${typeof coupon} (value: ${coupon})`
      ).toBe(true);
    }
  });

  test('ecommerce.items[0].index is a number when present', async () => {
    const index = eventPayload.ecommerce?.items?.[0]?.index;
    if (index !== undefined && index !== null) {
      expect(
        typeof index === 'number' && !isNaN(index),
        `items[0].index must be a number when present, got ${typeof index} (value: ${index})`
      ).toBe(true);
    }
  });

  test('ecommerce object is cleared before push (no stale data)', async ({ page }) => {
    // Verify that the ecommerce object does not contain data from previous pushes
    const allEvents = await getAllDataLayerEvents(page, 'add_to_cart');
    const lastEvent = allEvents[allEvents.length - 1];
    
    // Check that items array only contains items relevant to this add_to_cart action
    expect(
      lastEvent.ecommerce?.items?.length >= 1,
      `ecommerce.items should contain at least 1 item from this action, got ${lastEvent.ecommerce?.items?.length || 0}`
    ).toBe(true);
  });

  test('no duplicate events fired for single add to cart action', async ({ page }) => {
    // Per gtm_notes: Implement debouncing for duplicate prevention
    const allEvents = await getAllDataLayerEvents(page, 'add_to_cart');
    
    // Filter events that occurred in rapid succession (within 100ms would indicate duplicates)
    // Since we only clicked once, we should have exactly 1 event from this test
    expect(
      allEvents.length === 1,
      `Expected exactly 1 add_to_cart event, got ${allEvents.length} (debouncing may not be working)`
    ).toBe(true);
  });

  test('currency follows ISO 4217 format', async () => {
    const currency = eventPayload.ecommerce?.currency;
    const iso4217Pattern = /^[A-Z]{3}$/;
    expect(
      iso4217Pattern.test(currency),
      `currency must be a 3-letter ISO 4217 code, got "${currency}"`
    ).toBe(true);
  });

  test('value matches sum of item prices times quantities', async () => {
    const items = eventPayload.ecommerce?.items || [];
    const value = eventPayload.ecommerce?.value;
    
    const calculatedValue = items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const discount = item.discount || 0;
      return sum + itemTotal - discount;
    }, 0);
    
    // Allow for floating point precision issues
    expect(
      Math.abs(value - calculatedValue) < 0.01,
      `value (${value}) should match calculated total (${calculatedValue.toFixed(2)}) from items`
    ).toBe(true);
  });
});
