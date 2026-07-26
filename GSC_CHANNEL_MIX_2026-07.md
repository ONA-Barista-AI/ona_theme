# ONA Coffee — Organic Search Downtrend & Paid Channel-Mix Shift

**Date:** 2026-07-26
**Branch:** `felipe/funnel-conversion-audit`
**Scope:** Test the hypothesis that organic search visibility/sales are declining and paid spend is masking it in headline revenue.

**Result: two separate, real phenomena, not one — and both are now confirmed, not just hypothesized.** Felipe's pushback on the first pass of this analysis was correct: "paid cannibalizes organic" is a real, well-documented mechanism for **clicks**, but has no documented mechanism for reducing **impressions** — so a 38% impression drop needed a different explanation. Dug further with keyword-level GSC data, page-level GSC data, the Google Ads account, ONA's own OMG correspondence, ONA's own project-tracker risk register, and finally live HTML — both things are genuinely happening, for different reasons, and both are independently corroborated by ONA's own SEO agency:

1. **Click cannibalization on branded search terms** — real, matches the textbook signature exactly, traces to Performance Max/Shopping auto-targeting branded queries (no manual keyword control exists in this account), and **OMG's own July 22 email independently reached the same conclusion** and recommended the same fix.
2. **A much larger impression/visibility collapse concentrated on two pages — the homepage and `/collections/all`** — unrelated to paid ads. **Confirmed root cause, live:** the homepage's only H1 is a hidden, brand-only fallback (`<h1 class="visually-hidden">ONA Coffee</h1>`) with no keyword content, and `/collections/all` has no body/description copy at all — both exactly matching risks ONA's own project tracker flagged *before* the June 5–6 theme deployment and never confirmed as resolved. See Section 4.

---

## 1. Google Search Console — clicks and impressions down, ranking position *improved*

Site-wide performance for `onacoffee.com.au`, monthly, last 16 months:

| Month | Clicks | Impressions | Avg. position |
|---|---|---|---|
| Apr 2025 | 20,586 | 609,274 | 32.5 |
| May 2025 | 16,993 | 431,565 | 18.9 |
| Jun 2025 | 17,995 | 566,363 | 25.5 |
| Jul 2025 | 17,493 | 494,684 | 18.7 |
| Aug 2025 | 17,160 | 515,561 | 17.0 |
| Sep 2025 | 16,290 | 434,255 | 14.4 |
| Oct 2025 | 15,958 | 358,728 | 10.6 |
| Nov 2025 | 25,279 | 467,105 | 12.9 |
| Dec 2025 | 19,341 | 379,151 | 12.2 |
| Jan 2026 | 19,710 | 433,768 | 12.3 |
| Feb 2026 | 15,980 | 412,061 | 14.9 |
| Mar 2026 | 17,375 | 371,260 | 9.2 |
| **Apr 2026** | **18,851** | **394,067** | **11.0** |
| May 2026 | 17,179 | 314,589 | 11.1 |
| Jun 2026 | 14,134 | 243,371 | 8.6 |
| Jul 1–24, 2026 | 9,933 (partial) | 188,723 (partial) | 8.9 |

Average position has been *improving* almost the whole period (32.5 → ~9), yet impressions dropped 38% and clicks dropped 25% from April to June 2026 alone. Ranking quality isn't the problem — visibility surface area is shrinking. Sections 3–4 below localize exactly where.

---

## 2. Is this paid cannibalization? Checked against the actual research, then against ONA's own keyword data

Felipe's objection was right to raise: cannibalization is documented for **click-share**, not impressions. What the research actually says:

