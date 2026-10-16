# Gearly Career answer engine

`assets/gearly/career-engine.js` exposes `window.GearlyCareerEngine.create(document)` (also CommonJS). Instantiate once after the packet markup exists. `answer(question, previousContext)` returns `kind`, `text`, `sources`, `suggestions`, and bounded follow-up `context`. Render strings as text, and source IDs as local hash links. Reset should discard context. The engine never performs network requests.

## Grounding and privacy

The engine clones a fixed allowlist of 21 packet chapters once. It indexes static paragraphs, list items, tables, template text, and local heading metadata. It removes form controls, editable areas, scripts, generated live regions, saved STAR story containers, offer comparison results, and pitch/prep/interviewer outputs before extraction. It never reads values, localStorage, sessionStorage, or personal tool data. It remains isolated even when saved tools were populated before initialization.

Answers quote packet passages, with source IDs that already exist in the page. Excerpts preserve packet wording with whitespace normalized and long passages shortened. The resume-bullet blueprint additionally formats its extracted labels and questions with readable separators. Fictional resume/STAR examples are explicitly labeled. Domain synonyms, common misspellings, weighted term frequency, topic focus, and local heading context select passages; guidance and numerical recommendations are not generated from outside knowledge.

Keep `context.section`, `context.terms` (up to 6 known packet vocabulary tokens), and `context.excerpts` if conversation persistence is wanted. Restored terms are checked against the static vocabulary. Context changes when a user explicitly names another topic; a short unrelated question does not automatically inherit the prior topic.

## Representative checks

- “I’m a freshman with no internship. What goes on my resume?” → freshman advice on part-time work, introductory projects, and honest skills.
- “What is the STAR method?” → Situation → Task → Action → Result; “Show me an example” → labeled four-part fictional phone-stand answer.
- “What should I wear to a career fair?” → dress-code chapter rather than generic fair advice.
- “Can I upload internal CAD from my internship to my portfolio?” → specific employer/lab permission and prohibited disclosure guidance.
- “How long should a resume be?” → packet checklist’s undergraduate length guidance.
- “How do I follow up with a professor?” → packet’s once-after-1–2-weeks guidance.
- “How does the offer calculator work?” → hourly internship/co-op scope and explicit limits on full-time/take-home interpretation.
- “Show me an offer negotiation template.” → actual `offer-negotiation` source.
- “How do I write a cover letter?” → three extracted role, evidence, and closing paragraphs.
- “What is the weather?” / “Find live jobs for me” → honest out-of-scope response.

## Limits

This is deterministic packet search, not a remote language model or personalized resume editor. It cannot inspect a visitor’s saved work, search current vacancies, verify salaries, or fetch chapter events. Paraphrases outside its vocabulary may need a rephrased question. Sources should stay visible so visitors can read full context, including qualifications and fictional-example labels. A response may quote fewer passages when only one is a reliable match. It does not promise an exact requested count when the packet does not supply that count.

When the packet changes, the DOM snapshot automatically uses the changed static wording on the next page load. Update the section allowlist and topic metadata if a new chapter is added. Existing source IDs must remain valid.
