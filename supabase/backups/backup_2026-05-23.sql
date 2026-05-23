-- ============================================================
-- Supabase Backup — dashboard_hub (fufvkhdscexmkjnkotvt)
-- Generated : 2026-05-23
-- Tables    : family_income, family_expenses, family_investments,
--             family_events, japanese_phrases
-- Restore   : psql -h <host> -U postgres -d postgres -f backup_2026-05-23.sql
-- ============================================================

BEGIN;

-- ─── family_income (6 rows) ──────────────────────────────────────────────────

INSERT INTO family_income (id, source, country, currency, amount, received_date, category, note, created_at) VALUES
  ('mp2i56nsp57', 'wife_salary_vn', 'VN', 'VND', 25000000, '2026-05-12', NULL, NULL,                     '2026-05-12 10:42:55.864+00'),
  ('mp2ihht42ww', 'husband_vn',     'VN', 'VND', 22000000, '2026-05-12', NULL, NULL,                     '2026-05-12 10:52:30.184+00'),
  ('mp2ihxyfc41', 'husband_jp',     'JP', 'JPY',   200000, '2026-05-12', NULL, NULL,                     '2026-05-12 10:52:51.111+00'),
  ('mp5ingdlgn5', 'other',          'VN', 'VND', 15000000, '2026-05-14', NULL, 'Mẹ còn giữ tiền mặt',   '2026-05-14 13:20:26.793+00'),
  ('mp627fxlwrj', 'other',          'VN', 'JPY',   145000, '2026-05-14', NULL, 'Tiền công ty nợ',        '2026-05-14 22:27:52.041+00'),
  ('mp628c0wxg5', 'other',          'VN', 'JPY',    50000, '2026-05-14', NULL, 'Tiền e Quyền nợ',        '2026-05-14 22:28:33.632+00')
ON CONFLICT (id) DO NOTHING;

-- ─── family_expenses (12 rows) ───────────────────────────────────────────────

INSERT INTO family_expenses (id, country, category, amount, currency, spent_date, payment_method, note, created_at) VALUES
  ('mp2jbid5ir4', 'JP', 'food',      20000,    'JPY', '2026-05-12', NULL, NULL,                                   '2026-05-12 11:15:50.585+00'),
  ('mp2jbxyh3vy', 'JP', 'misc',       7284,    'JPY', '2026-05-12', NULL, 'Tiền sim data',                        '2026-05-12 11:16:10.793+00'),
  ('mp2jd2pkjss', 'VN', 'misc',    2000000,    'VND', '2026-05-12', NULL, 'Tiền trả thẻ VISA',                    '2026-05-12 11:17:03.608+00'),
  ('mp5hg3egv5h', 'JP', 'misc',       5010,    'JPY', '2026-05-14', NULL, 'Tiền Wifi HOME',                       '2026-05-14 12:46:43.768+00'),
  ('mp5hi4lc2a6', 'VN', 'misc',      50000,    'VND', '2026-05-14', NULL, 'Tiền nước tháng 4/2026',               '2026-05-14 12:48:18.624+00'),
  ('mp5hlxr5iqi', 'VN', 'utilities',29150000,  'VND', '2026-05-14', NULL, 'Tiền ngân hàng',                       '2026-05-14 12:51:16.385+00'),
  ('mp623nqw92s', 'JP', 'utilities', 279000,   'JPY', '2026-05-14', NULL, 'Mượn tiền a Kiệt',                     '2026-05-14 22:24:55.544+00'),
  ('mp9agj1fqf2', 'JP', 'misc',       2324,    'JPY', '2026-05-17', NULL, 'Tiền điện',                            '2026-05-17 04:42:11.027+00'),
  ('mp9ahc2xy0p', 'JP', 'utilities',  20000,   'JPY', '2026-05-17', NULL, 'Tiền đưa cho Quyền',                   '2026-05-17 04:42:49.065+00'),
  ('mp9ai4ldhec', 'JP', 'utilities',  10000,   'JPY', '2026-05-17', NULL, 'Nạp tiền Kyash(dùng cho Wifi home)',   '2026-05-17 04:43:26.017+00'),
  ('mpgyeav5pm5', 'JP', 'utilities',   7625,   'JPY', '2026-05-22', NULL, 'Tiền gas',                             '2026-05-22 13:26:41.537+00'),
  ('mphoo611pcu', 'VN', 'utilities',  297518,  'VND', '2026-05-23', NULL, 'Tiền điện',                            '2026-05-23 01:42:11.845+00')
