# Career packet audit and upgrade

Reviewed September 21, 2026. Scope: the public career packet, existing local source, navigation, visual hierarchy, representative guidance, and core interactive workflows.

## Findings and changes

| Finding | Upgrade |
| --- | --- |
| The introduction lists the packet’s capabilities but leaves readers to choose among equally weighted links. | A prominent prep-plan action and three direct routes for applications, interviews, and offer decisions. |
| Navy glass panels, pill buttons, faint labels, and repetitive cards dilute the Ohio State identity. | Scarlet accents, warm paper, charcoal, stronger type hierarchy, quieter borders, and a more editorial layout. |
| Twenty-one chapters make it easy to lose orientation. | Chapter counts and next-chapter links, search in the sticky navigation, and accessible current-location indicators. |
| Active navigation calls `scrollIntoView` as readers move through sections, which can shift the document vertically. | Adjust only the navigation rail’s horizontal scroll when needed. |
| Scroll-reveal styling initially hides useful content. | Content is immediately visible, with no entrance animation required to read it. |
| Wide comparison tables are difficult to accommodate on phones. | Tables scroll within their containers; the document stays within the viewport. |
| The public version uses categorical resume rules and promises about ATS optimization. | The working copy already contained more flexible format advice; retained it and revised ATS language to avoid guaranteed outcomes and encourage truthful tailoring and checking parsed fields. Added Ohio State guidance. |
| Keyboard navigation lacks a skip link and a clear way to dismiss chapter menus. | Skip-to-content link, visible focus, Escape-to-close menus, and focus returned to the menu trigger. |

## Preserved

The local checkout already had uncommitted improvements to templates, career resources, saved stories, and tests. These were retained. All 21 career chapters and the prep planner, pitch builder, story bank, prompt generator, offer comparison, checklists, backups, and focused-print controls remain available. Storage keys and saved-data formats are unchanged.

The new stylesheet is included in the offline app shell, and the cache version is bumped so existing installations can receive it.

## Evidence and limits

The repository validator and all 18 desktop/mobile browser tests passed. Visual previews were inspected at 1440px and 390px; automated document-width checks cover 360px, 700px, and 1024px. Tests cover saved prep plans, story editing, offer comparison, keyboard search, backup download, focused print selection, chapter routing, and menu dismissal.

This is a usability and implementation review, not a complete verification of every external resource, compensation figure, or career recommendation. Focused print controls were tested; full printed page-by-page layout was not audited. The upgrade is local and has not been published to GitHub Pages.

## Sources checked

- [Public packet](https://asme-osu.github.io/ASME-Career-Packet/)
- [Ohio State: Write Your Resume](https://careerguide.osu.edu/resume/write-your-resume)
- [Ohio State: Engineering Career Services](https://engineering.osu.edu/career-services)

## Completed content pass

Added application sourcing, timing, tailoring, weekly planning, and troubleshooting under Student Paths; OIA and Ohio State fraud-support links; portfolio permissions; AI-practice boundaries; interview logistics and accommodation guidance linked to the EEOC; a worked simply supported beam example; full-time benefit and offer questions linked to the Department of Labor; and three copyable offer emails (10 templates total).

Corrected the checklist’s Word-template ban and rigid length/file-format rules, cover-letter style absolutes, and offer-deadline and reneging claims. Existing checklist positions were preserved for saved progress. The 18 browser tests passed after these additions; separate desktop/phone checks verified new-template counts, negotiation-template copying, search discovery, and document width. No publishing was performed.

## Visual and AI practice pass

Added four responsive visual guides (application loop, resume anatomy, STAR structure, and offer lenses) and converted long application/technical explanations into numbered cards. Expanded the existing prompt generator into a configurable interviewer with four focuses, two feedback styles, three target levels, and adjustable question counts. Prompts wait for one answer at a time, allow retries and pausing, and end with evidence-based practice feedback. Optional context remains on the page only; this is a prompt builder, not an AI service. Added follow-up prompt examples and direct navigation to the tool.

Desktop and phone screenshots were inspected. The expanded 22-test suite covers prompt configuration, copied content, default setup, and manual-copy fallback alongside prior workflows.

## Resume template and year examples

Rebuilt the editable Word resume with black horizontal section rules, serif type, and the requested order: education, skills and qualifications, experience, projects, organizations and leadership. Rendered the final DOCX and visually verified its single page. Updated the on-page resume structure graphic and added four expandable, fictional freshman-through-senior samples with notes about realistic evidence and differing timelines. Reviewed all four desktop specimens and the phone layout; all 24 browser tests passed, including example expansion and section-order checks. The template remains at the existing download URL, with an offline cache version bump.

## Quantifying resume results

Added six question groups covering scope, before/after measurements, requirements, beneficiaries, personal contribution, and supporting records. Included a 25% time-reduction example and a scope-based alternative when outcome data is unavailable, with guidance on estimates and confidentiality.
