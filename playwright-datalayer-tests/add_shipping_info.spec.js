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

test.describe('add_shipping_info', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    // TODO: confirm selector with engineering - spec indicates NEEDS_CLARIFICATION
    // Using best-guess selector for shipping form submission button
    const shippingButton = page.locator('button:has-text("Continue to Payment"), button:has-text("Save Shipping"), button[type="submit"]').first();
    await shippingButton.click();
    eventPayload = await waitForDataLayerEvent(page, 'add_shipping_info');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event add_shipping_info not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "add_shipping_info", got "${eventPayload.event}"`
    ).toBe('add_shipping_info');
  });

  test('ecommerce object is present', async () => {
    expect(
      eventPayload.ecommerce !== undefined && eventPayload.ecommerce !== null,
      `ecommerce object must be present, got ${JSON.stringify(eventPayload.ecommerce)}`
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
    // coupon can be empty string if no coupon applied, but key should exist
    expect(
      coupon !== undefined,
      `ecommerce.coupon must be present, got undefined`
    ).toBe(true);
  });

  test('ecommerce.coupon is a string when present', async () => {
    const coupon = eventPayload.ecommerce?.coupon;
    if (coupon !== null && coupon !== undefined) {
      expect(
        typeof coupon === 'string',
        `ecommerce.coupon must be a string, got ${typeof coupon} (value: ${coupon})`
      ).toBe(true);
    }
  });

  test('ecommerce.shipping_tier is a non-empty string', async () => {
    const shippingTier = eventPayload.ecommerce?.shipping_tier;
    expect(
      typeof shippingTier === 'string' && shippingTier.length > 0,
      `ecommerce.shipping_tier must be a non-empty string, got ${typeof shippingTier} (value: ${shippingTier})`
    ).toBe(true);
  });

  test('ecommerce.items is an array', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(items),
      `ecommerce.items must be an array, got ${typeof items} (value: ${JSON.stringify(items)})`
    ).toBe(true);
  });

  test('ecommerce.items is not empty', async () => {
    const items = eventPayload.ecommerce?.items;
    expect(
      Array.isArray(items) && items.length > 0,
      `ecommerce.items must have at least one item, got ${items?.length || 0} items`
    ).toBe(true);
  });

  test('shipping_tier does not contain PII - no email addresses', async () => {
    const shippingTier = eventPayload.ecommerce?.shipping_tier;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    expect(
      !emailRegex.test(shippingTier),
      `ecommerce.shipping_tier must not contain email addresses (PII), got: ${shippingTier}`
    ).toBe(true);
  });

  test('shipping_tier does not contain PII - no phone numbers', async () => {
    const shippingTier = eventPayload.ecommerce?.shipping_tier;
    const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    expect(
      !phoneRegex.test(shippingTier),
      `ecommerce.shipping_tier must not contain phone numbers (PII), got: ${shippingTier}`
    ).toBe(true);
  });

  test('shipping_tier does not contain PII - no street addresses', async () => {
    const shippingTier = eventPayload.ecommerce?.shipping_tier;
    // Basic check for common address patterns
    const addressRegex = /\d+\s+[a-zA-Z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/i;
    expect(
      !addressRegex.test(shippingTier),
      `ecommerce.shipping_tier must not contain street addresses (PII), got: ${shippingTier}`
    ).toBe(true);
  });

  test('coupon does not contain PII - no email addresses', async () => {
    const coupon = eventPayload.ecommerce?.coupon;
    if (coupon) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      expect(
        !emailRegex.test(coupon),
        `ecommerce.coupon must not contain email addresses (PII), got: ${coupon}`
      ).toBe(true);
    }
  });
});