ON CONFLICT (id) DO NOTHING;

-- ─── family_investments (5 rows) ─────────────────────────────────────────────

INSERT INTO family_investments (id, type, asset_name, quantity, average_buy_price, current_price, currency, note, updated_at) VALUES
  ('mp2lfh5a22i', 'savings', 'Tiết kiệm JPY',  900000,   NULL,        NULL,      'JPY', NULL,           '2026-05-12 12:14:54.862+00'),
  ('mp5icz01beh', 'gold',    'Nhẫn tròn',         0.2,  15000000,  16200000,    'VND', NULL,           '2026-05-14 13:12:17.713+00'),
  ('mp5ifdx5i9l', 'crypto',  'BTC',             0.0007,    70000,     79580,     'USD', NULL,           '2026-05-14 13:14:10.361+00'),
  ('mp5iltqxay1', 'savings', 'VCB',          30000000,   NULL,        NULL,      'VND', 'Mẹ tiết kiệm',  '2026-05-14 13:19:10.809+00'),
  ('mp5imundpks', 'savings', 'BIDV',         30000000,   NULL,        NULL,      'VND', 'Bà ngoại giữ',  '2026-05-14 13:19:58.633+00')
ON CONFLICT (id) DO NOTHING;

-- ─── family_events (5 rows) ──────────────────────────────────────────────────

INSERT INTO family_events (id, title, description, category, date, end_date, time, location, reminder, created_by, created_at) VALUES
  ('evt_1777114339526_nshb2r', 'Bé Cafe 2 tuổi',              NULL, 'birthday', '2026-03-16', '2026-03-16', NULL, 'Tân Phú - Hồ Chí Minh - Việt Nam', NULL, 'me', '2026-04-25 10:52:19.526+00'),
  ('evt_1777111663095_ftwqtx', 'Lễ 30/4-1/5',                 NULL, 'holiday',  '2026-04-27', '2026-05-05', NULL, 'Việt Nam',                          NULL, 'me', '2026-04-25 10:07:43.095+00'),
  ('evt_1777114258263_vc7cph', 'Lễ Golden Week 2026',          NULL, 'holiday',  '2026-05-02', '2026-05-06', NULL, 'Okayama',                           NULL, 'me', '2026-04-25 10:50:58.263+00'),
  ('evt_1777111734212_f6dh5r', 'Về thăm 2 mẹ con lần 1-2026', NULL, 'visit',    '2026-08-01', '2026-08-31', NULL, 'Hồ Chí Minh',                       NULL, 'me', '2026-04-25 10:08:54.213+00'),
  ('evt_1777111841110_fqp9gd', 'Về ăn tết 2027 vs 2 mẹ con',  NULL, 'flight',   '2027-01-22', '2027-02-20', NULL, 'Okayama - Hồ Chí Minh',             NULL, 'me', '2026-04-25 10:10:41.110+00')
ON CONFLICT (id) DO NOTHING;

-- ─── japanese_phrases (48 rows) ──────────────────────────────────────────────

INSERT INTO japanese_phrases (id, category, japanese, vietnamese, note, tags, created_at, updated_at, category_vi, type, title, difficulty) VALUES

