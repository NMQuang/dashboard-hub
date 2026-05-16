// app/learn/japanese/data/wbs-data.ts

export interface Task {
  id: string
  name: string
  tags: string[]
  src: string
  min: number
}

export interface Week {
  id: string
  label: string
  tasks: Task[]
}

export interface MonthData {
  phase: number
  label: string
  weeks: Week[]
}

export const SRC_LABELS: Record<string, { text: string; color: string; bg: string; border: string }> = {
  tango:    { text: 'Tango/Hyougen',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  keigo:    { text: 'Keigo/Bunshou',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  bitesize: { text: 'Bite Size JP',   color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  bjt:      { text: 'Sách BJT',       color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  tips:     { text: 'Tips',           color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff' },
}

export const TAG_CONFIG: Record<string, { label: string; className: string }> = {
  listen:  { label: 'Listening', className: 'tag-listen' },
  read:    { label: 'Reading',   className: 'tag-read' },
  vocab:   { label: 'Từ vựng',  className: 'tag-vocab' },
  gram:    { label: 'Ngữ pháp', className: 'tag-gram' },
  test:    { label: 'Luyện đề', className: 'tag-test' },
  tips:    { label: 'Tips',     className: 'tag-tips' },
  weekend: { label: '📅 Cuối tuần', className: 'tag-weekend' },
}

export const PHASE_LABELS = ['', 'Giai đoạn 1', 'Giai đoạn 2', 'Giai đoạn 3']
export const PHASE_CLASSES = ['', 'ph1', 'ph2', 'ph3']

// ─────────────────────────────────────────────────────────────────────────────
// PLAN: Listening-first → Grammar+Reading → Sprint to BJT N2+
//
// Weekdays  : 90 min/ngày × 5 ngày = 450 min/tuần  → tasks thường 15–45 min
// Cuối tuần : 4 tiếng tổng = 240 min                → tasks weekend 60–120 min
//
// Phase 1A (T5–T6): Listening 100% — chưa học đọc/ngữ pháp
// Phase 1B (T7):    Bridge — introduce Reading nhẹ ở cuối tuần, Mock #1 cuối T7
// Phase 2  (T8–T9): Cân bằng 50% Nghe / 30% Đọc / 20% Ngữ pháp, Mock 2–3
// Phase 3  (T10–T12): Sprint, 2 Mock/tháng, thi thật
// ─────────────────────────────────────────────────────────────────────────────
export const DATA: Record<string, MonthData> = {
  "T5": {
    phase: 1,
    label: "Tháng 5 · Phase 1A — Chỉ BJT 聴解",
    weeks: [
      {
        id: "T5W1", label: "Tuần 1 (16–22/5) · Làm quen format + drill dạng câu", tasks: [
          { id: "t1", name: "BJT 聴解: nghe thử 5 câu đầu — ghi lại 3 dạng câu hỏi xuất hiện (hành động / thông tin / thái độ)", tags: ["listen"], src: "bjt", min: 20 },
          { id: "t2", name: "BJT 聴解: 10 câu dạng hỏi hành động (次は何をしますか) — không xem đáp án trước", tags: ["listen"], src: "bjt", min: 35 },
          { id: "t3", name: "BJT 聴解: nghe lại câu sai — nghe 2 lần, lần 2 có script, highlight từ không nhận ra", tags: ["listen"], src: "bjt", min: 25 },
          { id: "t4", name: "[Cuối tuần] BJT 聴解: làm 1 bộ mini (15 câu hỗn hợp) timed → phân loại câu sai theo dạng", tags: ["listen", "test", "weekend"], src: "bjt", min: 90 },
        ]
      },
      {
        id: "T5W2", label: "Tuần 2 (23–31/5) · Drill chuyên sâu từng dạng", tasks: [
          { id: "t5", name: "BJT 聴解: 10 câu dạng hỏi thái độ — chú ý でも/ただ/まあ/一応 → ghi pattern nhận biết", tags: ["listen"], src: "bjt", min: 35 },
          { id: "t6", name: "BJT 聴解: 10 câu dạng hỏi thông tin cụ thể — tập ghi số liệu/ngày ngay khi nghe", tags: ["listen"], src: "bjt", min: 35 },
          { id: "t7", name: "BJT 聴解: nghe lại toàn bộ câu sai tuần này — lần 2 có script", tags: ["listen"], src: "bjt", min: 25 },
          { id: "t8", name: "[Cuối tuần] BJT 聴解: 1 bộ đề Listening đầy đủ timed 50 phút → ghi điểm, phân tích lỗi 30 phút", tags: ["listen", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
    ]
  },
  "T6": {
    phase: 1,
    label: "Tháng 6 · Phase 1A — Chỉ BJT 聴解 + Mock Listening lần 1",
    weeks: [
      {
        id: "T6W1", label: "Tuần 1 (1–7/6) · Drill dạng hành động + điện thoại", tasks: [
          { id: "u1", name: "BJT 聴解: 10 câu dạng hành động (次は何をしますか) — đọc câu hỏi 30 giây trước khi nghe", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u2", name: "BJT 聴解: 8 câu điện thoại business — chú ý 折り返し、席を外す、〜の件で", tags: ["listen"], src: "bjt", min: 30 },
          { id: "u3", name: "BJT 聴解: nghe lại câu sai tuần này — nghe 2 lần, lần 2 có script", tags: ["listen"], src: "bjt", min: 20 },
          { id: "u4", name: "[Cuối tuần] BJT 聴解: 1 bộ mini (20 câu) timed 40 phút → phân tích lỗi theo dạng", tags: ["listen", "test", "weekend"], src: "bjt", min: 90 },
        ]
      },
      {
        id: "T6W2", label: "Tuần 2 (8–14/6) · Drill dạng thái độ", tasks: [
          { id: "u5", name: "BJT 聴解: 10 câu dạng thái độ — でも/ただ/まあ/一応 + nhận biết qua giọng điệu", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u6", name: "BJT 聴解: 10 câu hỗn hợp không phân loại — timed, ghi số liệu/ngày ngay khi nghe", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u7", name: "BJT 聴解: nghe lại câu sai — highlight từ không nhận ra, note pattern lặp lại", tags: ["listen"], src: "bjt", min: 20 },
          { id: "u8", name: "[Cuối tuần] BJT 聴解: làm lại câu sai T6W1+W2 → xác định dạng câu sai nhiều nhất", tags: ["listen", "test", "weekend"], src: "bjt", min: 90 },
        ]
      },
      {
        id: "T6W3", label: "Tuần 3 (15–21/6) · Tăng tốc + drill thông tin cụ thể", tasks: [
          { id: "u9",  name: "BJT 聴解: 10 câu dạng thông tin cụ thể — tập ghi số liệu/ngày/tên ngay khi nghe", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u10", name: "BJT 聴解: 10 câu điện thoại + cuộc họp hỗn hợp — không dừng giữa chừng", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u11", name: "BJT 聴解: nghe lại câu sai + tổng hợp pattern sai tuần 1-3 tháng 6", tags: ["listen"], src: "bjt", min: 25 },
          { id: "u12", name: "[Cuối tuần] BJT 聴解: 1 bộ đề Listening đầy đủ timed 50 phút → ghi điểm baseline", tags: ["listen", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "T6W4", label: "Tuần 4 (22–30/6) · MOCK LISTENING SECTION #1", tasks: [
          { id: "u13", name: "MOCK LISTENING SECTION #1 — làm phần 聴解 sách BJT đúng giờ 50 phút, không pause", tags: ["listen", "test"], src: "bjt", min: 60 },
          { id: "u14", name: "Phân tích lỗi Mock: phân loại (A) không biết từ / (B) nghe không kịp / (C) hiểu nhầm", tags: ["test"], src: "tips", min: 40 },
          { id: "u15", name: "Nghe lại toàn bộ câu sai Mock — nghe 2 lần, lần 2 có script, highlight từ miss", tags: ["listen"], src: "bjt", min: 35 },
          { id: "u16", name: "[Cuối tuần] Drill lại dạng câu sai nhiều nhất từ Mock #1 Listening — 20 câu focused", tags: ["listen", "test", "weekend"], src: "bjt", min: 90 },
        ]
      },
    ]
  },
  "T7": {
    phase: 1,
    label: "Tháng 7 · Phase 1B — Nghe thành thục + Bridge sang Đọc",
    weeks: [
      {
        id: "V1", label: "Tuần 1 (1–7/7) · Listening mastery + introduce Reading (cuối tuần)", tasks: [
          { id: "v1", name: "Phân tích Mock T6 Listening — lên danh sách 3 dạng câu nghe yếu nhất cần drill T7", tags: ["test"], src: "tips", min: 20 },
          { id: "v2", name: "BJT 聴解: 15 câu dạng 次は何をしますか — tập đọc câu hỏi trước 30 giây, ghi pattern", tags: ["listen"], src: "bjt", min: 40 },
          { id: "v3", name: "Tango/Hyougen: nhóm hợp đồng — 契約、条項、締結、納品、検収、発注 (40 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "v4", name: "Shadowing Bite Size ở 1.15x — nếu khó, nghe 5 lần trước rồi mới shadow", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "v5", name: "[Cuối tuần] BJT 読解: làm quen format — đọc 3 email mẫu, ghi từ không biết, không cần làm bài tập", tags: ["read", "weekend"], src: "bjt", min: 60 },
        ]
      },
      {
        id: "V2", label: "Tuần 2 (8–14/7) · Listening nâng cao + Reading nhẹ", tasks: [
          { id: "v6", name: "BJT 聴解: 10 câu dạng hỏi thái độ nâng cao — でも/ただ/まあ/一応 + context câu trước", tags: ["listen"], src: "bjt", min: 35 },
          { id: "v7", name: "Bite Size JP: nghe tập mới → viết 議事録 đầy đủ: 日時・参加者・決定事項・アクション", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "v8", name: "Tango/Hyougen: nhóm báo cáo/phân tích — 分析、傾向、要因、課題、改善策 (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v9", name: "Dictation: ghi lại toàn bộ 1 đoạn 4–5 câu từ Bite Size — không dừng giữa chừng", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "v10", name: "[Cuối tuần] BJT 読解: 3 bài email ngắn + 1 thông báo nội bộ — áp dụng kỹ thuật scan (câu hỏi trước → keyword)", tags: ["read", "weekend"], src: "bjt", min: 60 },
        ]
      },
      {
        id: "V3", label: "Tuần 3 (15–21/7) · Grammar bắt đầu + Reading tăng", tasks: [
          { id: "v11", name: "Keigo/Bunshou: học bảng 3 cột (普通形/丁寧語/敬語) — 20 động từ quan trọng nhất (bắt đầu từ đây)", tags: ["gram"], src: "keigo", min: 35 },
          { id: "v12", name: "Bite Size JP: nghe 5 tập liên tiếp không dừng — luyện concentration, không ghi chú", tags: ["listen"], src: "bitesize", min: 40 },
          { id: "v13", name: "Tango/Hyougen: nhóm sự cố — クレーム、謝罪、補償、再発防止、エスカレーション (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v14", name: "BJT 聴解: drill đọc câu hỏi trong 30 giây trước khi nghe — tập thành phản xạ", tags: ["listen"], src: "bjt", min: 30 },
          { id: "v15", name: "[Cuối tuần] BJT 読解: 2 bài thông báo + 1 báo cáo ngắn timed (3 phút/câu) + Keigo ôn bảng", tags: ["read", "gram", "weekend"], src: "bjt", min: 90 },
        ]
      },
      {
        id: "V4", label: "Tuần 4 (22–31/7) · FULL MOCK TEST #1", tasks: [
          { id: "v16", name: "Sprint ôn 3 ngày: Anki toàn bộ từ T5–T7 + đọc lại ghi chú lỗi Mock Listening T6", tags: ["vocab"], src: "tango", min: 30 },
          { id: "v17", name: "FULL MOCK TEST #1 — làm đủ Listening + Reading, đúng giờ, nghiêm túc", tags: ["test"], src: "bjt", min: 120 },
          { id: "v18", name: "Phân tích lỗi Mock #1: phân loại (A) không biết từ / (B) nghe không kịp / (C) hiểu nhầm", tags: ["test"], src: "tips", min: 45 },
          { id: "v19", name: "Nghe lại Listening sai Mock #1: nghe → ghi → xem script → highlight", tags: ["listen"], src: "bjt", min: 30 },
          { id: "v20", name: "[Cuối tuần] Ghi từ/mẫu câu mới từ Mock #1 vào Anki + lập kế hoạch ôn T8", tags: ["vocab", "weekend"], src: "bjt", min: 90 },
        ]
      },
    ]
  },
  "T8": {
    phase: 2,
    label: "Tháng 8 · Phase 2 — Cân bằng Nghe + Đọc + Ngữ pháp",
    weeks: [
      {
        id: "W1", label: "Tuần 1 (1–7/8) · Introduce Reading chính thức", tasks: [
          { id: "w1", name: "BJT 聴解: 10 câu dạng hỏi thông tin cụ thể — tập ghi số liệu ngay khi nghe", tags: ["listen"], src: "bjt", min: 30 },
          { id: "w2", name: "BJT 読解: 2 email ngắn — đọc câu hỏi trước → scan keyword → trả lời (2–3 phút/câu)", tags: ["read"], src: "bjt", min: 25 },
          { id: "w3", name: "Tango/Hyougen: nhóm outsourcing/IT — オフショア、委託、外注、SES、常駐 (35 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "w4", name: "Keigo/Bunshou: 承知/かしこまり/了解の違い + 10 câu bài tập chuyển đổi", tags: ["gram"], src: "keigo", min: 30 },
          { id: "w5", name: "[Cuối tuần] Ôn T8W1: BJT 聴解 15 câu timed + 2 bài 読解 timed + review lỗi", tags: ["listen", "read", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "W2", label: "Tuần 2 (8–14/8) · Grammar integration", tasks: [
          { id: "w6", name: "Keigo/Bunshou: もし〜なら、〜ため、〜にもかかわらず + 10 câu bài tập", tags: ["gram"], src: "keigo", min: 30 },
          { id: "w7", name: "BJT 読解: 2 bài báo cáo dài — tìm 筆者が言いたいこと (thường ở cuối bài)", tags: ["read"], src: "bjt", min: 30 },
          { id: "w8", name: "Dictation: ghi hoàn chỉnh 1 đoạn 4–5 câu từ Bite Size — so sánh với T5 ghi được mấy %?", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "w9", name: "Bite Size JP: nghe ở 1.2x — đây là tốc độ thực tế của người Nhật", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "w10", name: "[Cuối tuần] Tổng ôn: Anki 200 thẻ yếu + shadowing 2 đoạn + 1 bài 読解 dài timed", tags: ["vocab", "listen", "read", "weekend"], src: "tango", min: 120 },
        ]
      },
      {
        id: "W3", label: "Tuần 3 (15–21/8) · Mistake analysis + weak point drill", tasks: [
          { id: "w11", name: "Tổng hợp lỗi T5–T8: viết danh sách 5 lỗi cá nhân hay mắc nhất — dán lên màn hình", tags: ["test"], src: "tips", min: 20 },
          { id: "w12", name: "BJT 聴解: drill lại dạng câu sai nhiều nhất từ Mock #1 — 15 câu", tags: ["listen", "test"], src: "bjt", min: 40 },
          { id: "w13", name: "BJT 読解: speed drill — 1 email ngắn trong 3 phút, không đọc lại", tags: ["read"], src: "bjt", min: 20 },
          { id: "w14", name: "Tango/Hyougen: ôn nhóm leech (thẻ sai nhiều nhất) — xem lại ví dụ câu", tags: ["vocab"], src: "tango", min: 25 },
          { id: "w15", name: "[Cuối tuần] BJT 聴解: 1 bộ đề Listening đầy đủ timed 50 phút + phân tích lỗi 30 phút", tags: ["listen", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "W4", label: "Tuần 4 (22–31/8) · FULL MOCK TEST #2", tasks: [
          { id: "w16", name: "Sprint ôn 3 ngày: Anki toàn bộ + đọc lại ghi chú lỗi Mock #1", tags: ["vocab"], src: "tango", min: 30 },
          { id: "w17", name: "FULL MOCK TEST #2 — đề tiếp theo sách BJT, đúng giờ", tags: ["test"], src: "bjt", min: 120 },
          { id: "w18", name: "Phân tích Mock #2: so sánh điểm Listening + Reading với Mock #1 — tăng/giảm chỗ nào?", tags: ["test"], src: "tips", min: 40 },
          { id: "w19", name: "Nghe lại Listening sai Mock #2: nghe → ghi → xem script → highlight từ miss", tags: ["listen"], src: "bjt", min: 30 },
          { id: "w20", name: "[Cuối tuần] Cập nhật Anki deck BJT + lập kế hoạch T9 dựa trên kết quả Mock #2", tags: ["vocab", "weekend"], src: "bjt", min: 90 },
        ]
      },
    ]
  },
  "T9": {
    phase: 2,
    label: "Tháng 9 · Phase 2 — Ôn điểm yếu + Mock #3",
    weeks: [
      {
        id: "X1", label: "Tuần 1 (1–7/9) · Targeted weakness drill", tasks: [
          { id: "x1", name: "Phân tích lỗi Mock #1+2 — xác định dạng câu sai nhiều nhất → lên kế hoạch ôn T9", tags: ["test"], src: "tips", min: 20 },
          { id: "x2", name: "BJT 聴解: drill dạng câu sai nhiều nhất từ Mock #2 — 15 câu", tags: ["listen", "test"], src: "bjt", min: 40 },
          { id: "x3", name: "BJT 読解: speed scan — đọc câu hỏi trước → gạch keyword → scan bài 90 giây/câu", tags: ["read"], src: "bjt", min: 25 },
          { id: "x4", name: "Tango/Hyougen: review toàn bộ ~600 từ đã học — Anki filter 'overdue'", tags: ["vocab"], src: "tango", min: 30 },
          { id: "x5", name: "[Cuối tuần] Ôn tổng hợp nghe T7–T9: nghe 5 tập Bite Size + shadowing 2 đoạn yêu thích", tags: ["listen", "weekend"], src: "bitesize", min: 120 },
        ]
      },
      {
        id: "X2", label: "Tuần 2 (8–14/9) · Reading speed up + Grammar", tasks: [
          { id: "x6", name: "BJT 読解: 20 câu email + thông báo nội bộ — timed 2–3 phút/câu", tags: ["read"], src: "bjt", min: 50 },
          { id: "x7", name: "Bite Size JP: nghe tập công việc → viết 議事録 3 mục: quyết định / hành động / bảo lưu", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "x8", name: "Keigo/Bunshou: ôn 謙譲語 toàn bộ — ưu tiên vì BJT test nhiều hơn 尊敬語", tags: ["gram"], src: "keigo", min: 25 },
          { id: "x9", name: "Tango/Hyougen: nhóm tài chính — 予算、決算、収支、黒字、赤字、コスト削減 (30 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "x10", name: "[Cuối tuần] BJT 読解: 1 bộ đề đọc timed 70 phút + phân tích lỗi 30 phút", tags: ["read", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "X3", label: "Tuần 3 (15–21/9) · Integrated practice", tasks: [
          { id: "x11", name: "Chiến lược thi: vẽ timeline 50 phút Listening + 70 phút Reading — phân bổ thời gian/câu", tags: ["test"], src: "tips", min: 20 },
          { id: "x12", name: "BJT 聴解+読解: 15 câu hỗn hợp không phân loại — timed, không dừng", tags: ["listen", "read", "test"], src: "bjt", min: 40 },
          { id: "x13", name: "Dictation câu phức (複文): câu dài có mệnh đề điều kiện/nhượng bộ", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "x14", name: "Tango/Hyougen: nhóm leech + 20 từ mới từ sách BJT chưa thuộc", tags: ["vocab"], src: "tango", min: 25 },
          { id: "x15", name: "[Cuối tuần] Ôn kỹ năng yếu nhất (dựa trên Mock #2): 3 tiếng tập trung 1 kỹ năng", tags: ["test", "weekend"], src: "bjt", min: 180 },
        ]
      },
      {
        id: "X4", label: "Tuần 4 (22–30/9) · FULL MOCK TEST #3", tasks: [
          { id: "x16", name: "Sprint ôn 3 ngày: Anki toàn bộ + review ghi chú lỗi Mock #1+2", tags: ["vocab"], src: "tango", min: 30 },
          { id: "x17", name: "FULL MOCK TEST #3 — mục tiêu 430–460 điểm", tags: ["test"], src: "bjt", min: 120 },
          { id: "x18", name: "Phân tích Mock #3: vẽ bảng dạng câu / số câu / số sai / tỷ lệ — pattern lặp lại?", tags: ["test"], src: "tips", min: 45 },
          { id: "x19", name: "Nghe lại Listening sai Mock #3 → highlight từ không nhận ra", tags: ["listen"], src: "bjt", min: 35 },
          { id: "x20", name: "[Cuối tuần] Đánh giá tiến độ tổng thể + lập kế hoạch Sprint T10–T12", tags: ["test", "weekend"], src: "tips", min: 90 },
        ]
      },
    ]
  },
  "T10": {
    phase: 3,
    label: "Tháng 10 · Phase 3 — Sprint đích · 2 Mock/tháng",
    weeks: [
      {
        id: "Y1", label: "Tuần 1 (1–7/10) · MOCK #4", tasks: [
          { id: "y1", name: "FULL MOCK TEST #4 — điều kiện thi thật hoàn toàn (tắt điện thoại, không pause)", tags: ["test"], src: "bjt", min: 120 },
          { id: "y2", name: "Review Listening Mock #4: nghe lại câu sai ở 0.85x → ghi lại được chưa?", tags: ["listen"], src: "tips", min: 45 },
          { id: "y3", name: "Anki: xử lý thẻ leech — thêm ví dụ câu mới, xóa thẻ quá khó không thực tế", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y4", name: "BJT 読解: speed drill — 90 giây/câu, đoán nếu quá thời gian", tags: ["read"], src: "bjt", min: 25 },
          { id: "y5", name: "[Cuối tuần] Ôn tổng: shadowing 2 đoạn ở 1.1x + Anki 100 thẻ yếu + 1 bài 読解 dài", tags: ["listen", "vocab", "weekend"], src: "bitesize", min: 120 },
        ]
      },
      {
        id: "Y2", label: "Tuần 2 (8–14/10) · MOCK #5", tasks: [
          { id: "y6", name: "FULL MOCK TEST #5 — dùng đề mới (tìm 過去問 online nếu hết sách)", tags: ["test"], src: "bjt", min: 120 },
          { id: "y7", name: "Ôn pattern lỗi lặp lại Mock #4+5: nếu vẫn sai 次にすること → tập đọc câu hỏi trước", tags: ["test"], src: "tips", min: 35 },
          { id: "y8", name: "Bite Size JP: nghe → viết 議事録 nâng cao (thêm 保留事項 & リスク)", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "y9", name: "Tango/Hyougen: business nâng cao — 的確な判断、迅速な対応、合理的な提案 (20 từ)", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y10", name: "[Cuối tuần] Drill nghe 2 tiếng: BJT 聴解 30 câu timed + phân tích lỗi", tags: ["listen", "test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "Y3", label: "Tuần 3 (15–21/10) · Targeted drill tất cả Mock", tasks: [
          { id: "y11", name: "BJT 聴解: làm lại toàn bộ câu sai từ Mock #1–5 theo dạng — pattern nào vẫn sai?", tags: ["listen", "test"], src: "bjt", min: 45 },
          { id: "y12", name: "BJT 読解: 40 câu timed 60 phút — đạt 70%+ là OK", tags: ["read"], src: "bjt", min: 65 },
          { id: "y13", name: "Chiến lược câu khó: loại trừ 2 đáp án sai rõ → đoán trong 2 còn lại, không bỏ trống", tags: ["test"], src: "tips", min: 15 },
          { id: "y14", name: "Anki: review 700+ từ — mục tiêu retention 85%", tags: ["vocab"], src: "tango", min: 30 },
          { id: "y15", name: "[Cuối tuần] Ôn kỹ năng yếu nhất: 3 tiếng focused drilling theo lỗi Mock #5", tags: ["test", "weekend"], src: "bjt", min: 180 },
        ]
      },
      {
        id: "Y4", label: "Tuần 4 (22–31/10) · MOCK #6", tasks: [
          { id: "y16", name: "FULL MOCK TEST #6", tags: ["test"], src: "bjt", min: 120 },
          { id: "y17", name: "Đánh giá tiến độ tổng thể — điều chỉnh kế hoạch T11 nếu cần", tags: ["test"], src: "tips", min: 20 },
          { id: "y18", name: "Ôn toàn bộ lỗi T10 — tập trung 2 dạng câu sai nhiều nhất", tags: ["test"], src: "bjt", min: 30 },
          { id: "y19", name: "Tango + Keigo: ôn thẻ leech toàn bộ", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y20", name: "[Cuối tuần] Review Mock #4–6: vẽ trend chart điểm, xác định còn bao nhiêu điểm thiếu", tags: ["test", "weekend"], src: "tips", min: 90 },
        ]
      },
    ]
  },
  "T11": {
    phase: 3,
    label: "Tháng 11 · Phase 3 — Mock marathon · 2–3 đề/tháng",
    weeks: [
      {
        id: "Z1", label: "Tuần 1 (1–7/11) · MOCK #7", tasks: [
          { id: "z1", name: "FULL MOCK TEST #7 — nếu ≥ 460: đúng track. Nếu < 450: tăng lên 2 đề/tuần", tags: ["test"], src: "bjt", min: 120 },
          { id: "z2", name: "BJT 聴解: ôn tập trung 2–3 dạng sai nhiều nhất trong tất cả Mock", tags: ["listen", "test"], src: "bjt", min: 40 },
          { id: "z3", name: "Bite Size JP: chỉ nghe tập chủ đề công việc/xã hội — maintain, không ghi chú nhiều", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "z4", name: "BJT 読解: 40 câu timed 60 phút — maintain tốc độ", tags: ["read"], src: "bjt", min: 65 },
          { id: "z5", name: "[Cuối tuần] Drill nghe câu phức (複文) + dictation cao cấp + Anki 100 thẻ yếu", tags: ["listen", "vocab", "weekend"], src: "bitesize", min: 120 },
        ]
      },
      {
        id: "Z2", label: "Tuần 2 (8–14/11) · MOCK #8", tasks: [
          { id: "z6", name: "FULL MOCK TEST #8 — so sánh với Mock #1 (T7): tăng được bao nhiêu điểm?", tags: ["test"], src: "bjt", min: 120 },
          { id: "z7", name: "Vẽ biểu đồ điểm Mock #1→8 — nếu plateau → vấn đề từ vựng hay tốc độ xử lý?", tags: ["test"], src: "tips", min: 25 },
          { id: "z8", name: "BJT 聴解: drill đọc câu hỏi trong 30 giây — tập đến khi thành phản xạ tự động", tags: ["listen"], src: "bjt", min: 25 },
          { id: "z9", name: "Anki: review 700+ từ (Tango + Keigo + BJT deck) — toàn bộ", tags: ["vocab"], src: "tango", min: 30 },
          { id: "z10", name: "[Cuối tuần] Ôn tổng: shadowing + reading speed drill + Anki 150 thẻ", tags: ["listen", "read", "vocab", "weekend"], src: "bitesize", min: 120 },
        ]
      },
      {
        id: "Z3", label: "Tuần 3 (15–21/11) · MOCK #9", tasks: [
          { id: "z11", name: "FULL MOCK TEST #9 — mô phỏng điều kiện thi thật: buổi sáng, bàn học thật sự", tags: ["test"], src: "bjt", min: 120 },
          { id: "z12", name: "Ôn sprint: chỉ củng cố những gì đã biết — không học nội dung mới từ đây", tags: ["test"], src: "tips", min: 25 },
          { id: "z13", name: "Keigo/Bunshou: 5 động từ keigo quan trọng nhất — thuộc 100% cả 2 chiều", tags: ["gram"], src: "keigo", min: 20 },
          { id: "z14", name: "NHK Web Easy: thử nghe giọng mới (khác Bite Size), ghi từ không quen", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "z15", name: "[Cuối tuần] Drill điểm yếu theo Mock #9 + review toàn bộ ghi chú lỗi từ T5", tags: ["test", "weekend"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "Z4", label: "Tuần 4 (22–30/11) · MOCK #10", tasks: [
          { id: "z16", name: "FULL MOCK TEST #10 — mục tiêu > 460. Đây là thước đo khả năng thi thật", tags: ["test"], src: "bjt", min: 120 },
          { id: "z17", name: "Lập kế hoạch 3 tuần cuối T12 dựa trên kết quả Mock #10", tags: ["test"], src: "tips", min: 20 },
          { id: "z18", name: "Nghe lại Listening sai Mock #10 — lần cuối review theo kiểu này", tags: ["listen"], src: "bjt", min: 30 },
          { id: "z19", name: "Anki: giảm còn 20 thẻ/ngày — maintain, không thêm mới", tags: ["vocab"], src: "tango", min: 15 },
          { id: "z20", name: "[Cuối tuần] Nghỉ 1 ngày hoàn toàn — giữ tinh thần & motivation cho T12", tags: ["tips", "weekend"], src: "tips", min: 0 },
        ]
      },
    ]
  },
  "T12": {
    phase: 3,
    label: "Tháng 12 · Tuần quyết định — Thi thật",
    weeks: [
      {
        id: "A1", label: "Tuần 1–2 (1–14/12) · Mock #11 & #12", tasks: [
          { id: "a1", name: "FULL MOCK TEST #11 (tuần 1) — dùng đề chưa làm hoặc 過去問 online", tags: ["test"], src: "bjt", min: 120 },
          { id: "a2", name: "Ôn điểm yếu lần cuối — chỉ ôn những gì đã biết, không học gì mới", tags: ["test"], src: "tips", min: 30 },
          { id: "a3", name: "Bite Size JP: nghe 1 tập → đánh giá mình hiểu được bao nhiêu % so với tháng 5", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "a4", name: "Anki: 20 thẻ/ngày — maintain thôi, không ép", tags: ["vocab"], src: "tango", min: 15 },
          { id: "a5", name: "FULL MOCK TEST #12 (tuần 2) — nếu 470+: tự tin bước vào thi", tags: ["test"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "A2", label: "Tuần 3 · 1 tuần trước thi — Giảm tốc", tasks: [
          { id: "a6", name: "Bite Size JP: 1 tập/ngày nhẹ nhàng — chỉ nghe, không ghi chú, giữ tai quen tiếng Nhật", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "a7", name: "Anki: 15 thẻ/ngày — chỉ review, tuyệt đối không thêm thẻ mới", tags: ["vocab"], src: "tango", min: 15 },
          { id: "a8", name: "Đọc lại chiến lược làm bài: Listening (đọc câu hỏi 30s trước) · Reading (scan câu hỏi → locate)", tags: ["test"], src: "tips", min: 15 },
          { id: "a9", name: "Ngủ đủ giấc: memory consolidation quan trọng hơn ôn thêm 1 giờ", tags: ["tips"], src: "tips", min: 0 },
          { id: "a10", name: "Ngày trước thi: nghỉ ngơi hoàn toàn. Tin vào 8 tháng đã học và cố gắng.", tags: ["tips"], src: "tips", min: 0 },
        ]
      },
      {
        id: "A3", label: "Ngày thi BJT · Thực chiến", tasks: [
          { id: "a11", name: "Sáng thi: ăn đủ, đến sớm 20 phút, không ôn trong phòng chờ — giữ calm", tags: ["tips"], src: "tips", min: 0 },
          { id: "a12", name: "Listening: 30 giây đầu mỗi câu = đọc câu hỏi, gạch keyword. Ghi số liệu ngay khi nghe.", tags: ["listen"], src: "tips", min: 0 },
          { id: "a13", name: "Reading: làm câu ngắn (email) trước, câu dài (bài báo) sau. Scan câu hỏi → locate.", tags: ["read"], src: "tips", min: 0 },
          { id: "a14", name: "Không bỏ trống câu nào: đoán 25% > bỏ trống 0%. Luôn chọn đáp án.", tags: ["tips"], src: "tips", min: 0 },
          { id: "a15", name: "Sau thi: ghi lại cảm nhận về từng phần. Kết quả ra sau 1–2 tháng. がんばった！", tags: ["tips"], src: "tips", min: 0 },
        ]
      },
    ]
  },
}

export const MONTHS = Object.keys(DATA)
