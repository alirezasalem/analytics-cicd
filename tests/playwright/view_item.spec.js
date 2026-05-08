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

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('view_item', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
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
      eventPayload.event_label !== undefined && eventPayload.event_label !== null,
      `event_label must be present, got ${eventPayload.event_label}`
    ).toBe(true);
    expect(
      typeof eventPayload.event_label === 'string' && eventPayload.event_label.length > 0,
      `event_label must be a non-empty string, got ${typeof eventPayload.event_label} (value: "${eventPayload.event_label}")`
    ).toBe(true);
  });

  test('currency is present and is a non-empty string', async () => {
    expect(
      eventPayload.currency !== undefined && eventPayload.currency !== null,
      `currency must be present, got ${eventPayload.currency}`
    ).toBe(true);
    expect(
      typeof eventPayload.currency === 'string' && eventPayload.currency.length > 0,
      `currency must be a non-empty string, got ${typeof eventPayload.currency} (value: "${eventPayload.currency}")`
    ).toBe(true);
  });

  test('value is present and is a number', async () => {
    expect(
      eventPayload.value !== undefined && eventPayload.value !== null,
      `value must be present, got ${eventPayload.value}`
    ).toBe(true);
    expect(
      typeof eventPayload.value === 'number' && !isNaN(eventPayload.value),
      `value must be a number, got ${typeof eventPayload.value} (value: ${eventPayload.value})`
    ).toBe(true);
  });

  test('items array is present and not empty', async () => {
    expect(
      Array.isArray(eventPayload.items),
      `items must be an array, got ${typeof eventPayload.items}`
    ).toBe(true);
    expect(
      eventPayload.items.length > 0,
      `items array must not be empty, got length ${eventPayload.items.length}`
    ).toBe(true);
  });

  test('items[0].item_id is present and is a non-empty string', async () => {
    const item = eventPayload.items[0];
    expect(
      item.item_id !== undefined && item.item_id !== null,
      `items[0].item_id must be present, got ${item.item_id}`
    ).toBe(true);
    expect(
      typeof item.item_id === 'string' && item.item_id.length > 0,
      `items[0].item_id must be a non-empty string, got ${typeof item.item_id} (value: "${item.item_id}")`
    ).toBe(true);
  });

  test('items[0].item_name is present and is a non-empty string', async () => {
    const item = eventPayload.items[0];
    expect(
      item.item_name !== undefined && item.item_name !== null,
      `items[0].item_name must be present, got ${item.item_name}`
    ).toBe(true);
    expect(
      typeof item.item_name === 'string' && item.item_name.length > 0,
      `items[0].item_name must be a non-empty string, got ${typeof item.item_name} (value: "${item.item_name}")`
    ).toBe(true);
  });

  test('items[0].item_brand is present and is a non-empty string', async () => {
    const item = eventPayload.items[0];
    expect(
      item.item_brand !== undefined && item.item_brand !== null,
      `items[0].item_brand must be present, got ${item.item_brand}`
    ).toBe(true);
    expect(
      typeof item.item_brand === 'string' && item.item_brand.length > 0,
      `items[0].item_brand must be a non-empty string, got ${typeof item.item_brand} (value: "${item.item_brand}")`
    ).toBe(true);
  });

  test('items[0].item_category is present and is a non-empty string', async () => {
    const item = eventPayload.items[0];
    expect(
      item.item_category !== undefined && item.item_category !== null,
      `items[0].item_category must be present, got ${item.item_category}`
    ).toBe(true);
    expect(
      typeof item.item_category === 'string' && item.item_category.length > 0,
      `items[0].item_category must be a non-empty string, got ${typeof item.item_category} (value: "${item.item_category}")`
    ).toBe(true);
  });

  test('items[0].price is present and is a number', async () => {
    const item = eventPayload.items[0];
    expect(
      item.price !== undefined && item.price !== null,
      `items[0].price must be present, got ${item.price}`
    ).toBe(true);
    expect(
      typeof item.price === 'number' && !isNaN(item.price),
      `items[0].price must be a number, got ${typeof item.price} (value: ${item.price})`
    ).toBe(true);
  });

  test('event_label matches items[0].item_name', async () => {
    const item = eventPayload.items[0];
    expect(
      eventPayload.event_label === item.item_name,
      `event_label should match items[0].item_name, got event_label="${eventPayload.event_label}" vs item_name="${item.item_name}"`
    ).toBe(true);
  });

  test('value matches items[0].price', async () => {
    const item = eventPayload.items[0];
    expect(
      eventPayload.value === item.price,
      `value should match items[0].price, got value=${eventPayload.value} vs price=${item.price}`
    ).toBe(true);
  });
});
