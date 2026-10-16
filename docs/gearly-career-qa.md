# Gearly Career Packet QA

Validation date: October 16, 2026.

## Automated coverage

`npx playwright test tests/gearly-career.spec.js --workers=2`

Result: **20 passed**, covering the existing desktop Chromium and Pixel 7 projects. The complete packet regression suite also passed: **80 tests** across both projects.

The question matrix checks the selected chapter, relevant evidence, and every returned source: each source ID must exist exactly once in the real packet, and each quoted excerpt must occur in that target's static content. This protects against plausible-looking answers with unrelated or invented citations.

| Try asking | Expected packet grounding |
| --- | --- |
| How do I improve my resume bullets? | Resume guidance on actions, results, and honest evidence |
| Show me a freshman resume example without an internship | Freshman example; early projects and part-time work are valid evidence |
| What is the STAR method? | Situation, task, action, and result in the interview chapter |
| What should I wear to an interview? | Dress chapter and business/professional attire guidance |
| How should I improve my LinkedIn headline? | LinkedIn profile/headline guidance |
| Can I share confidential internship CAD in my portfolio? | Portfolio permissions; do not publish internal material without permission |
| How do I prepare for a career fair? | Research employers and prepare resumes and introductions |
| What should I compare in a full-time offer? | Pay, benefits, job conditions, and the written offer |
| How do I prepare for graduate school research? | Research fit, preparation, recommenders, and faculty outreach |
| Show me a post interview thank you email template | Actual packet email template |

Additional checks cover:

- Conversational follow-ups stay with the verified chapter; unrelated questions and live job requests decline safely.
- Questions about current pay do not invent a salary figure. Generic offer-comparison guidance may still be returned.
- Unique private-data sentinels placed in form values and generated story, offer, pitch, prep, and interviewer outputs never enter the source index or answers.
- The launcher hides while chat is open. Input stays visible within the compact viewport, and completed replies retain a Gearly avatar.
- Clicking a sophomore-resume citation activates the proper mobile chapter, opens its closed example, and navigates to the real local hash.
- HTML-like input remains literal text, reset clears history, and pending replies cannot reappear after reset.
- Session history survives reload; reset survives reload; Escape closes chat and restores launcher focus.
- Normal-motion thinking state completes; reduced-motion styles suppress animation. Dark appearance and print hiding work. User-message and send-button text meet a measured minimum 4.5:1 contrast in dark mode.
- After the service worker is ready, an offline reload still opens Gearly and answers packet questions. No new external chat service is contacted and question text does not appear in external requests.

## Scope and limits

This is local retrieval from the packet's teaching content, not a live job/salary feed or a review of the reader's saved worksheets. Existing packet fonts and Google Analytics may attempt their usual requests on reload; those pre-existing integrations are distinct from Gearly's local question handling.

The automated suite samples representative topics and behavior. It does not establish that every possible phrasing will rank the right paragraph. Cite-and-open behavior gives readers a direct way to check the original guidance. Additional useful manual prompts include misspellings, short follow-ups such as “show me an example,” and questions combining several topics.
