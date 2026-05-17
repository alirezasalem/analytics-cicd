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

test.describe('sign_up', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    // TODO: confirm selector with engineering - spec indicates NEEDS_CLARIFICATION
    // This selector targets a common signup form pattern - adjust as needed
    const signupForm = page.locator('form[data-testid="signup-form"], form.signup-form, #signup-form');
    
    // Fill signup form fields if present
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('testuser_' + Date.now() + '@example.com');
    }
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('TestPassword123!');
    }
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
    }
    
    eventPayload = await waitForDataLayerEvent(page, 'sign_up');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "sign_up", got "${eventPayload.event}"`
    ).toBe('sign_up');
  });

  test('event_category is present and equals "user_lifecycle"', async () => {
    expect(
      eventPayload.event_category,
      `event_category must be "user_lifecycle", got "${eventPayload.event_category}"`
    ).toBe('user_lifecycle');
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

  test('user_id does not contain PII (email pattern)', async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(
      emailRegex.test(eventPayload.user_id),
      `user_id must not be a raw email address (PII), got "${eventPayload.user_id}"`
    ).toBe(false);
  });

  test('user_id does not contain PII (phone pattern)', async () => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    expect(
      phoneRegex.test(eventPayload.user_id),
      `user_id must not be a raw phone number (PII), got "${eventPayload.user_id}"`
    ).toBe(false);
  });

  test('event_label matches method value', async () => {
    expect(
      eventPayload.event_label,
      `event_label should match method value. event_label: "${eventPayload.event_label}", method: "${eventPayload.method}"`
    ).toBe(eventPayload.method);
  });
});
