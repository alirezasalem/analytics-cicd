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

test.describe('page_view', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    eventPayload = await waitForDataLayerEvent(page, 'page_view');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event "page_view" not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name should be "page_view", got "${eventPayload.event}"`
    ).toBe('page_view');
  });

  test('event_category is present and equals "navigation"', async () => {
    expect(
      eventPayload.event_category,
      `event_category should be "navigation", got "${eventPayload.event_category}"`
    ).toBe('navigation');
  });

  test('event_label is present and is a non-empty string', async () => {
    expect(
      eventPayload.event_label !== undefined && eventPayload.event_label !== null,
      `event_label should be present, got ${eventPayload.event_label}`
    ).toBe(true);
    expect(
      typeof eventPayload.event_label === 'string',
      `event_label should be a string, got ${typeof eventPayload.event_label} (value: ${eventPayload.event_label})`
    ).toBe(true);
    expect(
      eventPayload.event_label.length > 0,
      `event_label should be non-empty, got "${eventPayload.event_label}"`
    ).toBe(true);
  });

  test('page_type is present and is a non-empty string', async () => {
    expect(
      eventPayload.page_type !== undefined && eventPayload.page_type !== null,
      `page_type should be present, got ${eventPayload.page_type}`
    ).toBe(true);
    expect(
      typeof eventPayload.page_type === 'string',
      `page_type should be a string, got ${typeof eventPayload.page_type} (value: ${eventPayload.page_type})`
    ).toBe(true);
    expect(
      eventPayload.page_type.length > 0,
      `page_type should be non-empty, got "${eventPayload.page_type}"`
    ).toBe(true);
  });

  test('page_category is present and is a non-empty string', async () => {
    expect(
      eventPayload.page_category !== undefined && eventPayload.page_category !== null,
      `page_category should be present, got ${eventPayload.page_category}`
    ).toBe(true);
    expect(
      typeof eventPayload.page_category === 'string',
      `page_category should be a string, got ${typeof eventPayload.page_category} (value: ${eventPayload.page_category})`
    ).toBe(true);
    expect(
      eventPayload.page_category.length > 0,
      `page_category should be non-empty, got "${eventPayload.page_category}"`
    ).toBe(true);
  });

  test('user_login_status is present and is a non-empty string', async () => {
    expect(
      eventPayload.user_login_status !== undefined && eventPayload.user_login_status !== null,
      `user_login_status should be present, got ${eventPayload.user_login_status}`
    ).toBe(true);
    expect(
      typeof eventPayload.user_login_status === 'string',
      `user_login_status should be a string, got ${typeof eventPayload.user_login_status} (value: ${eventPayload.user_login_status})`
    ).toBe(true);
    expect(
      eventPayload.user_login_status.length > 0,
      `user_login_status should be non-empty, got "${eventPayload.user_login_status}"`
    ).toBe(true);
  });

  test('user_id is present and is a string', async () => {
    expect(
      eventPayload.user_id !== undefined && eventPayload.user_id !== null,
      `user_id should be present, got ${eventPayload.user_id}`
    ).toBe(true);
    expect(
      typeof eventPayload.user_id === 'string',
      `user_id should be a string, got ${typeof eventPayload.user_id} (value: ${eventPayload.user_id})`
    ).toBe(true);
  });

  test('user_id does not contain raw email (PII compliance)', async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(
      !emailRegex.test(eventPayload.user_id),
      `user_id should not be a raw email address for PII compliance, got "${eventPayload.user_id}"`
    ).toBe(true);
  });

  test('user_id does not contain raw phone number (PII compliance)', async () => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    expect(
      !phoneRegex.test(eventPayload.user_id),
      `user_id should not be a raw phone number for PII compliance, got "${eventPayload.user_id}"`
    ).toBe(true);
  });

  test('user_id appears to be hashed (PII mitigation)', async () => {
    // If user_id is populated, it should look like a hash (alphanumeric, typically 32+ chars)
    // Empty string is acceptable if user is not logged in
    if (eventPayload.user_id && eventPayload.user_id.length > 0) {
      const hashPattern = /^[a-f0-9]{32,}$/i;
      const isLikelyHashed = hashPattern.test(eventPayload.user_id) || eventPayload.user_id.length >= 32;
      expect(
        isLikelyHashed,
        `user_id should be hashed/anonymized per GDPR/CCPA requirements, got "${eventPayload.user_id}" which doesn't appear to be a hash`
      ).toBe(true);
    }
  });

  test.skip('SPA navigation triggers page_view on route change', async () => {
    // This test requires custom SPA navigation setup
    // Per gtm_notes: "Use History Change trigger for SPA navigation"
    // Implement SPA route change logic specific to your application
  });
});
