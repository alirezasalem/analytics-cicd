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
      `event name should be "view_item", got "${eventPayload.event}"`
    ).toBe('view_item');
  });

  test('event_category is present and equals "ecommerce"', async () => {
    expect(
      eventPayload.event_category,
      `event_category should be "ecommerce", got "${eventPayload.event_category}"`
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

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.currency is present and is a non-empty string', async () => {
    expect(
      typeof eventPayload.ecommerce?.currency === 'string' && eventPayload.ecommerce.currency.length > 0,
      `ecommerce.currency must be a non-empty string, got ${typeof eventPayload.ecommerce?.currency} (value: ${eventPayload.ecommerce?.currency})`
    ).toBe(true);
  });

  test('ecommerce.value is present and is a number', async () => {
    expect(
      typeof eventPayload.ecommerce?.value === 'number' && !isNaN(eventPayload.ecommerce?.value),
      `ecommerce.value must be a number, got ${typeof eventPayload.ecommerce?.value} (value: ${eventPayload.ecommerce?.value})`
    ).toBe(true);
  });

  test('ecommerce.items is present and is an array', async () => {
    expect(
      Array.isArray(eventPayload.ecommerce?.items),
      `ecommerce.items must be an array, got ${typeof eventPayload.ecommerce?.items} (value: ${eventPayload.ecommerce?.items})`
    ).toBe(true);
  });

  test('ecommerce.items has at least one item', async () => {
    expect(
      eventPayload.ecommerce?.items?.length > 0,
      `ecommerce.items must have at least one item, got length ${eventPayload.ecommerce?.items?.length}`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_id is present and is a non-empty string', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_id === 'string' && item.item_id.length > 0,
      `ecommerce.items[0].item_id must be a non-empty string, got ${typeof item?.item_id} (value: ${item?.item_id})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_name is present and is a non-empty string', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_name === 'string' && item.item_name.length > 0,
      `ecommerce.items[0].item_name must be a non-empty string, got ${typeof item?.item_name} (value: ${item?.item_name})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_brand is present and is a non-empty string', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_brand === 'string' && item.item_brand.length > 0,
      `ecommerce.items[0].item_brand must be a non-empty string, got ${typeof item?.item_brand} (value: ${item?.item_brand})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_category is present and is a non-empty string', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_category === 'string' && item.item_category.length > 0,
      `ecommerce.items[0].item_category must be a non-empty string, got ${typeof item?.item_category} (value: ${item?.item_category})`
    ).toBe(true);
  });

  test('ecommerce.items[0].price is present and is a number', async () => {
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.price === 'number' && !isNaN(item?.price),
      `ecommerce.items[0].price must be a number, got ${typeof item?.price} (value: ${item?.price})`
    ).toBe(true);
  });
});
