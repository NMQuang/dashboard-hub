/**
 * AI features for Family section:
 * 1. Caption generation (Claude Vision → tiếng Việt)
 * 2. Face label suggestion (Claude Vision → who is in this photo)
 * 3. Story/slideshow narrative generation
 */

import type { FamilyPhoto, PhotoStory, FaceLabel } from '@/types/family-types'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''

// ── 1. Generate Vietnamese caption for a photo ────────────────────────────
export async function generatePhotoCaption(
  imageUrl: string,
  context?: { tags?: string[]; location?: string; takenAt?: string }
): Promise<string> {
  const contextStr = [
    context?.location ? `Địa điểm: ${context.location}` : '',
    context?.takenAt  ? `Ngày: ${new Date(context.takenAt).toLocaleDateString('vi-VN')}` : '',
    context?.tags?.length ? `Tags: ${context.tags.join(', ')}` : '',
  ].filter(Boolean).join(' · ')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `Bạn là người viết caption ảnh gia đình ấm áp và chân thực.
${contextStr ? `Thông tin: ${contextStr}` : ''}

Viết 1-2 câu caption tiếng Việt ngắn gọn, tự nhiên, cảm xúc cho bức ảnh này.
Không dùng emoji. Không hoa mỹ quá. Viết như người trong gia đình đang chia sẻ kỷ niệm.
Chỉ trả lời caption, không có gì thêm.`,
          },
        ],
      }],
    }),
  })

  if (!res.ok) throw new Error(`Claude caption error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}

// ── 2. Detect faces and suggest who is in the photo ──────────────────────
export async function detectFacesInPhoto(
  imageUrl: string,
  knownPeople: string[] = ['bé', 'vợ', 'chồng']
): Promise<FaceLabel[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: `Nhìn vào ảnh và xác định xem có những người nào trong số này xuất hiện: ${knownPeople.join(', ')}.
Trả lời dưới dạng JSON array, ví dụ: [{"person":"bé","confidence":0.9},{"person":"vợ","confidence":0.7}]
Chỉ trả về JSON, không có gì thêm. Nếu không nhận ra ai, trả về [].`,
          },
        ],
      }],
    }),
  })

  if (!res.ok) return []
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() ?? '[]'
  try {
    return JSON.parse(text) as FaceLabel[]
  } catch {
    return []
  }
}

// ── 3. Generate story/slideshow narrative from a set of photos ────────────
export async function generatePhotoStory(
  photos: FamilyPhoto[],
  theme?: string
): Promise<{ title: string; description: string }> {
  // Build context from photos metadata
  const photoContext = photos.slice(0, 10).map((p, i) =>
    `Ảnh ${i + 1}: ${p.caption ?? 'chưa có caption'} (${p.takenAt.slice(0, 10)})${p.location ? ` — ${p.location}` : ''}`
  ).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Bạn đang tạo một câu chuyện ảnh gia đình ấm áp.
${theme ? `Chủ đề: ${theme}` : ''}
Số ảnh: ${photos.length}
${photoContext}

Hãy tạo:
1. Một tiêu đề ngắn (tối đa 8 chữ)
2. Một đoạn mô tả 2-3 câu, viết như đang kể câu chuyện về kỷ niệm này

Trả lời theo JSON: {"title":"...","description":"..."}
Chỉ JSON, không có gì thêm.`,
      }],
    }),
  })

  if (!res.ok) throw new Error(`Story generation error: ${res.status}`)
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() ?? '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { title: 'Kỷ niệm gia đình', description: 'Những khoảnh khắc đáng nhớ bên nhau.' }
  }
}

// ── 4. Translate Japanese check-in to Vietnamese ─────────────────────────
export async function translateCheckIn(textJa: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Dịch đoạn tiếng Nhật sau sang tiếng Việt tự nhiên, giữ nguyên cảm xúc. Chỉ trả lời bản dịch:\n\n${textJa}`,
      }],
    }),
  })

  if (!res.ok) return ''
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}
