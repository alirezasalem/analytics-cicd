# Feature Brief Template
# ─────────────────────────────────────────────────────────────────────────────
# HOW TO USE THIS TEMPLATE
#
# 1. Copy this file and rename it: FB-NNN.md (e.g. FB-003.md)
# 2. Fill in every field marked REQUIRED
# 3. Fill in optional fields if you have the information
# 4. Leave fields you're unsure about as-is — the AI agent will flag them
# 5. Upload this file to: specs/briefs/ via the GitHub browser UI
# 6. The CI/CD pipeline will auto-generate a YAML spec and open a PR
#
# DO NOT rename or remove section headings — the AI agent reads them.
# Plain English is fine. No YAML or code knowledge needed.
# ─────────────────────────────────────────────────────────────────────────────

---
# ── DOCUMENT METADATA ────────────────────────────────────────────────────────
brief_id: "FB-NNN"                    # REQUIRED — increment from last brief (check specs/briefs/)
title: "REPLACE — Short feature name" # REQUIRED — e.g. "Checkout Flow Tracking"
status: "draft"                       # REQUIRED — always start as "draft"
version: "1.0"                        # REQUIRED — always start as "1.0"
author: ""                            # REQUIRED — your full name
owner_team: ""                        # REQUIRED — e.g. "Product", "Growth", "Commerce"
created_date: ""                      # REQUIRED — YYYY-MM-DD format, e.g. 2026-04-23
target_sprint: ""                     # REQUIRED — e.g. "Sprint 12 (Q2 2026)"
priority: ""                          # REQUIRED — P0 / P1 / P2
                                      #   P0 = blocks release, must be live before launch
                                      #   P1 = required this sprint
                                      #   P2 = nice to have, can slip
reviewers:
  analyst: ""                         # REQUIRED — Web Analyst who will review the generated spec
  engineer: ""                        # OPTIONAL — Frontend engineer who will implement
  bi_lead: ""                         # OPTIONAL — BI/Data Lead for reporting sign-off
related_briefs: []                    # OPTIONAL — list of related FB IDs, e.g. ["FB-001", "FB-002"]
---

---
## 1. Background & Problem Statement

<!-- REQUIRED -->
<!-- Explain: what exists today, what's broken or missing, why this matters. -->
<!-- Write 2–5 sentences. No bullet points needed. Plain English. -->

REPLACE — Describe the current situation and why it's a problem.

Example: "Our checkout flow has no analytics tracking after the cart page.
We cannot see where users drop off in the funnel, which means we cannot
prioritise improvements. This brief covers tracking for all steps from
begin_checkout through purchase confirmation."


---
## 2. Feature Description

<!-- REQUIRED -->
<!-- Describe what the feature or user journey looks like. -->
<!-- Think: what pages, steps, or interactions are involved? -->

REPLACE — Describe the feature or user journey in plain English.

Example: "The new checkout flow has 3 steps: (1) Cart review, (2) Shipping
& payment form, (3) Order confirmation page. Users can also save their cart
and return later. We need to track each step, form submissions, and the
final purchase confirmation."


---
## 3. Business Questions to Answer

<!-- REQUIRED — list at least 3 -->
<!-- Write as questions a business stakeholder would ask. -->
<!-- Each question maps to at least one event the AI will generate. -->

- REPLACE — e.g. "How many users start checkout but abandon before completing payment?"
- REPLACE — e.g. "What is the conversion rate from add_to_cart to purchase?"
- REPLACE — e.g. "Which payment method is most commonly selected?"
- REPLACE — add more as needed


---
## 4. Events to Track

<!-- REQUIRED — one block per event -->
<!-- You don't need to know the exact technical event name — describe in plain English. -->
<!-- The AI agent will choose the correct GA4 / snake_case event name. -->
<!-- Copy and repeat the block below for each event. -->

### Event: REPLACE — plain English name (e.g. "User starts checkout")

**When should this fire?**
<!-- REQUIRED — be precise: "when user clicks X", "when page Y loads", "when API returns success" -->
REPLACE

**What information should be captured?**
<!-- REQUIRED — list the data points you need. Plain English, no code. -->
- REPLACE — e.g. "Cart total value in EUR"
- REPLACE — e.g. "Number of items in cart"
- REPLACE — e.g. "User is logged in or guest"

**Priority:** REPLACE — P0 / P1 / P2

**Notes / edge cases:**
<!-- OPTIONAL — any special conditions, exceptions, or things the engineer should know -->
REPLACE or DELETE THIS LINE


---
### Event: REPLACE — copy this block for each additional event

**When should this fire?**
REPLACE

**What information should be captured?**
- REPLACE

**Priority:** REPLACE — P0 / P1 / P2

**Notes / edge cases:**
REPLACE or DELETE THIS LINE


---
## 5. Scope

<!-- REQUIRED -->

**In scope:**
<!-- What platforms, pages, or user types this covers -->
- REPLACE — e.g. "Web only (desktop + mobile web)"
- REPLACE — e.g. "Logged-in and guest users"
- REPLACE — e.g. "All markets (DE, EN, FR)"

**Out of scope:**
<!-- What is explicitly excluded -->
- REPLACE — e.g. "Native mobile app"
- REPLACE — e.g. "Server-side events"


---
## 6. KPIs & Success Metrics

<!-- OPTIONAL but recommended -->
<!-- What numbers will you look at to know if this tracking is working? -->

- REPLACE — e.g. "Checkout funnel drop-off rate per step"
- REPLACE — e.g. "Purchase conversion rate (add_to_cart → purchase)"
- REPLACE — e.g. "Average order value (EUR)"


---
## 7. Risks & Known Constraints

<!-- OPTIONAL — flag anything that could complicate implementation -->

| Risk | Impact | Notes |
|------|--------|-------|
| REPLACE — e.g. SPA route changes not detected | High | REPLACE — e.g. Need manual dataLayer.push on router hook |
| REPLACE | REPLACE | REPLACE |


---
## 8. Sign-off

<!-- REQUIRED before the AI agent generates the spec -->

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Manager | | | ☐ Approved |
| Web Analyst | | | ☐ Approved |
| BI Lead (Advisory) | | | ☐ Approved |

<!-- Once all required approvers have signed, change status in the metadata above to "approved" -->
<!-- The CI/CD pipeline will then auto-generate the YAML spec via GitHub Actions -->
