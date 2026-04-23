# Feature Brief

---
title: "Cart Page View Tracking"
status: draft
version: "1.0"
author: "Product Manager"
owner_team: "Commerce"
priority: "P1"
target_sprint: "Sprint 13 (Q2 2026)"
reviewer_analyst: "Alireza Salem"
reviewer_engineer: ""
related_briefs: [FB-ecommerce-tracking]
---


## Background

We track add_to_cart and begin_checkout but have no visibility on what happens
in between. We cannot measure cart review behaviour, total cart value at the
point of review, or whether users modify the cart before proceeding to checkout.


## Feature description

When a logged-in or guest user navigates to the /cart page, they see a summary
of all items currently in their cart with quantities, prices, and a total value.
From here they can remove items, update quantities, apply a coupon, or proceed
to checkout. We need to capture this moment — cart viewed, with full cart
contents — to close the gap in our funnel visibility.


## Business questions

- How many users view their cart but do not proceed to checkout?
- What is the average cart value at the point of cart review?
- How many items does the average cart contain when viewed?
- Do users who view the cart multiple times have a higher purchase rate?


## Events to track

### Event: User views the cart page

**When it fires:** On page load of /cart when the cart contains at least one
item. Do NOT fire if the cart is empty.

**Data to capture:**
- Cart total value in EUR (sum of all item prices × quantities)
- Currency code
- Full list of items in cart — each with ID, name, price, quantity, and discount if applied
- Number of distinct items in the cart (item_count)
- Coupon code if one is already applied

**Priority:** P1

**Edge cases:** Fire once per page load only — guard against re-renders with a
sessionStorage flag keyed to the session. Do not fire again if the user updates
quantity or removes an item without leaving and returning to the page.


## Scope

**In scope:**
- Web only (desktop + mobile web)
- Logged-in and guest users
- All markets (DE, EN, FR)

**Out of scope:**
- Native mobile app
- Mini-cart drawer / cart flyout (that is a separate event)
- Server-side rendering pre-hydration


## Risks

| Risk | Notes |
|------|-------|
| SPA re-renders firing multiple times | Use sessionStorage flag: cart_viewed_{session_id} — clear on session end |
| Cart empty on load (e.g. after session expiry) | Check cart length before firing — skip event entirely if items array is empty |
| value mismatch vs purchase value | Read from a single cart state source of truth — same object used at checkout |


## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Manager | | | ☐ |
| Web Analyst | | | ☐ |

<!-- Change status: draft → approved once both have signed -->
