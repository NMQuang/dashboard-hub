import type { ChatMessage, AIProvider } from '@/types'

const encoder = new TextEncoder()

function sseChunk(text: string) {
  return encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
}

const sseDone = encoder.encode('data: [DONE]\n\n')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function ensureApiKey(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

/**
 * Wrap a provider SSE stream into a normalized SSE stream for the client.
 * Output format: data: {"text":"..."}\n\n ... data: [DONE]\n\n
 */
function normalizeStream(
  rawStream: ReadableStream<Uint8Array>,
  extractText: (json: unknown) => string | null | undefined
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let buffer = ''

  const processLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return

    const raw = trimmed.slice(5).trim()
    if (!raw || raw === '[DONE]') return

    try {
      const json = JSON.parse(raw)
      const text = extractText(json)
      if (text) controller.enqueue(sseChunk(text))
    } catch {
      // Ignore malformed non-JSON chunks such as keep-alive events.
    }
  }

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
            processLine(line, controller)
          }
        }

        if (buffer) {
          processLine(buffer, controller)
        }

        controller.enqueue(sseDone)
      } finally {
        controller.close()
      }
    },
  })
}

export async function streamClaude(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = ensureApiKey('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
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

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`Claude error: ${res.status}${body ? ` - ${body}` : ''}`)
  }

  return normalizeStream(
    res.body,
    (json: unknown) => {
      if (!isRecord(json)) return null
      const delta = json.delta
      if (!isRecord(delta)) return null
      return typeof delta.text === 'string' ? delta.text : null
    }
  )
}

export async function streamOpenAI(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = ensureApiKey('OPENAI_API_KEY', process.env.OPENAI_API_KEY)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI error: ${res.status}${body ? ` - ${body}` : ''}`)
  }

  return normalizeStream(
    res.body,
    (json: unknown) => {
      if (!isRecord(json)) return null
      const choices = json.choices
      if (!Array.isArray(choices) || !choices.length || !isRecord(choices[0])) return null
      const delta = choices[0].delta
      if (!isRecord(delta)) return null
      return typeof delta.content === 'string' ? delta.content : null
    }
  )
}

export async function streamGemini(
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = ensureApiKey('GEMINI_API_KEY', process.env.GEMINI_API_KEY)
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

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini error: ${res.status}${body ? ` - ${body}` : ''}`)
  }

  return normalizeStream(
    res.body,
    (json: unknown) => {
      if (!isRecord(json)) return null
      const candidates = json.candidates
      if (!Array.isArray(candidates) || !candidates.length || !isRecord(candidates[0])) return null
      const content = candidates[0].content
      if (!isRecord(content)) return null
      const parts = content.parts
      if (!Array.isArray(parts) || !parts.length || !isRecord(parts[0])) return null
      return typeof parts[0].text === 'string' ? parts[0].text : null
    }
  )
}

export function streamAI(
  provider: AIProvider,
  messages: ChatMessage[],
  system?: string
): Promise<ReadableStream<Uint8Array>> {
  switch (provider) {
    case 'claude': return streamClaude(messages, system)
    case 'openai': return streamOpenAI(messages, system)
    case 'gemini': return streamGemini(messages, system)
    default: throw new Error(`Unsupported provider: ${String(provider)}`)
  }
}

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
