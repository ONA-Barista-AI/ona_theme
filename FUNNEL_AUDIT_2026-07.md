# ONA Coffee — Funnel & Checkout Conversion Audit
**Date:** 2026-07-26
**Branch:** `felipe/funnel-conversion-audit` (off `main`, no collision with other dev work)
**Scope:** End-to-end funnel data pull (GA4), checkout-tracking gap root cause, correlation with known theme bugs

---

## 1. The funnel, year-to-date (GA4, Jan 1 – Jul 25 2026)

| Step | Users | Step conversion |
|---|---|---|
| Session start | 155,141 | — |
| View product | 72,650 | 46.8% |
| Add to cart | 19,932 | 27.4% |
| Begin checkout | 8,952 | 44.9% |
| Purchase | 5,537 | 61.9% |

**Last 28 days vs. YTD average — both pre-cart steps are currently underperforming:**
- View product → Add to cart: 22.4% (28d) vs 27.4% (YTD)
- Add to cart → Begin checkout: 40.9% (28d) vs 44.9% (YTD)
- Begin checkout → Purchase: 59.2% (28d) — in line with YTD, checkout completion itself is not degraded

**Device split (YTD):** mobile is 70% of sessions but converts add-to-cart → begin-checkout at ~41%, vs. desktop's ~52% — an 11-point gap consistent with the original finding that the May 27–29 commits hit mobile cart-adds harder (-48%) than desktop (-43%).

**Read:** the active, currently-unfixed leak is pre-checkout (view→cart, cart→checkout), not checkout itself. This points at issue #20 (cart ATC bugs) as the highest-value fix, not a checkout redesign.

---

## 2. New finding: checkout-stage GA4 events are structurally blind

Pulled the "Checkout journey" funnel (`begin_checkout → add_shipping_info → add_payment_info → purchase`) in both closed and open-funnel mode, full year:

| Event | Count (Jan 1 – Jul 25, 2026) |
|---|---|
| begin_checkout | 10,817 |
| add_shipping_info | **0** |
| add_payment_info | **2** |
| purchase | 5,053+ (varies by funnel mode; real purchases clearly happen) |

This is not a funnel-configuration artifact — confirmed in open-funnel mode (no sequential requirement) across the full year. Real orders are being placed; GA4 simply never records the shipping or payment sub-step.

### Root cause investigation

**Ruled out — theme code.** Cloned `ona_theme` and searched for every relevant term (`add_shipping_info`, `add_payment_info`, `checkout_started`, `checkout_completed`, `shipping_info_submitted`, `payment_info_submitted`, `gtag(`, `fbq(`, `dataLayer.push(`): zero matches anywhere except `snippets/pagefly-main-js.liquid`, which is PageFly's own gtag setup, gated on `shop.metafields.pagefly.measurementId` — already confirmed `null`/dead in the original audit (closed issue #12). `layout/theme.liquid` has no analytics code at all; the real tracking is 100% Shopify platform-level injection via `content_for_header`. **No theme commit, at any date, could have caused or fixed this — there's nothing in this repo to correlate against.**

**Checked — Shopify Admin, Customer Events.** The "Google & YouTube" pixel is Active, both Server and Web channels on, data access "Optimized," connected to the correct GA4 property (`G-QX88TBZC3G`, "ONA Coffee"). Nothing misconfigured on the surface.

**Found — likely actual cause: Shop Pay auto-redirect.** Live-tested an actual add-to-cart → checkout flow. For a recognized Shop Pay user, `/checkout` **automatically redirects** to `shop.app/checkout/.../shoppay` (`redirect_source=checkout_automatic_redirect`) — a different domain entirely from `onacoffee.com.au`. Shop Pay's accelerated flow presents shipping address, shipping method, and payment method all on **one screen** with a single "Pay now" — there is no discrete "confirm shipping" step followed by a separate "confirm payment" step for the platform to fire two distinct events from. Standard multi-step Shopify checkout has these as separate pages/steps; Shop Pay's condensed UI structurally doesn't. For any customer who gets auto-routed into Shop Pay (which is common for returning customers — this test session had a saved address and card ready instantly), `add_shipping_info` and `add_payment_info` likely never have a discrete moment to fire.

This would explain the pattern precisely: `begin_checkout` and `purchase` map to checkout-created/order-created events that fire regardless of which UI path the customer takes; the two granular mid-checkout events depend on a step structure that a large and growing share of traffic (Shop Pay users) never goes through.

**Not yet confirmed, worth checking next:** what fraction of ONA's checkout sessions are Shop Pay-routed vs. classic multi-step checkout (Shopify Admin → Analytics, or Shop Pay's own reporting) — that would confirm whether this fully explains the near-zero count or only partially.

---

## 3. Timeline correlation

- `ona_theme` repo has exactly 4 commits, oldest dated **2026-05-27**. The Formswell commits that broke ATC (issue #20) landed **2026-05-27 to 05-29** — directly correlates with the pre-cart funnel steps currently running below their YTD average.
- The checkout-event gap (add_shipping_info/add_payment_info) shows **zero events since Jan 1, 2026** — i.e. before the repo's own history even begins, and unrelated to any theme commit. It is not a regression from a specific date; it appears to be structural (Shop Pay's UI shape), not a break.

---

## 4. Recommendations, in priority order

1. **Ship the #20 ATC fix.** This is the only *currently active, code-fixable* leak in the data. Directly addresses the 22.4%→27.4% and 40.9%→44.9% gaps between the last-28-days and YTD baseline.
2. **Re-pull this same funnel after #20 ships** to confirm the pre-cart steps recover toward YTD average — validates the fix with data rather than assuming it worked.
3. **Confirm the Shop Pay hypothesis** — check what share of checkout sessions route through `shop.app` vs. classic checkout, and check whether Shop Pay's own pixel/reporting shows shipping/payment-stage behavior GA4 misses entirely.
4. **Decide if the checkout-tracking gap is worth closing at all** — if Shop Pay's one-page flow structurally can't emit two separate events, the fix may be "accept it, rely on begin_checkout→purchase as the checkout-stage metric" rather than chasing a technical fix that fights the UI's actual shape.
