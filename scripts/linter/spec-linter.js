#!/usr/bin/env node
/**
 * spec-linter.js
 * Analytics CI/CD — Tracking Spec Linter
 *
 * Usage:
 *   node scripts/linter/spec-linter.js <spec-file.yaml> [--strict]
 *   node scripts/linter/spec-linter.js specs/examples/ecommerce-spec.yaml
 *
 * Exit codes:
 *   0 — All checks passed (warnings may exist)
 *   1 — One or more errors found (blocks merge)
 *
 * The linter reads conventions.yaml from the repo root conventions/ directory.
 * Override with CONVENTIONS_PATH env variable.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// ─── Colour helpers ───────────────────────────────────────────────────────────
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;
const DIM    = (s) => `\x1b[2m${s}\x1b[0m`;

// ─── Result collector ─────────────────────────────────────────────────────────
const results = { errors: [], warnings: [] };

function error(rule, location, message) {
  results.errors.push({ rule, location, message });
}

function warning(rule, location, message) {
  results.warnings.push({ rule, location, message });
}

function report(severity, rule, location, message) {
  if (severity === "error") error(rule, location, message);
  else warning(rule, location, message);
}

// ─── Load files ───────────────────────────────────────────────────────────────
function loadYaml(filePath) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(RED(`✗ Failed to parse YAML: ${filePath}`));
    console.error(DIM(e.message));
    process.exit(1);
  }
}

// ─── Arg parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const strictFlag = args.includes("--strict");
const specArg = args.find((a) => !a.startsWith("--"));

if (!specArg) {
  console.error(RED("Usage: node scripts/linter/spec-linter.js <spec-file.yaml> [--strict]"));
  process.exit(1);
}

const specPath = path.resolve(specArg);
const conventionsPath = process.env.CONVENTIONS_PATH
  ? path.resolve(process.env.CONVENTIONS_PATH)
  : path.resolve(__dirname, "../../conventions/conventions.yaml");

if (!fs.existsSync(specPath)) {
  console.error(RED(`✗ Spec file not found: ${specPath}`));
  process.exit(1);
}
if (!fs.existsSync(conventionsPath)) {
  console.error(RED(`✗ conventions.yaml not found: ${conventionsPath}`));
  process.exit(1);
}

const spec = loadYaml(specPath);
const conv = loadYaml(conventionsPath);

const strictMode = strictFlag || conv.linter?.strict_mode === true;

console.log(BOLD("\n📋 Analytics Spec Linter"));
console.log(DIM(`   Spec:         ${specPath}`));
console.log(DIM(`   Conventions:  ${conventionsPath}`));
console.log(DIM(`   Strict mode:  ${strictMode}`));
console.log("");

// ─────────────────────────────────────────────────────────────────────────────
// SECTION A — Top-level spec fields
// ─────────────────────────────────────────────────────────────────────────────
function validateSpecFields() {
  const required = conv.spec_required_fields || [];
  for (const field of required) {
    if (spec[field] === undefined || spec[field] === null || spec[field] === "") {
      error("spec_missing_required_field", "spec", `Missing required field: \`${field}\``);
    }
  }

  // spec_id format
  if (spec.spec_id) {
    const pattern = new RegExp(conv.spec_id_pattern);
    if (!pattern.test(spec.spec_id)) {
      error("spec_id_format", "spec.spec_id", `spec_id "${spec.spec_id}" must match pattern ${conv.spec_id_pattern}`);
    }
  }

  // spec_version semver
  if (spec.spec_version) {
    const pattern = new RegExp(conv.spec_version_pattern);
    if (!pattern.test(String(spec.spec_version))) {
      error("spec_version_format", "spec.spec_version", `spec_version "${spec.spec_version}" must be valid semver, e.g. 1.0.0`);
    }
  }

  // status
  if (spec.status) {
    const allowed = conv.status_allowed_values || [];
    if (!allowed.includes(spec.status)) {
      error("status_invalid", "spec.status", `status "${spec.status}" must be one of: ${allowed.join(", ")}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION B — Event name validation
// ─────────────────────────────────────────────────────────────────────────────
function validateEventName(name, location) {
  const ec = conv.event_names;
  if (!ec) return;

  const pattern = new RegExp(ec.pattern);
  if (!pattern.test(name)) {
    error("event_name_format", location, `Event name "${name}" must match pattern: ${ec.pattern_description?.trim() || ec.pattern}`);
  }

  if (name.length < (ec.min_length || 3)) {
    error("event_name_length", location, `Event name "${name}" is too short (min ${ec.min_length} chars)`);
  }
  if (name.length > (ec.max_length || 40)) {
    error("event_name_length", location, `Event name "${name}" is too long (max ${ec.max_length} chars)`);
  }

  for (const prefix of ec.forbidden_prefixes || []) {
    if (name.startsWith(prefix)) {
      error("event_name_forbidden_prefix", location, `Event name "${name}" starts with reserved prefix "${prefix}"`);
    }
  }

  for (const suffix of ec.forbidden_suffixes || []) {
    if (name.endsWith(suffix)) {
      error("event_name_forbidden_suffix", location, `Event name "${name}" ends with reserved suffix "${suffix}"`);
    }
  }

  for (const pat of ec.forbidden_patterns || []) {
    // Support both raw string patterns and regex-like patterns
    const rx = pat.startsWith("^") || pat.endsWith("$") ? new RegExp(pat) : null;
    const matches = rx ? rx.test(name) : name.includes(pat);
    if (matches) {
      error("event_name_forbidden_pattern", location, `Event name "${name}" contains forbidden pattern "${pat}"`);
    }
  }

  const allowlist = ec.allowlist || [];
  if (allowlist.length > 0 && !allowlist.includes(name)) {
    const severity = strictMode ? "error" : "warning";
    report(severity, "event_name_not_in_allowlist", location,
      `Event name "${name}" is not in the approved allowlist. Add it via PR to conventions.yaml.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION C — Parameter validation
// ─────────────────────────────────────────────────────────────────────────────
function validateParameter(param, location) {
  const pc = conv.parameter_names;
  const tc = conv.data_types;
  const required = conv.parameter_required_fields || [];

  // Required fields
  for (const field of required) {
    if (param[field] === undefined || param[field] === null || param[field] === "") {
      error("parameter_missing_required_field", location, `Parameter missing required field: \`${field}\``);
    }
  }

  // Name format
  if (param.name && pc) {
    const pattern = new RegExp(pc.pattern);
    if (!pattern.test(param.name)) {
      error("parameter_name_format", location, `Parameter name "${param.name}" must match pattern ${pc.pattern}`);
    }
    if (param.name.length > (pc.max_length || 40)) {
      error("parameter_name_format", location, `Parameter name "${param.name}" exceeds max length ${pc.max_length}`);
    }
    for (const prefix of pc.forbidden_prefixes || []) {
      if (param.name.startsWith(prefix)) {
        error("parameter_name_format", location, `Parameter name "${param.name}" starts with reserved prefix "${prefix}"`);
      }
    }
    for (const pat of pc.forbidden_patterns || []) {
      if (param.name.includes(pat)) {
        error("parameter_name_format", location, `Parameter name "${param.name}" contains forbidden pattern "${pat}"`);
      }
    }
  }

  // Type
  if (param.type && tc) {
    if (!tc.allowed.includes(param.type)) {
      error("parameter_type_invalid", location,
        `Parameter "${param.name}" has invalid type "${param.type}". Allowed: ${tc.allowed.join(", ")}`);
    }

    // enum must have values
    if (param.type === "enum" && tc.enum_requires_values) {
      if (!Array.isArray(param.values) || param.values.length === 0) {
        error("parameter_enum_missing_values", location,
          `Parameter "${param.name}" is type "enum" but has no \`values\` list`);
      }
    }
  }

  // Example placeholder check
  const forbidden = conv.parameter_forbidden_examples || [];
  const example = param.example;
  if (example !== undefined) {
    const exStr = String(example);
    if (forbidden.includes(exStr)) {
      error("parameter_example_forbidden", location,
        `Parameter "${param.name}" has a placeholder example "${example}". Provide a real value.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION D — Ecommerce rules
// ─────────────────────────────────────────────────────────────────────────────
function validateEcommerceRules(event) {
  const ec = conv.ecommerce;
  if (!ec) return;

  const name = event.name;
  const paramNames = (event.parameters || []).map((p) => p.name);

  // Must have items array
  if ((ec.requires_items_array || []).includes(name)) {
    if (!paramNames.includes("items")) {
      error("ecommerce_missing_items", `events[${name}]`,
        `Event "${name}" must include an \`items\` array parameter`);
    }
  }

  // Must have value + currency
  if ((ec.requires_value_currency || []).includes(name)) {
    if (!paramNames.includes("value")) {
      error("ecommerce_missing_value_currency", `events[${name}]`,
        `Event "${name}" must include a top-level \`value\` parameter`);
    }
    if (!paramNames.includes("currency")) {
      error("ecommerce_missing_value_currency", `events[${name}]`,
        `Event "${name}" must include a top-level \`currency\` parameter`);
    }
  }

  // Must have transaction_id
  if ((ec.requires_transaction_id || []).includes(name)) {
    if (!paramNames.includes("transaction_id")) {
      error("ecommerce_missing_transaction_id", `events[${name}]`,
        `Event "${name}" must include a \`transaction_id\` parameter`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION E — Event-level validation (orchestrates B, C, D)
// ─────────────────────────────────────────────────────────────────────────────
function validateEvent(event, index) {
  const location = `events[${index}] (${event.name || "unnamed"})`;
  const required = conv.event_required_fields || [];

  for (const field of required) {
    if (event[field] === undefined || event[field] === null || event[field] === "") {
      error("event_missing_required_field", location, `Event missing required field: \`${field}\``);
    }
  }

  if (event.name) {
    validateEventName(event.name, location);
  }

  // Priority
  if (event.priority) {
    const allowed = conv.priority_allowed_values || [];
    if (!allowed.includes(event.priority)) {
      error("event_missing_required_field", location,
        `Event priority "${event.priority}" must be one of: ${allowed.join(", ")}`);
    }
  }

  // Parameters
  if (Array.isArray(event.parameters)) {
    event.parameters.forEach((param, pi) => {
      validateParameter(param, `${location}.parameters[${pi}] (${param.name || "unnamed"})`);
    });
  }

  // Ecommerce
  validateEcommerceRules(event);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
validateSpecFields();

const events = spec.events || [];
if (events.length === 0) {
  warning("spec_missing_required_field", "spec.events", "Spec has no events defined");
}

events.forEach((event, i) => validateEvent(event, i));

// ─── Output ───────────────────────────────────────────────────────────────────
const errorCount = results.errors.length;
const warnCount  = results.warnings.length;

if (warnCount > 0) {
  console.log(YELLOW("⚠  Warnings:"));
  results.warnings.forEach(({ rule, location, message }) => {
    console.log(`   ${YELLOW("WARN")}  [${rule}]`);
    console.log(`         ${DIM(location)}`);
    console.log(`         ${message}`);
  });
  console.log("");
}

if (errorCount > 0) {
  console.log(RED("✗  Errors:"));
  results.errors.forEach(({ rule, location, message }) => {
    console.log(`   ${RED("ERR ")}  [${rule}]`);
    console.log(`         ${DIM(location)}`);
    console.log(`         ${message}`);
  });
  console.log("");
}

if (errorCount === 0 && warnCount === 0) {
  console.log(GREEN("✔  All checks passed — no errors or warnings.\n"));
} else if (errorCount === 0) {
  console.log(GREEN(`✔  Passed with ${warnCount} warning(s). Merge allowed.\n`));
} else {
  console.log(RED(`✗  Failed: ${errorCount} error(s), ${warnCount} warning(s). Merge blocked.\n`));
}

console.log(DIM(`   Events checked: ${events.length}`));
console.log(DIM(`   Parameters checked: ${events.reduce((s, e) => s + (e.parameters?.length || 0), 0)}`));
console.log("");

process.exit(errorCount > 0 ? 1 : 0);
