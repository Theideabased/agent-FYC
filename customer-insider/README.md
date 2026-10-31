# Seyi — Automation Chat MVP

A conversation-first website. A minimal light screen opens with a centered greeting inside the chat and one rounded input below, based on the supplied screenshot. Seyi greets visitors, asks their name, offers two automation paths, then asks the questions for their chosen path. Replies appear progressively. Visitors provide an email and request their PDF. Google Gemini creates each business owner’s personalized one-page PDF using `one-pager.html` as the design template. Learners receive the original `sales_automation_8_step_guide.pdf` without requiring Gemini. The contact is retained even when generation fails. The request automatically sends the correct PDF to the supplied email. Visitors can also download it or retry delivery.

## Run locally

Requires Node.js 22 or newer. No application dependencies or package installation. Node 22 may print an experimental warning for its built-in SQLite module.

```bash
npm run dev
```

Open http://127.0.0.1:3000. The development command watches imported source files and automatically restarts the server after code changes. If an older server is already running, stop it with Ctrl+C and run `npm run dev` again once to enable watch mode. Each browser profile keeps one conversation in local browser storage, including submitted answers and the transcript. Refreshing or reopening resumes it. There is no new-conversation button. Clearing browser storage or using another browser/device starts a separate conversation; cross-device identity enforcement would require visitor sign-in. The local copy remains even without consent to save the completed report to the owner’s database. Completed interviews are saved after explicit storage consent. Locally, SQLite persists at `.data/customer-insider.sqlite`; hosting uses the D1 database provisioned by Sites.

## Enable Brevo email and Telegram alerts

The ready-to-fill `.env` supports `GEMINI_API_KEY`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, optional `BREVO_REPLY_TO_EMAIL`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. See [SETUP.md](SETUP.md) for sender verification, bot creation, chat ID lookup, local checks and production configuration.

```bash
npm run env:check
npm run telegram:chats
```

The first command checks local configuration without sending or displaying secrets. The second reads recent Telegram bot updates to find your chat ID; start a chat with your bot first. Telegram is used for owner alerts containing saved visitor contact details and answers. Brevo sends visitors their one PDF attachment automatically, then adds business owners to list 9 and learners to list 10. List-sync failures can retry independently of an accepted email. Notifications are optional and do not block PDF generation or email if they fail. No Resend configuration is used.

Local files are ignored by Git. Nonempty `.env.local` values override `.env`; shell variables override both. Configure the same names in Sites production runtime secrets and redeploy for online delivery. Provider acceptance is not a guarantee of inbox delivery; check Brevo logs for delivery/bounce events.

## MVP scope and architecture

- `worker/index.js`: Cloudflare Worker, landing-page HTML/CSS, client interview, validation and email integration. `reports/` contains the business prompt, original template, shared business HTML/PDF renderer and exact learner PDF as base64. `scripts/bundle-worker.mjs` inlines these modules into the self-contained Worker artifact.
- `server.mjs`: local Node adapter; loads `.env` / `.env.local` only into the server environment.
- `POST /api/chat`: returns an SSE stream with stage metadata, text deltas and completion. Enforces the greeting, two-path choice and four-question state machine.
- `POST /api/report`: for the current automation flow, requires a valid email and an explicit plan-request action. The email capture step has no consent checkbox. The request records the button action rather than claiming a checkbox agreement. Saves contact details first, then uses Gemini to generate and persist the personalized report. Repeated requests return the same saved report. Legacy seven-answer preview requests remain supported for historical compatibility.
- `POST /api/email`: validates answers, recipient, consent and ownership of the saved interview, records the email attempt, creates the PDF and calls Brevo.
- `GET /api/admin/responses`: owner-only, paginated saved responses for the dashboard and JSON exports.
- `GET /api/status`: exposes only whether Brevo email, Gemini report generation and Telegram alerts are configured, never secret values.
- `tests/app.test.mjs`: request validation, both automation paths, question progression, SSE parsing, mocked model streaming and interrupted-stream fallback, client script parsing, PDF structure, database persistence, missing configuration, mocked attachment delivery and provider failures.

