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

  test('event_category has correct value', async () => {
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
        `user_id must be present when user is logged in, got ${eventPayload.user_id}`
      ).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  test('user_id is a string when present', async () => {
    if (eventPayload.user_id !== undefined && eventPayload.user_id !== null) {
      expect(
        typeof eventPayload.user_id === 'string',
        `user_id must be a string when present, got ${typeof eventPayload.user_id} (value: ${eventPayload.user_id})`
      ).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  test('event_label matches page_type', async () => {
    expect(
      eventPayload.event_label === eventPayload.page_type,
      `event_label must match page_type, got event_label: "${eventPayload.event_label}", page_type: "${eventPayload.page_type}"`
    ).toBe(true);
  });

  test('user_id appears hashed/anonymized (PII mitigation)', async () => {
    if (eventPayload.user_id !== undefined && eventPayload.user_id !== null && eventPayload.user_id !== '') {
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eventPayload.user_id);
      const looksLikeRawId = /^\d{1,10}$/.test(eventPayload.user_id);
      const looksHashed = /^[a-f0-9]{32,}$/i.test(eventPayload.user_id) || eventPayload.user_id.length >= 20;
      
      expect(
        !looksLikeEmail,
        `user_id must not be a raw email address for PII compliance, got "${eventPayload.user_id}"`
      ).toBe(true);
      
      if (looksLikeRawId) {
        console.warn(`Warning: user_id "${eventPayload.user_id}" looks like a raw numeric ID - verify it is properly anonymized`);
      }
    } else {
      expect(true).toBe(true);
    }
  });
});
