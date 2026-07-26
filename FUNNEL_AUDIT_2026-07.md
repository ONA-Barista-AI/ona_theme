# ONA Coffee — Funnel & Checkout Conversion Audit
**Date:** 2026-07-26 (research phase — Felipe takes direct control of the site 2026-07-30)
**Branch:** `felipe/funnel-conversion-audit` (off `main`, no collision with other dev work)
**Scope:** End-to-end funnel data pull (GA4 + Shopify), checkout-tracking gap root cause, live checkout UX walkthrough, correlation with known theme bugs

This version replaces the funnel numbers from the 2026-07-25 draft. Re-pulling the same period through a different GA4 report surfaced that the original numbers were undercounted — see Finding 4. Everything below is either a **confirmed finding** (verified today, evidence included) or a **hypothesis** (stated as such, with what would prove or disprove it).

---

## Confirmed findings

### 1. Five theme bugs, code-verified against the live site

All five are open GitHub issues on `ONA-Barista-AI/ona_theme`, each independently confirmed against the live site or the actual live-rendering template code (not just the repo — see Finding 5 on why that distinction matters):

| # | Issue | Verified live? |
|---|---|---|
| [#20](https://github.com/ONA-Barista-AI/ona_theme/issues/20) CRITICAL | Collection-page add-to-cart: drawer never opens, badge flashes white, badge invisible pre-scroll | Yes — all 3 bugs reproduced live |
| [#11](https://github.com/ONA-Barista-AI/ona_theme/issues/11) HIGH | Collection-page quick-add bypasses Shopify's tracking layer — Meta/GA4 `add_to_cart` never fires from that path | Yes — confirmed via live page source, zero `gtag`/`fbq` calls anywhere in the theme |
| [#18](https://github.com/ONA-Barista-AI/ona_theme/issues/18) HIGH | Product labels: date-comparison bug hides active "New In" tags; homepage featured section never reads per-product labels | Yes |
| [#21](https://github.com/ONA-Barista-AI/ona_theme/issues/21) MED | Hero preload tag missing `href` (confirmed via the section's own code comment, `CANARY-R33`, matched on the live page); product card images have no `srcset` | Yes |
| [#19](https://github.com/ONA-Barista-AI/ona_theme/issues/19) MED | `og:image` served over `http://` sitewide; collection pages show the generic site banner instead of collection imagery | Yes |

\#13 (missing JSON-LD) was deleted — false positive, Shopify injects it at the platform level regardless of theme code. #16 (locations page title) is closed, fixed directly in Shopify admin.

### 2. Cart drawer doesn't open on the *product* page either — confirmed, reproducible

Not a filed issue yet. Adding a product from its own product page does not open a cart drawer or show any confirmation — the item is added silently (badge count increments, no visual feedback). Reproduced on two different products (Raspberry Candy, Maple) — not a one-off glitch. This is on `ona-product-information.liquid`, a different file from #20's collection-page drawer bug, and not yet root-caused in code. Worth filing as its own issue: it affects the primary single-product purchase path, not just collection quick-add, so it's plausibly as high-value as #20.

### 3. Fresh checkouts auto-redirect to Shop Pay for a recognized customer — reliably, not randomly

Live-tested: for a recognized/returning customer, clicking the plain **"CHECK OUT"** button on the `/cart` page — not the purple "Buy with Shop" express button — lands on `shop.app/checkout/.../shoppay` with `redirect_source=checkout_automatic_redirect`, pre-filled with a real saved card and address, one tap from "Pay now." A "Check out as guest" link is present and does drop into the classic multi-step checkout.

**Correction to an earlier note in this doc:** a previous version of this finding said the redirect looked non-deterministic — one test skipped it entirely. That test is now understood to be an artifact, not a real finding: every checkout attempt in that session reused the *same* checkout object (same `cn/...` token in the URL) because items kept getting added to one ongoing cart rather than starting fresh. A checkout that's already past the redirect decision point won't re-trigger it. Felipe independently ran the clean version of this test — emptied the cart, then a genuinely fresh "Buy with Shop" click — and it redirected to Shop Pay. Treat the redirect as reliable for a fresh checkout with a recognized/logged-in customer, not as a coin flip.

This means there is effectively no direct path to classic checkout for a recognized shopper on a fresh session — they either complete via Shop Pay or have to notice and click "Check out as guest." Relevant context for the Shop Pay share number in Finding 6, and for how to interpret Hypothesis B: the classic checkout tested there is the *less common* path for a recognized customer, reached only by deliberately opting out of Shop Pay — Shop Pay's one-page UI is what most fresh-session recognized customers actually see by default.

### 4. The GA4 funnel-exploration tool was undercounting — badly, and increasingly at each step

The 2026-07-25 draft's funnel numbers (Session start 155,141 → View product 72,650 → Add to cart 19,932 → Begin checkout 8,952 → Purchase 5,537) came from GA4's **Funnel exploration** report. Today, pulling the same Jan 1 – Jul 26, 2026 window from the plain **Events** report (`event_name` × `Total users`, no funnel machinery) gives materially different numbers:

| Step | Funnel-exploration tool (2026-07-25) | Events report (2026-07-26, verified) | Difference |
|---|---|---|---|
| Session start | 155,141 | 156,855 | ~1%, consistent |
| View item | 72,650 | 73,033 | ~1%, consistent |
| Add to cart | 19,932 | 23,816 | +19% |
| Begin checkout | 8,952 | 10,922 | +22% |
| Purchase | 5,537 | 11,439 | **+107%** |

The gap widens the deeper into the funnel you go — classic symptom of GA4's funnel tool enforcing strict in-session step ordering even when "open funnel" is toggled, or of session/attribution boundaries (e.g. the Shop Pay cross-domain hop to `shop.app`) breaking the "same session, in order" requirement the funnel tool quietly still applies. **This was not caught in the 2026-07-25 pull** — the report's own text claimed the numbers were "confirmed in open-funnel mode," which turned out not to be reliable.

**Corrected YTD funnel (Events report, Jan 1 – Jul 26, 2026):**

| Step | Users | Step-over-step conversion |
|---|---|---|
| Session start | 156,855 | — |
| View item | 73,033 | 46.6% |
| Add to cart | 23,816 | 32.6% |
| Begin checkout | 10,922 | 45.9% |
| Purchase | 11,439 | 104.7% ⚠️ |

The begin_checkout → purchase figure exceeding 100% is real in the data (not a typo) and is itself an open question — see Hypothesis A below.

**Practical takeaway:** every previously-reported GA4 funnel-exploration number in the 2026-07-25 draft (including the mobile-vs-desktop split and the last-28-days-vs-YTD comparison) was pulled with the same tool and should be treated as unverified until re-pulled the same way as above. Going forward, pull funnel numbers from the plain Events report, not the Funnel exploration UI, unless the funnel tool's output is cross-checked against it first.

### 5. `ona-product-template.liquid` is dead code — the whole reason #11/#20 needed re-scoping

Confirmed via `templates/product.json` and every legacy `product.*.liquid` template in the repo: none of them reference `ona-product-template.liquid`. The live main product page renders `ona-product-information.liquid` instead, using Shopify's native `<product-form-component>` — a different, platform-standard component with no custom tracking code to break. This is why #11 and #20 were corrected to scope only to `ona-collection-template.liquid` (the file that *is* live-wired, via `templates/collection.json`).

### 6. Checkout-stage GA4 events, re-measured correctly

Same Events report, same period:

| Event | Users | Events | As % of purchase (11,439 / 12,434) |
|---|---|---|---|
| begin_checkout | 10,922 | 19,948 | — |
| add_shipping_info | **0** | **0** | **0%** |
| add_payment_info | 4,639 | 7,976 | 64% (of event count) |
| purchase | 11,439 | 12,434 | 100% |

`add_payment_info` is **not** the near-zero the earlier draft reported (it had said "2" — that number came from the same unreliable funnel-exploration tool). At 64% coverage relative to purchase count, it's firing at a normal rate for a client-side pre-purchase event. `add_shipping_info` is the real, standout gap: confirmed genuinely zero for the entire year, no funnel-mode ambiguity involved this time (plain event count).

This meaningfully weakens the "Shop Pay's one-page UI structurally prevents these events" theory from the earlier draft — if that were the whole story, `add_payment_info` should also be suppressed for the ~47% of orders going through Shop Pay, capping its coverage well below what's observed. It doesn't explain why `add_shipping_info` specifically is at zero while `add_payment_info` fires normally. See Hypothesis B.

### 7. Shop Pay is 47.1% of orders (unaffected by the funnel-tool issue — this came from Shopify, not GA4)

Shopify's "Shop Pay payments" report, YTD:

| | Orders | Net payments |
|---|---|---|
| Shop Pay | 8,386 | A$846,843.12 |
| Not Shop Pay | 9,429 | A$942,819.23 |
| **Total** | **17,815** | **A$1,789,662.35** |

### 8. The GA4-vs-Shopify order gap is real but much smaller than first thought

Shopify orders by sales channel, YTD (ShopifyQL, `FROM sales GROUP BY sales_channel`):

| Channel | Orders | Net sales |
|---|---|---|
| Online Store | 15,218 | A$1,558,802.47 |
| Appstle Subscription | 2,229 | A$153,516.73 |
| Shop (app) | 354 | A$34,278.93 |
| **Total** | **17,801** | **A$1,746,598.13** |

Appstle Subscription and Shop-app orders (2,583 total) are recurring/automated charges or a separate app channel — GA4 correctly wouldn't count these as storefront `purchase` events, so **Online Store (15,218) is the right comparison** against GA4's 11,439 purchasing users / 12,434 purchase events (from Finding 4/6, not the earlier draft's ~5,500).

- Gap: 15,218 − 12,434 = **2,784 orders (18.3%)**
- Revenue gap: $1,558,802.47 − $1,292,526.05 = **$266,276.42 (17.1%)**

This is in the ordinary range for ad-blocker/consent-mode/cross-domain tracking loss — not the near-total measurement failure the 2026-07-25 draft implied (which had compared Shopify's *total* 17,815 against GA4's under-measured ~5,500, a comparison that stacked two separate errors).

### 9. Checkout UX, live-walked (from a recognized/returning session — see caveat under Hypothesis D)

- **Guest checkout:** available via "Check out as guest," reachable from the Shop Pay screen.
- **Shipping cost transparency:** cart page shows a progress bar toward $120 free *express* shipping; at the checkout step, standard shipping showed clearly as "Free Domestic Standard (3-6 business days after dispatch) — FREE," with cost stated before any payment fields.
- **Payment methods surfaced:** Express row — Shop Pay, PayPal, Google Pay. Payment section — Credit card (Visa/Mastercard/Amex + 2 more), PayPal, Afterpay. Apple Pay did not appear (expected — this was a non-Safari browser, not a bug).
- **Field count:** standard credit-card fields (card number, expiry, CVC, name) plus a pre-checked "use shipping address as billing" toggle that removes a full second address form for most shoppers.

### 10. Microsoft Clarity is not actually installed

The earlier assumption that Clarity was "confirmed installed" was wrong. Opening the Clarity app in Shopify admin today landed on a fresh onboarding screen ("How would you like to set up Clarity?"), not a dashboard — meaning **no heatmap or session-recording data exists to review**. Did not click through setup: the recommended option bundles a new "Clarity with Brand Agents" AI shopping assistant with its own Terms of Use, which is a real decision, not a default to click past.

### 11. Mobile vs. desktop add-to-cart → begin-checkout gap, re-verified — the earlier estimate held up

Re-pulled from the Events report (not the funnel-exploration tool), segmented by device category, same Jan 1 – Jul 26, 2026 window:

| Device | Add to cart (users) | Begin checkout (users) | Step conversion |
|---|---|---|---|
| Mobile | 16,723 | 7,059 | 42.2% |
| Desktop | 6,789 | 3,730 | 54.9% |

A 12.7-point gap — close to the 2026-07-25 draft's 41%/52% estimate (which came from the now-distrusted funnel tool). Unlike the absolute step counts in Finding 4, this particular *ratio* held up under re-verification. Mobile genuinely converts add-to-cart → begin-checkout noticeably worse than desktop; worth keeping as a real, standing gap to watch when #20 ships (mobile add-to-cart was hit harder by the May 27–29 regression too — see Timeline correlation).

### 12. Shopify Plus does not currently offer a one-page/multi-page checkout toggle — that lever is gone

Felipe asked whether Plus's deeper checkout control could resolve Hypothesis B (the `add_shipping_info` gap) via a multi-step checkout layout, which Plus merchants used to be able to choose under the legacy checkout.liquid system. Checked directly: Settings → Checkout (`ONA Coffee configuration`) has no layout toggle anywhere — Customer contact method, Customer information, Marketing opt-in, Tipping, Post-purchase page, Address collection, Advanced preferences, Checkout rules. The checkout editor confirms the same thing structurally: Contact, Payment, Billing address, and the Pay Now action are all grouped under one "Main" section with no separate page for Shipping/Information. This store is on Shopify's modern Checkout Extensibility platform, which **standardized every store — Plus included — onto the single-page layout**; the old Plus-exclusive three-page option no longer exists to switch back to. This closes off that path for Hypothesis B — the DebugView test is still the way to resolve it.

(One legacy holdover still present: an "Additional scripts" field under Post-purchase page, currently populated with a plain shipping-delay notice. This only runs on the order-status/thank-you page, not the live checkout steps, so it isn't a lever for firing `add_shipping_info` either — Shopify locked down script injection on the checkout steps themselves years ago for PCI reasons.)

### 13. "Buy with Shop" does not skip add-to-cart — confirmed, it's a real cart add

Tested directly: read `/cart.js` before (3 items, no Aspen) and after clicking "Buy with Shop" on the Aspen product page. Aspen joined the existing cart as a genuine 4th line item (`item_count` 3 → 4) before landing on checkout — it isn't an isolated single-item buy-now flow that bypasses the cart. Since Finding 5 already established the main product page uses Shopify's native `<product-form-component>` (no custom tracking-breaking code), and "Buy with Shop" clearly routes through that same add-to-cart mechanism, there's no reason to think it behaves differently from the regular "Add to cart" button for tracking purposes. Not a source of additional undercounting.

Note: this test's "Buy with Shop" click landed on classic checkout with no Shop Pay redirect, which at the time looked like it contradicted Finding 3. It didn't — see the correction in Finding 3. This test added to an already-existing cart/checkout session rather than starting fresh, so it never hit the redirect decision point in the first place. The cart-merge conclusion above (item_count 3→4) is unaffected by this; only the redirect-behavior side note was wrong.

---

## Unproven hypotheses (with a validation plan)

**A. `purchase` users (11,439) exceed `begin_checkout` users (10,922) in the same window.**
Not a typo — reproduced in two separate reports (Events report and Transactions report). Possible causes: users completing checkout in a session-boundary-crossing way that doesn't get attributed back to a `begin_checkout` in the same window (e.g. an abandoned-cart email bringing someone back straight to a saved Shop Pay confirmation), or a `purchase` event firing from a non-`begin_checkout`-preceded path.
*Validation plan:* pull `purchase`-event sessions by landing page / session source; check specifically whether Shop Pay-completed sessions or email-driven sessions are overrepresented among purchases with no matching `begin_checkout` in the same session.

**B. Why `add_shipping_info` is at zero when `add_payment_info` fires normally.**
The Shop Pay one-page-UI theory from the earlier draft doesn't fully hold now that `add_payment_info` (64% coverage) looks normal. It's possible this specific event simply isn't wired up in Shopify's current checkout-extensibility configuration for *any* path, Shop Pay or classic.

*Tested today:* live checkout walkthrough with `window.Shopify.analytics.publish` hooked (instrumented, not simulated — confirmed the hook was the live function via `publishIsMine: true`) while genuinely changing the selected shipping method on a classic ("check out as guest") checkout. **Zero calls captured**, despite the visible UI updating (rate selection changed, total recalculated). This is suggestive but not conclusive — the checkout page has 10 iframes, some sandboxed for PCI reasons, and pixel dispatch could be happening inside one of those, invisible to a top-page hook. The result is consistent with — but doesn't prove — the theory that this checkout's single-page layout (contact + shipping + payment all visible at once, no discrete "continue to payment" step) simply has no trigger point Shopify's checkout wires `add_shipping_info` to.
*Remaining validation step:* a proper GA4 DebugView session (not just network/hook instrumentation) would give a definitive answer and is worth 10 minutes before concluding this is a Shopify-side gap not worth theme engineering time.

**D. Guest/first-time-visitor checkout experience.**
Today's checkout walkthrough (Finding 9) was done from Felipe's own browser — a recognized session with a saved card, saved address, and pre-filled name. A true first-time visitor's experience (empty fields, no express-checkout recognition, unfamiliar layout) was not independently tested. Per Finding 3, a fresh checkout for a recognized customer reliably redirects to Shop Pay — a genuine first-time visitor with no saved Shop account would be the case most likely to actually land on classic checkout by default, so this hypothesis and Finding 3 are closely related.
*Validation plan:* repeat the walkthrough in a clean/incognito session, or have someone who's never visited the site test the flow and note friction points.

---

## Timeline correlation

- `ona_theme` repo has 4 commits, oldest 2026-05-27. The commits that broke ATC (#20) landed 2026-05-27 to 05-29.
- The `add_shipping_info` gap shows zero events since Jan 1, 2026 — predates the repo's own history entirely, so it's not a regression from a specific commit. Confirmed structural, not a break — though the *specific* reason is still open (Hypothesis B).

---

## Recommendations, in priority order

1. **Ship the #20 ATC fix first**, and file + fix Finding 2 (product-page drawer) alongside it — both are confirmed, code-fixable, and together cover the entire add-to-cart surface (collection and product pages). Finding 4's corrected numbers give a clean baseline to measure both against.
2. **Re-pull the funnel after both ship, using the Events-report method from Finding 4** — not the Funnel exploration tool, which this audit found unreliable. Check Finding 11's mobile/desktop gap specifically to see if it narrows.
3. **Run a proper GA4 DebugView session before deciding whether to chase `add_shipping_info` as a bug** (Hypothesis B) — today's instrumented test was suggestive (zero events captured through a genuine shipping-method change) but not conclusive, since checkout runs pixels across 10 iframes that a top-page hook can't fully see into.
4. **Treat GA4 purchase/revenue numbers as directional, not absolute**, given the confirmed 17-18% gap against Shopify's own Online Store order count (Finding 8) — but this is a normal-sized gap now, not a reason to distrust GA4 broadly.
5. **Decide on Clarity separately**, now that it's confirmed not installed (Finding 10) — it's a real option for the qualitative side of this audit (Hypothesis D in particular), but the "Brand Agents" bundling needs a deliberate yes/no, not a default click-through.
