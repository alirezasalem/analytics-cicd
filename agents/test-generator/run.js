#!/usr/bin/env node
/**
 * A4 — Test Generator
 * Reads a merged analytics spec YAML and generates Playwright test files
 * for each event defined in the spec.
 *
 * Usage:
 *   node run.js <path-to-spec.yaml>
 *
 * Env:
 *   ANTHROPIC_API_KEY  — required
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── config ────────────────────────────────────────────────────────────────────

const SPEC_PATH = process.argv[2];
const OUTPUT_DIR = path.resolve('tests/playwright');
const PROMPT_PATH = path.join(__dirname, 'prompt.md');
const MODEL = 'claude-opus-4-5';
const MAX_TOKENS = 4096;

// ── validation ────────────────────────────────────────────────────────────────

if (!SPEC_PATH) {
  console.error('Usage: node run.js <path-to-spec.yaml>');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

if (!fs.existsSync(SPEC_PATH)) {
  console.error(`Error: Spec file not found at "${SPEC_PATH}"`);
  process.exit(1);
}

// ── load inputs ───────────────────────────────────────────────────────────────

const systemPrompt = fs.readFileSync(PROMPT_PATH, 'utf8');
const specRaw = fs.readFileSync(SPEC_PATH, 'utf8');

let spec;
try {
  spec = yaml.load(specRaw);
} catch (err) {
  console.error(`Error: Could not parse YAML spec — ${err.message}`);
  process.exit(1);
}

const events = spec.events;
if (!events || !Array.isArray(events) || events.length === 0) {
  console.error('Error: Spec contains no events array.');
  process.exit(1);
}

// ── setup output dir ──────────────────────────────────────────────────────────

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Claude client ─────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── generate test per event ───────────────────────────────────────────────────

async function generateTestForEvent(eventSpec) {
  const eventName = eventSpec.event_name;
  console.log(`\n→ Generating test for: ${eventName}`);

  const userMessage = `
Generate a complete Playwright test file for the following GA4 analytics event spec.

## Spec (YAML)
\`\`\`yaml
${yaml.dump({ event: eventSpec })}
\`\`\`

Requirements:
- Output only valid JavaScript, no markdown, no preamble.
- The test file must be self-contained and runnable with \`npx playwright test\`.
- Read \`process.env.TEST_URL\` as the base URL.
- Follow all rules in the system prompt exactly.
`.trim();

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (err) {
    console.error(`  ✗ Claude API error for "${eventName}": ${err.message}`);
    return null;
  }

  const output = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  if (!output) {
    console.error(`  ✗ Empty response from Claude for "${eventName}"`);
    return null;
  }

  // Strip accidental markdown fences if the model added them
  const clean = output
    .replace(/^```(?:javascript|js)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  const outFile = path.join(OUTPUT_DIR, `${eventName}.spec.js`);
  fs.writeFileSync(outFile, clean + '\n', 'utf8');
  console.log(`  ✓ Written: ${outFile}`);
  return outFile;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nA4 Test Generator`);
  console.log(`Spec: ${SPEC_PATH}`);
  console.log(`Events found: ${events.length}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);

  const results = { success: [], failed: [] };

  for (const eventSpec of events) {
    const outFile = await generateTestForEvent(eventSpec);
    if (outFile) {
      results.success.push(eventSpec.event_name);
    } else {
      results.failed.push(eventSpec.event_name);
    }
  }

  console.log('\n── Summary ──────────────────────────────────────────────');
  console.log(`✓ Generated: ${results.success.length} test files`);
  if (results.failed.length > 0) {
    console.log(`✗ Failed:    ${results.failed.length} events`);
    results.failed.forEach(n => console.log(`  - ${n}`));
    process.exit(1);
  }
  console.log('Done.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
