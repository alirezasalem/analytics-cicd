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
      `ecommerce object must be present, got ${eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.transaction_id is present', async () => {
    expect(
      eventPayload.ecommerce?.transaction_id !== undefined && eventPayload.ecommerce?.transaction_id !== null,
      `ecommerce.transaction_id must be present, got ${eventPayload.ecommerce?.transaction_id}`
    ).toBe(true);
  });

  test('ecommerce.transaction_id is a non-empty string', async () => {
    const value = eventPayload.ecommerce?.transaction_id;
    expect(
      typeof value === 'string' && value.length > 0,
      `ecommerce.transaction_id must be a non-empty string, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.value is present', async () => {
    expect(
      eventPayload.ecommerce?.value !== undefined && eventPayload.ecommerce?.value !== null,
      `ecommerce.value must be present, got ${eventPayload.ecommerce?.value}`
    ).toBe(true);
  });

  test('ecommerce.value is a number', async () => {
    const value = eventPayload.ecommerce?.value;
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.value must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.tax is present', async () => {
    expect(
      eventPayload.ecommerce?.tax !== undefined && eventPayload.ecommerce?.tax !== null,
      `ecommerce.tax must be present, got ${eventPayload.ecommerce?.tax}`
    ).toBe(true);
  });

  test('ecommerce.tax is a number', async () => {
    const value = eventPayload.ecommerce?.tax;
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.tax must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.shipping is present', async () => {
    expect(
      eventPayload.ecommerce?.shipping !== undefined && eventPayload.ecommerce?.shipping !== null,
      `ecommerce.shipping must be present, got ${eventPayload.ecommerce?.shipping}`
    ).toBe(true);
  });

  test('ecommerce.shipping is a number', async () => {
    const value = eventPayload.ecommerce?.shipping;
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.shipping must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.currency is present', async () => {
    expect(
      eventPayload.ecommerce?.currency !== undefined && eventPayload.ecommerce?.currency !== null,
      `ecommerce.currency must be present, got ${eventPayload.ecommerce?.currency}`
    ).toBe(true);
  });

  test('ecommerce.currency is a non-empty string', async () => {
    const value = eventPayload.ecommerce?.currency;
    expect(
      typeof value === 'string' && value.length > 0,
      `ecommerce.currency must be a non-empty string, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.currency is a valid ISO 4217 code', async () => {
    const value = eventPayload.ecommerce?.currency;
    const iso4217Pattern = /^[A-Z]{3}$/;
    expect(
      typeof value === 'string' && iso4217Pattern.test(value),
      `ecommerce.currency must be a valid 3-letter ISO 4217 currency code, got "${value}"`
    ).toBe(true);
  });

  test('ecommerce.coupon is present if provided', async () => {
    const value = eventPayload.ecommerce?.coupon;
    if (value !== undefined && value !== null && value !== '') {
      expect(
        typeof value === 'string',
        `ecommerce.coupon must be a string when provided, got ${typeof value} (value: ${value})`
      ).toBe(true);
    }
  });

  test('ecommerce.items is present', async () => {
    expect(
      eventPayload.ecommerce?.items !== undefined && eventPayload.ecommerce?.items !== null,
      `ecommerce.items must be present, got ${eventPayload.ecommerce?.items}`
    ).toBe(true);
  });

  test('ecommerce.items is an array', async () => {
    const value = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(value),
      `ecommerce.items must be an array, got ${typeof value} (value: ${JSON.stringify(value)})`
    ).toBe(true);
  });

  test('ecommerce.items array is non-empty', async () => {
    const value = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(value) && value.length > 0,
      `ecommerce.items must be a non-empty array, got length ${value?.length}`
    ).toBe(true);
  });

  test('each item in ecommerce.items has required item_id', async () => {
    const items = eventPayload.ecommerce?.items || [];
    items.forEach((item, index) => {
      expect(
        item.item_id !== undefined && item.item_id !== null,
        `ecommerce.items[${index}].item_id must be present, got ${item.item_id}`
      ).toBe(true);
    });
  });

  test('each item in ecommerce.items has required item_name', async () => {
    const items = eventPayload.ecommerce?.items || [];
    items.forEach((item, index) => {
      expect(
        item.item_name !== undefined && item.item_name !== null && typeof item.item_name === 'string',
        `ecommerce.items[${index}].item_name must be a string, got ${typeof item.item_name} (value: ${item.item_name})`
      ).toBe(true);
    });
  });

  test('each item in ecommerce.items has required price as number', async () => {
    const items = eventPayload.ecommerce?.items || [];
    items.forEach((item, index) => {
      expect(
        typeof item.price === 'number' && !isNaN(item.price),
        `ecommerce.items[${index}].price must be a number, got ${typeof item.price} (value: ${item.price})`
      ).toBe(true);
    });
  });

  test('each item in ecommerce.items has required quantity as number', async () => {
    const items = eventPayload.ecommerce?.items || [];
    items.forEach((item, index) => {
      expect(
        typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0,
        `ecommerce.items[${index}].quantity must be a positive number, got ${typeof item.quantity} (value: ${item.quantity})`
      ).toBe(true);
    });
  });

  test('each item in ecommerce.items has required item_category', async () => {
    const items = eventPayload.ecommerce?.items || [];
    items.forEach((item, index) => {
      expect(
        item.item_category !== undefined && item.item_category !== null && typeof item.item_category === 'string',
        `ecommerce.items[${index}].item_category must be a string, got ${typeof item.item_category} (value: ${item.item_category})`
      ).toBe(true);
    });
  });

  test('transaction_id is unique (no duplicate purchase events with same ID)', async ({ page }) => {
    const allPurchaseEvents = await getAllDataLayerEvents(page, 'purchase');
    const transactionIds = allPurchaseEvents.map(e => e.ecommerce?.transaction_id).filter(Boolean);
    const uniqueIds = [...new Set(transactionIds)];
    expect(
      transactionIds.length === uniqueIds.length,
      `duplicate transaction_id detected in dataLayer: ${JSON.stringify(transactionIds)}`
    ).toBe(true);
  });
});
