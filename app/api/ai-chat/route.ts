import { NextRequest } from 'next/server'
import { streamAI, SYSTEM_PROMPTS } from '@/services/ai'
import type { AIProvider, ChatMessage } from '@/types'

const VALID_PROVIDERS: AIProvider[] = ['claude', 'openai', 'gemini']

function isProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && VALID_PROVIDERS.includes(value as AIProvider)
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(item => (
    item &&
    typeof item === 'object' &&
    typeof (item as ChatMessage).id === 'string' &&
    typeof (item as ChatMessage).role === 'string' &&
    typeof (item as ChatMessage).content === 'string' &&
    typeof (item as ChatMessage).createdAt === 'string'
  ))
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null)

  if (!payload || !isProvider(payload.provider) || !isChatMessageArray(payload.messages)) {
    return new Response(JSON.stringify({ error: 'Invalid chat payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, provider, context } = payload as {
    messages: ChatMessage[]
    provider: AIProvider
    context?: string
  }

  const system = context ? SYSTEM_PROMPTS[context] ?? SYSTEM_PROMPTS.general : SYSTEM_PROMPTS.general

  try {
    const stream = await streamAI(provider, messages, system)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
