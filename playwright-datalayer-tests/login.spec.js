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

test.describe('login', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    // TODO: confirm selector with engineering - login form selector not specified in spec
    // Attempting to interact with a login form and submit
    await page.locator('form[action*="login"], form#login, form.login-form, [data-testid="login-form"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.locator('input[type="email"], input[type="text"][name*="email"], input[name*="username"]').first().fill('test@example.com').catch(() => {});
    await page.locator('input[type="password"]').first().fill('testpassword123').catch(() => {});
    await page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click().catch(() => {});
    eventPayload = await waitForDataLayerEvent(page, 'login');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event "login" not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "login", got "${eventPayload.event}"`
    ).toBe('login');
  });

  test('event_category is present and equals "authentication"', async () => {
    expect(
      eventPayload.event_category,
      `event_category must be "authentication", got "${eventPayload.event_category}"`
    ).toBe('authentication');
  });

  test('event_label is present and is a non-empty string', async () => {
    expect(
      eventPayload.event_label !== undefined && eventPayload.event_label !== null,
      `event_label must be present, got ${eventPayload.event_label}`
    ).toBe(true);
    expect(
      typeof eventPayload.event_label === 'string',
      `event_label must be a string, got ${typeof eventPayload.event_label} (value: ${eventPayload.event_label})`
    ).toBe(true);
    expect(
      eventPayload.event_label.length > 0,
      `event_label must be non-empty, got empty string`
    ).toBe(true);
  });

  test('user_id is present and is a non-empty string', async () => {
    expect(
      eventPayload.user_id !== undefined && eventPayload.user_id !== null,
      `user_id must be present, got ${eventPayload.user_id}`
    ).toBe(true);
    expect(
      typeof eventPayload.user_id === 'string',
      `user_id must be a string, got ${typeof eventPayload.user_id} (value: ${eventPayload.user_id})`
    ).toBe(true);
    expect(
      eventPayload.user_id.length > 0,
      `user_id must be non-empty, got empty string`
    ).toBe(true);
  });

  test('method is present and is a non-empty string', async () => {
    expect(
      eventPayload.method !== undefined && eventPayload.method !== null,
      `method must be present, got ${eventPayload.method}`
    ).toBe(true);
    expect(
      typeof eventPayload.method === 'string',
      `method must be a string, got ${typeof eventPayload.method} (value: ${eventPayload.method})`
    ).toBe(true);
    expect(
      eventPayload.method.length > 0,
      `method must be non-empty, got empty string`
    ).toBe(true);
  });

  test('user_id is not a cleartext email (PII mitigation)', async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(
      !emailRegex.test(eventPayload.user_id),
      `user_id must not be a cleartext email address (PII violation), got "${eventPayload.user_id}"`
    ).toBe(true);
  });

  test('user_id is not a cleartext username pattern (PII mitigation)', async () => {
    // Check that user_id appears to be hashed or an internal ID (contains numbers/hex characters, not plain readable text)
    const looksLikeHashOrId = /^[a-f0-9-]{8,}$/i.test(eventPayload.user_id) || /^\d+$/.test(eventPayload.user_id);
    const looksLikePlainUsername = /^[a-zA-Z][a-zA-Z0-9_]{2,}$/.test(eventPayload.user_id) && !/\d{4,}/.test(eventPayload.user_id);
    expect(
      !looksLikePlainUsername || looksLikeHashOrId,
      `user_id should be hashed or internal database ID, not a plain username. Got "${eventPayload.user_id}"`
    ).toBe(true);
  });

  test('user_id is not a phone number (PII mitigation)', async () => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    expect(
      !phoneRegex.test(eventPayload.user_id),
      `user_id must not be a phone number (PII violation), got "${eventPayload.user_id}"`
    ).toBe(true);
  });
});
