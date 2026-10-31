# Seyi: Brevo, Telegram and Gemini setup

Online project: https://customer-insider-studio.ogunmusireseyi01.chatgpt.site
The hosted project is currently private to its owner. This update preserves that access setting.

## What each service does

- **Brevo** emails a personalized business-growth PDF to business owners, or the original `sales_automation_8_step_guide.pdf` to learners. Each email has exactly one PDF attachment.
- **Telegram** sends the site owner a plain-text notification containing the visitor's name, email and completed answers. It does not replace the website chatbot or send PDFs to visitors. Notifications happen once the completed submission is saved, even if Gemini or email delivery is unavailable.
- **Gemini** generates business plans using your approved prompt and the `one-pager.html` design. Learners do not need Gemini.

## Fill in `.env`

The `.env` file is already prepared in this project. Preserve any keys you have already added. The main fields are:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Seyi
BREVO_REPLY_TO_EMAIL=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

`BREVO_REPLY_TO_EMAIL` is optional. Telegram is optional: leave both Telegram fields blank to disable alerts. The guided chatbot works without OpenAI keys. The full `.env.example` also includes optional chat-model, local port and hosted-admin settings.

`.env` and `.env.local` are ignored by Git. Nonempty `.env.local` values override `.env`. Shell environment variables override both, even if blank. The local server reloads API settings per request; changing `PORT` or `HOST` requires restarting it. Never paste keys into chat or commit a populated environment file.

## Brevo

1. In Brevo, configure your sending domain and register the sender address you want to use. See the [official transactional email setup guide](https://developers.brevo.com/docs/send-a-transactional-email).
2. Create a **Brevo API key** and put it in `BREVO_API_KEY`. Use an API key, not an SMTP password.
3. Put the registered email address into `BREVO_FROM_EMAIL`, such as `hello@yourdomain.com`. Use only the address here, without `<...>` or a display name.
4. Set `BREVO_FROM_NAME` to `Seyi` or your preferred sender name. Optionally add a valid `BREVO_REPLY_TO_EMAIL` for replies.

The app uses Brevo's transactional email API directly; SMTP host/port settings and an email template ID are not needed. Acceptance by Brevo does not guarantee inbox delivery. Check the Brevo transactional logs for delivery/bounce status. Accepted sends are recorded in the database so retries do not send the same PDF to the same address again on the same UTC date. Failed sends can be retried. After an uncertain timeout, check the inbox and Brevo logs before retrying.

## Brevo contact lists

After Brevo accepts a PDF email, the app creates or updates that contact and adds the email address to:

- **List 9:** business owners.
- **List 10:** learners.

These IDs are fixed on the server; no extra environment variables are needed. Ensure both lists exist in the Brevo account associated with `BREVO_API_KEY`, and that the API key can manage contacts. Existing contact attributes, blacklist settings and other list memberships are not overwritten. A visitor who takes both paths can belong to both lists.

PDF delivery and list sync are tracked separately. If email is rejected or unconfirmed, list sync does not run. If the email succeeds but list sync fails, the PDF remains marked as accepted. Requesting the saved report/email again retries list sync without resending that accepted PDF on the same UTC date. This is a retry on request, not a scheduled background worker. The owner JSON export includes `brevoListSync` with the list ID and sync status.

## Telegram

1. Open the official [@BotFather](https://t.me/BotFather) in Telegram. Send `/newbot` and follow the prompts. Put the resulting token into `TELEGRAM_BOT_TOKEN`. See the [official bot tutorial](https://core.telegram.org/bots/tutorial).
2. Open your new bot in Telegram and tap **Start** or send `/start`.
3. In the project folder, run:

   ```bash
   npm run telegram:chats
   ```

4. Copy the intended `chatId` from the output into `TELEGRAM_CHAT_ID`. This command reads recent updates; it does not send messages or remove webhooks. If your bot already uses a webhook, obtain the chat ID from that existing app.
5. For a group instead, add the bot to the group, send `/start@YourBotUsername` in the group, and run the command again. Group IDs can be negative; keep the minus sign.

The app sends notifications only to the chat configured on the server. Visitor input cannot choose the Telegram destination. No incoming webhook is needed for these outgoing notifications. Telegram errors do not stop PDF generation or email delivery. Failed notifications can retry when the visitor requests the same saved report again; successful notifications are recorded to prevent ordinary retries from duplicating them. An interrupted request after Telegram accepts a message can still result in a duplicate on recovery; Telegram has no send-message idempotency key.

## Check and run locally

```bash
npm run env:check
npm run dev
```

Open http://127.0.0.1:3000. If your development server is already running on port 3000, keep that server or stop it with Ctrl+C before starting another. `env:check` reports missing settings without displaying secrets or contacting providers. It exits with a nonzero code when one of the three service groups is incomplete; leave optional Telegram blank if you do not want alerts.

After adding your settings, complete a learner interview with an email you control first. Confirm that the original learner PDF arrives and your Telegram notification appears. Then test the business path to check Gemini and the personalized PDF. These are real sends once the keys are configured.

## Configure the online site too

Local `.env` files are **not uploaded** and do not configure the online site. In Sites production environment controls, add the same nonempty service settings listed above as server runtime variables, marking keys/tokens as secrets, then redeploy. Keep the existing `ADMIN_EMAIL` owner setting. No Resend settings are used.

## Email message

Both email paths explicitly tell the visitor that their PDF is attached. The business subject is “Your Sales Automation Plan”; learners receive “Your Sales Automation Learning Guide”. Each email invites visitors who want a more personal touch to [book a call with Seyi](https://cal.com/seyiogunmusire/ai-sales). The booking link is in the email body; no booking is needed to receive or open the attached PDF.

## Email-only background requests

Visitors submit their email at the end of the interview. `POST /api/plan` saves their answers and email, claims a `plan_requests` record, and immediately acknowledges the request (202). There is no visitor report preview or download control. The Worker uses `ctx.waitUntil` to prepare the business PDF with Gemini and send it through Brevo; learners receive the original guide without calling Gemini. Processing is detached from the visitor connection, so closing the tab does not cancel the request. Local Node provides the same background-task interface while the server remains running.

The hosted runtime allows 30 seconds of post-response work. Provider work is bounded to 27 seconds total, with 20 seconds shared by Gemini attempts, up to 4 seconds for email and 2 seconds for list sync. Telegram runs alongside the plan. This is best-effort background execution, not a durable queue with automatic retries after a runtime crash. Saved job status remains available; a failed or stale job can be retried using the same conversation. A saved successful PDF is reused. For longer jobs or unattended automatic retries, a separate queue service would be needed.

`POST /api/plan/status` requires the conversation ID and access token and returns only processing/accepted/failed status. The page polls status while open and restores it after a reload. It never marks a request as sent until Brevo confirms acceptance. The owner dashboard and JSON export include email plan status. Provider inbox delivery still needs to be checked in Brevo. No extra environment keys are required for this flow.
