import { test, expect } from '@playwright/test';

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

test.describe('page_view', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    eventPayload = await waitForDataLayerEvent(page, 'page_view');
  });

  test('event name fires', async () => {
    expect(eventPayload, 'dataLayer event "page_view" not found').toBeTruthy();
  });

  test('event property is correct', async () => {
    expect(
      eventPayload.event,
      `event must be "page_view", got "${eventPayload.event}"`
    ).toBe('page_view');
  });

  test('event_category is present', async () => {
    expect(
      eventPayload.event_category !== undefined && eventPayload.event_category !== null,
      `event_category must be present, got ${eventPayload.event_category}`
    ).toBe(true);
  });

  test('event_category is a string', async () => {
    expect(
      typeof eventPayload.event_category === 'string' && eventPayload.event_category.length > 0,
      `event_category must be a non-empty string, got ${typeof eventPayload.event_category} (value: ${eventPayload.event_category})`
    ).toBe(true);
  });

  test('event_category equals "navigation"', async () => {
    expect(
      eventPayload.event_category,
      `event_category must be "navigation", got "${eventPayload.event_category}"`
    ).toBe('navigation');
  });

  test('event_label is present', async () => {
    expect(
      eventPayload.event_label !== undefined && eventPayload.event_label !== null,
      `event_label must be present, got ${eventPayload.event_label}`
    ).toBe(true);
  });

  test('event_label is a string', async () => {
    expect(
      typeof eventPayload.event_label === 'string',
      `event_label must be a string, got ${typeof eventPayload.event_label} (value: ${eventPayload.event_label})`
    ).toBe(true);
  });

  test('page_type is present', async () => {
    expect(
      eventPayload.page_type !== undefined && eventPayload.page_type !== null,
      `page_type must be present, got ${eventPayload.page_type}`
    ).toBe(true);
  });

  test('page_type is a string', async () => {
    expect(
      typeof eventPayload.page_type === 'string' && eventPayload.page_type.length > 0,
      `page_type must be a non-empty string, got ${typeof eventPayload.page_type} (value: ${eventPayload.page_type})`
    ).toBe(true);
  });

  test('page_category is present', async () => {
    expect(
      eventPayload.page_category !== undefined && eventPayload.page_category !== null,
      `page_category must be present, got ${eventPayload.page_category}`
    ).toBe(true);
  });

  test('page_category is a string', async () => {
    expect(
      typeof eventPayload.page_category === 'string' && eventPayload.page_category.length > 0,
      `page_category must be a non-empty string, got ${typeof eventPayload.page_category} (value: ${eventPayload.page_category})`
    ).toBe(true);
  });

  test('user_login_status is present', async () => {
    expect(
      eventPayload.user_login_status !== undefined && eventPayload.user_login_status !== null,
      `user_login_status must be present, got ${eventPayload.user_login_status}`
    ).toBe(true);
  });

  test('user_login_status is a string', async () => {
    expect(
      typeof eventPayload.user_login_status === 'string' && eventPayload.user_login_status.length > 0,
      `user_login_status must be a non-empty string, got ${typeof eventPayload.user_login_status} (value: ${eventPayload.user_login_status})`
    ).toBe(true);
  });

  test('user_id is present when user is logged in', async () => {
    if (eventPayload.user_login_status === 'logged_in' || eventPayload.user_login_status === 'authenticated') {
      expect(
        eventPayload.user_id !== undefined && eventPayload.user_id !== null,
        `user_id must be present when user_login_status is "${eventPayload.user_login_status}", got ${eventPayload.user_id}`
      ).toBe(true);
    }
  });

  test('user_id is a string when present', async () => {
    if (eventPayload.user_id !== undefined && eventPayload.user_id !== null) {
      expect(
        typeof eventPayload.user_id === 'string',
        `user_id must be a string when present, got ${typeof eventPayload.user_id} (value: ${eventPayload.user_id})`
      ).toBe(true);
    }
  });

  test('user_id appears hashed/anonymized (PII mitigation)', async () => {
    if (eventPayload.user_id !== undefined && eventPayload.user_id !== null && eventPayload.user_id.length > 0) {
      const hasEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eventPayload.user_id);
      const hasPhonePattern = /^\+?[\d\s\-()]{7,}$/.test(eventPayload.user_id);
      expect(
        !hasEmailPattern && !hasPhonePattern,
        `user_id appears to contain PII (email or phone). Value must be hashed/anonymized per GDPR/CCPA. Got: "${eventPayload.user_id}"`
      ).toBe(true);
    }
  });

  test('event_label matches page_type', async () => {
    expect(
      eventPayload.event_label,
      `event_label should match page_type. event_label: "${eventPayload.event_label}", page_type: "${eventPayload.page_type}"`
    ).toBe(eventPayload.page_type);
  });
});

test.describe('page_view - SPA navigation', () => {
  test.skip('fires on client-side route change', async ({ page }) => {
    // This test requires SPA navigation to be triggered
    // The spec indicates this event should fire on "client-side route changes"
    // Implementation depends on specific SPA navigation mechanism available on TEST_URL
    // Add appropriate navigation trigger and verify page_view fires again
  });
});
