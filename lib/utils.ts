import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number, currency = 'USD', decimals = 2): string {
  const symbols: Record<string, string> = { USD: '$', JPY: '¥', EUR: '€', VND: '₫' }
  const sym = symbols[currency] ?? currency + ' '
  if (value >= 1_000_000) return sym + (value / 1_000_000).toFixed(2) + 'M'
  if (value >= 1_000) return sym + value.toLocaleString('en-US', { maximumFractionDigits: decimals })
  return sym + value.toFixed(decimals)
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

export function greetingJapanese(): { jp: string; en: string } {
  const h = new Date().getHours()
  if (h < 11) return { jp: 'おはようございます', en: 'Good morning' }
  if (h < 18) return { jp: 'こんにちは', en: 'Good afternoon' }
  return { jp: 'こんばんは', en: 'Good evening' }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
