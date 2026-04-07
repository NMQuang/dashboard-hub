# Dify Workflow: Báo Giá Vàng Sáng (DIFY_GOLD_ALERT_WORKFLOW_ID)

> **Goal**: A daily 07:00 ICT workflow that receives Vietnam gold prices from the dashboard cron,
> generates a Vietnamese morning briefing via LLM, and sends it to Gmail via Resend.

---

## 1. Prerequisites

| Tool | Purpose | Free tier |
|------|---------|-----------|
| [app.dify.ai](https://app.dify.ai) | Workflow builder | ✓ |
| [resend.com](https://resend.com) | Email delivery API | 100 emails/day |
| Your dashboard deployed on Vercel | Triggers the workflow | ✓ |

---

## 2. Create the Dify Workflow

### 2.1 New workflow

1. Go to **app.dify.ai** → **Studio** → **Create App**
2. Choose **Workflow** (not Chatbot or Agent)
3. Name it: `gold-alert-morning`
4. Click **Create**

### 2.2 Configure Start node inputs

Click the **Start** node → **Add Input Variable** for each row below:

| Variable name | Type | Description |
|---|---|---|
| `recipient_email` | String | Email to send to |
| `date` | String | e.g. "Thứ Hai, 06 tháng 4 năm 2026" |
| `triggered_at` | String | e.g. "07:00 ICT" |
| `xau_price` | String | e.g. "$3020.50" |
| `xau_change` | String | e.g. "-0.42" |
| `vn_mieng_buy` | String | e.g. "168.1 triệu" |
| `vn_mieng_sell` | String | e.g. "171.1 triệu" |
| `vn_mieng_change` | String | e.g. "-0.81" |
| `vn_nhan_buy` | String | |
| `vn_nhan_sell` | String | |
| `vn_nhan_change` | String | |
| `vn_sjc_buy` | String | |
| `vn_sjc_sell` | String | |
| `vn_sjc_change` | String | |
| `vn_nutrang_buy` | String | |
| `vn_nutrang_sell` | String | |
| `vn_nutrang_change` | String | |
| `top_news_1` | String | Headline |
| `top_news_1_url` | String | Article URL |
| `top_news_2` | String | |
| `top_news_2_url` | String | |
| `top_news_3` | String | |
| `top_news_3_url` | String | |
| `portfolio_qty` | String | e.g. "2" (lượng) |
| `portfolio_cost` | String | e.g. "164.0 triệu" |
| `portfolio_value` | String | e.g. "168.1 triệu" |
| `portfolio_pnl` | String | e.g. "4.1 triệu" |
| `portfolio_pnl_pct` | String | e.g. "+2.50" |

---

## 3. Add LLM Node — Generate Email Content

### 3.1 Add the node

**Start** → click **+** → choose **LLM**

### 3.2 Model settings

- **Model**: `claude-haiku-4-5` or `gpt-4o-mini` (fast + cheap for daily emails)
- **Temperature**: `0.4` (consistent tone, slight variation)
- **Max tokens**: `1024`

### 3.3 System prompt

```
Bạn là trợ lý tài chính cá nhân, viết email báo cáo giá vàng buổi sáng bằng tiếng Việt.
Ngắn gọn, rõ ràng, thân thiện. Không dùng markdown. Chỉ xuất nội dung email thuần text.
```

### 3.4 User prompt (copy exactly, use variable references)

In Dify, reference variables using `{{variable_name}}` syntax:

```
📅 {{date}} — {{triggered_at}}

BÁO GIÁ VÀNG SÁNG NAY

── GIÁ VÀNG QUỐC TẾ ──
XAU/USD: {{xau_price}} ({{xau_change}}% so với hôm qua)

── GIÁ VÀNG TRONG NƯỚC (nguồn BTMC) ──
Vàng Miếng BTMC
  Mua vào: {{vn_mieng_buy}}
  Bán ra:  {{vn_mieng_sell}}
  Thay đổi: {{vn_mieng_change}}% so với phiên trước

Vàng Nhẫn
  Mua vào: {{vn_nhan_buy}}
  Bán ra:  {{vn_nhan_sell}}
  Thay đổi: {{vn_nhan_change}}%

Vàng SJC
  Mua vào: {{vn_sjc_buy}}
  Bán ra:  {{vn_sjc_sell}}
  Thay đổi: {{vn_sjc_change}}%

Vàng Nữ Trang
  Mua vào: {{vn_nutrang_buy}}
  Bán ra:  {{vn_nutrang_sell}}
  Thay đổi: {{vn_nutrang_change}}%

── TIN TỨC VÀNG ──
1. {{top_news_1}}
   {{top_news_1_url}}
2. {{top_news_2}}
   {{top_news_2_url}}
3. {{top_news_3}}
   {{top_news_3_url}}

── DANH MỤC GIA ĐÌNH ──
Số lượng: {{portfolio_qty}} lượng
Vốn: {{portfolio_cost}}
Giá trị hiện tại: {{portfolio_value}}
Lãi/Lỗ: {{portfolio_pnl_pct}}% ({{portfolio_pnl}})

Dựa trên dữ liệu trên, hãy viết một đoạn nhận xét ngắn (2-3 câu) về diễn biến giá vàng
hôm nay và khuyến nghị ngắn cho nhà đầu tư vàng cá nhân.

Kết thúc bằng: "Chúc bạn ngày mới tốt lành!"
```

> **Tip**: In Dify's LLM node, click **`{x}`** to insert variable references from the Start node.

---

## 4. Add HTTP Node — Send Email via Resend

### 4.1 Get Resend API key

1. Sign up at [resend.com](https://resend.com)
2. **Dashboard** → **API Keys** → **Create API Key** → copy the key (`re_xxx...`)
3. Verify your sending domain (or use `onboarding@resend.dev` for testing)

### 4.2 Add the HTTP node in Dify

**LLM** → click **+** → choose **HTTP Request**

### 4.3 Configure the HTTP node

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `https://api.resend.com/emails` |

**Headers** (add each):
```
Authorization    Bearer re_YOUR_RESEND_API_KEY
Content-Type     application/json
```

> Store the API key in Dify's **Environment Variables** (`re_xxx`) and reference it as `{{ENV.RESEND_API_KEY}}` instead of hardcoding.

**Body** (raw JSON):

```json
{
  "from": "Gold Alert <alert@yourdomain.com>",
  "to": ["{{recipient_email}}"],
  "subject": "📊 Báo Giá Vàng Sáng {{date}}",
  "text": "{{LLM節点の出力変数}}"
}
```

> Replace `{{LLM節点の出力変数}}` with the actual output variable from the LLM node.
> In Dify, click **`{x}`** → select the LLM node output (usually named `text` or `output`).

**Full body example** using Dify variable reference:
```json
{
  "from": "Gold Alert <alert@yourdomain.com>",
  "to": ["{{recipient_email}}"],
  "subject": "📊 Báo Giá Vàng {{date}}",
  "text": "{{#LLM_node_name.text#}}"
}
```

### 4.4 Add End node

**HTTP** → **+** → **End**

Set **Output** to the HTTP node's response (or the LLM text).

---

## 5. Workflow diagram

```
[Start]
  │  All input variables (29 fields)
  ▼
[LLM: Generate Email]
  │  Model: claude-haiku / gpt-4o-mini
  │  System + User prompt with all variables
  │  Output: email body text
  ▼
[HTTP: Send via Resend]
  │  POST https://api.resend.com/emails
  │  Body: { from, to, subject, text }
  ▼
[End]
```

---

## 6. Get the Workflow ID

After building the workflow:

1. Click **Publish** (top right) to make the workflow runnable via API
2. Go to **API Access** → copy the workflow URL
   - It looks like: `https://api.dify.ai/v1/workflows/run`
   - The **Workflow ID** is in the URL of the workflow page itself:
     `https://app.dify.ai/app/YOUR_WORKFLOW_ID/workflow`
3. Also copy your **API Key** from **API Access** → **API Key**

---

## 7. Set environment variables

### Local development (`.env.local`)

```bash
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_GOLD_ALERT_WORKFLOW_ID=YOUR_WORKFLOW_ID_HERE
```

### Vercel production

```
Dashboard → project → Settings → Environment Variables

DIFY_API_KEY             app-xxx...
DIFY_BASE_URL            https://api.dify.ai/v1
DIFY_GOLD_ALERT_WORKFLOW_ID   wf-xxx...
```

---

## 8. Test manually

### Option A: Trigger via dashboard alerts page

Go to `/invest/alerts` → find "Báo Giá Vàng Sáng" → click **Run now**

### Option B: curl

```bash
curl -X GET https://your-dashboard.vercel.app/api/cron/gold-alert \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Option C: local dev

```bash
curl http://localhost:3000/api/cron/gold-alert
```

Check the response:
```json
{
  "success": true,
  "run_id": "run_xxx",
  "snapshot": {
    "vn_mieng_sell": "171.1 triệu",
    "vn_mieng_change": "-0.81",
    "news_count": 8,
    "portfolio_qty": 0
  }
}
```

---

## 9. Dify environment variables (optional but recommended)

Store secrets inside Dify instead of hardcoding in the HTTP node:

1. In Dify workflow → **Environment Variables** (top menu)
2. Add:
   - `RESEND_API_KEY` = `re_xxx...`
3. Reference in HTTP node header: `{{ENV.RESEND_API_KEY}}`

---

## 10. Troubleshooting

| Problem | Check |
|---|---|
| Workflow not triggered | Is `DIFY_GOLD_ALERT_WORKFLOW_ID` set in Vercel env? |
| Email not received | Check Resend dashboard → Logs |
| LLM output is empty | Check LLM node variable references (`{{variable_name}}` exact match) |
| "401 Unauthorized" on cron | Set `CRON_SECRET` in Vercel, pass it in the Authorization header |
| VN gold shows `—` | BTMC API might be down; the cron still runs and sends whatever data is available |
| Wrong email format | Resend requires `from` to be a verified domain or use `onboarding@resend.dev` for testing |

---

## 11. Cron schedule reference

| Schedule | UTC | ICT (Vietnam) |
|---|---|---|
| `0 0 * * *` | 00:00 | **07:00** ← gold alert |
| `0 22 * * *` | 22:00 | **05:00** ← morning brief |
| `0 23 * * *` | 23:00 | **06:00** ← crypto digest |

Schedules are configured in `vercel.json` and only run automatically on **Vercel Pro**.
On the free tier, trigger manually from `/invest/alerts`.