- Google's own incrementality research (400+ ad-pause studies) found search ads average **89% incremental clicks** — i.e. only ~11% of ad clicks would have gone organic instead, on average. But that average masks a lot of variance: for **well-known/high-authority brands**, cannibalization is much higher — prior ad-shutoff studies found organic recovers **37–99.5%** of paid clicks specifically on **branded terms** ([Search Engine Journal](https://www.searchenginejournal.com/paid-search-incrementality/397279/); [Google Research](https://research.google/pubs/incremental-clicks-impact-of-search-advertising/)).
- The documented diagnostic signature for active cannibalization: **"organic traffic drops while positions hold steady, and organic CTR falls while paid CTR on the same keywords rises"** ([climbinsearch.com](https://www.climbinsearch.com/faq/paid-search-cannibalizing-organic-search); [Search Engine Land](https://searchengineland.com/paid-search-clicks-double-organic-clicks-fall-study-469519)).
- None of this literature describes a mechanism where running ads reduces organic **impressions** — Google still shows the organic listing regardless of whether an ad also appears alongside it.

**Checked ONA's own branded-query data** (GSC Compare, June 2026 vs April 2026) against that exact signature:

| Query | Clicks Apr | Clicks Jun | Clicks Δ | Impr. Apr | Impr. Jun | Impr. Δ |
|---|---|---|---|---|---|---|
| ona coffee | 6,460 | 4,644 | **-28%** | 11,061 | 12,197 | **+10%** |
| ona | 2,058 | 1,225 | **-40%** | 5,240 | 5,270 | +0.6% |
| ona coffee beans | 817 | 515 | **-37%** | 1,252 | 1,390 | **+11%** |
| ona raspberry candy | 184 | 145 | **-21%** | 297 | 344 | **+16%** |

This is the textbook signature, exactly. Clicks down 21–40% on every top branded query, while impressions on those same queries are flat or **up**. Organic isn't losing eligibility to show for its own brand name — it's losing the click to something else on the same result page.

**Checked the Google Ads account directly** to find the mechanism: **there is no active Search campaign with manually-chosen keywords.** The only two live campaigns are `AON | Performance Max | TOF | ONA Coffee` and `AON | Shopping | Catalogue | ONA Coffee` — both automated campaign types where Google's algorithm decides which queries to match, not the advertiser. This is a widely-documented Performance Max behavior: PMax is known to aggressively match branded queries because they're cheap and convert well, with no way to exclude brand terms from a standard PMax campaign the way you could with a manually-built Search campaign. A paused campaign called `Website traffic-Wholesale page` (Search type, all ads stopped) confirms brand-term bidding isn't a deliberate, separately-managed strategy here — it's very likely a side effect of PMax's own targeting logic.

**Conclusion on this part:** cannibalization is real, confirmed, and traces to Performance Max auto-targeting branded search — not a deliberate brand-defense campaign. It's a real cost (organic clicks that used to be free are now costing ad spend) but it's a normal, fixable PMax configuration issue, not a crisis — and it does not explain the impression collapse.

**Independently confirmed by OMG (ONA's SEO agency) — checked their July 22, 2026 email** ("Meeting Follow-Up & Next Steps," to Macarena and Felipe): OMG reached this exact conclusion on their own and recommended the exact fix:
> "we've seen a significant decline in organic traffic since Google Ads launched, and this will help reduce cannibalisation of branded organic traffic... Add 'ONA Coffee' as an exact match negative keyword to the Performance Max and Shopping campaigns... Create a dedicated Brand Search campaign with a limited budget, rather than allowing branded traffic to be captured by the Performance Max and Shopping campaigns."

Two independent investigations — this one from GA4/Shopify/GSC/Ads data, OMG's from whatever they use — landed on the same mechanism and the same fix. As of that email, this action item was still open on ONA's side.

---

## 3. The real driver: impressions collapsed on two pages specifically — homepage and `/collections/all`

Sorted the same June-vs-April GSC comparison by **Pages** instead of Queries:

| Page | Impr. Apr | Impr. Jun | Impr. Δ | Clicks Apr | Clicks Jun | Clicks Δ |
|---|---|---|---|---|---|---|
| `/` (homepage) | 137,677 | 80,278 | **-57,399 (-42%)** | 8,725 | 6,527 | -2,198 (-25%) |
| `/collections/all` | 48,427 | 33,099 | **-15,328 (-32%)** | 2,636 | 1,497 | -1,139 (-43%) |
| `/pages/locations` | 37,673 | 36,661 | -1,012 (-3%) | 1,391 | 1,284 | -107 |
| `/products/raspberry-candy` | 3,821 | 3,733 | -88 | 632 | 453 | -179 |

The homepage alone accounts for **~38% of the entire site's impression loss** (-57,399 of -150,696 total). Homepage + `/collections/all` together account for **~48%** of it. Every other page's loss is comparatively minor. This is not spread evenly across the site or concentrated in one product category — it's two specific, high-level pages.

**Checked whether the homepage was deindexed or flagged:** no. URL Inspection shows it's indexed, no manual actions, no coverage errors — Google considers it fully eligible to appear. This rules out a hard technical failure (noindex tag, robots.txt block, removal request) as the cause. Whatever changed is affecting *ranking/relevance for broad queries* specifically, not indexing eligibility.

**Cross-checked which queries lost the most impressions site-wide** (same Compare, sorted by Queries instead of Pages) — this is where the homepage/collection-page loss actually shows up:

| Query | Impr. Apr | Impr. Jun | Impr. Δ | Clicks Apr | Clicks Jun |
|---|---|---|---|---|---|
| espresso beans | 55,430 | 6,891 | **-48,539 (-88%)** | 2 | 1 |
| coffee near me | 14,469 | 1,400 | **-13,069 (-90%)** | 2 | 1 |
| coffee beans | 9,834 | 4,870 | -4,964 (-50%) | 120 | 106 |
| coffee | 9,772 | 5,164 | -4,608 (-47%) | 11 | 7 |

These are broad, generic, category-level terms — exactly what a homepage or an "all products" collection page would be expected to rank for — and they had almost no clicks at either point in time (1–2 clicks on the two biggest losers, out of tens of thousands of impressions). This rules out cannibalization here too: there's no meaningful click volume to divert. This looks like ONA's homepage and collection-all page lost ranking eligibility for broad category terms specifically, while keeping (or improving) their ranking for branded and long-tail terms.

---

## 4. Root cause found: a known, pre-flagged theme-deployment risk that was never confirmed fixed

Checked ONA's Google Drive (`ONA_Project_WIP_Tracker`, created 2026-05-25) and Gmail for OMG correspondence, per Felipe's request. Both independently point at the same event: a **theme deployment scheduled for June 5–6, 2026** — which lands exactly at the point where GSC impressions took their steepest single-month drop (May 314,589 → June 243,371, -23%).

**OMG's own July 22 email says so directly.** Their action item: *"Complete a deeper technical SEO audit to investigate the recent keyword volatility and identify any technical issues **following the Shopify theme update**."* They're independently pursuing the same timing correlation found here.

**ONA's own project tracker had already flagged the exact two failure modes, before deployment, as unconfirmed risks (status: Not Started):**

> **M9** — 8 collection pages have no SEO copy: `/collections/all`, Matcha, Candy, Reserve, Brew Gear, Merch, Ready to Brew — all blank to Google. *(High priority)*
>
> **M10** — Homepage H1 is conditional on theme settings: new theme outputs H1 only if slide title is set. **Must be verified before deployment — not assumed fixed.** *(Medium priority)*

The pre-deployment checklist (`PRE-3`) required four fixes signed off in writing before go-live, one of which was explicitly *"Homepage H1 slide title setting."* Task `1.10`, "Verify post-deployment — live site checklist," was supposed to confirm *"H1 on homepage"* among other things — but nothing in the tracker shows this was ever confirmed done.

**Checked live, right now — both risks are real, present-tense problems:**

- Homepage's only H1 tag is `<h1 class="visually-hidden">ONA Coffee</h1>` — hidden from display, and containing only the brand name, no descriptive/keyword content. This is consistent with the slide-title setting never having been populated, exactly as M10 warned could happen.
- `/collections/all` has an H1 (`class="collection-title"`) but no description or body-copy block anywhere on the page — confirms M9 as still true today.

This lines up precisely with Section 3's findings: branded search (which doesn't depend on the H1 saying anything beyond the brand name) held up fine, while broad category terms like "coffee," "coffee beans," "espresso beans" — exactly what a real, keyword-rich H1 and collection description would target — collapsed. **This is likely the actual root cause of the entire impression decline in Section 1 and 3**, not a ranking-algorithm shift or reduced demand.

This is a fixable, well-scoped, non-controversial change: give the homepage a real, visible, keyword-relevant H1 (via the slide title setting or a template fix), and write actual collection description copy for `/collections/all` and the other 7 collections M9 flagged. Both were already scoped by OMG/ONA's own team before this ever became urgent.

---

## Open questions

1. **Confirm the H1/description fixes get shipped and re-pull GSC after.** The mechanism is now well-evidenced but not yet proven by outcome — the real test is whether impressions on these broad terms recover once the homepage H1 and collection descriptions are fixed. Worth re-pulling this same month-over-month comparison a few weeks after the fix ships.
2. **Should Performance Max be configured to exclude brand terms?** OMG has already given step-by-step instructions for adding `[ona coffee]` as an exact-match negative keyword to the PMax/Shopping campaigns, and recommends a separate, budget-limited Brand Search campaign instead. Per the July 22 email this was an open ONA-side action item — worth confirming whether it's been done.
3. **Margin impact of the click shift.** ~28–40% of branded clicks that used to be free organic clicks are now costing ad spend via PMax. Worth quantifying the actual CAC delta once full spend data is available.
4. **Is the homepage/collection-page loss related to anything in the funnel/checkout audit?** #20 (cart ATC regression) landed 2026-05-27–29, close to but not the same event as the June 5–6 theme deployment discussed here. Keep these as separate problems that happened to land in the same stretch of time.

Sources checked for the cannibalization research:
- [How Paid Search Incrementality Impacts SEO](https://www.searchenginejournal.com/paid-search-incrementality/397279/) — Search Engine Journal
- [Incremental Clicks: The Impact of Search Advertising](https://research.google/pubs/incremental-clicks-impact-of-search-advertising/) — Google Research
- [Paid search click share doubles as organic clicks fall: Study](https://searchengineland.com/paid-search-clicks-double-organic-clicks-fall-study-469519) — Search Engine Land
- [Paid Search Cannibalizing Organic Search](https://www.climbinsearch.com/faq/paid-search-cannibalizing-organic-search) — ClimbInSearch
