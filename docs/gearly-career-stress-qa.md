# Career Packet Gearly stress review

Reviewed October 16, 2026 against the deployed PR #3 implementation, followed by regression tests of these fixes.

## Reproduced issues and changes

| Trigger | Previous behavior | Improvement |
| --- | --- | --- |
| “I am a freshman, what should I wear?” or a senior asking about graduate school | Class-year boosts routed unrelated questions to resume examples | Apply year-specific example boosts only to resume/CV requests |
| “What if I do not have an internship?” (a built-in suggestion) | Returned the internship/co-op comparison | Recognize missing-experience phrasing and prioritize the alternatives chapter |
| “What should I ask the interviewer?” (another built-in suggestion) | Could fall back or retrieve unrelated interview paragraphs | Normalize interviewer phrasing and rank actual candidate questions |
| An interview card followed by unrelated paragraphs | A heading could leak into later passage metadata | Resolve headings within each passage’s containing card or subsection |
| Offer acceptance/decline, deadline-extension, or networking email requests | Could quote general advice or the template introduction | Prefer the corresponding actual email template |
| Branding, final checklists, quantified results, or plural “scams” | Some supported questions fell back | Add missing topic coverage and normalize common word forms |
| Current hiring/pay or the next career-fair date | Returned general preparation advice without clearly answering the live-data limitation | Explicitly state that current hiring, salary, and event schedules are unavailable |
| Long conversations | Saved history was bounded, but rendered messages kept accumulating | Bound rendered history to 24 messages as well as session storage |
| Reset with an unfinished draft | Draft remained after resetting | Clear the input together with the conversation |

Long replies open at their beginning instead of scrolling past the start of the answer. This is covered by a viewport assertion.

Generic example boosts now stay within the requested topic so “show me an example” does not jump to another chapter.

## Validation

`npm test`: **96 tests passed** across desktop Chromium and Pixel 7.

The 16 new stress runs cover:

- A 41-question matrix with chapter/fallback expectations and exact excerpt containment in every cited local target. Selected answers also check meaningful content, including rejection of unrelated passages in interviewer-question responses.
- Every suggested follow-up generated from the supported matrix questions; generic examples and “tell me more” must retain their chapter.
- 1,000 mixed requests per browser project, including blank, Unicode, control-character, HTML-like, overlong, unrelated, and normal queries. The batch must complete within a generous 15-second regression budget without exceptions or unbounded answers.
- 60 submitted questions per browser project; rendered and restored history remain bounded, close/reopen preserves a draft, and reset clears it.
- 320×360, 390×300, and 844×390 viewports with visible, in-bounds header and input controls.
- Blocked session-storage access with working question handling and reset.
- Actual wave download/replay lifecycle using controlled browser time: an idle interval precedes each wave, replay uses a fresh object URL and one downloaded asset, and opening chat cancels animation.

The existing tests continue to cover private worksheet exclusion, exact citations, mobile source navigation and collapsed examples, offline reload, reduced motion, dark-mode contrast, printing, and the packet’s original tools.

## Limits

This is sampled quality and local browser stress testing, not proof that every wording will retrieve the best passage. The assistant remains deterministic packet search, not a generative editor or live employer service. The load test measures local answer handling; no remote AI service or shared-server load is involved. Source links let readers verify the underlying guidance.
