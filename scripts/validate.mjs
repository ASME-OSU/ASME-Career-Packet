import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const errors = [];

const fail = message => errors.push(message);

if (!/^<!DOCTYPE html>/i.test(html)) fail('index.html must begin with an HTML5 doctype.');

const scriptMatches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
for (const [index, match] of scriptMatches.entries()) {
  try { new Function(match[1]); }
  catch (error) { fail(`Inline script ${index + 1} has invalid JavaScript: ${error.message}`); }
}

for (const [name, source] of [['config.js', config], ['sw.js', serviceWorker]]) {
  try { new Function(source); }
  catch (error) { fail(`${name} has invalid JavaScript: ${error.message}`); }
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) fail(`Duplicate IDs: ${duplicateIds.join(', ')}`);

const anchors = [...html.matchAll(/href="\#([A-Za-z][\w:-]*)"/g)].map(match => match[1]);
const missingTargets = [...new Set(anchors.filter(anchor => !ids.includes(anchor)))];
if (missingTargets.length) fail(`Internal links without targets: ${missingTargets.join(', ')}`);

const openingSections = (html.match(/<section\b/gi) || []).length;
const closingSections = (html.match(/<\/section>/gi) || []).length;
if (openingSections !== closingSections) fail(`Section tags are unbalanced: ${openingSections} opening, ${closingSections} closing.`);

for (const match of html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)) {
  const attributes = match[1];
  const body = match[2];
  const forMatch = attributes.match(/\bfor="([^"]+)"/i);
  if (!forMatch && !/<input\b/i.test(body)) fail(`Label is not associated with a control: ${body.replace(/<[^>]+>/g, '').trim().slice(0, 60)}`);
  if (forMatch && !ids.includes(forMatch[1])) fail(`Label points to missing control: ${forMatch[1]}`);
}

for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
  const attributes = match[1];
  if (/target="_blank"/i.test(attributes) && !/rel="[^"]*noopener/i.test(attributes)) {
    fail(`External link opened in a new tab is missing rel="noopener": <a${attributes}>`);
  }
}

if (/2025[–-]26/.test(html)) fail('The previous 2025–26 edition remains in index.html.');
if (/Resume_2025\.pdf/.test(html)) fail('A year-specific 2025 resume filename remains in index.html.');
if (/\.innerHTML\s*=/.test(html)) fail('Avoid innerHTML assignments; render dynamic content with DOM APIs and textContent.');

if (!/rel="manifest"[^>]+href="manifest\.webmanifest"/.test(html)) fail('index.html must link to manifest.webmanifest.');
if (!manifest.name || !manifest.short_name || manifest.display !== 'standalone') fail('The web app manifest is missing required install metadata.');
for (const icon of manifest.icons || []) {
  if (!fs.existsSync(new URL(`../${icon.src}`, import.meta.url))) fail(`Manifest icon is missing: ${icon.src}`);
}
if (!fs.existsSync(new URL('../assets/asme-osu-logo.png', import.meta.url))) fail('The local ASME Ohio State logo is missing.');
if (!serviceWorker.includes("'./index.html'") || !serviceWorker.includes("'./config.js'")) fail('The offline app shell must cache index.html and config.js.');

if (errors.length) {
  console.error('Validation failed:\n');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validation passed: ${ids.length} IDs, ${anchors.length} internal links, ${openingSections} sections, ${scriptMatches.length} inline script, configuration, manifest, and offline shell checked.`);
