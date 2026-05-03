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
  createdAt: string
  updatedAt?: string
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
