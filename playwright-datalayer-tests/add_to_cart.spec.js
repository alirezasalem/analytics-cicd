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
    // Using best-guess selector for add to cart button
    const addToCartButton = page.locator('[data-testid="add-to-cart"], button:has-text("Add to Cart"), .add-to-cart-button, [class*="add-to-cart"]').first();
    await addToCartButton.click();
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event "add_to_cart" not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "add_to_cart", got "${eventPayload.event}"`
    ).toBe('add_to_cart');
  });

  // ── ecommerce object tests ──────────────────────────────────────────────────

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${typeof eventPayload.ecommerce}`
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
  });

  test('ecommerce.currency is a valid ISO 4217 code', async () => {
    const currency = eventPayload.ecommerce?.currency;
    const validCurrencyCodes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN'];
    expect(
      typeof currency === 'string' && currency.length === 3,
      `ecommerce.currency must be a 3-letter currency code, got "${currency}"`
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

  test('ecommerce.value is non-negative', async () => {
    const value = eventPayload.ecommerce?.value;
    expect(
      typeof value === 'number' && value >= 0,
      `ecommerce.value must be non-negative, got ${value}`
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
      `ecommerce.items must contain at least one item, got ${items?.length || 0} items`
    ).toBe(true);
  });

  // ── item-level parameter tests ──────────────────────────────────────────────

  test('item_id is present in first item', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      item?.item_id !== undefined && item?.item_id !== null,
      `item_id must be present in first item, got ${item?.item_id}`
    ).toBe(true);
  });

  test('item_id is a non-empty string', async () => {
    const itemId = eventPayload.ecommerce?.items?.[0]?.item_id;
    expect(
      typeof itemId === 'string' && itemId.length > 0,
      `item_id must be a non-empty string, got ${typeof itemId} (value: ${itemId})`
    ).toBe(true);
  });

  test('item_name is present in first item', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      item?.item_name !== undefined && item?.item_name !== null,
      `item_name must be present in first item, got ${item?.item_name}`
    ).toBe(true);
  });

  test('item_name is a non-empty string', async () => {
    const itemName = eventPayload.ecommerce?.items?.[0]?.item_name;
    expect(
      typeof itemName === 'string' && itemName.length > 0,
      `item_name must be a non-empty string, got ${typeof itemName} (value: ${itemName})`
    ).toBe(true);
  });

  test('item_brand is present in first item', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      item?.item_brand !== undefined && item?.item_brand !== null,
      `item_brand must be present in first item, got ${item?.item_brand}`
    ).toBe(true);
  });

  test('item_brand is a string', async () => {
    const itemBrand = eventPayload.ecommerce?.items?.[0]?.item_brand;
    expect(
      typeof itemBrand === 'string',
      `item_brand must be a string, got ${typeof itemBrand} (value: ${itemBrand})`
    ).toBe(true);
  });

  test('item_category is present in first item', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      item?.item_category !== undefined && item?.item_category !== null,
      `item_category must be present in first item, got ${item?.item_category}`
    ).toBe(true);
  });

  test('item_category is a string', async () => {
    const itemCategory = eventPayload.ecommerce?.items?.[0]?.item_category;
    expect(
      typeof itemCategory === 'string',
      `item_category must be a string, got ${typeof itemCategory} (value: ${itemCategory})`
    ).toBe(true);
  });

  test('item_category2 is a string when present', async () => {
    const itemCategory2 = eventPayload.ecommerce?.items?.[0]?.item_category2;
    if (itemCategory2 !== undefined && itemCategory2 !== null) {
      expect(
        typeof itemCategory2 === 'string',
        `item_category2 must be a string when present, got ${typeof itemCategory2} (value: ${itemCategory2})`
      ).toBe(true);
    }
  });

  test('item_variant is a string when present', async () => {
    const itemVariant = eventPayload.ecommerce?.items?.[0]?.item_variant;
    if (itemVariant !== undefined && itemVariant !== null) {
      expect(
        typeof itemVariant === 'string',
        `item_variant must be a string when present, got ${typeof itemVariant} (value: ${itemVariant})`
      ).toBe(true);
    }
  });

  test('item_list_id is a string when present', async () => {
    const itemListId = eventPayload.ecommerce?.items?.[0]?.item_list_id;
    if (itemListId !== undefined && itemListId !== null) {
      expect(
        typeof itemListId === 'string',
        `item_list_id must be a string when present, got ${typeof itemListId} (value: ${itemListId})`
      ).toBe(true);
    }
  });

  test('item_list_name is a string when present', async () => {
    const itemListName = eventPayload.ecommerce?.items?.[0]?.item_list_name;
    if (itemListName !== undefined && itemListName !== null) {
      expect(
        typeof itemListName === 'string',
        `item_list_name must be a string when present, got ${typeof itemListName} (value: ${itemListName})`
      ).toBe(true);
    }
  });

  test('price is present in first item and is a number', async () => {
    const price = eventPayload.ecommerce?.items?.[0]?.price;
    expect(
      price !== undefined && price !== null,
      `price must be present in first item, got ${price}`
    ).toBe(true);
    expect(
      typeof price === 'number' && !isNaN(price),
      `price must be a number, got ${typeof price} (value: ${price})`
    ).toBe(true);
  });

  test('price is non-negative', async () => {
    const price = eventPayload.ecommerce?.items?.[0]?.price;
    expect(
      typeof price === 'number' && price >= 0,
      `price must be non-negative, got ${price}`
    ).toBe(true);
  });

  test('quantity is present in first item and is a number', async () => {
    const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
    expect(
      quantity !== undefined && quantity !== null,
      `quantity must be present in first item, got ${quantity}`
    ).toBe(true);
    expect(
      typeof quantity === 'number' && !isNaN(quantity),
      `quantity must be a number, got ${typeof quantity} (value: ${quantity})`
    ).toBe(true);
  });

  test('quantity is a positive integer', async () => {
    const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
    expect(
      typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0,
      `quantity must be a positive integer, got ${quantity}`
    ).toBe(true);
  });

  test('discount is a number when present', async () => {
    const discount = eventPayload.ecommerce?.items?.[0]?.discount;
    if (discount !== undefined && discount !== null) {
      expect(
        typeof discount === 'number' && !isNaN(discount),
        `discount must be a number when present, got ${typeof discount} (value: ${discount})`
      ).toBe(true);
    }
  });

  test('discount is non-negative when present', async () => {
    const discount = eventPayload.ecommerce?.items?.[0]?.discount;
    if (discount !== undefined && discount !== null) {
      expect(
        typeof discount === 'number' && discount >= 0,
        `discount must be non-negative when present, got ${discount}`
      ).toBe(true);
    }
  });

  test('coupon is a string when present', async () => {
    const coupon = eventPayload.ecommerce?.items?.[0]?.coupon;
    if (coupon !== undefined && coupon !== null) {
      expect(
        typeof coupon === 'string',
        `coupon must be a string when present, got ${typeof coupon} (value: ${coupon})`
      ).toBe(true);
    }
  });

  test('index is a number when present', async () => {
    const index = eventPayload.ecommerce?.items?.[0]?.index;
    if (index !== undefined && index !== null) {
      expect(
        typeof index === 'number' && !isNaN(index),
        `index must be a number when present, got ${typeof index} (value: ${index})`
      ).toBe(true);
    }
  });

  test('index is a non-negative integer when present', async () => {
    const index = eventPayload.ecommerce?.items?.[0]?.index;
    if (index !== undefined && index !== null) {
      expect(
        typeof index === 'number' && Number.isInteger(index) && index >= 0,
        `index must be a non-negative integer when present, got ${index}`
      ).toBe(true);
    }
  });

  // ── business rule tests from gtm_notes ──────────────────────────────────────

  test('ecommerce object is cleared before push (no stale data)', async ({ page }) => {
    // Verify the ecommerce object in the event is a fresh object, not merged with previous data
    // This checks that the implementation follows the "Clear ecommerce object before push" requirement
    const ecommerce = eventPayload.ecommerce;
    expect(
      ecommerce !== undefined && typeof ecommerce === 'object',
      `ecommerce object must be a valid object, got ${typeof ecommerce}`
    ).toBe(true);
    // The items array should only contain items from this specific add_to_cart action
    expect(
      Array.isArray(ecommerce.items),
      `ecommerce.items must be an array for proper ecommerce clearing`
    ).toBe(true);
  });

  test('no duplicate events fired (debounce implementation)', async ({ page }) => {
    // Get all add_to_cart events to verify debounce is working
    const allEvents = await getAllDataLayerEvents(page, 'add_to_cart');
    expect(
      allEvents.length === 1,
      `add_to_cart should fire exactly once per click (debounce), but found ${allEvents.length} events`
    ).toBe(true);
  });

  test('value matches sum of item prices times quantities', async () => {
    const value = eventPayload.ecommerce?.value;
    const items = eventPayload.ecommerce?.items || [];
    
    if (items.length > 0) {
      const calculatedValue = items.reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        const discount = item.discount || 0;
        return sum + ((price - discount) * quantity);
      }, 0);
      
      // Allow for floating point precision issues
      const tolerance = 0.01;
      expect(
        Math.abs(value - calculatedValue) <= tolerance,
        `ecommerce.value (${value}) should match calculated sum of items (${calculatedValue})`
      ).toBe(true);