-- 会議 (Cuộc họp)
('seed_001', '会議',
  '本日の議題は〜についてです。',
  'Chủ đề hôm nay là về ~.',
  'Dùng để mở đầu meeting.',
  ARRAY['business_japanese','onsite','it_project','meeting'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'sample_phrase', 'Nêu chủ đề cuộc họp', 'basic'),

('seed_002', '会議',
  'まず、〜について説明いたします。',
  'Trước tiên, tôi xin giải thích về ~.',
  'Dùng khi trình bày thiết kế, spec, issue.',
  ARRAY['business_japanese','onsite','it_project','meeting'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'sample_phrase', 'Bắt đầu phần giải thích', 'basic'),

('seed_003', '会議',
  'ご意見をいただけますでしょうか。',
  'Anh/chị có thể cho tôi ý kiến được không?',
  'Dùng khi cần confirm từ khách hàng Nhật.',
  ARRAY['business_japanese','onsite','it_project','meeting'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'sample_phrase', 'Xin ý kiến trong meeting', 'basic'),

('seed_004', '会議',
  E'お時間いただきありがとうございます。\n本日の議題は〜についてです。\n\nまず、〜について説明いたします。\n次に、〜についてご意見を伺いたいです。',
  'Cảm ơn anh/chị đã dành thời gian. Chủ đề hôm nay là ~. Trước tiên tôi xin giải thích về ~. Sau đó tôi muốn xin ý kiến về ~.',
  'Template mở đầu meeting IT với khách hàng Nhật.',
  ARRAY['business_japanese','template','onsite','it_project','meeting'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'template', 'Meeting opening template', 'basic'),

('seed_005', '会議',
  E'本日の議題は、API設計についてです。\nまず、エンドポイント構成について説明いたします。\nこの設計で問題ないか、ご意見をいただけますでしょうか。',
  'Chủ đề hôm nay là thiết kế API. Trước tiên tôi xin giải thích cấu trúc endpoint. Anh/chị có thể cho ý kiến xem thiết kế này có vấn đề gì không?',
  'Tình huống họp review basic/detail design API.',
  ARRAY['business_japanese','scenario','onsite','it_project','meeting','api_design'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'scenario_example', 'Review thiết kế API', 'practical'),

('seed_006', '会議',
  E'本日の議題は、開発進捗についてです。\n現在、バックエンドは80％完了しております。\nスケジュールについてご確認いただけますでしょうか。',
  'Chủ đề hôm nay là tiến độ phát triển. Hiện backend đã hoàn thành 80%. Anh/chị có thể xác nhận lại schedule giúp tôi được không?',
  'Tình huống daily/weekly progress meeting.',
  ARRAY['business_japanese','scenario','onsite','it_project','meeting','progress'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Cuộc họp', 'scenario_example', 'Họp tiến độ dự án', 'practical'),

-- メール (Email)
('seed_007', 'メール',
  'お世話になっております。',
  'Cảm ơn anh/chị luôn hỗ trợ.',
  'Câu mở đầu email business phổ biến.',
  ARRAY['business_japanese','onsite','it_project','email'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'sample_phrase', 'Mở đầu email', 'basic'),

('seed_008', 'メール',
  '〜についてご連絡いたしました。',
  'Tôi xin liên hệ về ~.',
  'Dùng khi gửi mail về spec, bug, schedule.',
  ARRAY['business_japanese','onsite','it_project','email'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'sample_phrase', 'Nêu mục đích liên hệ', 'basic'),

('seed_009', 'メール',
  'お手数ですが、〜していただけますでしょうか。',
  'Phiền anh/chị ~ giúp tôi được không?',
  'Câu nhờ vả lịch sự trong email.',
  ARRAY['business_japanese','onsite','it_project','email','request'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'sample_phrase', 'Nhờ xác nhận', 'basic'),

('seed_010', 'メール',
  E'お世話になっております。\n[会社名]の[名前]です。\n\n〜についてご連絡いたしました。\nお手数ですが、〜していただけますでしょうか。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi là [Tên] từ [Công ty]. Tôi xin liên hệ về ~. Phiền anh/chị ~ giúp tôi được không?',
  'Template email cơ bản khi làm việc với khách hàng Nhật.',
  ARRAY['business_japanese','template','onsite','it_project','email'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'template', 'Business email template', 'basic'),

('seed_011', 'メール',
  E'お世話になっております。\n設計書を添付いたしました。\nお手数ですが、ご確認いただけますでしょうか。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi đã đính kèm tài liệu thiết kế. Phiền anh/chị xác nhận giúp tôi.',
  'Tình huống gửi basic design/detail design.',
  ARRAY['business_japanese','scenario','onsite','it_project','email','design_doc'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'scenario_example', 'Gửi tài liệu thiết kế', 'practical'),

('seed_012', 'メール',
  E'お世話になっております。\n本日の実装内容についてご連絡いたしました。\nお手数ですが、コードレビューをお願いできますでしょうか。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi xin liên hệ về nội dung implement hôm nay. Phiền anh/chị review code giúp tôi.',
  'Tình huống nhờ review PR/code.',
  ARRAY['business_japanese','scenario','onsite','it_project','email','code_review'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Email', 'scenario_example', 'Nhờ review code', 'practical'),

-- 電話 (Điện thoại)
('seed_013', '電話',
  '〜の件でお電話いたしました。',
  'Tôi gọi về việc ~.',
  'Dùng khi gọi điện business.',
  ARRAY['business_japanese','onsite','it_project','phone'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'sample_phrase', 'Nêu lý do gọi', 'basic'),

('seed_014', '電話',
  '少々お待ちいただけますでしょうか。',
  'Anh/chị vui lòng chờ một chút được không?',
  'Dùng khi cần kiểm tra thông tin.',
  ARRAY['business_japanese','onsite','it_project','phone'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'sample_phrase', 'Nhờ chờ máy', 'basic'),

('seed_015', '電話',
  '折り返しご連絡いたします。',
  'Tôi sẽ liên hệ lại sau.',
  'Dùng khi chưa thể trả lời ngay.',
  ARRAY['business_japanese','onsite','it_project','phone'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'sample_phrase', 'Gọi lại sau', 'basic'),

('seed_016', '電話',
  E'お世話になっております。\n[会社名]の[名前]でございます。\n\n〜の件でお電話いたしました。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi là [Tên] từ [Công ty]. Tôi gọi về việc ~.',
  'Template mở đầu cuộc gọi với khách hàng Nhật.',
  ARRAY['business_japanese','template','onsite','it_project','phone'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'template', 'Phone call opening template', 'basic'),

('seed_017', '電話',
  E'お世話になっております。\nシステム障害の件でお電話いたしました。\n現在、調査中でございます。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi gọi về việc sự cố hệ thống. Hiện tại chúng tôi đang điều tra.',
  'Tình huống gọi điện khi production incident.',
  ARRAY['business_japanese','scenario','onsite','it_project','phone','incident'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'scenario_example', 'Báo lỗi production', 'practical'),

('seed_018', '電話',
  E'お世話になっております。\n打ち合わせ日程の件でお電話いたしました。\n明日の10時でよろしいでしょうか。',
  'Cảm ơn anh/chị luôn hỗ trợ. Tôi gọi về lịch họp. 10 giờ ngày mai có được không ạ?',
  'Tình huống gọi xác nhận meeting schedule.',
  ARRAY['business_japanese','scenario','onsite','it_project','phone','meeting'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Điện thoại', 'scenario_example', 'Xác nhận lịch họp', 'practical'),

-- 報告 (Báo cáo)
('seed_019', '報告',
  '〜についてご報告いたします。',
  'Tôi xin báo cáo về ~.',
  'Dùng khi báo cáo tiến độ/lỗi/kết quả.',
  ARRAY['business_japanese','onsite','it_project','report'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'sample_phrase', 'Mở đầu báo cáo', 'basic'),

('seed_020', '報告',
  '現状は〜となっております。',
  'Hiện trạng đang là ~.',
  'Dùng trong status report.',
  ARRAY['business_japanese','onsite','it_project','report'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'sample_phrase', 'Nêu hiện trạng', 'basic'),

('seed_021', '報告',
  '今後は〜予定です。',
  'Sau đây dự kiến sẽ ~.',
  'Dùng khi nói next action.',
  ARRAY['business_japanese','onsite','it_project','report'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'sample_phrase', 'Nêu kế hoạch tiếp theo', 'basic'),

('seed_022', '報告',
  E'〜についてご報告いたします。\n現状は〜となっております。\n問題点は〜です。\n今後は〜予定です。',
  'Tôi xin báo cáo về ~. Hiện trạng là ~. Vấn đề là ~. Sau đây dự kiến sẽ ~.',
  'Template báo cáo tiến độ/vấn đề trong dự án IT.',
  ARRAY['business_japanese','template','onsite','it_project','report'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'template', 'Status report template', 'basic'),

('seed_023', '報告',
  E'本日の進捗についてご報告いたします。\n現在、API開発は完了しております。\nフロント側は対応中です。',
  'Tôi xin báo cáo tiến độ hôm nay. Hiện phần phát triển API đã hoàn thành. Phía frontend đang được xử lý.',
  'Tình huống daily progress report.',
  ARRAY['business_japanese','scenario','onsite','it_project','report','progress'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'scenario_example', 'Báo cáo tiến độ dev', 'practical'),

('seed_024', '報告',
  E'不具合対応についてご報告いたします。\n原因はデータ不整合でした。\n修正は完了しております。',
  'Tôi xin báo cáo về xử lý lỗi. Nguyên nhân là dữ liệu không đồng nhất. Việc sửa lỗi đã hoàn thành.',
  'Tình huống bug fix report.',
  ARRAY['business_japanese','scenario','onsite','it_project','report','bug'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Báo cáo', 'scenario_example', 'Báo cáo bug', 'practical'),

-- 相談 (Trao đổi / xin ý kiến)
('seed_025', '相談',
  '〜についてご相談させていただきたいです。',
  'Tôi muốn trao đổi/xin ý kiến về ~.',
  'Dùng khi cần hỏi hướng xử lý.',
  ARRAY['business_japanese','onsite','it_project','consultation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'sample_phrase', 'Xin trao đổi', 'basic'),

('seed_026', '相談',
  '現在、〜という状況です。',
  'Hiện tại tình hình là ~.',
  'Dùng để cung cấp context.',
  ARRAY['business_japanese','onsite','it_project','consultation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'sample_phrase', 'Nêu tình trạng hiện tại', 'basic'),

('seed_027', '相談',
  'ご意見をいただけますでしょうか。',
  'Anh/chị có thể cho tôi ý kiến được không?',
  'Dùng khi cần decision hoặc direction.',
  ARRAY['business_japanese','onsite','it_project','consultation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'sample_phrase', 'Xin ý kiến', 'basic'),

('seed_028', '相談',
  E'〜についてご相談させていただきたいです。\n現在、〜という状況です。\nご意見をいただけますでしょうか。',
  'Tôi muốn trao đổi/xin ý kiến về ~. Hiện tại tình hình là ~. Anh/chị có thể cho tôi ý kiến được không?',
  'Template xin ý kiến khách hàng/leader Nhật.',
  ARRAY['business_japanese','template','onsite','it_project','consultation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'template', 'Consultation template', 'basic'),

('seed_029', '相談',
  E'実装方法についてご相談させていただきたいです。\n現在、パフォーマンスに問題がある可能性があります。\nご意見をいただけますでしょうか。',
  'Tôi muốn trao đổi về cách implement. Hiện có khả năng phát sinh vấn đề performance. Anh/chị có thể cho tôi ý kiến được không?',
  'Tình huống cân nhắc implementation approach.',
  ARRAY['business_japanese','scenario','onsite','it_project','consultation','implementation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'scenario_example', 'Chọn hướng implement', 'practical'),

('seed_030', '相談',
  E'設計方針についてご相談があります。\nこの方法で問題ないか、ご意見をいただけますでしょうか。',
  'Tôi muốn trao đổi về phương hướng thiết kế. Anh/chị có thể cho ý kiến xem cách này có vấn đề gì không?',
  'Tình huống xin ý kiến basic/detail design.',
  ARRAY['business_japanese','scenario','onsite','it_project','consultation','design'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Trao đổi / xin ý kiến', 'scenario_example', 'Quyết định design', 'practical'),

-- 依頼 (Nhờ vả / yêu cầu)
('seed_031', '依頼',
  'お手数ですが〜',
  'Phiền anh/chị ~.',
  'Cushion phrase khi nhờ việc.',
  ARRAY['business_japanese','onsite','it_project','request'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'sample_phrase', 'Mở đầu nhờ vả', 'basic'),

('seed_032', '依頼',
  '〜していただけますでしょうか。',
  'Anh/chị có thể ~ giúp tôi được không?',
  'Cách nhờ lịch sự.',
  ARRAY['business_japanese','onsite','it_project','request'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'sample_phrase', 'Nhờ xử lý', 'basic'),

('seed_033', '依頼',
  'ご対応のほどよろしくお願いいたします。',
  'Rất mong anh/chị hỗ trợ xử lý.',
  'Dùng cuối email/request.',
  ARRAY['business_japanese','onsite','it_project','request'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'sample_phrase', 'Kết thúc request', 'basic'),

('seed_034', '依頼',
  'お手数ですが、〜していただけますでしょうか。',
  'Phiền anh/chị ~ giúp tôi được không?',
  'Template request ngắn gọn.',
  ARRAY['business_japanese','template','onsite','it_project','request'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'template', 'Request template', 'basic'),

('seed_035', '依頼',
  'お手数ですが、不具合を修正していただけますでしょうか。',
  'Phiền anh/chị sửa lỗi này giúp tôi được không?',
  'Tình huống nhờ member/customer-side team fix bug.',
  ARRAY['business_japanese','scenario','onsite','it_project','request','bug'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'scenario_example', 'Nhờ fix bug', 'practical'),

('seed_036', '依頼',
  'お手数ですが、仕様をご確認いただけますでしょうか。',
  'Phiền anh/chị xác nhận spec giúp tôi được không?',
  'Tình huống cần customer confirm spec trước khi implement.',
  ARRAY['business_japanese','scenario','onsite','it_project','request','spec'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Nhờ vả / yêu cầu', 'scenario_example', 'Nhờ confirm spec', 'practical'),

-- 謝罪 (Xin lỗi)
('seed_037', '謝罪',
  '大変申し訳ございません。',
  'Thành thật xin lỗi.',
  'Cách xin lỗi trang trọng.',
  ARRAY['business_japanese','onsite','it_project','apology'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'sample_phrase', 'Xin lỗi trang trọng', 'basic'),

('seed_038', '謝罪',
  'ご迷惑をおかけして申し訳ございません。',
  'Xin lỗi vì đã gây phiền toái.',
  'Dùng khi lỗi ảnh hưởng tới khách hàng.',
  ARRAY['business_japanese','onsite','it_project','apology'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'sample_phrase', 'Xin lỗi vì gây phiền toái', 'basic'),

('seed_039', '謝罪',
  '今後は注意いたします。',
  'Từ nay tôi sẽ chú ý hơn.',
  'Dùng sau khi xin lỗi.',
  ARRAY['business_japanese','onsite','it_project','apology'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'sample_phrase', 'Cam kết chú ý hơn', 'basic'),

('seed_040', '謝罪',
  E'大変申し訳ございません。\n〜について不備がございました。\n今後は再発防止に努めます。',
  'Thành thật xin lỗi. Đã có thiếu sót về ~. Chúng tôi sẽ cố gắng ngăn tái phát.',
  'Template xin lỗi khi có lỗi trong dự án IT.',
  ARRAY['business_japanese','template','onsite','it_project','apology'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'template', 'Apology template', 'basic'),

('seed_041', '謝罪',
  E'大変申し訳ございません。\nリリースに不具合がございました。\n現在修正中です。',
  'Thành thật xin lỗi. Có lỗi trong bản release. Hiện chúng tôi đang sửa.',
  'Tình huống lỗi sau deploy/release.',
  ARRAY['business_japanese','scenario','onsite','it_project','apology','release'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'scenario_example', 'Deploy lỗi', 'practical'),

('seed_042', '謝罪',
  E'ご迷惑をおかけして申し訳ございません。\n対応が遅れております。\n本日中に完了できるよう対応いたします。',
  'Xin lỗi vì đã gây phiền toái. Việc xử lý đang bị chậm. Tôi sẽ cố gắng hoàn thành trong hôm nay.',
  'Tình huống báo delay task/deadline.',
  ARRAY['business_japanese','scenario','onsite','it_project','apology','delay'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xin lỗi', 'scenario_example', 'Trễ deadline', 'practical'),

-- 確認 (Xác nhận)
('seed_043', '確認',
  '念のため確認させていただきます。',
  'Để chắc chắn, tôi xin xác nhận lại.',
  'Dùng khi tránh hiểu sai.',
  ARRAY['business_japanese','onsite','it_project','confirmation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'sample_phrase', 'Xin xác nhận lại', 'basic'),

('seed_044', '確認',
  '〜でよろしいでしょうか。',
  '~ có được không ạ?',
  'Dùng để confirm spec/schedule/decision.',
  ARRAY['business_japanese','onsite','it_project','confirmation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'sample_phrase', 'Xác nhận có được không', 'basic'),

('seed_045', '確認',
  'ご確認いただけますでしょうか。',
  'Anh/chị có thể xác nhận giúp tôi được không?',
  'Dùng trong meeting/email.',
  ARRAY['business_japanese','onsite','it_project','confirmation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'sample_phrase', 'Nhờ xác nhận', 'basic'),

('seed_046', '確認',
  E'念のため確認させていただきます。\n〜でよろしいでしょうか。',
  '~ có được không ạ?',
  'Template xác nhận nội dung với khách hàng Nhật.',
  ARRAY['business_japanese','template','onsite','it_project','confirmation'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'template', 'Confirmation template', 'basic'),

('seed_047', '確認',
  E'念のため確認させていただきます。\nこの仕様で問題ないでしょうか。',
  'Để chắc chắn, tôi xin xác nhận lại. Spec này có vấn đề gì không ạ?',
  'Tình huống confirm spec trước khi development.',
  ARRAY['business_japanese','scenario','onsite','it_project','confirmation','spec'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'scenario_example', 'Confirm spec', 'practical'),

('seed_048', '確認',
  E'念のため確認させていただきます。\n本日リリースでよろしいでしょうか。',
  'Để chắc chắn, tôi xin xác nhận lại. Hôm nay release có được không ạ?',
  'Tình huống confirm thời điểm release/deploy.',
  ARRAY['business_japanese','scenario','onsite','it_project','confirmation','release'],
  '2026-04-25 13:45:03.663628+00', '2026-04-25 13:45:03.663628+00',
  'Xác nhận', 'scenario_example', 'Confirm deploy', 'practical')

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- End of backup
-- Tables not included: cron_runs (system/log data)
-- New tables (family_bills, family_debts) not yet in Supabase —
--   apply supabase/migrations/20260523_family_bills_debts.sql first
-- ============================================================
