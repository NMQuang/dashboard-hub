# Setup Dify Workflow cho Event Reminder

Hướng dẫn tạo workflow trong Dify để gửi email nhắc nhở sự kiện gia đình (sử dụng Resend qua HTTP Node).

---

## Bước 1: Tạo Workflow mới trên Dify

1. Truy cập [app.dify.ai](https://app.dify.ai) (hoặc Dify self-hosted của bạn).
2. Tạo App mới: **Create from Blank** → **Workflow**.
3. Đặt tên: `Family Event Reminder`.

---

## Bước 2: Khai báo Start Node (Variables)

Tại node **Start**, thêm các biến số (Variables) dạng **String** sau đây. Những biến này sẽ được truyền từ Next.js cron:

1. `recipient_email` (Ví dụ: `quangnmjp96@gmail.com`)
2. `email_subject` (Ví dụ: `📅 Nhắc nhở: 2 sự kiện gia đình trong 7 ngày tới`)
3. `event_list` (Danh sách các sự kiện dạng text, ví dụ: `• 🎂 Sinh nhật — Sinh nhật bé Cafe (12 Tháng 6, 2026)`)
4. `event_count` (Ví dụ: `2`)

---

## Bước 3: Thêm Node LLM (Tạo nội dung Email)

1. Nhấn nút `+` sau node Start, chọn **LLM**.
2. Chọn model (Ví dụ: `gpt-4o-mini` hoặc `claude-3-haiku` để tiết kiệm chi phí).
3. **System Prompt**:
   ```text
   Bạn là một trợ lý ảo của gia đình. Bạn sẽ nhận được danh sách các sự kiện gia đình sắp diễn ra trong đúng 7 ngày tới.
   Hãy viết một email nhắc nhở ngắn gọn, vui vẻ và ấm áp bằng tiếng Việt.
   Không cần tiêu đề email, chỉ trả về nội dung HTML body (bắt đầu bằng thẻ <div>).
   Thiết kế giao diện email bằng HTML/CSS inline, sử dụng font sans-serif, màu nền nhẹ nhàng, giống một thiệp nhắc nhở dễ thương.
   ```
4. **User Prompt**:
   ```text
   Số lượng sự kiện: {{event_count}}
   Danh sách sự kiện:
   {{event_list}}
   
   Hãy viết HTML cho email.
   ```
   *Lưu ý: Bạn chọn các biến từ Start node cho phần {{...}}*

---

## Bước 4: Thêm HTTP Request Node (Gửi email qua Resend)

1. Sau node LLM, thêm node **HTTP Request**.
2. Cấu hình node:
   - **Method**: `POST`
   - **URL**: `https://api.resend.com/emails`
   - **Headers**:
     - `Authorization`: `Bearer re_XXXXXXXXXXXXX` (Thay bằng API Key Resend của bạn)
     - `Content-Type`: `application/json`
   - **Body (dạng JSON)**:
     ```json
     {
       "from": "Family Hub <noreply@yourdomain.com>",
       "to": ["{{#1719280000000.recipient_email#}}"],
       "subject": "{{#1719280000000.email_subject#}}",
       "html": "{{#1719280000001.text#}}"
     }
     ```
     *Lưu ý: Thay `yourdomain.com` bằng domain đã verify trên Resend. Các phần `{{#...#}}` bạn click để chọn từ danh sách biến: Chọn `recipient_email` và `email_subject` từ node Start, chọn `text` từ output của node LLM.*

---

## Bước 5: Thêm End Node

1. Sau node HTTP Request, thêm node **End**.
2. Trả về kết quả:
   - `resend_status`: chọn `status_code` từ HTTP Request node.
   - `resend_body`: chọn `body` từ HTTP Request node.

---

## Bước 6: Lấy API Key và tích hợp vào Dashboard

1. Nhấn **Publish** ở góc phải trên.
2. Tại menu bên trái, chọn **API Access** (Truy cập API).
3. Nhấn **API Key** → **Create new API Key** → Copy chuỗi `app-xxxxxxxxxxxxxxxxxxxx`.
4. Mở file `.env.local` trong dự án Dashboard Hub, thêm dòng sau:
   ```env
   DIFY_EVENT_REMINDER_API_KEY=app-xxxxxxxxxxxxxxxxxxxx
   ```
5. Đảm bảo `.env.local` cũng có `RECIPIENT_EMAIL`:
   ```env
   RECIPIENT_EMAIL=quangnmjp96@gmail.com
   ```

Xong! Giờ mỗi 06:00 sáng JST, hệ thống sẽ gọi Dify, Dify sẽ gọi LLM sinh HTML email dễ thương, sau đó tự gọi Resend gửi về mail của bạn.
