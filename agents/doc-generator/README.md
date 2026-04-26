# doc-generator

Reads a merged analytics spec YAML and generates a developer-ready implementation Markdown doc for each event — one file per event, written to `implementation/<event_name>.md`.

## How it works

1. GitHub Actions merges a spec YAML to `main` (via the spec generator PR)
2. `generate-docs.yml` detects the changed spec and triggers this agent
3. Claude reads the spec + system prompt → generates a structured Markdown doc per event
4. The workflow commits all `implementation/*.md` files to a new branch and opens a PR for review

## Output format

Each generated doc contains:

| Section | What it covers |
|---|---|
| **Overview** | Plain-English explanation of when and why the event fires |
| **Trigger Rules** | Exact conditions (user action, state, negative conditions) |
| **dataLayer.push() snippet** | Copy-paste ready JS with real example values |
| **Parameter table** | All params — name, type, required, example, description |
| **Business Rules & Edge Cases** | Dedup logic, timing rules, PII restrictions |

See [`implementation/view_item.example.md`](../../implementation/view_item.example.md) for a real output sample.

## Local usage (dev convenience)

```bash
cd agents/doc-generator
npm install

ANTHROPIC_API_KEY=sk-... node run.js --spec specs/SPEC-2025-001.yaml
```

Output is written to `implementation/` by default. Override with `OUTPUT_DIR=path/to/dir`.

Debug mode:
```bash
DEBUG=1 ANTHROPIC_API_KEY=sk-... node run.js --spec specs/SPEC-2025-001.yaml
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | — | Set as GitHub Actions secret |
| `OUTPUT_DIR` | ⬜ | `implementation/` | Override output directory |
| `DEBUG` | ⬜ | — | Set to `1` for verbose stderr |

## CI trigger (automatic)

The workflow fires automatically when any `specs/SPEC-*.yaml` is pushed to `main`.

To regenerate docs without a spec change, use **manual dispatch** from the GitHub Actions tab:
- Go to **Actions → Generate Implementation Docs → Run workflow**
- Enter the spec path (e.g. `specs/SPEC-2025-001.yaml`)

## Files

```
agents/doc-generator/
  prompt.md       ← System prompt — controls doc structure and writing rules
  run.js          ← CLI entry point
  package.json    ← Dependencies (yaml@2)
  README.md       ← This file
```
