# ASME at Ohio State Career Packet

An interactive professional-development guide for Ohio State engineering students. The packet covers resumes, LinkedIn, interviewing, career fairs, networking, internships, offer evaluation, graduate school, and reusable outreach templates.

## Live guide

[Open the Career Packet](https://asme-osu.github.io/ASME-Career-Packet/)

## Features

- Grouped, searchable navigation across 21 career-preparation sections
- Elevator-pitch builder
- Locally saved STAR interview-story bank with text and JSON exports
- AI interview-practice prompt generator
- Pre-tax offer comparison after estimated rent
- Locally saved preparation checklists
- Print and PDF-friendly layout

## Privacy

The site has no backend and does not upload form entries. STAR stories and checklist progress are stored in the current browser using `localStorage`. Resume summaries and job descriptions entered into the prompt generator remain on the page until the user copies the generated prompt into another service.

Clearing browser storage removes saved stories and checklist progress. STAR-story JSON backups can be exported and imported on another device.

## Run locally

The packet is a static site. From the repository directory, start any local HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `index.html` directly also works, although clipboard behavior varies between browsers on local files.

## Validate changes

Run the dependency-free repository checks before committing:

```sh
node scripts/validate.mjs
```

The validator checks JavaScript syntax, duplicate IDs, section balance, internal navigation targets, label associations, current edition wording, and external-link safety. GitHub Actions runs the same validation on pushes and pull requests.

## Updating the annual edition

Before each academic year:

1. Update the edition in the header and footer.
2. Review time-sensitive compensation data and replace the source, values, and reference year together.
3. Recheck career-resource recommendations and template language.
4. Test navigation, search, story import/export, checklist persistence, offer calculations, and print/PDF output.
5. Run `node scripts/validate.mjs`.

## Deployment

GitHub Pages publishes the repository root from the `main` branch. Changes merged into `main` are deployed automatically by GitHub's Pages workflow.

## Project structure

- `index.html` — page content, styling, and browser-side interactions
- `scripts/validate.mjs` — dependency-free repository checks
- `.github/workflows/validate.yml` — automated validation
