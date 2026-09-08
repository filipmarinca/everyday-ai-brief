# Everyday AI Brief

**A free prompt builder for everyday work. No account, AI API or prompt uploads.**

Turn a task into a brief with source material, a defined output, action boundaries and a review checklist. This is a deterministic educational tool, not an AI service. It does not generate an AI answer or call a model.

[Open the free tool](https://rawcdn.githack.com/filipmarinca/everyday-ai-brief/v1.0.1/docs/index.html) · [Download the standalone HTML](https://github.com/filipmarinca/everyday-ai-brief/releases/latest)

**Hosting notice:** GitHack shows a one-time external-content notice in browsers. Its **Open the page** button opens this repository's tool without an account. The offline download does not use the CDN. The CDN response is marked `noindex`, so the demo is not a standalone search-engine acquisition channel.

## What it does

- Builds a copyable prompt from your task, context, sources and desired output.
- Includes three original, fictional examples: meeting follow-up, expense summary and project update.
- Asks the AI to keep assumptions visible, preserve missing facts and explain its calculations.
- Defaults to draft-only instructions: no sending, spending, deleting or modifying files.
- Downloads a plain-text brief and works offline as one HTML file.
- Flags some possible credentials and email addresses before copying. This is a limited heuristic, not comprehensive sensitive-data detection.

Prompt instructions are **not** an authorization system. Models can still ignore instructions or make mistakes. Keep actual permissions narrow and independently review important outputs.

## Examples and further learning

### Meeting notes: suggested is not agreed

A fictional note says: "Thursday was suggested for release; no date was approved."

Ask an AI for decisions and it may overstate the note. A better brief explicitly asks it to separate decisions from proposals and mark an unapproved deadline as "not specified." Compare every claimed decision with the source.

### Expenses: do not combine currencies

The included example contains USD 12.00, USD 8.50 and EUR 15.00. A checkable result keeps them separate: **USD 20.50 across two rows; EUR 15.00 across one row.** There is no meaningful single currency total without an explicit conversion rule and rate.

### Project updates: testing is not finished

"The report page is being tested" does not mean the report page is complete. Ask for distinct Completed, In progress, Blockers and Decisions needed sections. Do not invent an owner or a date to make the update look tidy.

### Optional paid course

For a structured beginner course, see [AI for Absolute Beginners: ChatGPT, Claude & Copilot, by Corey Cascio](https://www.udemy.com/course/ai-productivity-for-beginners-safe-prompts-files-agents/?referralCode=24C06640F153438479E2).

**Disclosure:** this is an instructor referral link. An eligible purchase through it may give the course instructor a larger share of the sale. Udemy controls current pricing, checkout, access, refunds and payment processing. This free tool works independently; no purchase is required. The tool does not process payments or verify course earnings.

The repository contains original free exercises, not the course videos or its paid resource pack.

## Privacy

Inputs stay in the page. There is no backend, analytics, telemetry, browser storage, signup or external font request. The standalone HTML has no runtime network dependencies. Its content-security policy blocks connections and form submissions.

GitHub and other hosting providers may process ordinary page-request logs and use their own content notices or security/consent cookies. Clicking an external link leaves the tool and uses that website's privacy policy. Pasting a brief into an AI service sends it to that service, so remove confidential material first. Local downloads contain the text you entered.

## Run locally

Node.js 20 or later:

```sh
npm run build
npm test
npm run preview
```

The preview listens on `127.0.0.1:4173`. Set `PORT` to use another port.

For browser tests:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

The build creates `docs/index.html` and `dist/everyday-ai-brief.html`. Open the standalone file directly for offline use. The online copy is served from a versioned public GitHack CDN URL, with GitHub Releases as the download fallback. It is a free educational project, not a checkout or paid software service. All payments for the optional course happen on Udemy.

The CDN version is pinned to a release tag. Publish a new tag and update the link when the file changes; never move an existing release tag.

## Technology and license

Vanilla HTML, CSS and JavaScript. [Pretext](https://github.com/chenglou/pretext) supplies local text measurement under the MIT license; its license is included in `vendor/PRETEXT-LICENSE.txt` and in the standalone build. Playwright is a development-only test dependency.

This project is MIT licensed. It is not affiliated with or endorsed by OpenAI, Anthropic, Microsoft, GitHub or Udemy.

## Bounded launch observation

The optional `Seven-day course signal` GitHub workflow makes one public course-API request per day, using a standard runner in this public repository. It makes no AI calls, purchases or promotional posts. If enrollment rises above the launch baseline of zero, it opens at most one issue in this repository. **An enrollment is not proof of payment.** The workflow has no access to revenue or payout records and never reports dollars earned.

On its first scheduled run on or after 16 September 2026 UTC, the workflow disables itself. It uses only its automatically supplied repository token, not a personal access token. A local read-only observation is available with `node scripts/course-signal.mjs --dry-run`.
