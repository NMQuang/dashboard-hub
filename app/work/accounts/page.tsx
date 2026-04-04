'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

interface Account {
  label: string
  desc: string
  url: string
  icon: string
  color: string
  category: string
}

const ACCOUNTS: Account[] = [
  // AI
  {
    label: 'Dify',
    desc: 'AI Workflow & Agent Builder',
    url: 'https://cloud.dify.ai/',
    icon: '◉',
    color: '#eef6ff',
    category: 'AI',
  },
  {
    label: 'Anthropic / Claude',
    desc: 'Claude AI API & Console',
    url: 'https://console.anthropic.com/',
    icon: '◈',
    color: '#fdf3f2',
    category: 'AI',
  },
  {
    label: 'ChatGPT',
    desc: 'OpenAI Chat & API Console',
    url: 'https://chatgpt.com/',
    icon: '◯',
    color: '#eefcf5',
    category: 'AI',
  },
  {
    label: 'Gemini',
    desc: 'Google AI Studio & Chat',
    url: 'https://gemini.google.com/',
    icon: '✨',
    color: '#f0f5fd',
    category: 'AI',
  },
  // Code & Deploy
  {
    label: 'GitHub',
    desc: 'Source code repositories & CI/CD',
    url: 'https://github.com/',
    icon: 'octocat',
    color: '#f0f5fd',
    category: 'Code & Deploy',
  },
  {
    label: 'Vercel',
    desc: 'Deployment & Hosting for Dashboards',
    url: 'https://vercel.com/dashboard',
    icon: '▲',
    color: '#f0f0ed',
    category: 'Code & Deploy',
  },
  {
    label: 'AWS Console',
    desc: 'Cloud Infrastructure & Lambda',
    url: 'https://console.aws.amazon.com/',
    icon: '☁',
    color: '#fffbf0',
    category: 'Code & Deploy',
  },
  {
    label: 'Firebase',
    desc: 'Backend as a Service & Database',
    url: 'https://console.firebase.google.com/',
    icon: '🔥',
    color: '#fffbf0',
    category: 'Code & Deploy',
  },
  {
    label: 'Cloudflare',
    desc: 'DNS, CDN & Edge Network',
    url: 'https://dash.cloudflare.com/',
    icon: '⛅',
    color: '#fffbf0',
    category: 'Code & Deploy',
  },
  {
    label: 'Upstash',
    desc: 'Serverless Redis & Kafka',
    url: 'https://console.upstash.com/',
    icon: '⚡',
    color: '#eefcf5',
    category: 'Code & Deploy',
  },
  // Design
  {
    label: 'Figma',
    desc: 'Collaborative UI & UX Design',
    url: 'https://www.figma.com/',
    icon: '🎨',
    color: '#fdf3f2',
    category: 'Design',
  },
  // Slides
  {
    label: 'Gamma',
    desc: 'AI Presentations & Documents',
    url: 'https://gamma.app/',
    icon: 'γ',
    color: '#eefcf5',
    category: 'Slides',
  },
  // Learning
  {
    label: 'Corodomo',
    desc: 'Japanese Learning & Practice',
    url: 'https://corodomo.com/',
    icon: '🇯🇵',
    color: '#fdf3f2',
    category: 'Learning',
  },
  {
    label: 'Udemy',
    desc: 'Online learning and technical courses',
    url: 'https://www.udemy.com/',
    icon: 'ᴜ',
    color: '#fdf8ed',
    category: 'Learning',
  },
  // Work & Productivity
  {
    label: 'Backlog',
    desc: 'Project Management & Issue Tracking',
    url: 'https://quangnm-96.backlog.com/',
    icon: '📋',
    color: '#eef6ff',
    category: 'Work',
  },
  {
    label: 'Slack',
    desc: 'Team Communication & Channels',
    url: 'https://slack.com/',
    icon: '💬',
    color: '#f0f5fd',
    category: 'Work',
  },
  {
    label: 'Gmail',
    desc: 'Email & Google Workspace',
    url: 'https://mail.google.com/',
    icon: '✉',
    color: '#fdf3f2',
    category: 'Work',
  },
  {
    label: 'Trello',
    desc: 'Kanban Boards & Task Management',
    url: 'https://trello.com/',
    icon: '▦',
    color: '#eef6ff',
    category: 'Work',
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(ACCOUNTS.map(a => a.category)))]

export default function AccountsPage() {
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? ACCOUNTS : ACCOUNTS.filter(a => a.category === active)

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>work / accounts</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Accounts <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Important Links & Platforms</span>
        </h1>
      </div>

      {/* Category Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map(cat => {
          const isActive = active === cat
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                padding: '5px 14px',
                borderRadius: 20,
                border: isActive ? '1px solid var(--ink)' : '1px solid var(--border)',
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'var(--surface)' : 'var(--ink2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Account Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {filtered.map((acc) => (
          <Link
            key={acc.label}
            href={acc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: acc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  color: 'var(--ink)',
                }}>
                  {acc.icon === 'octocat' ? <span style={{ fontSize: 20 }}>🐙</span> : acc.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{acc.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{acc.category}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.5, flex: 1 }}>{acc.desc}</div>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink3)', wordBreak: 'break-all' }}>
                {acc.url.replace(/^https?:\/\//, '')}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
