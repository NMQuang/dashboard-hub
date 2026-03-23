'use client'

import { useState, useRef, useEffect } from 'react'
import { generateId } from '@/lib/utils'
import type { ChatMessage, AIProvider } from '@/types'
import { AI_PROVIDERS } from '@/lib/constants'

interface ChatBoxProps {
  context?: string
  defaultProvider?: AIProvider
  placeholder?: string
}

export default function ChatBox({
  context = 'general',
  defaultProvider = 'claude',
  placeholder = 'Type a message...',
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState<AIProvider>(defaultProvider)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return

    // Build the full next-state snapshot first to avoid stale closures
    const userMsg: ChatMessage = {
      id: generateId(), role: 'user', content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    const assistantId = generateId()
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '', provider,
      createdAt: new Date().toISOString(),
    }
    const nextMessages = [...messages, userMsg]

    setMessages([...nextMessages, assistantMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use the stable snapshot — no stale closure over old messages
        body: JSON.stringify({ messages: nextMessages, provider, context }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (raw === '[DONE]') break
          try {
            // Normalized format from /api/ai-chat: { text: "…" }
            const { text } = JSON.parse(raw) as { text?: string }
            if (text) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + text } : m
              ))
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `Error: ${String(e)}` } : m
      ))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
      {/* Provider picker */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {AI_PROVIDERS.map(p => (
          <button
            key={p.id}
            onClick={() => setProvider(p.id as AIProvider)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: '1px solid',
              borderColor: provider === p.id ? p.color : 'var(--border)',
              background: provider === p.id ? p.color + '18' : 'var(--surface)',
              color: provider === p.id ? p.color : 'var(--ink2)',
              fontWeight: provider === p.id ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink3)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--ink3)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Start a conversation…
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--ink)' : 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500, color: msg.role === 'user' ? '#fff' : 'var(--ink2)',
            }}>
              {msg.role === 'user' ? 'U' : (AI_PROVIDERS.find(p => p.id === msg.provider)?.label?.[0] ?? 'A')}
            </div>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: msg.role === 'user' ? 'var(--ink)' : 'var(--surface2)',
              color: msg.role === 'user' ? '#fff' : 'var(--ink)',
              fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.role === 'assistant' && loading && msg.content === '' && (
                <span style={{ opacity: 0.4 }}>●●●</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13.5,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--ink)', resize: 'none', outline: 'none', lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1, transition: 'opacity 0.15s',
          }}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
