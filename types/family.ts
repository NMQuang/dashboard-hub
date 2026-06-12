// ── Photo / Memories ─────────────────────────────────────────────────────

export type PhotoTag =
  | 'japan'      // ảnh từ Nhật
  | 'family'     // ảnh gia đình chung
  | 'baby'       // ảnh con
  | 'couple'     // ảnh vợ chồng
  | 'travel'     // du lịch
  | 'milestone'  // cột mốc quan trọng
  | string       // tag tùy chỉnh

export interface FamilyPhoto {
  id: string
  filename: string
  url: string          // Cloudflare R2 public URL
  thumbnailUrl: string // smaller version
  takenAt: string      // ISO date — from EXIF or manual
  uploadedAt: string
  uploadedBy: 'me' | 'partner'
  tags: PhotoTag[]
  caption?: string     // AI-generated hoặc manual
  captionGeneratedAt?: string
  location?: string    // e.g. "Tokyo, Nhật Bản"
  faces?: FaceLabel[]  // từ face recognition
  albumIds: string[]
  sizeBytes: number
  width: number
  height: number
}

export interface FaceLabel {
  person: 'me' | 'partner' | 'baby' | string
  confidence: number   // 0-1
}

export interface PhotoAlbum {
  id: string
  name: string
  description?: string
  coverPhotoId?: string
  photoIds: string[]
  tags: PhotoTag[]
  createdAt: string
  updatedAt: string
}

export interface PhotoStory {
  id: string
  title: string
  description: string // AI-generated narrative
  photoIds: string[]
  createdAt: string
  tag?: PhotoTag      // story được tạo từ tag nào
}

// ── Connect / Check-in ────────────────────────────────────────────────────

export interface DailyCheckIn {
  id: string
  date: string         // YYYY-MM-DD
  author: 'me' | 'partner'
  mood: 1 | 2 | 3 | 4 | 5  // 1=tired, 5=great
  text: string         // nội dung check-in
  textJa?: string      // nếu viết tiếng Nhật
  textViTranslated?: string // AI dịch sang tiếng Việt
  photoUrl?: string    // optional ảnh đính kèm
  location?: string    // Tokyo, Ho Chi Minh
  weather?: string     // từ weather API
  createdAt: string
}

export type MoodEmoji = {
  [key: number]: string
}

// ── Plan / Calendar ───────────────────────────────────────────────────────

export type EventCategory =
  | 'flight'      // lịch bay
  | 'visit'       // về thăm nhà / bạn sang thăm
  | 'birthday'    // sinh nhật
  | 'medical'     // lịch bác sĩ con
  | 'holiday'     // ngày nghỉ lễ
  | 'trip'        // du lịch
  | 'vaccine'     // lịch tiêm chủng bé
  | 'school'      // trường học / nhà trẻ
  | 'other'

export interface FamilyEvent {
  id: string
  title: string
  description?: string
  category: EventCategory
  date: string         // YYYY-MM-DD
  endDate?: string     // for multi-day events
  time?: string        // HH:mm
  location?: string
  reminder?: number    // days before
  createdBy: 'me' | 'partner'
  createdAt: string
}

// ── Finance / Budget ──────────────────────────────────────────────────────

export type Currency = 'VND' | 'JPY' | 'USD'

export type ExpenseCategory =
  | 'rent'        // tiền nhà / tiền trọ
  | 'food'        // ăn uống
  | 'baby'        // đồ dùng cho con
  | 'transport'   // đi lại
  | 'medical'     // y tế
  | 'education'   // học phí
  | 'saving'      // tiết kiệm
  | 'income'      // thu nhập
  | 'other'

export interface BudgetEntry {
  id: string
  date: string
  amount: number
  currency: Currency
  amountVnd?: number   // quy đổi tham khảo
  category: ExpenseCategory
  type: 'income' | 'expense'
  title: string
  description?: string
  note?: string
  location: 'vietnam' | 'japan'
  createdBy: 'me' | 'partner'
  createdAt: string
}

