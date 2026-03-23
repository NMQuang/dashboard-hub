import type { ChatMessage, AIProvider } from '@/types'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Encode a unified SSE event line */
function sseChunk(text: string) {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
}
const sseDone = new TextEncoder().encode('data: [DONE]\n\n')

/**
 * Wraps a raw provider ReadableStream into a normalized SSE stream.
 * Output format: `data: {"text":"…"}\n\n` … `data: [DONE]\n\n`
 */
function normalizeStream(
  rawStream: ReadableStream<Uint8Array>,
  extractText: (json: unknown) => string | null | undefined
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = rawStream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            const raw = line.slice(5).trim()
            if (raw === '[DONE]') continue
            try {
              const json = JSON.parse(raw)
              const text = extractText(json)
              if (text) controller.enqueue(sseChunk(text))
            } catch { /* skip malformed chunks */ }
          }
        }
        controller.enqueue(sseDone)
      } finally {
        controller.close()
      }
    },
  })
}

// ── Claude (Anthropic) ────────────────────────────────────────────────────
export async function streamClaude(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      stream: true,
      system: system ?? 'You are a helpful assistant.',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) throw new Error(`Claude error: ${res.status}`)
  return normalizeStream(
    res.body!,
    // Claude SSE: { type: "content_block_delta", delta: { type: "text_delta", text: "…" } }
    (json: unknown) => (json as { delta?: { text?: string } }).delta?.text
  )
}

// ── OpenAI ───────────────────────────────────────────────────────────────
export async function streamOpenAI(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: system ?? 'You are a helpful assistant.' },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  return normalizeStream(
    res.body!,
    // OpenAI SSE: { choices: [{ delta: { content: "…" } }] }
    (json: unknown) =>
      (json as { choices?: Array<{ delta?: { content?: string } }> })
        .choices?.[0]?.delta?.content
  )
}

// ── Gemini ────────────────────────────────────────────────────────────────
export async function streamGemini(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${apiKey}&alt=sse`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
    }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  return normalizeStream(
    res.body!,
    // Gemini SSE: { candidates: [{ content: { parts: [{ text: "…" }] } }] }
    (json: unknown) =>
      (
        json as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> }
          }>
        }
      ).candidates?.[0]?.content?.parts?.[0]?.text
  )
}

// ── Router ────────────────────────────────────────────────────────────────
export function streamAI(
  provider: AIProvider,
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  switch (provider) {
    case 'claude': return streamClaude(messages, system)
    case 'openai': return streamOpenAI(messages, system)
    case 'gemini': return streamGemini(messages, system)
  }
}

// ── System prompts ────────────────────────────────────────────────────────
export const SYSTEM_PROMPTS: Record<string, string> = {
  japanese: `You are a Japanese language tutor. The user is preparing for JLPT N2 and will work onsite in Japan.
- Respond in a mix of Japanese and English to help them learn
- Correct grammar gently, always explain why
- Use natural conversational Japanese appropriate for workplace settings
- Include furigana for kanji: write it as 日本語(にほんご)
- When asked to practice, roleplay realistic Japan workplace scenarios`,

  cobol: `You are an expert IBM Mainframe and COBOL developer.
- Help the user understand COBOL syntax, JCL, ISPF, DB2, and z/OS concepts
- When reading code, explain each division (IDENTIFICATION, ENVIRONMENT, DATA, PROCEDURE)
- Highlight common patterns: batch processing, file I/O, VSAM, copybooks
- Use enterprise mainframe terminology correctly
- Suggest modern best practices while respecting legacy constraints`,

  general: `You are a helpful personal assistant. Be concise, accurate, and practical.`,
}
