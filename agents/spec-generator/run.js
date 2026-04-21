#!/usr/bin/env node
import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { readConventions, validateSpecAgainstConventions } from "./conventions_reader.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "prompt.md");

function getFeatureBrief() {
  const args = process.argv.slice(2);

  const briefIdx = args.indexOf("--brief");
  if (briefIdx !== -1 && args[briefIdx + 1]) return args[briefIdx + 1];

  const fileIdx = args.indexOf("--brief-file");
  if (fileIdx !== -1 && args[fileIdx + 1]) return readFileSync(args[fileIdx + 1], "utf8");

  if (args.includes("--stdin")) return readFileSync("/dev/stdin", "utf8");

  throw new Error("Provide a brief via --brief \"text\", --brief-file path, or --stdin");
}

function buildMessages(conventionsRaw, brief) {
  return [
    {
      role: "user",
      content: `## conventions.yaml\n\n\`\`\`yaml\n${conventionsRaw}\n\`\`\`\n\n## Feature Brief\n\n${brief.trim()}`,
    },
  ];
}

async function callClaude(systemPrompt, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is not set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function stripFences(text) {
  return text
    .replace(/^```ya?ml\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function main() {
  let brief;
  try {
    brief = getFeatureBrief();
  } catch (err) {
    console.error(`[spec-generator] Input error: ${err.message}`);
    process.exit(1);
  }

  let conventions;
  try {
    conventions = readConventions();
    if (process.env.DEBUG) console.error(conventions.summary);
  } catch (err) {
    console.error(`[spec-generator] conventions.yaml error: ${err.message}`);
    process.exit(1);
  }

  const systemPrompt = readFileSync(PROMPT_PATH, "utf8");
  const messages = buildMessages(conventions.raw, brief);

  let rawOutput;
  try {
    console.error("[spec-generator] Calling Claude API...");
    rawOutput = await callClaude(systemPrompt, messages);
  } catch (err) {
    console.error(`[spec-generator] API error: ${err.message}`);
    process.exit(1);
  }

  const yamlText = stripFences(rawOutput);
  let specObj;
  try {
    specObj = parseYaml(yamlText);
  } catch (err) {
    console.error(`[spec-generator] Output is not valid YAML: ${err.message}`);
    console.error("--- Raw output ---");
    console.error(rawOutput);
    process.exit(1);
  }

  const { valid, errors } = validateSpecAgainstConventions(specObj, conventions.parsed);
  if (!valid) {
    console.error("[spec-generator] Spec failed validation:");
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error("\nRaw spec output (for debugging):");
    console.error(yamlText);
    process.exit(1);
  }

  console.error(`[spec-generator] ✓ Generated ${specObj.spec_id} — ${specObj.title}`);
  process.stdout.write(yamlText + "\n");
}

main().catch((err) => {
  console.error(`[spec-generator] Unexpected error: ${err.message}`);
  process.exit(1);
});
