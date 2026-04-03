export const NAV_ITEMS = [
  {
    group: 'Family',
    items: [
      { label: 'Home', href: '/family', icon: '🏠' },
      { label: 'Memories', href: '/family/memories', icon: '📸' },
      { label: 'Connect', href: '/family/connect', icon: '💬' },
      { label: 'Plan', href: '/family/plan', icon: '📅' },
      { label: 'Finance', href: '/family/finance', icon: '💴' },
      { label: 'Tasks', href: '/family/tasks', icon: '✅' },
    ],
  },
  {
    group: 'Learn',
    items: [
      { label: 'Japanese', href: '/learn/japanese', icon: '日', badge: 'N2' },
      { label: 'Mainframe', href: '/learn/mainframe', icon: '⬛' },
      { label: 'AI / Dev', href: '/learn/ai-dev', icon: '◈' },
    ],
  },
  {
    group: 'Work',
    items: [
      { label: 'Tools', href: '/work/tools', icon: '⚙' },
      { label: 'AI Hub', href: '/work/ai-hub', icon: '◎' },
      { label: 'Projects', href: '/work/projects', icon: '⌥' },
      { label: 'Accounts', href: '/work/accounts', icon: '👤' },
    ],
  },
  {
    group: 'Invest',
    items: [
      { label: 'Market', href: '/invest/market', icon: '◎' },
      { label: 'Alerts', href: '/invest/alerts', icon: '◉' },
      { label: 'Watchlist', href: '/invest/watchlist', icon: '☆' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: '⊙' },
    ],
  },
] as const

export const DEFAULT_WATCHLIST = ['XAU', 'BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'FET']

export const GITHUB_REPOS = [
  { name: 'web3', topic: 'Web3 / DApp', color: 'purple' },
  { name: 'ai', topic: 'AI / Agents', color: 'blue' },
  { name: 'aws', topic: 'AWS / Infrastructure', color: 'amber' },
  { name: 'claude', topic: 'Claude tools', color: 'teal' },
  { name: 'ibm', topic: 'IBM Mainframe / COBOL', color: 'gray' },
  { name: 'dify', topic: 'Dify workflows', color: 'orange' },
] as const

export const AI_PROVIDERS = [
  { id: 'claude', label: 'Claude', model: 'claude-sonnet-4-5', color: '#D4845A' },
  { id: 'openai', label: 'ChatGPT', model: 'gpt-4o', color: '#10a37f' },
  { id: 'gemini', label: 'Gemini', model: 'gemini-1.5-pro', color: '#4285F4' },
] as const

export const COBOL_KEYWORDS = [
  'IDENTIFICATION', 'ENVIRONMENT', 'DATA', 'PROCEDURE', 'DIVISION',
  'PROGRAM-ID', 'AUTHOR', 'WORKING-STORAGE', 'LINKAGE', 'FILE',
  'SECTION', 'PARAGRAPH', 'PERFORM', 'MOVE', 'COMPUTE', 'IF', 'ELSE',
  'END-IF', 'EVALUATE', 'WHEN', 'END-EVALUATE', 'CALL', 'EXIT', 'STOP RUN',
  'PIC', 'OCCURS', 'REDEFINES', 'COPY', '88', '01', '05', '10', '77',
  'READ', 'WRITE', 'OPEN', 'CLOSE', 'INPUT', 'OUTPUT', 'EXTEND',
] as const
