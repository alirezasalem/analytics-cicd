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

test.describe('add_payment_info', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    // TODO: confirm selector with engineering - payment submission button selector not specified
    const paymentButton = page.locator('[data-testid="payment-submit"], button[type="submit"]:has-text("Pay"), .payment-submit-btn');
    await paymentButton.click();
    eventPayload = await waitForDataLayerEvent(page, 'add_payment_info');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event add_payment_info not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name should be "add_payment_info", got "${eventPayload.event}"`
    ).toBe('add_payment_info');
  });

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${typeof eventPayload.ecommerce}`
    ).toBe(true);
  });

  test('ecommerce.currency is a non-empty string', async () => {
    const currency = eventPayload.ecommerce?.currency;
    expect(
      typeof currency === 'string' && currency.length > 0,
      `ecommerce.currency must be a non-empty string, got ${typeof currency} (value: ${currency})`
    ).toBe(true);
  });

  test('ecommerce.value is a number', async () => {
    const value = eventPayload.ecommerce?.value;
    expect(
      typeof value === 'number' && !isNaN(value),
      `ecommerce.value must be a number, got ${typeof value} (value: ${value})`
    ).toBe(true);
  });

  test('ecommerce.coupon is present', async () => {
    const coupon = eventPayload.ecommerce?.coupon;
    expect(
      coupon !== undefined,
      `ecommerce.coupon must be present (can be empty string or null if no coupon), got ${typeof coupon}`
    ).toBe(true);
  });

  test('ecommerce.coupon is a string when provided', async () => {
    const coupon = eventPayload.ecommerce?.coupon;
    if (coupon !== null && coupon !== '') {
      expect(
        typeof coupon === 'string',
        `ecommerce.coupon must be a string when provided, got ${typeof coupon} (value: ${coupon})`
      ).toBe(true);
    }
  });

  test('ecommerce.payment_type is a non-empty string', async () => {
    const paymentType = eventPayload.ecommerce?.payment_type;
    expect(
      typeof paymentType === 'string' && paymentType.length > 0,
      `ecommerce.payment_type must be a non-empty string, got ${typeof paymentType} (value: ${paymentType})`
    ).toBe(true);
  });

  test('ecommerce.items is an array', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(items),
      `ecommerce.items must be an array, got ${typeof items} (value: ${JSON.stringify(items)})`
    ).toBe(true);
  });

  test('ecommerce.items array is not empty', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(items) && items.length > 0,
      `ecommerce.items must not be empty, got ${items?.length || 0} items`
    ).toBe(true);
  });

  test('ecommerce.items contain required item properties', async () => {
    const items = eventPayload.ecommerce?.items;
    if (Array.isArray(items) && items.length > 0) {
      const firstItem = items[0];
      expect(
        firstItem.item_id !== undefined || firstItem.item_name !== undefined,
        `ecommerce.items must contain item_id or item_name, got: ${JSON.stringify(firstItem)}`
      ).toBe(true);
    }
  });

  test('event fires only after payment validation (fires exactly once per submission)', async ({ page }) => {
    const allEvents = await getAllDataLayerEvents(page, 'add_payment_info');
    expect(
      allEvents.length === 1,
      `add_payment_info should fire exactly once after payment validation, found ${allEvents.length} occurrences`
    ).toBe(true);
  });
});
