# Dify Alert Workflows — Setup Guide

Emails will be sent to **quangnmjp96@gmail.com** when each workflow fires.

---

## 4 Workflows to Create in Dify

| Workflow | Trigger | Env var |
|---|---|---|
| Morning Market Brief | Daily 07:00 JST | `DIFY_MORNING_BRIEF_WORKFLOW_ID` |
| Gold Price Alert (Báo Giá Vàng Sáng) | Daily 07:00 ICT / 00:00 UTC | `DIFY_GOLD_ALERT_WORKFLOW_ID` |
| Crypto Daily Digest | Daily 08:00 JST | `DIFY_CRYPTO_DIGEST_WORKFLOW_ID` |
| JPY/VND Weekly Digest | Mon 09:00 JST | `DIFY_FX_DIGEST_WORKFLOW_ID` |

---

## Step 1 — Create Dify Account

1. Go to [app.dify.ai](https://app.dify.ai) → Sign up
2. Create **4 new apps**, each type = **Workflow**

---

## Step 2 — Build Each Workflow in Dify UI

### Workflow 1: Morning Market Brief

**Inputs:** [date](file:///d:/OTHER/Dashboard/my-dashboard/components/widgets/HomeClient.tsx#18-23), `gold_price`, `gold_change`, `btc_price`, `btc_change`, `eth_price`, `eth_change`, `fet_price`, `jpy_rate`, `vnd_rate`, `recipient_email`

**Nodes:**
1. **LLM node** — Claude/GPT, system prompt:
   ```
   You are a financial analyst. Write a concise bilingual (English + Vietnamese) daily market brief.
   ```
   User message:
   ```
   Date: {{date}}
   Gold: ${{gold_price}} ({{gold_change}}%)
   BTC: ${{btc_price}} ({{btc_change}}%)
   ETH: ${{eth_price}} ({{eth_change}}%)
   FET: ${{fet_price}}
   USD/JPY: ¥{{jpy_rate}}
   USD/VND: ₫{{vnd_rate}}
   
   Provide brief market insights and today's outlook in both EN and VI.
   ```
2. **Email node** — To: `{{recipient_email}}`, Subject: `📊 Morning Market Brief – {{date}}`, Body: `{{llm_output}}`
3. **End node**

---

### Workflow 2: Gold Price Alert (Báo Giá Vàng Sáng)

> **Full guide:** See [`docs/dify-gold-alert-workflow.md`](./dify-gold-alert-workflow.md) for the complete step-by-step setup.

This workflow has been upgraded to a **daily Vietnam gold morning brief** (fires at 07:00 ICT / 00:00 UTC) instead of a threshold-based alert.

**Env var:** `DIFY_GOLD_ALERT_WORKFLOW_ID`

**Summary of inputs (29 fields):** date/time, XAU/USD international price, 4 VN gold types (miếng, nhẫn, SJC, nữ trang) each with buy/sell/change%, top 3 news headlines + URLs, family portfolio snapshot.

**Nodes:** Start → LLM (Vietnamese morning brief) → HTTP (Resend email) → End

Refer to [dify-gold-alert-workflow.md](./dify-gold-alert-workflow.md) for the exact node configuration, system/user prompts, and Resend HTTP node setup.

---

### Workflow 3: Crypto Daily Digest

**Inputs:** [date](file:///d:/OTHER/Dashboard/my-dashboard/components/widgets/HomeClient.tsx#18-23), `btc_price`, `btc_change`, `eth_price`, `eth_change`, `fet_price`, `fet_change`, `recipient_email`

**Nodes:**
1. **LLM node** — Bilingual crypto summary
2. **Email node** — Subject: `📈 Crypto Digest – {{date}}`
3. **End node**

---

### Workflow 4: JPY/VND Weekly Digest

**Inputs:** `week`, `jpy_rate`, `vnd_rate`, `triggered_at`, `recipient_email`

**Nodes:**
1. **LLM node** — Weekly FX summary, focus on Japan/Vietnam context
2. **Email node** — Subject: `💱 FX Weekly – {{week}}`
3. **End node**

> **Tip:** For the Email node, use Dify's built-in SMTP integration or connect Resend/SendGrid via API call node.

---

## Step 3 — Add to `.env.local`

```env
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1

DIFY_MORNING_BRIEF_WORKFLOW_ID=wf-xxxxxxxxxxxxxxxx
DIFY_GOLD_ALERT_WORKFLOW_ID=wf-xxxxxxxxxxxxxxxx
DIFY_CRYPTO_DIGEST_WORKFLOW_ID=wf-xxxxxxxxxxxxxxxx
DIFY_FX_DIGEST_WORKFLOW_ID=wf-xxxxxxxxxxxxxxxx

GOLD_ALERT_THRESHOLD=1.5
CRON_SECRET=your-random-secret-string
```

Get the Workflow ID from the Dify URL when viewing a workflow: `app.dify.ai/app/{id}/workflow`

---

## Step 4 — Test Manually (Dev)

```bash
# Test morning brief
curl http://localhost:3000/api/cron/morning-brief

# Test gold alert (checks if price moved since last call)
curl http://localhost:3000/api/cron/gold-alert

# Test crypto digest
curl http://localhost:3000/api/cron/crypto-digest

# Test FX digest
curl http://localhost:3000/api/cron/fx-digest
```

In production, add `Authorization: Bearer your-secret` header.

---

## Step 5 — Deploy to Vercel

```bash
git add .
git commit -m "feat: add dify alert workflows"
git push
```

Vercel picks up [vercel.json](file:///d:/OTHER/Dashboard/my-dashboard/vercel.json) cron config automatically. Crons run on **Vercel Pro** tier. On free tier, use the `Test →` button on the `/invest/alerts` page to trigger manually.

---

## Cron Schedule Summary

| Cron | UTC | JST | ICT (Vietnam) |
|---|---|---|---|
| `0 22 * * *` | 22:00 daily | 07:00 daily | 05:00 daily |
| `0,30 * * * *` | Every 30 min | Every 30 min | Every 30 min |
| `0 23 * * *` | 23:00 daily | 08:00 daily | 06:00 daily |
| `0 0 * * 1` | 00:00 Mon | 09:00 Mon | 07:00 Mon |
