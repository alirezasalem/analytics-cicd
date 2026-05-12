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

test.describe('scroll_depth', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    
    // Scroll to 50% of page height to trigger the scroll_depth event
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const targetScroll = (scrollHeight - viewportHeight) * 0.55; // Scroll past 50% threshold
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    eventPayload = await waitForDataLayerEvent(page, 'scroll_depth');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "scroll_depth", got "${eventPayload.event}"`
    ).toBe('scroll_depth');
  });

  test('event_category is present and equals "engagement"', async () => {
    expect(
      eventPayload.event_category !== undefined && eventPayload.event_category !== null,
      `event_category must be present, got ${eventPayload.event_category}`
    ).toBe(true);
    expect(
      eventPayload.event_category,
      `event_category must be "engagement", got "${eventPayload.event_category}"`
    ).toBe('engagement');
  });

  test('event_label is present and equals "50% scroll depth"', async () => {
    expect(
      eventPayload.event_label !== undefined && eventPayload.event_label !== null,
      `event_label must be present, got ${eventPayload.event_label}`
    ).toBe(true);
    expect(
      eventPayload.event_label,
      `event_label must be "50% scroll depth", got "${eventPayload.event_label}"`
    ).toBe('50% scroll depth');
  });

  test('scroll_percent is present and is a number', async () => {
    expect(
      eventPayload.scroll_percent !== undefined && eventPayload.scroll_percent !== null,
      `scroll_percent must be present, got ${eventPayload.scroll_percent}`
    ).toBe(true);
    expect(
      typeof eventPayload.scroll_percent === 'number' && !isNaN(eventPayload.scroll_percent),
      `scroll_percent must be a number, got ${typeof eventPayload.scroll_percent} (value: ${eventPayload.scroll_percent})`
    ).toBe(true);
  });

  test('scroll_percent equals 50', async () => {
    expect(
      eventPayload.scroll_percent,
      `scroll_percent must be 50, got ${eventPayload.scroll_percent}`
    ).toBe(50);
  });

  test('page_title is present and is a non-empty string', async () => {
    expect(
      eventPayload.page_title !== undefined && eventPayload.page_title !== null,
      `page_title must be present, got ${eventPayload.page_title}`
    ).toBe(true);
    expect(
      typeof eventPayload.page_title === 'string',
      `page_title must be a string, got ${typeof eventPayload.page_title} (value: ${eventPayload.page_title})`
    ).toBe(true);
    expect(
      eventPayload.page_title.length > 0,
      `page_title must be non-empty, got "${eventPayload.page_title}"`
    ).toBe(true);
  });

  test('page_url is present and is a non-empty string', async () => {
    expect(
      eventPayload.page_url !== undefined && eventPayload.page_url !== null,
      `page_url must be present, got ${eventPayload.page_url}`
    ).toBe(true);
    expect(
      typeof eventPayload.page_url === 'string',
      `page_url must be a string, got ${typeof eventPayload.page_url} (value: ${eventPayload.page_url})`
    ).toBe(true);
    expect(
      eventPayload.page_url.length > 0,
      `page_url must be non-empty, got "${eventPayload.page_url}"`
    ).toBe(true);
  });

  test('page_url is a valid URL format', async () => {
    const urlPattern = /^https?:\/\/.+/;
    expect(
      urlPattern.test(eventPayload.page_url),
      `page_url must be a valid URL, got "${eventPayload.page_url}"`
    ).toBe(true);
  });
});
