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
  listen: { label: 'Listening', className: 'tag-listen' },
  read:   { label: 'Reading',   className: 'tag-read' },
  vocab:  { label: 'Từ vựng',   className: 'tag-vocab' },
  gram:   { label: 'Ngữ pháp',  className: 'tag-gram' },
  test:   { label: 'Luyện đề',  className: 'tag-test' },
  tips:   { label: 'Tips',      className: 'tag-tips' },
}

export const PHASE_LABELS = ['', 'Giai đoạn 1', 'Giai đoạn 2', 'Giai đoạn 3']
export const PHASE_CLASSES = ['', 'ph1', 'ph2', 'ph3']

export const DATA: Record<string, MonthData> = {
  "T5": {
    phase: 1,
    label: "Tháng 5 · Nền tảng — bắt đầu từ đầu",
    weeks: [
      {
        id: "T5W1", label: "Tuần 1 (1–7/5) · Làm quen tài liệu", tasks: [
          { id: "t1", name: "Mở sách BJT 聴解 — xem format, nghe thử 3 câu đầu", tags: ["test"], src: "bjt", min: 20 },
          { id: "t2", name: "Mở sách BJT 読解 — xem format, đọc thử 3 câu đầu", tags: ["read"], src: "bjt", min: 15 },
          { id: "t3", name: "Cài Anki — tạo 3 deck: Tango/Hyougen · Keigo/Bunshou · BJT mới", tags: ["vocab"], src: "tips", min: 20 },
          { id: "t4", name: "Tango/Hyougen: nhập 50 từ đầu vào Anki, học lần đầu", tags: ["vocab"], src: "tango", min: 40 },
          { id: "t5", name: "Bite Size JP: nghe tập 50–55, không dừng, ghi những gì nghe được", tags: ["listen"], src: "bitesize", min: 25 },
        ]
      },
      {
        id: "T5W2", label: "Tuần 2 (8–14/5) · Thiết lập thói quen", tasks: [
          { id: "t6", name: "Anki hàng ngày: 15 thẻ cũ + 10 thẻ mới từ Tango/Hyougen (x7 ngày)", tags: ["vocab"], src: "tango", min: 15 },
          { id: "t7", name: "Bite Size JP: nghe tập 56–60 — quy trình 3 bước (nghe → ghi → nghe lại)", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "t8", name: "Bite Size JP: shadowing 1 đoạn 30 giây từ tập đã nghe", tags: ["listen"], src: "bitesize", min: 10 },
          { id: "t9", name: "Tango/Hyougen: nhóm họp — 議事録、確認事項、宿題、持ち帰る (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "t10", name: "BJT 読解: đọc 1 email mẫu trong sách — ghi từ không biết vào Anki deck BJT", tags: ["read"], src: "bjt", min: 20 },
        ]
      },
      {
        id: "T5W3", label: "Tuần 3 (15–21/5) · Keigo + Dictation bắt đầu", tasks: [
          { id: "t11", name: "Dictation: nghe Bite Size, ghi lại 5 câu có số liệu/ngày tháng", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "t12", name: "Tango/Hyougen: nhóm email — お世話、ご確認、取り急ぎ、ご対応 (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "t13", name: "Keigo/Bunshou: bắt đầu từ đầu — học bảng 3 cột (普通形/丁寧語/敬語) x20 từ", tags: ["gram"], src: "keigo", min: 35 },
          { id: "t14", name: "BJT 聴解: nghe + làm bài số 1 trong sách, không tính giờ", tags: ["test"], src: "bjt", min: 30 },
          { id: "t15", name: "Bite Size JP: shadowing tập mới — focus vào rhythm & intonation", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "T5W4", label: "Tuần 4 (22–31/5) · Tổng kết tháng 1", tasks: [
          { id: "t16", name: "Tango/Hyougen: nhóm báo cáo — 進捗、完了、遅延、原因、納期 (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "t17", name: "BJT 聴解: làm bài 2–3, ghi lại dạng câu hỏi (hỏi gì: hành động/thông tin/thái độ?)", tags: ["test"], src: "bjt", min: 35 },
          { id: "t18", name: "Keigo/Bunshou: 承知/かしこまり/了解の違い + 10 câu bài tập", tags: ["gram"], src: "keigo", min: 30 },
          { id: "t19", name: "Bite Size JP: shadowing tập mới ở tốc độ 1x — đã thuộc chưa?", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "t20", name: "Ôn Anki: toàn bộ 150 từ tháng 5 — xem có thẻ leech nào không", tags: ["vocab"], src: "tango", min: 20 },
        ]
      },
    ]
  },
  "T6": {
    phase: 1,
    label: "Tháng 6 · Nền tảng (tt) + Mock 1",
    weeks: [
      {
        id: "T6W1", label: "Tuần 1 (1–7/6)", tasks: [
          { id: "u1", name: "Tango/Hyougen: nhóm schedule/negotiation — 調整、折り合い、合意、期限 (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "u2", name: "Bite Size JP: nghe tập chủ đề công việc/xã hội — ghi 3 từ/cụm mới vào Anki", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "u3", name: "Dictation: nghe Bite Size, ghi lại tên người + chức vụ xuất hiện", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "u4", name: "BJT 読解: làm 2 bài email ngắn — áp dụng kỹ thuật scan (câu hỏi trước → keyword)", tags: ["read"], src: "bjt", min: 25 },
          { id: "u5", name: "Keigo/Bunshou: 承知 / かしこまり / 了解 — phân biệt + 10 câu bài tập", tags: ["gram"], src: "keigo", min: 25 },
        ]
      },
      {
        id: "T6W2", label: "Tuần 2 (8–14/6)", tasks: [
          { id: "u6", name: "Tango/Hyougen: nhóm IT — 不具合、修正、リリース、本番環境、テスト (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "u7", name: "Bite Size JP: nghe monologue 10 phút — sau đó tóm tắt ý chính bằng tiếng Nhật (3 câu)", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "u8", name: "BJT 読解: làm 2 bài thông báo nội bộ + 1 bài báo cáo ngắn", tags: ["read"], src: "bjt", min: 30 },
          { id: "u9", name: "BJT 聴解: làm bài 4–6, phân loại câu hỏi: hành động / thông tin / thái độ", tags: ["test"], src: "bjt", min: 35 },
          { id: "u10", name: "Bite Size JP: shadowing — chú ý âm nối 連濁, ghi lại ví dụ nghe được", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "T6W3", label: "Tuần 3 (15–21/6)", tasks: [
          { id: "u11", name: "Tango/Hyougen: nhóm nhân sự — 部長、課長、担当者、取引先、顧客 (50 từ)", tags: ["vocab"], src: "tango", min: 30 },
          { id: "u12", name: "Bite Size JP: nghe tập 10 phút → viết 議事録 mini (quyết định, hành động tiếp theo)", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "u13", name: "BJT 読解: 3 bài email — nhận dạng loại: yêu cầu / thông báo / báo cáo vấn đề", tags: ["read"], src: "bjt", min: 25 },
          { id: "u14", name: "Keigo/Bunshou: もし〜なら、〜ため、〜にもかかわらず + 10 câu bài tập", tags: ["gram"], src: "keigo", min: 25 },
          { id: "u15", name: "Dictation: ghi lại số liệu tài chính (% tăng/giảm, ngày tháng) từ Bite Size", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "T6W4", label: "Tuần 4 (22–30/6) · MOCK TEST 1", tasks: [
          { id: "u16", name: "Sprint ôn 3 ngày: Anki 200 từ đã học + đọc lại ghi chú lỗi sách BJT", tags: ["vocab"], src: "tango", min: 30 },
          { id: "u17", name: "FULL MOCK TEST — dùng đề trong sách BJT lần 1 · đúng giờ, nghiêm túc", tags: ["test"], src: "bjt", min: 120 },
          { id: "u18", name: "Phân tích lỗi Mock 1 — phân loại: (A) không biết từ, (B) nghe không kịp, (C) hiểu nhầm", tags: ["test"], src: "tips", min: 45 },
          { id: "u19", name: "Nghe lại phần Listening sai trong sách — nghe 2 lần, lần 2 có script", tags: ["listen"], src: "bjt", min: 30 },
          { id: "u20", name: "Ghi từ/mẫu câu mới từ đề thi vào Anki deck BJT", tags: ["vocab"], src: "bjt", min: 20 },
        ]
      },
    ]
  },
  "T7": {
    phase: 2,
    label: "Tháng 7 · Tăng tốc Listening",
    weeks: [
      {
        id: "V1", label: "Tuần 1 (1–7/7)", tasks: [
          { id: "v1", name: "Phân tích kết quả Mock 1 — lên danh sách điểm yếu cụ thể cần ôn T7", tags: ["test"], src: "tips", min: 20 },
          { id: "v2", name: "BJT 聴解: luyện 10 câu dạng 次は何をしますか — ghi pattern nghe", tags: ["listen"], src: "bjt", min: 30 },
          { id: "v3", name: "Tango/Hyougen: nhóm hợp đồng — 契約、条項、締結、納品、検収 (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v4", name: "BJT 読解: 2 bài hợp đồng/điều khoản — tập scan 3 phần chính", tags: ["read"], src: "bjt", min: 25 },
          { id: "v5", name: "Bite Size JP: tăng tốc 1.1x — nghe tập mới, ghi 3 attitude word nghe được", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "V2", label: "Tuần 2 (8–14/7)", tasks: [
          { id: "v6", name: "BJT 聴解: 10 câu dạng hỏi thái độ — chú ý: でも / ただ / まあ / 一応", tags: ["listen"], src: "bjt", min: 30 },
          { id: "v7", name: "Dictation từ Bite Size: ghi số liệu + ngày tháng — 5 câu/ngày", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "v8", name: "BJT 読解: 2 bài báo cáo tháng — tìm ý chính, không đọc toàn bài", tags: ["read"], src: "bjt", min: 25 },
          { id: "v9", name: "Tango/Hyougen: nhóm báo cáo/phân tích — 分析、傾向、要因、課題、改善策 (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v10", name: "Keigo/Bunshou: viết email báo cáo trễ hạn theo mẫu chuẩn (お詫び→原因→対策)", tags: ["gram"], src: "keigo", min: 25 },
        ]
      },
      {
        id: "V3", label: "Tuần 3 (15–21/7)", tasks: [
          { id: "v11", name: "Bite Size JP: nghe 1 tập → viết 議事録 đầy đủ: 日時・決定事項・アクション", tags: ["listen"], src: "bitesize", min: 35 },
          { id: "v12", name: "BJT 読解: 20 câu email + thông báo nội bộ — timed (2–3 phút/câu)", tags: ["read"], src: "bjt", min: 50 },
          { id: "v13", name: "Tango/Hyougen: nhóm sự cố — クレーム、謝罪、補償、再発防止 (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v14", name: "Bite Size JP: shadowing tập mới ở 1.15x — nếu khó, nghe 5 lần trước", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "v15", name: "Keigo/Bunshou: ていただく vs てもらう — 10 câu bài tập chuyển đổi", tags: ["gram"], src: "keigo", min: 25 },
        ]
      },
      {
        id: "V4", label: "Tuần 4 (22–31/7)", tasks: [
          { id: "v16", name: "BJT 聴解: làm 1 bộ đề nghe đầy đủ trong sách — timed 50 phút", tags: ["test"], src: "bjt", min: 55 },
          { id: "v17", name: "Review Listening: nghe lại câu sai, ghi lại từ/câu không nhận ra", tags: ["test"], src: "bjt", min: 30 },
          { id: "v18", name: "BJT 読解: làm 1 bộ đề đọc đầy đủ trong sách — timed 70 phút", tags: ["test"], src: "bjt", min: 75 },
          { id: "v19", name: "Anki: ôn toàn bộ từ T5–T7 — chú ý thẻ leech", tags: ["vocab"], src: "tango", min: 25 },
          { id: "v20", name: "Ghi từ mới từ sách BJT vào Anki deck BJT", tags: ["vocab"], src: "bjt", min: 15 },
        ]
      },
    ]
  },
  "T8": {
    phase: 2,
    label: "Tháng 8 · Tăng tốc + Mock 2",
    weeks: [
      {
        id: "W1", label: "Tuần 1 (1–7/8)", tasks: [
          { id: "w1", name: "BJT 聴解: 10 câu dạng hỏi thông tin cụ thể — luyện ghi số liệu ngay khi nghe", tags: ["listen"], src: "bjt", min: 30 },
          { id: "w2", name: "Tango/Hyougen: nhóm outsourcing — オフショア、委託、外注、SES、常駐 (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "w3", name: "BJT 読解: bảng kế hoạch vs thực tế — tập đọc 計画・実績・差異・達成率", tags: ["read"], src: "bjt", min: 25 },
          { id: "w4", name: "Keigo/Bunshou: bài tập chuyển đổi 3 loại — 10 động từ x3 chiều", tags: ["gram"], src: "keigo", min: 30 },
          { id: "w5", name: "Bite Size JP: nghe 1.2x — nếu bắt đầu nghe rõ = đang tiến bộ tốt", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "W2", label: "Tuần 2 (8–14/8)", tasks: [
          { id: "w6", name: "BJT 聴解: 8 câu điện thoại business — chú ý 折り返し、席を外す、〜の件で", tags: ["listen"], src: "bjt", min: 30 },
          { id: "w7", name: "Dictation: nghe Bite Size, ghi lại toàn bộ 1 đoạn 3–4 câu", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "w8", name: "BJT 読解: 2 bài báo kinh doanh dài — tìm 筆者が言いたいこと (thường ở cuối bài)", tags: ["read"], src: "bjt", min: 25 },
          { id: "w9", name: "Tango/Hyougen: nhóm quản lý rủi ro — リスク、懸念、影響範囲、エスカレーション (40 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "w10", name: "BJT 聴解+読解: 15 câu hỗn hợp không phân loại — timed", tags: ["test"], src: "bjt", min: 35 },
        ]
      },
      {
        id: "W3", label: "Tuần 3 (15–21/8)", tasks: [
          { id: "w11", name: "Tổng hợp lỗi T5–T8: viết danh sách 5 lỗi cá nhân hay mắc nhất", tags: ["test"], src: "tips", min: 20 },
          { id: "w12", name: "Bite Size JP: nghe tập có Q&A hoặc 2 người nói — khó hơn monologue", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "w13", name: "BJT 読解: speed drill — 1 email ngắn trong 3 phút, không đọc lại", tags: ["read"], src: "bjt", min: 20 },
          { id: "w14", name: "Tango/Hyougen: ôn nhóm leech (thẻ sai nhiều nhất) — xem lại ví dụ câu", tags: ["vocab"], src: "tango", min: 25 },
          { id: "w15", name: "Viết 議事録 từ cuộc họp thật tuần này bằng tiếng Nhật", tags: ["gram"], src: "tips", min: 25 },
        ]
      },
      {
        id: "W4", label: "Tuần 4 (22–31/8) · MOCK TEST 2", tasks: [
          { id: "w16", name: "Sprint ôn 3 ngày: Anki toàn bộ + đọc lại ghi chú lỗi Mock 1", tags: ["vocab"], src: "tango", min: 30 },
          { id: "w17", name: "FULL MOCK TEST — dùng đề tiếp theo trong sách BJT · đúng giờ", tags: ["test"], src: "bjt", min: 120 },
          { id: "w18", name: "Phân tích Mock 2: so sánh điểm và loại lỗi với Mock 1", tags: ["test"], src: "tips", min: 40 },
          { id: "w19", name: "Nghe lại Listening sai — quy trình: nghe → ghi → xem script → highlight", tags: ["listen"], src: "bjt", min: 30 },
          { id: "w20", name: "Cập nhật Anki deck BJT với từ mới từ đề Mock 2", tags: ["vocab"], src: "bjt", min: 15 },
        ]
      },
    ]
  },
  "T9": {
    phase: 2,
    label: "Tháng 9 · Ôn điểm yếu từ Mock",
    weeks: [
      {
        id: "X1", label: "Tuần 1 (1–7/9)", tasks: [
          { id: "x1", name: "Phân tích lỗi Mock 1+2: xác định dạng câu sai nhiều nhất → lên kế hoạch ôn T9", tags: ["test"], src: "tips", min: 20 },
          { id: "x2", name: "Tango/Hyougen: review toàn bộ 700 từ đã học — Anki filter: 'overdue'", tags: ["vocab"], src: "tango", min: 30 },
          { id: "x3", name: "BJT 読解: speed scan — đọc câu hỏi → gạch keyword → scan bài 90 giây/câu", tags: ["read"], src: "bjt", min: 25 },
          { id: "x4", name: "Bite Size JP: shadowing native speed (1x) — không chỉnh tốc độ", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "x5", name: "Keigo/Bunshou: ôn 謙譲語 toàn bộ — ưu tiên vì BJT test nhiều hơn 尊敬語", tags: ["gram"], src: "keigo", min: 25 },
        ]
      },
      {
        id: "X2", label: "Tuần 2 (8–14/9)", tasks: [
          { id: "x6", name: "BJT 聴解: làm lại dạng câu sai nhiều nhất từ Mock 1+2 — 15 câu", tags: ["test"], src: "bjt", min: 40 },
          { id: "x7", name: "Bite Size JP: nghe tập chủ đề công việc → viết 議事録 3 mục (quyết định, hành động, bảo lưu)", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "x8", name: "BJT 読解: 2 bài báo kinh doanh dài — timed 6 phút/bài", tags: ["read"], src: "bjt", min: 35 },
          { id: "x9", name: "Tango/Hyougen: nhóm tài chính — 予算、決算、収支、黒字、赤字、コスト削減 (30 từ)", tags: ["vocab"], src: "tango", min: 25 },
          { id: "x10", name: "Chiến lược thi: vẽ timeline 50 phút Listening + 70 phút Reading — phân bổ thời gian/câu", tags: ["test"], src: "tips", min: 20 },
        ]
      },
      {
        id: "X3", label: "Tuần 3 (15–21/9) · MOCK TEST 3", tasks: [
          { id: "x11", name: "FULL MOCK TEST 3 — dùng đề mới trong sách BJT · mục tiêu 430–460", tags: ["test"], src: "bjt", min: 120 },
          { id: "x12", name: "Phân tích Mock 3: vẽ bảng dạng câu / số câu / số sai / tỷ lệ", tags: ["test"], src: "tips", min: 40 },
          { id: "x13", name: "Nghe lại Listening sai Mock 3: nghe → ghi → script → highlight", tags: ["listen"], src: "bjt", min: 35 },
          { id: "x14", name: "Anki: review 500+ từ đã học — mục tiêu 0 thẻ overdue", tags: ["vocab"], src: "tango", min: 30 },
          { id: "x15", name: "BJT 読解: làm lại 10 câu sai từ Mock 3 — không xem đáp án trước", tags: ["read"], src: "bjt", min: 30 },
        ]
      },
      {
        id: "X4", label: "Tuần 4 (22–30/9)", tasks: [
          { id: "x16", name: "Ôn pattern lỗi tái phát: so sánh Mock 1, 2, 3 — lỗi nào lặp lại?", tags: ["test"], src: "tips", min: 25 },
          { id: "x17", name: "Bite Size JP: nghe 5 tập liên tiếp không dừng — luyện concentration", tags: ["listen"], src: "bitesize", min: 40 },
          { id: "x18", name: "BJT 読解: đọc spec IT thật + bài báo kinh doanh — ghi từ mới vào Anki", tags: ["read"], src: "bjt", min: 30 },
          { id: "x19", name: "Tango/Hyougen: ôn nhóm leech + 30 từ mới từ sách BJT chưa biết", tags: ["vocab"], src: "tango", min: 25 },
          { id: "x20", name: "Lập kế hoạch Sprint T10–T12 dựa trên kết quả 3 Mock", tags: ["test"], src: "tips", min: 15 },
        ]
      },
    ]
  },
  "T10": {
    phase: 3,
    label: "Tháng 10 · Sprint đích",
    weeks: [
      {
        id: "Y1", label: "Tuần 1 (1–7/10) · MOCK 4", tasks: [
          { id: "y1", name: "FULL MOCK TEST 4 — điều kiện thi thật hoàn toàn (tắt điện thoại, không pause)", tags: ["test"], src: "bjt", min: 120 },
          { id: "y2", name: "Review Listening Mock 4: nghe lại câu sai ở 0.85x → ghi lại được chưa?", tags: ["listen"], src: "tips", min: 45 },
          { id: "y3", name: "Anki: xử lý thẻ leech — thêm ví dụ mới, xóa thẻ quá khó không thực tế", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y4", name: "BJT 読解: speed drill — 90 giây/câu, đoán nếu quá thời gian", tags: ["read"], src: "bjt", min: 25 },
          { id: "y5", name: "Bite Size JP: 15 phút/ngày — maintain, không cần ghi chú nhiều", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
      {
        id: "Y2", label: "Tuần 2 (8–14/10) · MOCK 5", tasks: [
          { id: "y6", name: "FULL MOCK TEST 5 — dùng đề mới (tìm 過去問 nếu hết sách)", tags: ["test"], src: "bjt", min: 120 },
          { id: "y7", name: "Ôn pattern lỗi lặp lại từ Mock 4: nếu vẫn sai 次にすること → đọc câu hỏi trước", tags: ["test"], src: "tips", min: 35 },
          { id: "y8", name: "Tango/Hyougen: business nâng cao — 的確な判断、迅速な対応、合理的な提案 (20 từ)", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y9", name: "Bite Size JP: nghe → viết 議事録 nâng cao (thêm 保留事項 & リスク)", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "y10", name: "Chiến lược: nếu miss câu đầu Listening → tiếp tục nghe, câu đầu là context", tags: ["test"], src: "tips", min: 15 },
        ]
      },
      {
        id: "Y3", label: "Tuần 3 (15–21/10)", tasks: [
          { id: "y11", name: "BJT 聴解: làm lại toàn bộ câu sai từ Mock 1–5 theo dạng — pattern nào vẫn sai?", tags: ["listen"], src: "bjt", min: 40 },
          { id: "y12", name: "BJT 読解: 40 câu — đọc bài TRƯỚC, câu hỏi SAU (luyện đọc chủ động)", tags: ["read"], src: "bjt", min: 65 },
          { id: "y13", name: "Anki: review 600+ từ — mục tiêu retention 85%", tags: ["vocab"], src: "tango", min: 30 },
          { id: "y14", name: "Dictation 8 phút từ Bite Size: ghi hoàn chỉnh — đây là level thi thật", tags: ["listen"], src: "bitesize", min: 25 },
          { id: "y15", name: "Ghi danh sách 5 lỗi cá nhân — dán lên màn hình, nhìn mỗi ngày trước học", tags: ["test"], src: "tips", min: 15 },
        ]
      },
      {
        id: "Y4", label: "Tuần 4 (22–31/10) · MOCK 6", tasks: [
          { id: "y16", name: "FULL MOCK TEST 6", tags: ["test"], src: "bjt", min: 120 },
          { id: "y17", name: "Đánh giá tiến độ tổng thể — điều chỉnh kế hoạch T11 nếu cần", tags: ["test"], src: "tips", min: 20 },
          { id: "y18", name: "Ôn toàn bộ lỗi tháng 10 — tập trung 2 dạng câu sai nhiều nhất", tags: ["test"], src: "bjt", min: 30 },
          { id: "y19", name: "Tango/Hyougen + Keigo: ôn thẻ leech toàn bộ", tags: ["vocab"], src: "tango", min: 20 },
          { id: "y20", name: "Bite Size JP: shadowing native speed — maintain fluency", tags: ["listen"], src: "bitesize", min: 15 },
        ]
      },
    ]
  },
  "T11": {
    phase: 3,
    label: "Tháng 11 · Sprint đích (tt)",
    weeks: [
      {
        id: "Z1", label: "Tuần 1 (1–7/11) · MOCK 7", tasks: [
          { id: "z1", name: "FULL MOCK TEST 7 — nếu >= 460: đúng track. Nếu < 450: tăng lên 2 đề/tuần", tags: ["test"], src: "bjt", min: 120 },
          { id: "z2", name: "Dictation câu phức (複文): ghi câu dài có mệnh đề điều kiện/nhượng bộ", tags: ["listen"], src: "bitesize", min: 30 },
          { id: "z3", name: "Bite Size JP: chỉ nghe tập chủ đề công việc/xã hội — skip tập ẩm thực/du lịch", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "z4", name: "BJT 聴解: drill đọc câu hỏi trong 30 giây — tập nhận dạng keyword cần nghe", tags: ["test"], src: "bjt", min: 25 },
          { id: "z5", name: "Chiến lược câu khó: loại trừ 2 đáp án sai rõ → đoán trong 2 còn lại, không bỏ trống", tags: ["test"], src: "tips", min: 15 },
        ]
      },
      {
        id: "Z2", label: "Tuần 2 (8–14/11) · MOCK 8", tasks: [
          { id: "z6", name: "FULL MOCK TEST 8 — so sánh điểm với Mock 1 (tháng 6): tăng bao nhiêu?", tags: ["test"], src: "bjt", min: 120 },
          { id: "z7", name: "Vẽ biểu đồ điểm Mock 1→8 — nếu plateau → vấn đề từ vựng hay tốc độ?", tags: ["test"], src: "tips", min: 25 },
          { id: "z8", name: "BJT 聴解: ôn tập trung 2–3 dạng sai nhiều nhất trong tất cả Mock", tags: ["listen"], src: "bjt", min: 40 },
          { id: "z9", name: "BJT 読解: 40 câu timed trong 60 phút — nếu hoàn thành 70%+ đúng: OK", tags: ["read"], src: "bjt", min: 65 },
          { id: "z10", name: "Anki: review 700+ từ (Tango/Hyougen + Keigo + BJT deck) — toàn bộ", tags: ["vocab"], src: "tango", min: 30 },
        ]
      },
      {
        id: "Z3", label: "Tuần 3 (15–21/11) · MOCK 9", tasks: [
          { id: "z11", name: "FULL MOCK TEST 9 — mô phỏng điều kiện thi thật: buổi sáng, bàn học", tags: ["test"], src: "bjt", min: 120 },
          { id: "z12", name: "Ôn sprint: chỉ củng cố đã biết — không học nội dung mới từ đây", tags: ["test"], src: "tips", min: 25 },
          { id: "z13", name: "Bite Size JP: 1 tập/ngày — maintain. Hoặc thử NHK Web Easy để nghe giọng khác", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "z14", name: "BJT 聴解: drill đọc câu hỏi 30 giây — luyện đến khi thành phản xạ", tags: ["test"], src: "bjt", min: 20 },
          { id: "z15", name: "Keigo/Bunshou: bảng 5 động từ quan trọng nhất — thuộc 100% cả 2 chiều", tags: ["gram"], src: "keigo", min: 20 },
        ]
      },
      {
        id: "Z4", label: "Tuần 4 (22–30/11) · MOCK 10", tasks: [
          { id: "z16", name: "FULL MOCK TEST 10 — mục tiêu > 460. Kết quả = thước đo khả năng thi thật", tags: ["test"], src: "bjt", min: 120 },
          { id: "z17", name: "Lập kế hoạch 3 tuần cuối T12 dựa trên kết quả Mock 10", tags: ["test"], src: "tips", min: 20 },
          { id: "z18", name: "Nghe lại Listening sai Mock 10 — lần cuối review kiểu này", tags: ["listen"], src: "bjt", min: 30 },
          { id: "z19", name: "Anki: giảm còn 20 thẻ/ngày — maintain, không thêm mới", tags: ["vocab"], src: "tango", min: 15 },
          { id: "z20", name: "Nghỉ 1 ngày hoàn toàn — giữ tinh thần & motivation", tags: ["tips"], src: "tips", min: 0 },
        ]
      },
    ]
  },
  "T12": {
    phase: 3,
    label: "Tháng 12 · Tuần quyết định",
    weeks: [
      {
        id: "A1", label: "Tuần 1–2 (1–14/12) · Mock 11 & 12", tasks: [
          { id: "a1", name: "FULL MOCK TEST 11 (tuần 1) — dùng đề chưa làm hoặc 過去問 online", tags: ["test"], src: "bjt", min: 120 },
          { id: "a2", name: "Ôn điểm yếu lần cuối — chỉ ôn, không học gì mới", tags: ["test"], src: "tips", min: 30 },
          { id: "a3", name: "Bite Size JP: nghe 1 tập → kiểm tra mình hiểu bao nhiêu % so với tháng 5", tags: ["listen"], src: "bitesize", min: 20 },
          { id: "a4", name: "Anki: 20 thẻ/ngày — maintain thôi", tags: ["vocab"], src: "tango", min: 15 },
          { id: "a5", name: "FULL MOCK TEST 12 (tuần 2) — nếu 470+: tự tin vào thi", tags: ["test"], src: "bjt", min: 120 },
        ]
      },
      {
        id: "A2", label: "Tuần 3 — 1 tuần trước thi · Giảm tốc", tasks: [
          { id: "a6", name: "Bite Size JP: 1 tập/ngày nhẹ nhàng — chỉ nghe, không ghi chú", tags: ["listen"], src: "bitesize", min: 15 },
          { id: "a7", name: "Anki: 15 thẻ/ngày — chỉ review, không thêm mới", tags: ["vocab"], src: "tango", min: 15 },
          { id: "a8", name: "Đọc lại: chiến lược làm bài (Listening: đọc câu hỏi trước · Reading: scan trước)", tags: ["test"], src: "tips", min: 15 },
          { id: "a9", name: "Ngủ đủ giấc: memory consolidation quan trọng hơn ôn thêm 1 giờ", tags: ["tips"], src: "tips", min: 0 },
          { id: "a10", name: "Ngày trước thi: nghỉ ngơi hoàn toàn. Tin vào 8 tháng đã học.", tags: ["tips"], src: "tips", min: 0 },
        ]
      },
      {
        id: "A3", label: "Ngày thi BJT · Thực chiến", tasks: [
          { id: "a11", name: "Sáng thi: ăn đủ, đến sớm 20 phút, không ôn trong phòng chờ", tags: ["tips"], src: "tips", min: 0 },
          { id: "a12", name: "Listening: 30 giây đầu = đọc câu hỏi, gạch keyword. Ghi số liệu ngay khi nghe.", tags: ["listen"], src: "tips", min: 0 },
          { id: "a13", name: "Reading: làm câu ngắn (email) trước, câu dài (bài báo) sau. Scan câu hỏi → locate.", tags: ["read"], src: "tips", min: 0 },
          { id: "a14", name: "Không bỏ trống câu nào: đoán 25% > bỏ trống 0%. Luôn chọn đáp án.", tags: ["tips"], src: "tips", min: 0 },
          { id: "a15", name: "Sau thi: ghi lại cảm nhận. Kết quả ra sau 1–2 tháng. がんばった！", tags: ["tips"], src: "tips", min: 0 },
        ]
      },
    ]
  },
}

export const MONTHS = Object.keys(DATA)
