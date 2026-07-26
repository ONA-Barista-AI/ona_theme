# ONA Coffee — Organic Search Downtrend & Paid Channel-Mix Shift

**Date:** 2026-07-26
**Branch:** `felipe/funnel-conversion-audit`
**Scope:** Test the hypothesis that organic search visibility/sales are declining and paid spend is masking it in headline revenue.

**Result: two separate, real phenomena, not one.** Felipe's pushback on the first pass of this analysis was correct: "paid cannibalizes organic" is a real, well-documented mechanism for **clicks**, but has no documented mechanism for reducing **impressions** — so a 38% impression drop needed a different explanation. Digging further with keyword-level GSC data, page-level GSC data, and the actual Google Ads account found both things are genuinely happening, for different reasons:

1. **Click cannibalization on branded search terms** — real, matches the textbook signature exactly, and traces to Performance Max/Shopping campaigns that target branded queries automatically (no manual keyword control exists in this account).
2. **A much larger impression/visibility collapse concentrated on two pages — the homepage and `/collections/all`** — unrelated to paid ads, still unexplained, and the more urgent problem of the two.

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

## Open questions

1. **What changed on the homepage or `/collections/all` around April 2026 to cause this?** Not yet identified. Worth checking: theme/content change history for those two templates in this window (the repo's own commit history starts 2026-05-27, so an earlier change — before the branch's visibility — or a Shopify-admin-side content edit is more likely than a tracked code change), Core Web Vitals for those specific URLs, and whether page title/meta description/structured data changed. This is a real, still-open SEO investigation, separate from anything in the funnel/checkout audit.
2. **Should Performance Max be configured to exclude brand terms?** Standard PMax doesn't support keyword-level brand exclusion the way Search campaigns do, but brand exclusion lists and account-level negative keywords are possible in some configurations — worth a conversation with whoever manages the Ads account (or Google's own PMax brand controls, which have expanded over time) before assuming nothing can be done.
3. **Margin impact of the click shift.** ~28–40% of branded clicks that used to be free organic clicks are now costing ad spend via PMax. Worth quantifying the actual CAC delta once full spend data is available — this is a real, quantifiable cost even though it's not the bigger problem.
4. **Is the homepage/collection-page loss related to anything in the funnel/checkout audit?** #20 (cart ATC regression) landed 2026-05-27–29 — inside this window, but the impression decline was already underway in April, before that commit. Keep these as separate problems; both were degrading performance in the same stretch of time but don't appear causally linked.

Sources checked for the cannibalization research:
- [How Paid Search Incrementality Impacts SEO](https://www.searchenginejournal.com/paid-search-incrementality/397279/) — Search Engine Journal
- [Incremental Clicks: The Impact of Search Advertising](https://research.google/pubs/incremental-clicks-impact-of-search-advertising/) — Google Research
- [Paid search click share doubles as organic clicks fall: Study](https://searchengineland.com/paid-search-clicks-double-organic-clicks-fall-study-469519) — Search Engine Land
- [Paid Search Cannibalizing Organic Search](https://www.climbinsearch.com/faq/paid-search-cannibalizing-organic-search) — ClimbInSearch