export interface MonthlyBudget {
  month: string        // YYYY-MM
  targetSavingVnd: number
  entries: BudgetEntry[]
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export type TaskPriority = 'high' | 'medium' | 'low'

export interface FamilyTask {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  done: boolean
  doneAt?: string
  doneBy?: 'me' | 'partner'
  assignedTo?: 'me' | 'partner' | 'both'
  createdBy: 'me' | 'partner'
  createdAt: string
  updatedAt: string
}

// ── Google Photos album ───────────────────────────────────────────────────

export interface GooglePhotoAlbum {
  id: string
  title: string
  mediaItemsCount: number
  coverPhotoBaseUrl?: string
}

// ── Unified display photo ─────────────────────────────────────────────────
// Single format for rendering both Google Photos and R2-uploaded photos.

export interface DisplayPhoto {
  id: string
  url: string
  thumbnailUrl: string
  filename: string
  caption?: string
  description?: string
  takenAt: string        // ISO — primary sort key
  location?: string
  tags: string[]
  source: 'google_photos' | 'local'
  width: number
  height: number
  albumTitle?: string
  googleAlbumId?: string // populated when photo was fetched via album filter
}

// ── Family photo story (source-agnostic, replaces PhotoStory in /photos hub) ──

export type StorySyncStatus = 'local' | 'pending' | 'synced' | 'failed'

export interface FamilyPhotoStory {
  id: string
  title: string
  description?: string
  photoIds: string[]      // DisplayPhoto ids (google or local)
  dateFrom?: string       // YYYY-MM-DD
  dateTo?: string         // YYYY-MM-DD
  location?: string
  notes?: string
  googleAlbumId?: string  // populated after Google Photos album sync
  syncStatus: StorySyncStatus
  shareToken?: string     // random token for public share link
  createdAt: string
  updatedAt?: string
}

// ── Finance v2 — multi-source income, enhanced expenses, investments ──────

export type IncomeSource =
  | 'wife_salary_vn'
  | 'husband_vn'
  | 'husband_jp'
  | 'other'

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  wife_salary_vn: 'Vợ - Lương VN',
  husband_vn: 'Chồng - Thu nhập VN',
  husband_jp: 'Chồng - Lương Nhật',
  other: 'Khác',
}

export const INCOME_SOURCE_ICONS: Record<IncomeSource, string> = {
  wife_salary_vn: '🇻🇳',
  husband_vn: '🇻🇳',
  husband_jp: '🇯🇵',
  other: '💼',
}

export interface FamilyIncome {
  id: string
  source: IncomeSource
  country: 'VN' | 'JP'
  currency: 'VND' | 'JPY' | 'USD'
  amount: number
  receivedDate: string   // YYYY-MM-DD
  category?: string
  note?: string
  createdAt: string
}

export type ExpenseCategoryFinance =
  | 'rent'
  | 'food'
  | 'transportation'
  | 'utilities'
  | 'family'
  | 'shopping'
  | 'travel'
  | 'misc'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryFinance, string> = {
  rent: 'Nhà ở',
  food: 'Ăn uống',
  transportation: 'Đi lại',
  utilities: 'Tiện ích',
  family: 'Gia đình',
  shopping: 'Mua sắm',
  travel: 'Du lịch',
  misc: 'Khác',
}

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategoryFinance, string> = {
  rent: '🏠',
  food: '🍜',
  transportation: '🚌',
  utilities: '💡',
  family: '👨‍👩‍👧',
  shopping: '🛍️',
  travel: '✈️',
  misc: '📦',
}

export interface FamilyExpense {
  id: string
  country: 'VN' | 'JP'
  category: ExpenseCategoryFinance
  amount: number
  currency: 'VND' | 'JPY'
  spentDate: string      // YYYY-MM-DD
  paymentMethod?: string
  note?: string
  createdAt: string
}

export type InvestmentType = 'gold' | 'crypto' | 'savings' | 'stock'

export interface FamilyInvestment {
  id: string
  type: InvestmentType
  assetName: string
  quantity: number
  averageBuyPrice?: number
  currentPrice?: number
  currency: string
  note?: string
  purchasedAt?: string   // YYYY-MM-DD
  updatedAt: string
}

// ── Bills (hóa đơn cố định JP) ────────────────────────────────────────────

export type BillStatus = 'pending' | 'paid'

