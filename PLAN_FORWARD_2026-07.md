# ONA Coffee — Plan Forward
**Date:** 2026-07-26 · **Execution starts:** 2026-07-30 (Thursday, per Felipe's ownership transition)
**Branch:** `felipe/funnel-conversion-audit`

Consolidates everything found this week: `FUNNEL_AUDIT_2026-07.md` (theme bugs, checkout tracking), `GSC_CHANNEL_MIX_2026-07.md` (organic decline, root cause), plus the URL Tracker and product export reviewed today. Organized by confidence and effort, not by source document — some of these are ready to ship Thursday morning, some need a decision first, some need more data.

---

## Tier 1 — Ready to ship Thursday, root-caused, cheap

| # | Fix | Why it matters | Effort | Owner (per Sasa's May 24 role split) |
|---|---|---|---|---|
| 1 | **Homepage H1**: set the hero slide title so a real H1 renders instead of the hidden `ONA Coffee` fallback | Most likely root cause of the entire organic-impression collapse (GSC section 3-4 of channel-mix doc) | 15–30 min | Felipe/Formswell (theme setting or template fix) |
| 2 | **PMax/Shopping negative keyword**: add `[ona coffee]` exact-match negative, per OMG's own step-by-step instructions in their Jul 22 email | Stops paying for clicks that were free organic; OMG already flagged this as an open ONA action item | 15 min | Felipe (Ads access) |
| 3 | Ship **#20** (collection-page cart ATC: drawer, badge flash, badge CSS) | Highest-value, currently-active, code-fixable checkout-funnel leak | ~40 min | Felipe |
| 4 | File + fix the **product-page drawer bug** found during today's audit (same class as #20, not yet filed) | Affects the primary single-product purchase path | Confirm on 1-2 more products, then fix | Felipe |
| 5 | Ship **#11** (collection-page quick-add tracking gap) | Same PR window as #20, same files | ~30 min | Felipe |

## Tier 2 — This week/early next, clear scope, moderate effort

| # | Fix | Notes |
|---|---|---|
| 6 | Write collection descriptions for the 8 pages OMG's own M9 flagged as blank: `/collections/all`, Matcha, Candy, Reserve, Brew Gear, Merch, Ready to Brew (+1 more) | Second half of the impression-collapse root cause. Content work — likely OMG's lane, not Felipe's; see Coordination note below. |
| 7 | Ship **#18** (product label date bug), **#21** (hero preload + srcset), **#19** (og:image HTTPS) | Already scoped and verified live in `FUNNEL_AUDIT_2026-07.md`, just not yet shipped |
| 8 | Set a real **SEO Title** on the 25 of 26 active/published products missing one (only `comandante-hand-grinder-walnut` has one) | Instant coffee line, merch, gift cards — a newer gap than the URL Tracker's original 82-product sweep. OMG's email references "metadata updates using Felipe's script" — check if that tool already covers this or needs extending. |
| 9 | Fix the 3 Matcha latte products with the bogus `"Matcha (Green Tea) Powder"` meta description (extraction/fallback bug, not a real description) | Small, isolated, found today |
| 10 | Set up the dedicated **Brand Search campaign** (limited budget) OMG recommended, instead of leaving branded traffic entirely to PMax/Shopping | Pairs with #2 |

## Tier 3 — Needs more data or a real decision, not a quick fix

| # | Item | What's blocking it |
|---|---|---|
| 11 | **Hypothesis B** (`add_shipping_info` never fires) | Needs GA4 DebugView (authenticated) or a real test order — today's browser-side tests couldn't see checkout events at all, so more of the same won't resolve it |
| 12 | **Hypothesis A** (`purchase` users exceed `begin_checkout` users in the same window) | Needs a session-path pull GA4's standard UI doesn't expose cleanly |
| 13 | True **first-time-guest checkout UX** | Every test this week was from Felipe's own recognized browser session; needs a clean/incognito pass or a real first-time user |
| 14 | **683 brew-guide pages, 565 missing meta** | Huge in count, low value per page individually — needs a decision on bulk/templated generation vs. hand-picking only the ones with real traffic, not a one-by-one fix |
| 15 | **Margin/CAC impact** of the PMax brand-cannibalization | Needs actual ad spend data once #2 changes are live and have run for a bit |
| 16 | Confirm whether `products_export.zip` (50 products) is the **full current catalog or a curated subset** | The URL Tracker's product sweep found 82 live product pages; this export has 50, mixing active/draft/unlisted — worth clarifying before treating 26/50 as the true scope of the SEO-title gap |

## Validation step (applies across the board)

**Re-pull the GSC month-over-month comparison a few weeks after #1 and #6 ship.** That's the actual proof the H1/collection-copy theory was right, not just well-argued. Use the same method as `GSC_CHANNEL_MIX_2026-07.md` Section 3 (Compare tab, sorted by Pages, then by Queries) so the before/after is apples-to-apples.

## Coordination note

Per Sasa's May 24 email: *"Felipe owns back of house (UX, analytics, conversion, backend). Formswell owns design. OMG owns SEO."* Items 1, 3–5, 7–9 are squarely backend/theme — Felipe's lane once he has direct access Thursday. Item 6 (collection copy) and the broader metadata cleanup (14) are content/SEO — OMG's lane, and their July 24 email specifically asked *"Share any findings from the Shopify theme update investigation so we can compare them against our technical audit."* Worth sending them Section 4 of `GSC_CHANNEL_MIX_2026-07.md` directly rather than quietly fixing the H1 in isolation — they're already running a parallel technical audit on the same issue, and this closes it out for both sides at once.
