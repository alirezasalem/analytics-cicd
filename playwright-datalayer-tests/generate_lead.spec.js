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

test.describe('generate_lead', () => {
  let eventPayload;

  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.TEST_URL);
    
    // TODO: confirm selector with engineering - spec indicates NEEDS_CLARIFICATION for success state
    // This assumes a contact form with submit button - adjust selector as needed
    const formSelector = page.locator('form[data-form-id], form#contact-form, form.contact-form').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Send")').first();
    
    // Fill required form fields if present (using generic field detection)
    const nameField = page.locator('input[name="name"], input[name="fullName"], input[id="name"]').first();
    const emailField = page.locator('input[name="email"], input[type="email"], input[id="email"]').first();
    const messageField = page.locator('textarea[name="message"], textarea[id="message"], textarea').first();
    
    if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameField.fill('Test User');
    }
    if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailField.fill('test@example.com');
    }
    if (await messageField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageField.fill('Test message for form submission');
    }
    
    await submitButton.click();
    
    // Event should fire only after successful API response per gtm_notes
    eventPayload = await waitForDataLayerEvent(page, 'generate_lead');
  });

  test('event fires', async () => {
    expect(eventPayload, 'dataLayer event not found').toBeTruthy();
  });

  test('event name is correct', async () => {
    expect(
      eventPayload.event,
      `event name must be "generate_lead", got "${eventPayload.event}"`
    ).toBe('generate_lead');
  });

  test('event_category is present and equals "lead_generation"', async () => {
    expect(
      eventPayload.event_category,
      `event_category must be "lead_generation", got "${eventPayload.event_category}"`
    ).toBe('lead_generation');
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

  test('form_id is present and is a non-empty string', async () => {
    expect(
      eventPayload.form_id !== undefined && eventPayload.form_id !== null,
      `form_id must be present, got ${eventPayload.form_id}`
    ).toBe(true);
    expect(
      typeof eventPayload.form_id === 'string',
      `form_id must be a string, got ${typeof eventPayload.form_id} (value: ${eventPayload.form_id})`
    ).toBe(true);
    expect(
      eventPayload.form_id.length > 0,
      `form_id must be non-empty, got empty string`
    ).toBe(true);
  });

  test('form_name is present and is a non-empty string', async () => {
    expect(
      eventPayload.form_name !== undefined && eventPayload.form_name !== null,
      `form_name must be present, got ${eventPayload.form_name}`
    ).toBe(true);
    expect(
      typeof eventPayload.form_name === 'string',
      `form_name must be a string, got ${typeof eventPayload.form_name} (value: ${eventPayload.form_name})`
    ).toBe(true);
    expect(
      eventPayload.form_name.length > 0,
      `form_name must be non-empty, got empty string`
    ).toBe(true);
  });

  test('lead_category is present and is a non-empty string', async () => {
    expect(
      eventPayload.lead_category !== undefined && eventPayload.lead_category !== null,
      `lead_category must be present, got ${eventPayload.lead_category}`
    ).toBe(true);
    expect(
      typeof eventPayload.lead_category === 'string',
      `lead_category must be a string, got ${typeof eventPayload.lead_category} (value: ${eventPayload.lead_category})`
    ).toBe(true);
    expect(
      eventPayload.lead_category.length > 0,
      `lead_category must be non-empty, got empty string`
    ).toBe(true);
  });

  test('event_label matches form_name value', async () => {
    expect(
      eventPayload.event_label === eventPayload.form_name,
      `event_label should match form_name. event_label: "${eventPayload.event_label}", form_name: "${eventPayload.form_name}"`
    ).toBe(true);
  });

  test('PII mitigation - form_id does not contain email pattern', async () => {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    expect(
      !emailPattern.test(eventPayload.form_id),
      `form_id must not contain email address, got "${eventPayload.form_id}"`
    ).toBe(true);
  });

  test('PII mitigation - form_name does not contain email pattern', async () => {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    expect(
      !emailPattern.test(eventPayload.form_name),
      `form_name must not contain email address, got "${eventPayload.form_name}"`
    ).toBe(true);
  });

  test('PII mitigation - lead_category does not contain email pattern', async () => {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    expect(
      !emailPattern.test(eventPayload.lead_category),
      `lead_category must not contain email address, got "${eventPayload.lead_category}"`
    ).toBe(true);
  });

  test('PII mitigation - form_id does not contain phone pattern', async () => {
    const phonePattern = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    expect(
      !phonePattern.test(eventPayload.form_id),
      `form_id must not contain phone number, got "${eventPayload.form_id}"`
    ).toBe(true);
  });

  test('PII mitigation - form_name does not contain phone pattern', async () => {
    const phonePattern = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    expect(
      !phonePattern.test(eventPayload.form_name),
      `form_name must not contain phone number, got "${eventPayload.form_name}"`
    ).toBe(true);
  });

  test('PII mitigation - lead_category does not contain phone pattern', async () => {
    const phonePattern = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    expect(
      !phonePattern.test(eventPayload.lead_category),
      `lead_category must not contain phone number, got "${eventPayload.lead_category}"`
    ).toBe(true);
  });

  test('event fires only once per form submission', async ({ page }) => {
    const allEvents = await getAllDataLayerEvents(page, 'generate_lead');
    expect(
      allEvents.length === 1,
      `generate_lead should fire exactly once per submission, found ${allEvents.length} events`
    ).toBe(true);
  });
});
