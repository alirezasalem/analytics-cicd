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
    // TODO: set trigger.page_path in spec for correct page (should be a PDP)
    await page.goto(process.env.TEST_URL);
    // TODO: trigger.selector not defined in spec — interaction requires clicking Add to Cart button
    // The spec states this fires on "PDP - Add to Cart - Success" after cart API response
    // Manual interaction or selector needed to trigger the add_to_cart event
  });

  test('event fires after add to cart interaction', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test. Event fires after successful cart API response, not on button click alone.');
  });

  test('event name is correct', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      eventPayload.event,
      `event name must be "add_to_cart", got "${eventPayload.event}"`
    ).toBe('add_to_cart');
  });

  test('event_category is present and equals "ecommerce"', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      eventPayload.event_category,
      `event_category must be "ecommerce", got "${eventPayload.event_category}"`
    ).toBe('ecommerce');
  });

  test('event_label is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      typeof eventPayload.event_label === 'string' && eventPayload.event_label.length > 0,
      `event_label must be a non-empty string, got ${typeof eventPayload.event_label} (value: ${eventPayload.event_label})`
    ).toBe(true);
  });

  test('currency is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      typeof eventPayload.currency === 'string' && eventPayload.currency.length > 0,
      `currency must be a non-empty string, got ${typeof eventPayload.currency} (value: ${eventPayload.currency})`
    ).toBe(true);
  });

  test('value is present and is a number', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      typeof eventPayload.value === 'number' && !isNaN(eventPayload.value),
      `value must be a number, got ${typeof eventPayload.value} (value: ${eventPayload.value})`
    ).toBe(true);
  });

  test('ecommerce object is present', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.currency is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      typeof eventPayload.ecommerce?.currency === 'string' && eventPayload.ecommerce.currency.length > 0,
      `ecommerce.currency must be a non-empty string, got ${typeof eventPayload.ecommerce?.currency} (value: ${eventPayload.ecommerce?.currency})`
    ).toBe(true);
  });

  test('ecommerce.value is present and is a number', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      typeof eventPayload.ecommerce?.value === 'number' && !isNaN(eventPayload.ecommerce.value),
      `ecommerce.value must be a number, got ${typeof eventPayload.ecommerce?.value} (value: ${eventPayload.ecommerce?.value})`
    ).toBe(true);
  });

  test('ecommerce.items is present and is a non-empty array', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(
      Array.isArray(eventPayload.ecommerce?.items) && eventPayload.ecommerce.items.length > 0,
      `ecommerce.items must be a non-empty array, got ${JSON.stringify(eventPayload.ecommerce?.items)}`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_id is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_id === 'string' && item.item_id.length > 0,
      `ecommerce.items[0].item_id must be a non-empty string, got ${typeof item?.item_id} (value: ${item?.item_id})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_name is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_name === 'string' && item.item_name.length > 0,
      `ecommerce.items[0].item_name must be a non-empty string, got ${typeof item?.item_name} (value: ${item?.item_name})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_brand is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_brand === 'string' && item.item_brand.length > 0,
      `ecommerce.items[0].item_brand must be a non-empty string, got ${typeof item?.item_brand} (value: ${item?.item_brand})`
    ).toBe(true);
  });

  test('ecommerce.items[0].item_category is present and is a non-empty string', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.item_category === 'string' && item.item_category.length > 0,
      `ecommerce.items[0].item_category must be a non-empty string, got ${typeof item?.item_category} (value: ${item?.item_category})`
    ).toBe(true);
  });

  test('ecommerce.items[0].price is present and is a number', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.price === 'number' && !isNaN(item.price),
      `ecommerce.items[0].price must be a number, got ${typeof item?.price} (value: ${item?.price})`
    ).toBe(true);
  });

  test('ecommerce.items[0].quantity is present and is a number', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      typeof item?.quantity === 'number' && !isNaN(item.quantity),
      `ecommerce.items[0].quantity must be a number, got ${typeof item?.quantity} (value: ${item?.quantity})`
    ).toBe(true);
  });

  test('ecommerce.items[0].quantity is a positive integer', async ({ page }) => {
    test.skip(true, 'trigger.selector not defined in spec — add it to enable this test');
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    const item = eventPayload.ecommerce?.items?.[0];
    expect(
      Number.isInteger(item?.quantity) && item.quantity > 0,
      `ecommerce.items[0].quantity must be a positive integer, got ${item?.quantity}`
    ).toBe(true);
  });

  test('event fires only after successful cart API response (not on button click alone)', async ({ page }) => {
    test.skip(true, 'fire_on_api_success_only — requires mocking or intercepting cart API to verify event timing. Add trigger.selector and API intercept logic to enable this test.');
  });
});
