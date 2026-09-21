# ASME at Ohio State Career Packet

An interactive professional-development guide for Ohio State engineering students. The packet covers resumes, LinkedIn, interviewing, career fairs, networking, internships, offer evaluation, graduate school, and reusable outreach templates.

## Live guide

[Open the Career Packet](https://asme-osu.github.io/ASME-Career-Packet/)

## Features

- Grouped, searchable navigation across 21 career-preparation sections
- Keyboard-friendly search with highlighted results and recent searches
- Personalized, date-based preparation plans for fairs, interviews, searches, and offer decisions
- Elevator-pitch builder with local persistence
- Locally saved STAR interview-story bank with text and JSON exports
- Expandable, editable, and copyable STAR stories for rehearsal
- Configurable AI interviewer prompts: four interview focuses, coaching or realistic feedback, adjustable question counts, and copy fallback
- Responsive visual guides for application strategy, resume structure, STAR answers, and offer evaluation
- Comparison of up to four offers by pre-tax value after rent and weighted qualitative fit
- Locally saved preparation checklists
- Focused print/PDF options for one section, checklists, templates, or STAR stories
- Shareable links for every section
- Downloadable resume, project-portfolio, and application-tracker templates
- Resume template with section rules and education → skills → experience → projects → organizations order
- Expandable freshman, sophomore, junior, and senior resume examples
- Complete JSON backup and restore for all saved tools
- Installable offline web app support

## Content additions

Application strategy, student support and scam awareness, a worked beam interview example, responsible AI practice, portfolio permissions, full-time offer questions, and negotiation/acceptance/decline templates complement the original 21 chapters.

## Privacy

The site has no backend and does not upload form entries. Prep plans, pitch-builder entries, STAR stories, checklists, offer comparisons, and recent searches are stored in the current browser using `localStorage`. Resume summaries and job descriptions entered into the prompt generator remain on the page until the user copies the generated prompt into another service.

Clearing browser storage removes saved tool data. Use **Data & Backup → Export All Data** to move or preserve everything in one JSON file. The separate STAR-story text and JSON exports remain available for interview preparation.

## Run locally

The packet is a static site. From the repository directory, start any local HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `index.html` directly also works, although clipboard, installation, and offline behavior require an HTTP or HTTPS server.

## Validate changes

Run the dependency-free repository checks before committing:

```sh
node scripts/validate.mjs
```

For the complete browser test suite:

```sh
npm install
npx playwright install chromium
npm test
```

The validator checks JavaScript syntax, duplicate IDs, section balance, internal navigation targets, label associations, current edition wording, external-link safety, the annual configuration, and offline assets. Playwright tests the key workflows in desktop and mobile Chromium. GitHub Actions runs both on pull requests and pushes to `main`.

## Updating the annual edition

Before each academic year:

1. Update `edition` in `config.js`.
2. Review the `compensation` object in `config.js` and replace the source, values, and reference year together.
3. Review the prep-plan tasks and offer-fit weights in `config.js`.
4. Recheck career-resource recommendations and template language in `index.html`.
5. Run `npm test` and manually review print/PDF output.

## Deployment

GitHub Pages publishes the repository root from the `main` branch. Changes merged into `main` are deployed automatically by GitHub's Pages workflow.

## Project structure

- `index.html` — page content, styling, and browser-side interactions
- `config.js` — annual edition, compensation references, prep plans, and offer-fit weights
- `manifest.webmanifest` and `sw.js` — installation and offline app shell
- `assets/` — local brand and app assets
- `tests/` and `playwright.config.js` — desktop and mobile browser tests
- `scripts/validate.mjs` — dependency-free repository checks
- `.github/workflows/validate.yml` — automated validation