export interface FamilyBill {
  id: string
  month: string             // YYYY-MM
  country: 'JP' | 'VN'
  name: string
  category: string
  estimatedAmount?: number
  actualAmount?: number
  currency: 'JPY' | 'VND'
  dueDate?: string          // YYYY-MM-DD
  status: BillStatus
  expenseId?: string        // sau khi mark paid → link to expense
  note?: string
  createdAt: string
}

export interface BillPreset {
  name: string
  icon: string
  category: string
  country: 'JP' | 'VN'
  currency: 'JPY' | 'VND'
}

export const BILL_PRESETS: BillPreset[] = [
  // Japan — tiền cố định hàng tháng
  { name: '電気',          icon: '💡', category: 'utilities',      country: 'JP', currency: 'JPY' },
  { name: '水道',          icon: '💧', category: 'utilities',      country: 'JP', currency: 'JPY' },
  { name: 'ガス',          icon: '🔥', category: 'utilities',      country: 'JP', currency: 'JPY' },
  { name: 'インターネット', icon: '🌐', category: 'utilities',      country: 'JP', currency: 'JPY' },
  { name: 'WiFi',          icon: '📶', category: 'utilities',      country: 'JP', currency: 'JPY' },
  { name: '食費',          icon: '🍱', category: 'food',           country: 'JP', currency: 'JPY' },
  { name: 'JP その他',     icon: '📋', category: 'misc',           country: 'JP', currency: 'JPY' },
  // Vietnam — tiền cố định hàng tháng
  { name: 'Tiền điện',        icon: '💡', category: 'utilities',       country: 'VN', currency: 'VND' },
  { name: 'Tiền nước',        icon: '💧', category: 'utilities',       country: 'VN', currency: 'VND' },
  { name: 'Tiền internet',    icon: '🌐', category: 'utilities',       country: 'VN', currency: 'VND' },
  { name: 'Tiền trả VISA',    icon: '💳', category: 'misc',            country: 'VN', currency: 'VND' },
  { name: 'Tiền trả ngân hàng', icon: '🏦', category: 'utilities',    country: 'VN', currency: 'VND' },
  { name: 'Tiền xe',          icon: '🛵', category: 'transportation',  country: 'VN', currency: 'VND' },
  { name: 'VN Khác',          icon: '📋', category: 'misc',            country: 'VN', currency: 'VND' },
]

export const BILL_PRESETS_JP = BILL_PRESETS.filter(p => p.country === 'JP')
export const BILL_PRESETS_VN = BILL_PRESETS.filter(p => p.country === 'VN')

// ── Bill templates (cấu hình tự động sinh hàng tháng) ────────────────────

export interface FamilyBillTemplate {
  id: string
  country: 'JP' | 'VN'
  name: string
  category: string
  currency: 'JPY' | 'VND'
  estimatedAmount?: number  // null = dùng smart estimate (actual tháng trước)
  enabled: boolean
  sortOrder: number
  createdAt: string
}

// ── Debts (công nợ) ───────────────────────────────────────────────────────

export type DebtType = 'owe' | 'lend'  // owe = tôi nợ, lend = người ta nợ tôi
export type DebtStatus = 'active' | 'partial' | 'settled'

export interface FamilyDebt {
  id: string
  type: DebtType
  person: string
  amount: number
  currency: 'JPY' | 'VND' | 'USD'
  description?: string
  dueDate?: string          // YYYY-MM-DD
  status: DebtStatus
  paidAmount: number        // số đã trả/nhận
  createdAt: string
  settledAt?: string
}

// ── Finance History (audit log) ──────────────────────────────────────────

export type FinanceEntityType = 'income' | 'expense' | 'bill' | 'debt' | 'investment'
export type FinanceHistoryAction = 'created' | 'updated' | 'deleted'

export interface FinanceHistoryEntry {
  id: string
  entityType: FinanceEntityType
  entityId: string
  action: FinanceHistoryAction
  description: string
  snapshot?: Record<string, unknown>
  month?: string   // YYYY-MM, null cho debt/investment
  createdAt: string
}

// ── Upload ────────────────────────────────────────────────────────────────

export interface PresignedUploadUrl {
  uploadUrl: string    // PUT to this URL
  publicUrl: string    // final accessible URL
  key: string          // R2 object key
}

export interface UploadResult {
  photo: FamilyPhoto
  captionPending: boolean
}
