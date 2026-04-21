import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../");
const CONVENTIONS_PATH = resolve(REPO_ROOT, "conventions.yaml");

export function readConventions() {
  if (!existsSync(CONVENTIONS_PATH)) {
    throw new Error(
      `conventions.yaml not found at ${CONVENTIONS_PATH}.\n` +
      `Run 'git pull' or check that Step 2 was completed.`
    );
  }

  const raw = readFileSync(CONVENTIONS_PATH, "utf8");
  let parsed;

  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(`Failed to parse conventions.yaml: ${err.message}`);
  }

  return {
    raw,
    parsed,
    summary: buildSummary(parsed),
  };
}

function buildSummary(parsed) {
  const lines = ["=== conventions.yaml summary ==="];
  if (parsed?.version) lines.push(`Version   : ${parsed.version}`);
  if (parsed?.last_updated) lines.push(`Updated   : ${parsed.last_updated}`);
  const eventCount = parsed?.events?.allowed_names?.length ?? "?";
  lines.push(`Events    : ${eventCount} allowed names defined`);
  const paramCount = Object.keys(parsed?.parameters ?? {}).length;
  lines.push(`Parameters: ${paramCount} top-level keys`);
  const reqFields = parsed?.spec?.required_fields ?? [];
  lines.push(`Required  : ${reqFields.join(", ") || "none listed"}`);
  const platforms = parsed?.spec?.platforms ?? [];
  lines.push(`Platforms : ${platforms.join(", ") || "none listed"}`);
  const priorities = parsed?.spec?.priorities ?? [];
  lines.push(`Priorities: ${priorities.join(", ") || "none listed"}`);
  lines.push("================================");
  return lines.join("\n");
}

export function validateSpecAgainstConventions(specObj, conventions) {
  const errors = [];
  const required = conventions?.spec?.required_fields ?? [];

  for (const field of required) {
    if (specObj[field] === undefined || specObj[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  const allowedPlatforms = conventions?.spec?.platforms ?? [];
  if (allowedPlatforms.length > 0 && !allowedPlatforms.includes(specObj.platform)) {
    errors.push(`Invalid platform "${specObj.platform}". Allowed: ${allowedPlatforms.join(", ")}`);
  }

  const allowedPriorities = conventions?.spec?.priorities ?? [];
  if (allowedPriorities.length > 0 && !allowedPriorities.includes(specObj.priority)) {
    errors.push(`Invalid priority "${specObj.priority}". Allowed: ${allowedPriorities.join(", ")}`);
  }

  if (specObj.spec_id && !/^SPEC-\d{4}-\d{3}$/.test(specObj.spec_id)) {
    errors.push(`spec_id "${specObj.spec_id}" does not match pattern SPEC-YYYY-NNN`);
  }

  for (const event of specObj.events ?? []) {
    if (event.name && !/^[a-z][a-z0-9_]*$/.test(event.name)) {
      errors.push(`Event name "${event.name}" violates snake_case convention`);
    }
  }

  return { valid: errors.length === 0, errors };
}
