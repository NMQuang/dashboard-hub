'use client'

/**
 * JapaneseTabs.tsx
 * Client-side tab switcher for /learn/japanese.
 * Currently: BJT | Onsite Best Practices
 * Designed to allow future tabs (JLPT N2, Shadowing, etc.) without changes here.
 */
import { useState } from 'react'
import type { JapanesePhrase } from '@/types'
import BJTTracker from './BJTTracker'
import OnsitePhrases from './OnsitePhrases'
import './japanese-tabs.css'

/* ── Tab registry ──────────────────────────────────────────────────────────
 * Add a new entry here to introduce a new tab without touching render logic.
 */

type TabId = 'bjt' | 'onsite'

interface TabDef {
  id: TabId
  label: string
}

const TABS: TabDef[] = [
  { id: 'bjt',    label: '📘 BJT' },
  { id: 'onsite', label: '🏢 Onsite Best Practices' },
]

/* ── Props ── */

interface JapaneseTabsProps {
  initialPhrases: JapanesePhrase[]
  dbAvailable: boolean
}

/* ── Component ── */

export default function JapaneseTabs({ initialPhrases, dbAvailable }: JapaneseTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('bjt')

  return (
    <div>
      {/* Tab bar */}
      <div className="jp-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            className={`jp-tab${tab.id === activeTab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'bjt' && (
        <div className="jp-panel" role="tabpanel">
          <BJTTracker />
        </div>
      )}

      {activeTab === 'onsite' && (
        <div className="jp-panel" role="tabpanel">
          <OnsitePhrases
            initialPhrases={initialPhrases}
            dbAvailable={dbAvailable}
          />
        </div>
      )}
    </div>
  )
}
