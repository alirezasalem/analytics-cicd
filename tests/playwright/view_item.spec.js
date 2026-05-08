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

test.describe('view_item', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL + '/products/test-product');
    eventPayload = await waitForDataLayerEvent(page, 'view_item');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "view_item", got "${eventPayload.event}"`
    ).toBe('view_item');
  });

  test('event_category is present and equals "ecommerce"', async () => {
    expect(
      eventPayload.event_category,
      `event_category must be "ecommerce", got "${eventPayload.event_category}"`
    ).toBe('ecommerce');
  });

  test('event_label is present and is a non-empty string', async () => {
    expect(
      typeof eventPayload.event_label === 'string' && eventPayload.event_label.length > 0,
      `event_label must be a non-empty string, got ${typeof eventPayload.event_label} (value: ${eventPayload.event_label})`
    ).toBe(true);
  });

  test('currency is present and is a non-empty string', async () => {
    expect(
      typeof eventPayload.currency === 'string' && eventPayload.currency.length > 0,
      `currency must be a non-empty string, got ${typeof eventPayload.currency} (value: ${eventPayload.currency})`
    ).toBe(true);
  });

  test('value is present and is a number', async () => {
    expect(
      typeof eventPayload.value === 'number' && !isNaN(eventPayload.value),
      `value must be a number, got ${typeof eventPayload.value} (value: ${eventPayload.value})`
    ).toBe(true);
  });

  test('items array is present and not empty', async () => {
    expect(
      Array.isArray(eventPayload.items) && eventPayload.items.length > 0,
      `items must be a non-empty array, got ${typeof eventPayload.items} (value: ${JSON.stringify(eventPayload.items)})`
    ).toBe(true);
  });

  test('items[0].item_id is present and is a non-empty string', async () => {
    const item = eventPayload.items?.[0];
    expect(
      item && typeof item.item_id === 'string' && item.item_id.length > 0,
      `items[0].item_id must be a non-empty string, got ${typeof item?.item_id} (value: ${item?.item_id})`
    ).toBe(true);
  });

  test('items[0].item_name is present and is a non-empty string', async () => {
    const item = eventPayload.items?.[0];
    expect(
      item && typeof item.item_name === 'string' && item.item_name.length > 0,
      `items[0].item_name must be a non-empty string, got ${typeof item?.item_name} (value: ${item?.item_name})`
    ).toBe(true);
  });

  test('items[0].item_brand is present and is a non-empty string', async () => {
    const item = eventPayload.items?.[0];
    expect(
      item && typeof item.item_brand === 'string' && item.item_brand.length > 0,
      `items[0].item_brand must be a non-empty string, got ${typeof item?.item_brand} (value: ${item?.item_brand})`
    ).toBe(true);
  });

  test('items[0].item_category is present and is a non-empty string', async () => {
    const item = eventPayload.items?.[0];
    expect(
      item && typeof item.item_category === 'string' && item.item_category.length > 0,
      `items[0].item_category must be a non-empty string, got ${typeof item?.item_category} (value: ${item?.item_category})`
    ).toBe(true);
  });

  test('items[0].price is present and is a number', async () => {
    const item = eventPayload.items?.[0];
    expect(
      item && typeof item.price === 'number' && !isNaN(item.price),
      `items[0].price must be a number, got ${typeof item?.price} (value: ${item?.price})`
    ).toBe(true);
  });

  test('event_label matches items[0].item_name', async () => {
    const item = eventPayload.items?.[0];
    expect(
      eventPayload.event_label === item?.item_name,
      `event_label should match items[0].item_name, got event_label="${eventPayload.event_label}" vs item_name="${item?.item_name}"`
    ).toBe(true);
  });

  test('value matches items[0].price', async () => {
    const item = eventPayload.items?.[0];
    expect(
      eventPayload.value === item?.price,
      `value should match items[0].price, got value=${eventPayload.value} vs price=${item?.price}`
    ).toBe(true);
  });
});
