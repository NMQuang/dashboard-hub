import { NextRequest } from 'next/server'
import { streamAI, SYSTEM_PROMPTS } from '@/services/ai'
import type { AIProvider, ChatMessage } from '@/types'

export async function POST(req: NextRequest) {
  const { messages, provider, context } = (await req.json()) as {
    messages: ChatMessage[]
    provider: AIProvider
    context?: string
  }

  const system = context ? SYSTEM_PROMPTS[context] : SYSTEM_PROMPTS.general

  try {
    const stream = await streamAI(provider, messages, system)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
