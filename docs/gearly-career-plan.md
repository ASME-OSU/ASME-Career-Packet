# Gearly for the ASME Career Packet

## Objective

Add the approved compact Gearly experience to the Career Packet, with answers grounded in the packet's published content and links to the relevant chapters. Keep the existing packet tools, mobile chapter mode, theme, print output and offline support intact.

## Execution plan

1. **Content and answer engine — delegated:** inspect the 21 chapters and anchored topics; build a local static-content index; support natural-language phrasing, synonyms and focused follow-ups; return concise packet excerpts with source links and a clear fallback when coverage is insufficient.
2. **Conversation interface — delegated:** reuse existing Gearly artwork and visual behavior; keep the chat compact with a visible header/input, persistent speaker portraits and reset; provide accessible section navigation, mobile layout, theme and reduced-motion support.
3. **Independent QA — delegated:** test representative career questions, source accuracy, unfamiliar topics, follow-ups, privacy boundaries, hostile input and section navigation across desktop/mobile.
4. **Integration and review — primary agent:** isolate work from existing uncommitted packet edits; add local assets and script/style loading; update offline caching and validation; run the full existing suite and inspect the actual browser UI.
5. **Delivery:** publish a reviewable PR, document limitations and representative questions, and provide a current source ZIP. A production merge is a separate rollout decision for this repository.

## Answer and privacy contract

- Published packet prose is the source of truth; source IDs resolve to real local sections.
- No external AI service, API key or question upload is required.
- Do not index input values, generated prompts, saved stories, offers, pitch details, preparation plans or assistant messages.
- Treat unsupported current facts (such as live job availability) as outside the packet's coverage.
- Preserve existing tools and storage keys. Gearly conversation history is scoped to the current browser tab and can be cleared.
- Avoid unsupported personalized judgments and fabricated salary/job guarantees; identify published examples as examples.

## Acceptance

- Useful sourced responses across resumes, interviews/STAR, fairs, LinkedIn/networking, portfolios, dress codes, opportunities, offers, graduate school and templates.
- The launcher hides while open; header/input remain visible; source navigation works in mobile chapter mode and expands collapsed content.
- Keyboard focus, Escape, dark/light modes, narrow/short screens, reduced motion, print and offline behavior verified.
- Existing packet tests pass, new tests exercise content and privacy boundaries, and review records any remaining limitations.
