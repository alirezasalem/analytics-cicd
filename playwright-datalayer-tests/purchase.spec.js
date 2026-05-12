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

test.describe('purchase', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    eventPayload = await waitForDataLayerEvent(page, 'purchase');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event "purchase" not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "purchase", got "${eventPayload.event}"`
    ).toBe('purchase');
  });

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${typeof eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.transaction_id is present and is a string', async () => {
    const value = eventPayload.ecommerce?.transaction_id;
    expect(
      value !== undefined && value !== null,
      `ecommerce.transaction_id must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'string',
      `ecommerce.transaction_id must be a string, got ${typeof value} (value: ${value})`
    ).toBe(true);
    expect(
      value.length > 0,
      `ecommerce.transaction_id must be a non-empty string, got empty string`
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

  test('ecommerce.tax is present and is a number', async () => {
    const value = eventPayload.ecommerce?.tax;
    expect(
      value !== undefined && value !== null,
      `ecommerce.tax must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.tax must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.shipping is present and is a number', async () => {
    const value = eventPayload.ecommerce?.shipping;
    expect(
      value !== undefined && value !== null,
      `ecommerce.shipping must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.shipping must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.currency is present and is a string', async () => {
    const value = eventPayload.ecommerce?.currency;
    expect(
      value !== undefined && value !== null,
      `ecommerce.currency must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'string',
      `ecommerce.currency must be a string, got ${typeof value} (value: ${value})`
    ).toBe(true);
    expect(
      value.length > 0,
      `ecommerce.currency must be a non-empty string, got empty string`
    ).toBe(true);
  });

  test('ecommerce.coupon is present and is a string (can be empty)', async () => {
    const value = eventPayload.ecommerce?.coupon;
    expect(
      value !== undefined,
      `ecommerce.coupon must be defined, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'string' || value === null,
      `ecommerce.coupon must be a string or null, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.items is present and is an array', async () => {
    const value = eventPayload.ecommerce?.items;
    expect(
      value !== undefined && value !== null,
      `ecommerce.items must be present, got ${value}`
    ).toBe(true);
    expect(
      Array.isArray(value),
      `ecommerce.items must be an array, got ${typeof value} (value: ${JSON.stringify(value)})`
    ).toBe(true);
  });

  test('ecommerce.items array is not empty', async () => {
    const value = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(value) && value.length > 0,
      `ecommerce.items must contain at least one item, got ${value?.length || 0} items`
    ).toBe(true);
  });

  test('ecommerce.items contain required fields (item_id, item_name, price, quantity, item_category)', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(Array.isArray(items), 'ecommerce.items must be an array').toBe(true);
    
    items.forEach((item, index) => {
      expect(
        item.item_id !== undefined && item.item_id !== null,
        `items[${index}].item_id must be present, got ${item.item_id}`
      ).toBe(true);
      expect(
        item.item_name !== undefined && item.item_name !== null,
        `items[${index}].item_name must be present, got ${item.item_name}`
      ).toBe(true);
      expect(
        item.price !== undefined && item.price !== null,
        `items[${index}].price must be present, got ${item.price}`
      ).toBe(true);
      expect(
        typeof item.price === 'number' && !isNaN(item.price),
        `items[${index}].price must be a number, got ${typeof item.price} (value: ${item.price})`
      ).toBe(true);
      expect(
        item.quantity !== undefined && item.quantity !== null,
        `items[${index}].quantity must be present, got ${item.quantity}`
      ).toBe(true);
      expect(
        typeof item.quantity === 'number' && !isNaN(item.quantity),
        `items[${index}].quantity must be a number, got ${typeof item.quantity} (value: ${item.quantity})`
      ).toBe(true);
      expect(
        item.item_category !== undefined && item.item_category !== null,
        `items[${index}].item_category must be present, got ${item.item_category}`
      ).toBe(true);
    });
  });

  test('customer_type custom dimension is present', async () => {
    const value = eventPayload.customer_type;
    expect(
      value !== undefined && value !== null,
      `customer_type must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'string',
      `customer_type must be a string, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('user_id custom dimension is present', async () => {
    const value = eventPayload.user_id;
    expect(
      value !== undefined && value !== null,
      `user_id must be present, got ${value}`
    ).toBe(true);
    expect(
      typeof value === 'string',
      `user_id must be a string, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('transaction_id is unique for deduplication purposes', async ({ page }) => {
    const allEvents = await getAllDataLayerEvents(page, 'purchase');
    const transactionIds = allEvents.map(e => e.ecommerce?.transaction_id).filter(Boolean);
    const uniqueIds = [...new Set(transactionIds)];
    expect(
      transactionIds.length === uniqueIds.length,
      `transaction_id values must be unique across purchase events, found duplicates: ${JSON.stringify(transactionIds)}`
    ).toBe(true);
  });
});
