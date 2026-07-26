# ONA Coffee — Organic Search Downtrend & Paid Channel-Mix Shift

**Date:** 2026-07-26
**Branch:** `felipe/funnel-conversion-audit`
**Scope:** Test the hypothesis that organic search visibility/sales are declining and paid spend is masking it in headline revenue.

**Result: confirmed.** Google Search Console (site-wide, independent of Shopify) and Shopify's own traffic-type-attributed sales (independent of GSC) tell the same story from two different data sources: organic is down sharply since April 2026, and paid spend ramped up almost exactly in step to cover the gap.

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

**The counterintuitive part:** average position has been *improving* almost the whole period (32.5 → ~9), yet impressions dropped 38% and clicks dropped 25% from April to June 2026 alone (and July is on the same trajectory). This is not a ranking-quality problem — the pages that do rank are ranking better than ever. It reads as a loss of **visibility surface area**: fewer distinct queries/pages generating impressions at all, even though the ones that remain are performing well. Consistent explanations include reduced indexed-page coverage, reduced content breadth (e.g. product/collection consolidation), or falling underlying search demand for ONA's terms — not yet distinguished; see Open questions below.

---

## 2. Shopify's own traffic-type-attributed sales — organic collapsing, paid ramping in lockstep

Pulled via ShopifyQL (`FROM sales`, `GROUP BY traffic_type, month`, last-click attribution) — a completely independent data source from GSC, based on actual completed orders rather than search impressions.

Note: `traffic_type` attribution only starts producing real (non-$0) numbers from **October 2025** — everything before that shows as unattributed (`None`), meaning proper channel tracking wasn't wired up until then. The comparison below uses only the reliably-attributed window.

| Month | Organic net sales | Organic orders | Paid net sales | Paid orders |
|---|---|---|---|---|
| Oct 2025 | $41,364 | 394 | $81 | 1 |
| Nov 2025 | $184,773 | 1,784 | $467 | 7 |
| Dec 2025 | $76,927 | 746 | $22 | 1 |
| Jan 2026 | $106,794 | 1,018 | $131 | 1 |
| Feb 2026 | $110,746 | 1,111 | $127 | 1 |
| Mar 2026 | $95,215 | 978 | $290 | 3 |
| **Apr 2026** | **$113,087** | **1,080** | **$3,539** | **34** |
| May 2026 | $85,464 | 880 | $8,118 | 89 |
| **Jun 2026** | **$54,660** | **482** | **$38,081** | **336** |
| Jul 1–24, 2026 (partial) | $38,560 | 374 | $27,596 | 285 |

**Reading this month by month:**
- Through March 2026, Paid is essentially nonexistent ($22–$290/month) — Organic is carrying the store almost entirely.
- April 2026: Organic is still near its peak ($113K) but Paid starts moving ($3.5K, 34 orders) — the first real signal of a shift.
- May 2026: Organic drops 24% ($113K → $85K). Paid roughly doubles ($3.5K → $8.1K) but nowhere near enough to offset the organic loss. **Combined Organic+Paid falls from ~$117K to ~$94K.**
- **June 2026: Organic drops another 36% ($85K → $55K, a ~$31K loss). Paid jumps 4.7x ($8K → $38K, a ~$30K gain).** Almost a dollar-for-dollar swap. Combined Organic+Paid is effectively flat month-over-month (~$94K → ~$93K) — the paid ramp fully masked the organic decline in the headline number that same month.
- July 2026 (partial, 24 days): Organic continues declining ($38.6K, pace ~$50K for the full month, down again from June); Paid is roughly holding at its new elevated level ($27.6K, pace ~$36K). Combined is trending down again — the paid ramp hasn't fully kept pace with organic's continued fall into July.

**This directly confirms the hypothesis as stated:** organic search sales have been in a real, steep decline since April 2026, and a deliberate or coincidental ramp in paid spend beginning the same month — sharply accelerating in June — has been masking that decline in combined/headline revenue. Anyone looking only at total store revenue without splitting by channel would not have seen the organic problem; June's flat combined total in particular would have looked like a stable month rather than "organic fell 36%, paid happened to grow just enough to hide it."

---

## Open questions (not yet investigated)

1. **What's driving the GSC visibility loss specifically?** Ranking is fine; something else is shrinking impressions. Worth checking: Search Console's **Pages** report for whether specific high-traffic pages lost indexing or impressions (product/collection pages vs blog/content), and the **Queries** report split by branded ("ona coffee", "ona") vs non-branded terms — if it's concentrated in branded queries, this is a brand-awareness/demand issue; if non-branded, more likely a content/indexing issue.
2. **Is the paid ramp deliberate?** Not yet confirmed whether this was an intentional decision (e.g. a campaign increase to compensate for a known organic dip) or a coincidence. Worth checking actual Google Ads spend/budget change history for April–June 2026 to see if it lines up with a specific campaign or budget decision, or happened independently of anyone noticing the organic slide.
3. **Is this related to any of the funnel/checkout findings from the same period?** #20 (the cart ATC regression) landed 2026-05-27–29, which is inside this window but doesn't explain the organic decline that was already underway in April/May — worth keeping as two separate problems rather than assuming one caused the other, though both were degrading the funnel at the same time.
4. **Margin impact.** Paid orders cost money to acquire; organic orders effectively don't. A revenue-neutral swap from organic to paid is not neutral on profitability. Worth quantifying blended CAC/margin impact once ad spend data is available.