## Gemini personalized reports

Add these server-only values to `.env.local` (preserve any existing email settings):

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.8-flash
```

Create/manage the key in [Google AI Studio](https://aistudio.google.com/api-keys). The default model is [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash); choose another compatible model explicitly if required by your project. Local `.env.local` values are reloaded for each request, so refresh the page after adding the key. Port or host changes still require restarting the server. Local keys do not configure the hosted site: set the same names as production runtime secrets in Sites and redeploy to enable production generation. Never paste API keys in chat or commit `.env.local`.

The generator calls Google's [generateContent endpoint](https://ai.google.dev/api/generate-content) with [structured JSON output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). It sends the validated visitor name, intent, business name, role, problem area and critical business/team/goals context, **not the contact email**. Unknown industry, customers, tools and goals must be identified as missing information instead of inferred from the business name. Business reports use the owner-approved prompt in `reports/business-prompt.js` and the supplied design retained in `reports/business-template.html`. Seven sections cover the current situation, opportunity, buyer channel, blockers, three actions with timing and metrics, first automation and immediate next step. Revenue remains a range, not a budget. Links are omitted because the model has no resource-verification tool. For relevant problems, the model may select one server-approved Salesforce 2026 survey statistic; the app adds the exact wording, attribution and survey context. Other numeric percentage claims require a matching visitor-supplied percentage. See `reports/README.md` for source details. The app requests structured section content and renders trusted markup itself; Gemini cannot inject executable HTML. The saved report includes a complete self-contained HTML document. The business PDF uses the same measured layout, colours, green symbol, table, and Helvetica/Arial typography. Body text stays at 11pt; oversized content is rejected and retried once with a shorter-content instruction. Only the finished PDF is downloaded or attached to business report emails; HTML stays internal as the template and preview format. Learners receive only the exact supplied `sales_automation_8_step_guide.pdf`, available at `/resources/automation-learning-guide.pdf`. Learner answers and email are saved without any Gemini request. Both paths automatically request email delivery when the visitor clicks “Send my PDF”; failures are shown honestly and the saved PDF stays available for download and retry. Output is validated before saving and is bounded to fit one A4 page. The report preview, PDF download and email attachment all use this exact saved report.

If a key is missing, Google returns an error, output is invalid or generation is blocked, contact details remain saved and the app shows an actionable error. It never substitutes a generic report and labels it as Gemini output. With no key, new personalized PDFs cannot yet be created. The owner dashboard still shows the captured email and report status. Existing reports remain readable.

Each provider attempt has a 40-second timeout (business content may be retried once to fit) and a fixed Google API endpoint. No visitor-supplied URL is fetched. The key is sent in a server-side header. A model response cannot execute code or send email. Automated tests mock provider responses, including failures, malformed output, caching, concurrent requests and PDF attachment consistency. A real Google request still requires your own configured key and model access.

## Live AI and guided replies

The default guided mode works immediately without a model key. It uses each visitor's name, selected path and earlier answers in follow-up questions, with incremental text display. The label says **Guided conversation**. It does not pretend to be a generative model.

For generated AI replies, enable OpenAI Developers in ChatGPT to configure a server-only OpenAI key through its supported setup workflow. For local development, set `OPENAI_API_KEY` and an explicitly selected `OPENAI_MODEL` in `.env.local`, then restart. For hosted Sites, configure those names as production runtime secrets and redeploy. Never paste keys into chat. There is no default model selection; use a model available to your API project that supports text streaming through Responses.

The implementation uses the [Responses API streaming protocol](https://developers.openai.com/api/docs/guides/streaming-responses): `stream: true`, text delta forwarding, and `store: false`. It sets an output limit and a 30-second provider timeout. No visitor-provided URL is fetched. A failed or interrupted model reply is replaced by the full guided question with a visible fallback notice. Actual provider access and billing must be configured before live model replies can be verified.

The greeting and two-choice menu are controlled by the app. Later AI replies receive the validated previous answers and the prescribed scope for the next question: four on the learning path, five on the business-sales path. Partial conversations are processed by the model when enabled, but are not inserted into the response database. The privacy notice discloses this processing. The report generator is separate from chat: Google Gemini personalizes either a four-answer learning roadmap or a five-answer business plan. Neither a generated report nor a chat reply constitutes verified market research.

Both the Worker and local Node server stream data through to the browser. The local adapter uses a streaming pipeline rather than buffering the response with `arrayBuffer()`. The browser displays arriving text progressively, respects reduced-motion preferences, supports Enter to send and Shift+Enter for newlines, and provides a retry when the connection fails.

The business-sales path uses the owner-approved five questions: business name; role in the business; the main problem area (Marketing, Sales, Operations or Finance); annual revenue (Under $10k, $10k-$100k, $100k-$500k or Above $500k); and anything critical about the business, team or goals. Questions three and four are single-choice menus. The original open-ended critical-context question remains last, as question five. The last answer supports up to 1,200 characters. Exact question wording is app-controlled; an optional generated acknowledgement is followed by the canonical question.

## Saved responses and JSON export

Completed interviews are stored in Cloudflare D1 (`DB`) when the visitor submits the plan request. New records distinguish the plan-request action from historical checkbox agreements, with a request timestamp and method. The contact email is a first-class `submissions.email` field, retained independently of optional email delivery. It appears in the owner dashboard and JSON exports. The database keeps the visitor name, contact email, selected path, four structured answers, generated report, submission timestamp and consent record. Report status distinguishes pending, awaiting configuration, generating, failed and ready; provider and model are recorded for generated reports. Partial chats are not saved. Historical seven-answer reports remain readable alongside the new automation flow. Editing and regenerating creates a new report revision; retrying the same generation does not create duplicate rows.

Email requests are linked to their saved interview and store the recipient, consent timestamp, provider request ID where available, and status: `requested`, `unconfigured`, `rate_limited`, `failed`, `unknown` or `accepted`. `accepted` is provider acceptance, not confirmed inbox delivery. A provider timeout is `unknown`, since the provider may have accepted a request before the connection timed out. No marketing subscription is created.

Open `/admin` on the deployed site to review responses and export them as JSON. The API and page require a platform-authenticated email matching the server-only `ADMIN_EMAIL` setting. This is configured to the verified Site owner at deployment. It remains required even if the landing page is later made public. Do not use a shared admin password or expose this email check as a client-side guard. Local development strips hosted identity headers and does not simulate owner authentication; hosted authentication is required for the admin UI.

Exports include all submissions through paginated reads, with the latest 20 email attempts per submission; the database retains all attempts. Keep downloaded JSON files private. Records are retained until the owner removes them through database management. No automatic retention schedule is configured. The interface and privacy notice disclose storage. You can inspect the live tables in the Site's database settings or through the connected database tools.

`db/schema.sql` is the initial schema source, with additive changes in `db/migrations/`. `npm run db:generate` copies pending SQL and appends journal entries while refusing to rewrite existing migrations. The packaged `drizzle/` SQL and journal are applied by Sites before the updated Worker is activated. Applied migrations must not be edited: append new schema-only migrations for later changes. The local SQLite adapter applies pending journaled migrations at startup inside transactions and records them in `__local_migrations`. Existing databases created by the original adapter are adopted without replaying their initial schema. Migration 0001 adds email and report-generation fields without dropping existing records. Never commit `.data/`, exported responses or live database files.

## Validation

```bash
npm test
npm run build
npm run validate
```

The tests write sample and maximum-length PDFs to `/tmp`. Where Poppler is installed, independently inspect the generated PDF with:

```bash
pdfinfo /tmp/customer-insider-max.pdf
pdftotext /tmp/customer-insider-sample.pdf -
```

PDFs are exactly one A4 page, including maximum valid inputs. The compact built-in Helvetica font normalizes Latin accents; unsupported non-Latin characters appear as `?` in the PDF. On-screen reports preserve Unicode. Embed a Unicode font before launching in markets that need non-Latin PDFs.

## Access and launch

The initial Sites deployment is owner-private for review. Allow external visitors through the Site's access settings when ready to launch. This source also runs as an independent Cloudflare Worker.

Before sending launch traffic, configure the sender, verify one real email delivery, and review the responsive interface in your target browsers. Automated checks cover the service and generated PDF; a real browser and a production email credential were not available in the build session.

Email requests use JSON validation, same-origin checks, a honeypot, request-size limits, provider timeouts and duplicate-request protection. Best-effort per-isolate IP limits allow five email attempts, five new Gemini generation attempts and 100 chat replies per hour. Saved-report retries do not spend an additional model call. Database locks prevent simultaneous generation of the same report, with a two-minute stale-lock recovery window. It resets on Worker restarts and is not a distributed quota or bot defense. Before a broad public campaign, use hosting-level rate limiting and/or a verified challenge such as Turnstile. These controls are especially important because email sends have a cost. The UI deliberately avoids reporting an email as delivered.

## Customize

Edit `chatPlan` and `businessChatPlan` in `worker/index.js` to customize the path-specific questions. Keep the corresponding validators, answer editor and `getAnswers` aligned if changing the schema. Edit the system instruction and structured schema in `generateGeminiReport` for the personalized PDF recommendations. `automationReport` supports historical reports and is not used as a silent fallback for failed Gemini generation. Existing database tables store versioned answers as JSON, so no table migration is needed for this flow change. CSS variables at the top of the page define the visual palette. Change the embedded HTML title, description and brand copy when you choose your own business name.

The conversation cache also retains report references so the same saved report remains available after refresh. If a reply was interrupted by navigation, reopening retries that reply without adding another user answer. Browser storage may be unavailable in restricted browsing modes; the current tab still works in that case.

Current questionnaire submissions use `flowVersion: 4` with `businessName`, `role`, `problemArea`, `revenueBand` and `criticalContext`. The selected annual-revenue band is preserved verbatim, not converted into an exact number or treated as profit or available budget. Historical flowVersion 2 records remain readable. Cached older chats preserve their transcript, visitor name, selected path and email; the app asks the revised business questions as a new report revision rather than reinterpreting old answers. A local backup of the prior cached state is kept under `seyi.conversation.previous.v2`.

The email helper text reads “I will send your personalized PDF to your inbox.” The capture checkbox was removed. Current requests send `requestPlan: true`; older clients with genuine checkbox flags remain supported. The owner API exposes `planRequestedAt` and `requestMethod` for new requests, while `storageConsentAt` is reserved for historical checkbox records.

Returning questionVersion 3 chats keep their already supplied business name, role and problem area and continue at the new annual-revenue question. An earlier final critical-context answer is retained and prefilled for review at question five. Historical reports stay in the database; new answers create a new report revision.

## Learning path

The first choice is now “I want to learn automation.” It asks four questions: location; whether the visitor wants to help their own business or help other businesses as a consultant/freelancer; the tools/apps they use; and prior automation experience. Current tools and experience remain free text. Learning submissions use `flowVersion: 5`, `intent: learn`, `location`, `useCase`, `currentTools` and `experience`. Learners receive only the supplied `sales_automation_8_step_guide.pdf`; no Gemini request is needed for that path. The sales path retains its five business questions.

The UI derives question count, progress, choices, answer editor and completion from the selected path. Saved five-question business-sales conversations remain intact. Older “build automation for businesses” selections are migrated to the renamed learning option without reinterpreting their old business answers; the prior transcript is preserved and learning questions start after the saved name and path. Historical saved reports remain readable. Changing direction in the answer editor starts the chosen path’s questions instead of mapping unrelated fields across paths.

## First-visit greeting

The first screen is deliberately minimal and light, including when the device prefers dark mode. “Hi, I’m Seyi 👋 What’s your name?” types inside the chat at 36ms per Unicode character, twice the 18ms pace of later replies. The input is available during the reveal; submitting early completes the greeting and proceeds exactly once. Reduced-motion preferences show the greeting immediately. Returning visitors resume their existing conversation.
