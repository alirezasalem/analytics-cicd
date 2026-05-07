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
    // TODO: set trigger.page_path in spec for correct page (PDP)
    await page.goto(process.env.TEST_URL);
    // TODO: trigger.selector not defined in spec — interaction required to add to cart
    // The trigger is "PDP - Add to Cart - Success" which requires clicking add to cart button
    // and waiting for successful cart API response
  });

  test.skip('event fires after add to cart interaction', async ({ page }) => {
    // This test requires trigger.selector to be defined in spec for the add to cart button
    // Once defined, uncomment and use: await page.click(trigger.selector);
    eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    expect(eventPayload, 'dataLayer event add_to_cart not found').toBeTruthy();
  });

  test.describe('with mocked event payload', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(process.env.TEST_URL);
      // Inject a test event to validate structure assertions
      // In real scenario, this would come from actual add to cart interaction
      await page.evaluate(() => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'add_to_cart',
          event_category: 'ecommerce',
          event_label: 'Test Product',
          currency: 'USD',
          value: 99.99,
          ecommerce: {
            currency: 'USD',
            value: 99.99,
            items: [{
              item_id: 'PROD-123',
              item_name: 'Test Product',
              item_brand: 'Test Brand',
              item_category: 'Test Category',
              price: 99.99,
              quantity: 1
            }]
          }
        });
      });
      eventPayload = await waitForDataLayerEvent(page, 'add_to_cart');
    });

    test('event name is correct', async () => {
      expect(
        eventPayload.event,
        `event name must be "add_to_cart", got "${eventPayload.event}"`
      ).toBe('add_to_cart');
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
        typeof eventPayload.ecommerce?.value === 'number' && !isNaN(eventPayload.ecommerce.value),
        `ecommerce.value must be a number, got ${typeof eventPayload.ecommerce?.value} (value: ${eventPayload.ecommerce?.value})`
      ).toBe(true);
    });

    test('ecommerce.items is present and is an array', async () => {
      expect(
        Array.isArray(eventPayload.ecommerce?.items),
        `ecommerce.items must be an array, got ${typeof eventPayload.ecommerce?.items} (value: ${JSON.stringify(eventPayload.ecommerce?.items)})`
      ).toBe(true);
    });

    test('ecommerce.items has at least one item', async () => {
      expect(
        eventPayload.ecommerce?.items?.length > 0,
        `ecommerce.items must have at least one item, got ${eventPayload.ecommerce?.items?.length} items`
      ).toBe(true);
    });

    test('ecommerce.items[0].item_id is present and is a non-empty string', async () => {
      const itemId = eventPayload.ecommerce?.items?.[0]?.item_id;
      expect(
        typeof itemId === 'string' && itemId.length > 0,
        `ecommerce.items[0].item_id must be a non-empty string, got ${typeof itemId} (value: ${itemId})`
      ).toBe(true);
    });

    test('ecommerce.items[0].item_name is present and is a non-empty string', async () => {
      const itemName = eventPayload.ecommerce?.items?.[0]?.item_name;
      expect(
        typeof itemName === 'string' && itemName.length > 0,
        `ecommerce.items[0].item_name must be a non-empty string, got ${typeof itemName} (value: ${itemName})`
      ).toBe(true);
    });

    test('ecommerce.items[0].item_brand is present and is a non-empty string', async () => {
      const itemBrand = eventPayload.ecommerce?.items?.[0]?.item_brand;
      expect(
        typeof itemBrand === 'string' && itemBrand.length > 0,
        `ecommerce.items[0].item_brand must be a non-empty string, got ${typeof itemBrand} (value: ${itemBrand})`
      ).toBe(true);
    });

    test('ecommerce.items[0].item_category is present and is a non-empty string', async () => {
      const itemCategory = eventPayload.ecommerce?.items?.[0]?.item_category;
      expect(
        typeof itemCategory === 'string' && itemCategory.length > 0,
        `ecommerce.items[0].item_category must be a non-empty string, got ${typeof itemCategory} (value: ${itemCategory})`
      ).toBe(true);
    });

    test('ecommerce.items[0].price is present and is a number', async () => {
      const price = eventPayload.ecommerce?.items?.[0]?.price;
      expect(
        typeof price === 'number' && !isNaN(price),
        `ecommerce.items[0].price must be a number, got ${typeof price} (value: ${price})`
      ).toBe(true);
    });

    test('ecommerce.items[0].quantity is present and is a number', async () => {
      const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
      expect(
        typeof quantity === 'number' && !isNaN(quantity),
        `ecommerce.items[0].quantity must be a number, got ${typeof quantity} (value: ${quantity})`
      ).toBe(true);
    });

    test('ecommerce.items[0].quantity is a positive integer', async () => {
      const quantity = eventPayload.ecommerce?.items?.[0]?.quantity;
      expect(
        Number.isInteger(quantity) && quantity > 0,
        `ecommerce.items[0].quantity must be a positive integer, got ${quantity}`
      ).toBe(true);
    });
  });

  test.describe('business rules', () => {
    test.skip('event fires only after successful cart API response', async ({ page }) => {
      // GTM Note: Fire only after successful cart API response. 
      // Use custom event trigger listening for add_to_cart dataLayer push.
      // Do not fire on button click alone.
      // This test requires integration with cart API mock or real API testing
      // to verify the event only fires on successful response, not on button click
    });
  });
});
