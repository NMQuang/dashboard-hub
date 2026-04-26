'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DATA, MONTHS, PHASE_LABELS, PHASE_CLASSES, TAG_CONFIG, SRC_LABELS } from './data/wbs-data'
import { TIPS } from './data/tips-data'
import type { Task } from './data/wbs-data'
import './bjt-tracker.css'

/* ─────────────────────────────── helpers ──────────────────────────────── */

const sk = (k: string) => 'bjt2_' + k

function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function fmtTime(s: number): string {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

function localTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}g trước`
  return `${Math.floor(h / 24)}n trước`
}

function allTasks(): Task[] {
  const a: Task[] = []
  MONTHS.forEach(m => DATA[m].weeks.forEach(w => w.tasks.forEach(t => a.push(t))))
  return a
}

function monthTasks(m: string): Task[] {
  const a: Task[] = []
  DATA[m].weeks.forEach(w => w.tasks.forEach(t => a.push(t)))
  return a
}

/* ─────────────────────────────── types ────────────────────────────────── */

interface MockScore { label: string; score: number }

interface PhraseEntry {
  id: string
  taskId: string
  taskName: string
  tip: string
  savedAt: string   // ISO
}

/* ─────────────────────────── static data ──────────────────────────────── */

const POMO_WORK = 25 * 60
const POMO_REST = 5 * 60

const BITESIZE_URL =
  'https://www.youtube.com/watch?v=WZOu4FDuGoQ&list=PLQcOOIxIw8dIZFPPnHzSBoCFXVPqBhYjP'

/* ───────────────────────── SkillRadar SVG ──────────────────────────────── */

interface SkillRadarProps {
  listen: number
  read: number
  vocab: number
  gram: number
}

function SkillRadar({ listen, read, vocab, gram }: SkillRadarProps) {
  const CX = 100, CY = 84, R = 54

  function radarPt(angleDeg: number, valuePct: number): [number, number] {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    const dist = (valuePct / 100) * R
    return [CX + dist * Math.cos(rad), CY + dist * Math.sin(rad)]
  }

  const axes: Array<{ label: string; value: number; angle: number }> = [
    { label: '聴解', value: listen, angle: 0 },
    { label: '読解', value: read, angle: 90 },
    { label: '語彙', value: vocab, angle: 180 },
    { label: '文法', value: gram, angle: 270 },
  ]

  const dataD = axes
    .map(({ angle, value }, i) => {
      const [x, y] = radarPt(angle, value)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + 'Z'

  function gridPath(level: number): string {
    return axes
      .map(({ angle }, i) => {
        const [x, y] = radarPt(angle, level)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ') + 'Z'
  }

  const labelPos: Array<{ x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = [
    { x: CX,          y: CY - R - 12, anchor: 'middle' },
    { x: CX + R + 10, y: CY + 3,      anchor: 'start'  },
    { x: CX,          y: CY + R + 12, anchor: 'middle' },
    { x: CX - R - 10, y: CY + 3,      anchor: 'end'    },
  ]

  return (
    <svg width={200} height={168} viewBox="0 0 200 168" style={{ display: 'block' }}>
      {[25, 50, 75, 100].map(level => (
        <path key={level} d={gridPath(level)} fill="none"
          stroke="var(--border)" strokeWidth={level === 100 ? 0.8 : 0.4} />
      ))}
      {axes.map(({ angle }, i) => {
        const [x2, y2] = radarPt(angle, 100)
        return (
          <line key={i} x1={CX} y1={CY}
            x2={x2.toFixed(1)} y2={y2.toFixed(1)}
            stroke="var(--border)" strokeWidth={0.5} />
        )
      })}
      <path d={dataD} fill="rgba(124,58,237,0.15)" stroke="var(--purple)" strokeWidth={1.5} />
      {axes.map(({ angle, value }, i) => {
        const [x, y] = radarPt(angle, value)
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.5} fill="var(--purple)" />
      })}
      {axes.map(({ label, value }, i) => (
        <text key={i} x={labelPos[i].x} y={labelPos[i].y}
          textAnchor={labelPos[i].anchor} dominantBaseline="middle"
          fontSize={9} fill="var(--ink2)">
          {label} {value}%
        </text>
      ))}
    </svg>
  )
}

/* ─────────────────────────── main component ───────────────────────────── */

export default function BJTTracker() {
  /* ── core state ── */
  const [taskState, setTaskState]     = useState<Record<string, boolean>>({})
  const [notes, setNotes]             = useState<Record<string, string>>({})
  const [openWeeks, setOpenWeeks]     = useState<Record<string, boolean>>({})
  const [showTips, setShowTips]       = useState<Record<string, boolean>>({})
  const [mockScores, setMockScores]   = useState<MockScore[]>([])
  const [streakDays, setStreakDays]   = useState<Record<string, boolean>>({})
  const [curMonth, setCurMonth]       = useState('T5')

  /* ── new feature state ── */
  const [phraseBank, setPhraseBank]         = useState<PhraseEntry[]>([])
  const [showPhraseBank, setShowPhraseBank] = useState(false)
  const [pomoFocusTask, setPomoFocusTask]   = useState<string | null>(null)

  /* ── pomodoro state ── */
  const [pomoLeft, setPomoLeft]       = useState(POMO_WORK)
  const [pomoIsWork, setPomoIsWork]   = useState(true)
  const [pomoSession, setPomoSession] = useState(0)
  const [pomoRunning, setPomoRunning] = useState(false)
  const pomoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── reminder state ── */
  const [remindTime, setRemindTime]   = useState('09:00')
  const [remindTz, setRemindTz]       = useState('Asia/Tokyo')
  const [showReminder, setShowReminder] = useState(false)
  const [notifMsg, setNotifMsg]       = useState('')
  const [showNotif, setShowNotif]     = useState(false)
  const reminderRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── mock input ── */
  const [mockScoreInput, setMockScoreInput] = useState('')
  const [mockLabelInput, setMockLabelInput] = useState('Mock 1')

  /* ── load localStorage ── */
  useEffect(() => {
    try {
      const s  = localStorage.getItem(sk('state'));      if (s)  setTaskState(JSON.parse(s))
      const n  = localStorage.getItem(sk('notes'));      if (n)  setNotes(JSON.parse(n))
      const o  = localStorage.getItem(sk('openWeeks')); if (o)  setOpenWeeks(JSON.parse(o))
      const t  = localStorage.getItem(sk('showTips'));   if (t)  setShowTips(JSON.parse(t))
      const m  = localStorage.getItem(sk('mockScores')); if (m) setMockScores(JSON.parse(m))
      const d  = localStorage.getItem(sk('streakDays')); if (d) setStreakDays(JSON.parse(d))
      const cm = localStorage.getItem(sk('month'));      if (cm) setCurMonth(cm)
      const rt = localStorage.getItem(sk('remindTime')); if (rt) setRemindTime(rt)
      const rz = localStorage.getItem(sk('remindTz'));   if (rz) setRemindTz(rz)
      const pb = localStorage.getItem(sk('phraseBank')); if (pb) setPhraseBank(JSON.parse(pb))
    } catch { /* ignore */ }
  }, [])

  /* ── save localStorage ── */
  const save = useCallback(() => {
    try {
      localStorage.setItem(sk('state'),      JSON.stringify(taskState))
      localStorage.setItem(sk('notes'),      JSON.stringify(notes))
      localStorage.setItem(sk('openWeeks'),  JSON.stringify(openWeeks))
      localStorage.setItem(sk('showTips'),   JSON.stringify(showTips))
      localStorage.setItem(sk('mockScores'), JSON.stringify(mockScores))
      localStorage.setItem(sk('streakDays'), JSON.stringify(streakDays))
      localStorage.setItem(sk('month'),      curMonth)
      localStorage.setItem(sk('remindTime'), remindTime)
      localStorage.setItem(sk('remindTz'),   remindTz)
      localStorage.setItem(sk('phraseBank'), JSON.stringify(phraseBank))
    } catch { /* ignore */ }
  }, [taskState, notes, openWeeks, showTips, mockScores, streakDays,
      curMonth, remindTime, remindTz, phraseBank])

  useEffect(() => { save() }, [save])

  /* ── streak ── */
  function markTodayStudied() {
    setStreakDays(prev => ({ ...prev, [todayKey()]: true }))
  }

  function computeStreak(): { streak: number; best: number } {
    let cur = 0, best = 0
    const d = new Date()
    for (let i = 0; i < 90; i++) {
      const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (streakDays[k]) { cur++; best = Math.max(best, cur) }
      else { if (i > 0) cur = 0 }
      d.setDate(d.getDate() - 1)
    }
    const tk = new Date()
    const todK = `${tk.getFullYear()}-${tk.getMonth() + 1}-${tk.getDate()}`
    return { streak: streakDays[todK] ? cur : 0, best }
  }

  /* ── pomodoro ── */
  useEffect(() => {
    if (pomoRunning) {
      pomoRef.current = setInterval(() => {
        setPomoLeft(prev => {
          if (prev <= 1) {
            setPomoIsWork(wasWork => {
              if (wasWork) {
                setPomoSession(s => s + 1)
                showBanner(pomoIsWork ? 'Nghỉ 5 phút đi bạn ☕' : 'Hết giờ nghỉ! Bắt đầu học thôi 💪')
                setPomoLeft(POMO_REST)
                return false
              } else {
                showBanner('Hết giờ nghỉ! Bắt đầu học thôi 💪')
                setPomoLeft(POMO_WORK)
                return true
              }
            })
            return prev
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (pomoRef.current) clearInterval(pomoRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRunning])

  function pomoStart() {
    if (pomoRunning) { setPomoRunning(false) }
    else { setPomoRunning(true); markTodayStudied() }
  }

  function pomoReset() {
    setPomoRunning(false)
    setPomoLeft(POMO_WORK)
    setPomoIsWork(true)
    setPomoSession(0)
    setPomoFocusTask(null)
  }

  function toggleFocusTask(name: string) {
    setPomoFocusTask(prev => prev === name ? null : name)
  }

  /* ── reminder ── */
  useEffect(() => {
    reminderRef.current = setInterval(() => {
      try {
        const now = new Date()
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: remindTz, hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(now)
        const h  = parts.find(p => p.type === 'hour')?.value
        const mi = parts.find(p => p.type === 'minute')?.value
        const cur = (h ?? '00').padStart(2, '0') + ':' + (mi ?? '00').padStart(2, '0')
        if (cur === remindTime) {
          showBanner('Đến giờ học BJT rồi! 📚 がんばって！')
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('BJT Study Time!', { body: 'Đến giờ học rồi！がんばって！' })
          }
        }
      } catch { /* ignore */ }
    }, 60000)
    return () => { if (reminderRef.current) clearInterval(reminderRef.current) }
  }, [remindTime, remindTz])

  function showBanner(msg: string) {
    setNotifMsg(msg)
    setShowNotif(true)
    setTimeout(() => setShowNotif(false), 7000)
  }

  function saveReminder() {
    setShowReminder(false)
    showBanner('Đã lưu! Nhắc lúc ' + remindTime + ' (' + remindTz + ')')
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  /* ── task actions ── */
  function toggleTask(id: string) {
    setTaskState(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) markTodayStudied()
      return next
    })
  }
  function toggleWeek(id: string) { setOpenWeeks(prev => ({ ...prev, [id]: !prev[id] })) }
  function toggleTip(id: string)  { setShowTips(prev => ({ ...prev, [id]: !prev[id] })) }
  function saveNote(id: string, val: string) { setNotes(prev => ({ ...prev, [id]: val })) }
  function switchMonth(m: string) { setCurMonth(m) }

  /* ── phrase bank ── */
  function savePhrase(taskId: string, taskName: string) {
    const tip = TIPS[taskId]
    if (!tip) return
    if (phraseBank.some(e => e.taskId === taskId)) return
    const entry: PhraseEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      taskId,
      taskName,
      tip,
      savedAt: new Date().toISOString(),
    }
    setPhraseBank(prev => {
      const next: PhraseEntry[] = []
      for (const e of prev) next.push(e)
      next.push(entry)
      return next
    })
  }

  function removePhrase(id: string) {
    setPhraseBank(prev => {
      const next: PhraseEntry[] = []
      for (const e of prev) { if (e.id !== id) next.push(e) }
      return next
    })
  }

  /* ── mock scores ── */
  function addMockScore() {
    const s = parseInt(mockScoreInput)
    if (isNaN(s) || s < 0 || s > 800) return
    setMockScores(prev => {
      const filtered = prev.filter(x => x.label !== mockLabelInput)
      const next = [...filtered, { label: mockLabelInput, score: s }]
      next.sort((a, b) => {
        const n = (x: string) => parseInt(x.replace(/\D/g, ''))
        return n(a.label) - n(b.label)
      })
      return next
    })
    setMockScoreInput('')
  }

  function removeMockScore(label: string) {
    setMockScores(prev => prev.filter(x => x.label !== label))
  }

  /* ── reset ── */
  function resetAll() {
    if (!confirm('Reset toàn bộ tiến độ? Không thể hoàn tác.')) return
    setTaskState({})
    setNotes({})
    setOpenWeeks({})
    setMockScores([])
    setStreakDays({})
    setShowTips({})
    setPhraseBank([])
    setPomoFocusTask(null)
  }

  /* ── CSV export ── */
  function exportCSV() {
    const rows = [['Tháng','Tuần','Nhiệm vụ','Nguồn','Tags','Phút','Hoàn thành','Ghi chú']]
    MONTHS.forEach(m => DATA[m].weeks.forEach(w => w.tasks.forEach(t => {
      rows.push([m, w.label, t.name, t.src, t.tags.join('|'), String(t.min),
        taskState[t.id] ? 'Yes' : 'No', notes[t.id] || ''])
    })))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'bjt_progress.csv'
    a.click()
  }

  /* ── PDF export ── */
  function exportPDF() {
    const scores = mockScores.map(x => `${x.label}: ${x.score}điểm`).join(' | ') || 'Chưa có'
    const all    = allTasks()
    const done   = all.filter(t => taskState[t.id]).length
    const si     = computeStreak()
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BJT Progress</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1a1a18;max-width:700px;margin:0 auto}
    h1{font-size:20px;margin-bottom:4px}h2{font-size:15px;margin:16px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
    .meta{font-size:12px;color:#666;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f5f4f0;text-align:left;padding:5px 8px;border:1px solid #ddd}
    td{padding:4px 8px;border:1px solid #e0ddd5;vertical-align:top}
    .done{color:#16a34a}.nd{color:#9b9a95}
    @media print{button{display:none}}</style></head><body>
    <h1>BJT Study Progress Report</h1>
    <div class="meta">Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} · Tài liệu: Tango/Hyougen + Keigo/Bunshou + Bite Size JP + Sách BJT</div>
    <h2>Tổng quan</h2>
    <table><tr><th>Chỉ số</th><th>Giá trị</th></tr>
    <tr><td>Tổng tiến độ</td><td>${done}/${all.length} nhiệm vụ (${pct(done,all.length)}%)</td></tr>
    <tr><td>Streak</td><td>${si.streak} ngày · Kỷ lục: ${si.best} ngày</td></tr>
    <tr><td>Mock Test</td><td>${scores}</td></tr></table>
    <h2>Chi tiết tháng</h2>
    <table><tr><th>Tháng</th><th>Giai đoạn</th><th>Hoàn thành</th><th>%</th></tr>
    ${MONTHS.map(m => { const mt2=monthTasks(m); const md2=mt2.filter(t=>taskState[t.id]).length; return `<tr><td>${m}</td><td>${PHASE_LABELS[DATA[m].phase]}</td><td>${md2}/${mt2.length}</td><td>${pct(md2,mt2.length)}%</td></tr>` }).join('')}
    </table>
    <h2>Danh sách nhiệm vụ</h2>
    <table><tr><th>Tháng</th><th>Tuần</th><th>Nhiệm vụ</th><th>Nguồn</th><th>Trạng thái</th><th>Ghi chú</th></tr>
    ${MONTHS.map(m=>DATA[m].weeks.map(wk=>wk.tasks.map(t=>`<tr><td>${m}</td><td style="font-size:11px">${wk.label}</td><td>${t.name}</td><td>${t.src}</td><td class="${taskState[t.id]?'done':'nd'}">${taskState[t.id]?'✓':'—'}</td><td style="font-size:11px">${notes[t.id]||''}</td></tr>`).join('')).join('')).join('')}
    </table><br><button onclick="window.print()">In / Lưu PDF</button></body></html>`)
    w.document.close()
  }

  /* ─────────────────────────── computed ─────────────────────────────── */

  const { streak, best } = computeStreak()
  const all      = allTasks()
  const totalDone = all.filter(t => taskState[t.id]).length
  const mt        = monthTasks(curMonth)
  const monthDone = mt.filter(t => taskState[t.id]).length

  /* skill radar percentages for current month */
  function skillPct(tag: string): number {
    const tasks = mt.filter(t => t.tags.includes(tag))
    const done  = tasks.filter(t => taskState[t.id]).length
    return pct(done, tasks.length)
  }
  const listenPct = skillPct('listen')
  const readPct   = skillPct('read')
  const vocabPct  = skillPct('vocab')
  const gramPct   = skillPct('gram')

  /* week tasks for "this week" stat */
  const openWeekEntry = Object.entries(openWeeks).find(([, v]) => v)
  let weekTasks: Task[] = []
  if (openWeekEntry) {
    MONTHS.forEach(m => DATA[m].weeks.forEach(w => {
      if (w.id === openWeekEntry[0]) weekTasks = w.tasks
    }))
  } else {
    weekTasks = DATA[curMonth].weeks[0].tasks
  }
  const weekDone = weekTasks.filter(t => taskState[t.id]).length

  /* pomodoro progress */
  const pomoTotal = pomoIsWork ? POMO_WORK : POMO_REST
  const pomoPct   = Math.round(((pomoTotal - pomoLeft) / pomoTotal) * 100)

  /* streak calendar dots (14 days) */
  const calDots: Array<{ key: string; done: boolean; today: boolean }> = []
  const calDate = new Date()
  for (let i = 13; i >= 0; i--) {
    const dd = new Date(calDate)
    dd.setDate(calDate.getDate() - i)
    const k = `${dd.getFullYear()}-${dd.getMonth() + 1}-${dd.getDate()}`
    calDots.push({ key: k, done: !!streakDays[k], today: i === 0 })
  }

  /* mock score bar */
  const lastMockScore  = mockScores.length > 0 ? mockScores[mockScores.length - 1].score : 0
  const scoreBarWidth  = Math.min(100, Math.round((lastMockScore / 800) * 100))

  /* mock score sparkline path */
  const sparkPath = (() => {
    if (mockScores.length < 2) return ''
    const W = 260, H = 36
    return mockScores
      .map(({ score }, i) => {
        const x = (i / (mockScores.length - 1)) * W
        const y = H - (score / 800) * H
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  })()

  const md = DATA[curMonth]

  /* ─────────────────────────────── render ──────────────────────────────── */

  return (
    <div className="bjt-app">

      {/* ── Top bar ── */}
      <div className="bjt-topbar">
        <span className="bjt-title">BJT Tracker · T5–T12 / 2026</span>
        <div className="bjt-topbar-actions">
          <button className="bjt-btn bjt-btn-warn" onClick={() => setShowReminder(v => !v)}>⏰ Nhắc giờ</button>
          <button
            className={`bjt-btn${phraseBank.length > 0 ? ' bjt-btn-phrase' : ''}`}
            onClick={() => setShowPhraseBank(v => !v)}
          >
            📚{phraseBank.length > 0 ? ` (${phraseBank.length})` : ' Phrase Bank'}
          </button>
          <button className="bjt-btn" onClick={exportCSV}>↓ CSV</button>
          <button className="bjt-btn bjt-btn-primary" onClick={exportPDF}>↓ PDF</button>
          <button className="bjt-btn bjt-btn-danger" onClick={resetAll}>Reset</button>
        </div>
      </div>

      {/* ── Notification banner ── */}
      <div className={`bjt-notif${showNotif ? ' show' : ''}`}>
        <span>{notifMsg}</span>
        <button onClick={() => setShowNotif(false)}>✕</button>
      </div>

      {/* ── Reminder ── */}
      <div className={`bjt-reminder${showReminder ? ' show' : ''}`}>
        <div className="bjt-reminder-row">
          <label>Nhắc lúc:</label>
          <input type="time" value={remindTime} onChange={e => setRemindTime(e.target.value)} />
          <label>Múi giờ:</label>
          <select value={remindTz} onChange={e => setRemindTz(e.target.value)}>
            <option value="Asia/Tokyo">JST (Tokyo)</option>
            <option value="Asia/Ho_Chi_Minh">ICT (VN)</option>
          </select>
          <button className="bjt-btn bjt-btn-primary" onClick={saveReminder}>Lưu</button>
          <button className="bjt-btn" onClick={() => setShowReminder(false)}>Đóng</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 6 }}>
          Trình duyệt sẽ hiện thông báo + chuông. Hãy cho phép notification khi được hỏi.
        </div>
      </div>

      {/* ── Study Resources ── */}
      <div className="bjt-resources">
        <div className="bjt-resources-label">📚 Tài liệu</div>
        <div className="bjt-resources-links">
          <a href="https://knowt.com/folder/e909718b-5035-4e49-9925-814800d959a9" target="_blank" rel="noopener noreferrer" className="bjt-resource-link bjt-res-tango">
            <span className="bjt-res-icon">📖</span><span className="bjt-res-text">Tango &amp; Hyougen</span>
          </a>
          <a href="https://knowt.com/folder/63154100-831e-413a-b2d6-3235d9e44198" target="_blank" rel="noopener noreferrer" className="bjt-resource-link bjt-res-keigo">
            <span className="bjt-res-icon">🎌</span><span className="bjt-res-text">Keigo &amp; Bunshou</span>
          </a>
          <a href={BITESIZE_URL} target="_blank" rel="noopener noreferrer" className="bjt-resource-link bjt-res-bite">
            <span className="bjt-res-icon">🎧</span><span className="bjt-res-text">Bite Size JP</span>
          </a>
          <a href="https://www.amazon.co.jp/s?k=BJT%E3%83%93%E3%82%B8%E3%83%8D%E3%82%B9%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%83%BD%E5%8A%9B%E3%83%86%E3%82%B9%E3%83%88" target="_blank" rel="noopener noreferrer" className="bjt-resource-link bjt-res-bjt">
            <span className="bjt-res-icon">📕</span><span className="bjt-res-text">Sách BJT</span>
          </a>
        </div>
      </div>

      {/* ── Streak ── */}
      <div className="bjt-streak">
        <div className="bjt-streak-flame">🔥</div>
        <div className="bjt-streak-info">
          <div className="bjt-streak-num">{streak}</div>
          <div className="bjt-streak-label">ngày liên tiếp</div>
          <div className="bjt-streak-cal">
            {calDots.map(d => (
              <div key={d.key} className={`bjt-cal-dot${d.done ? ' done' : ''}${d.today ? ' today' : ''}`} />
            ))}
          </div>
        </div>
        <div className="bjt-streak-best">Kỷ lục: {best} ngày</div>
      </div>

      {/* ── Stats + Skill Radar (NEW layout) ── */}
      <div className="bjt-stats-row">
        <div className="bjt-stats">
          <div className="bjt-stat">
            <div className="bjt-stat-label">Hôm nay</div>
            <div className="bjt-stat-val">{weekDone}/{Math.min(3, weekTasks.length)}</div>
          </div>
          <div className="bjt-stat">
            <div className="bjt-stat-label">Tuần này</div>
            <div className="bjt-stat-val">{pct(weekDone, weekTasks.length)}%</div>
          </div>
          <div className="bjt-stat">
            <div className="bjt-stat-label">Tháng này</div>
            <div className="bjt-stat-val">{pct(monthDone, mt.length)}%</div>
          </div>
          <div className="bjt-stat">
            <div className="bjt-stat-label">Tổng</div>
            <div className="bjt-stat-val">{pct(totalDone, all.length)}%</div>
          </div>
        </div>
        <div className="bjt-radar-card">
          <div className="bjt-radar-title">Kỹ năng · {curMonth}</div>
          <SkillRadar listen={listenPct} read={readPct} vocab={vocabPct} gram={gramPct} />
        </div>
      </div>

      {/* ── Mock Test Scores ── */}
      <div className="bjt-mock">
        <div className="bjt-mock-hdr">
          <span className="bjt-mock-title">Điểm Mock Test</span>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Mục tiêu: 480–599 · Sách BJT chính thức</span>
        </div>
        <div className="bjt-mock-scores">
          {mockScores.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Chưa có — thêm sau khi làm mock test</span>
          ) : (
            mockScores.map(x => (
              <div key={x.label} className={`bjt-mock-chip${x.score >= 480 ? ' target' : ''}`} onClick={() => removeMockScore(x.label)}>
                <span>{x.label}</span>
                <span className="bjt-mock-chip-score">{x.score}</span>
              </div>
            ))
          )}
        </div>

        {/* Sparkline (NEW) — shown when ≥ 2 scores */}
        {mockScores.length >= 2 && (
          <div style={{ marginTop: 10 }}>
            <svg width="100%" viewBox="0 0 260 52" style={{ display: 'block', overflow: 'visible' }}>
              {/* target line 480 */}
              <line
                x1={0} y1={(1 - 480 / 800) * 36}
                x2={260} y2={(1 - 480 / 800) * 36}
                stroke="var(--green)" strokeWidth={0.75} strokeDasharray="4 3" opacity={0.7}
              />
              <text x={262} y={(1 - 480 / 800) * 36 + 1} fontSize={8} fill="var(--green)" dominantBaseline="middle">480</text>
              {/* score line */}
              <path d={sparkPath} fill="none" stroke="var(--purple)" strokeWidth={1.5} />
              {/* dots */}
              {mockScores.map(({ score, label }, i) => {
                const x = (i / (mockScores.length - 1)) * 260
                const y = 36 - (score / 800) * 36
                return (
                  <g key={label}>
                    <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill="var(--purple)" />
                    <text x={x.toFixed(1)} y={50} textAnchor="middle" fontSize={8} fill="var(--ink3)">
                      {label.replace('Mock ', 'M')}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}

        {/* bar (single score fallback) */}
        {mockScores.length < 2 && (
          <>
            <div className="bjt-score-bar-wrap">
              <div className="bjt-score-bar-fill" style={{ width: scoreBarWidth + '%' }} />
            </div>
            <div className="bjt-score-labels">
              <span>0</span><span>480 (J2)</span><span>599</span><span>800</span>
            </div>
          </>
        )}

        <div className="bjt-mock-add">
          <input
            type="number" placeholder="Điểm" min={0} max={800} style={{ width: 72 }}
            value={mockScoreInput} onChange={e => setMockScoreInput(e.target.value)}
          />
          <select value={mockLabelInput} onChange={e => setMockLabelInput(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`Mock ${i + 1}`}>Mock {i + 1}</option>
            ))}
          </select>
          <button className="bjt-btn bjt-btn-primary" onClick={addMockScore}>+ Thêm</button>
        </div>
      </div>

      {/* ── Pomodoro (with focus task, NEW) ── */}
      <div className="bjt-pomo">
        <div className="bjt-pomo-inner">
          <div>
            <div className={`bjt-pomo-clock ${pomoIsWork ? 'work' : 'rest'}`}>{fmtTime(pomoLeft)}</div>
            <div className="bjt-pomo-label">{pomoIsWork ? 'Học' : 'Nghỉ'} · Pomodoro {pomoSession + 1}</div>
            {pomoFocusTask !== null && (
              <div className="bjt-pomo-focus">🎯 {pomoFocusTask}</div>
            )}
            <div className="bjt-pomo-dots">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`bjt-pomo-dot${i < pomoSession ? ' done' : ''}`} />
              ))}
            </div>
          </div>
          <div className="bjt-pomo-btns">
            <button className="bjt-btn bjt-btn-primary" onClick={pomoStart}>
              {pomoRunning ? 'Dừng' : 'Bắt đầu'}
            </button>
            <button className="bjt-btn" onClick={pomoReset}>Reset</button>
          </div>
        </div>
        <div className="bjt-pomo-progress">
          <div className={`bjt-pomo-progress-fill${pomoIsWork ? '' : ' rest'}`} style={{ width: pomoPct + '%' }} />
        </div>
      </div>

      {/* ── Month tabs ── */}
      <div className="bjt-month-tabs">
        {MONTHS.map(m => (
          <button key={m} className={`bjt-mtab${m === curMonth ? ' active' : ''}`} onClick={() => switchMonth(m)}>
            {m}
          </button>
        ))}
      </div>

      {/* ── WBS content ── */}
      <div>
        <span className={`bjt-phase ${PHASE_CLASSES[md.phase]}`}>
          {PHASE_LABELS[md.phase]} · {md.label}
        </span>

        {md.weeks.map(w => {
          const wd   = w.tasks.filter(t => taskState[t.id]).length
          const wt   = w.tasks.length
          const wp   = pct(wd, wt)
          const isOpen = !!openWeeks[w.id]

          return (
            <div key={w.id} className="bjt-week">
              <div className="bjt-week-hdr" onClick={() => toggleWeek(w.id)}>
                <div className="bjt-week-hdr-left">
                  <span className={`bjt-chevron${isOpen ? ' open' : ''}`}>&#9654;</span>
                  <span className="bjt-week-label">{w.label}</span>
                  <span className="bjt-week-prog">{wd}/{wt}</span>
                </div>
                <div className="bjt-prog-bar-wrap">
                  <div className="bjt-prog-bar-fill" style={{ width: wp + '%' }} />
                </div>
              </div>

              {isOpen && (
                <div className="bjt-task-list">
                  {w.tasks.map(t => {
                    const done      = !!taskState[t.id]
                    const nv        = notes[t.id] || ''
                    const hasTip    = !!TIPS[t.id]
                    const tipOpen   = !!showTips[t.id]
                    const srcInfo   = SRC_LABELS[t.src]
                    const isFocused = pomoFocusTask === t.name
                    const isSaved   = phraseBank.some(e => e.taskId === t.id)

                    return (
                      <div key={t.id} className="bjt-task-row">
                        <div className={`bjt-task-check${done ? ' done' : ''}`} onClick={() => toggleTask(t.id)} />
                        <div className="bjt-task-info">
                          <div className={`bjt-task-name${done ? ' done' : ''}`}>{t.name}</div>
                          <div className="bjt-task-meta">
                            {t.tags.map(tag => {
                              const cfg = TAG_CONFIG[tag]
                              return cfg ? (
                                <span key={tag} className={`bjt-tag ${cfg.className}`}>{cfg.label}</span>
                              ) : null
                            })}
                            {srcInfo && (
                              <span className="bjt-src" style={{ background: srcInfo.bg, color: srcInfo.color, border: `1px solid ${srcInfo.border}` }}>
                                {srcInfo.text}
                              </span>
                            )}
                            {/* Quick link (NEW) */}
                            {t.src === 'bitesize' && (
                              <a href={BITESIZE_URL} target="_blank" rel="noopener noreferrer" className="bjt-quick-link">
                                ▶ Bite Size
                              </a>
                            )}
                            {hasTip && (
                              <span className="bjt-tips-toggle" onClick={() => toggleTip(t.id)}>💡 Tips</span>
                            )}
                            {/* Pomodoro focus button (NEW) */}
                            <button
                              className={`bjt-focus-btn${isFocused ? ' active' : ''}`}
                              onClick={() => toggleFocusTask(t.name)}
                            >
                              {isFocused ? '⏱ Đang focus' : '⏱'}
                            </button>
                          </div>

                          {hasTip && (
                            <div className={`bjt-tips-box${tipOpen ? ' show' : ''}`}>
                              {TIPS[t.id]}
                              {/* Phrase bank save (NEW) */}
                              {tipOpen && (
                                <button
                                  className={`bjt-tip-save${isSaved ? ' saved' : ''}`}
                                  onClick={() => !isSaved && savePhrase(t.id, t.name)}
                                  disabled={isSaved}
                                >
                                  {isSaved ? '✓ Đã lưu' : '💾 Lưu vào Phrase Bank'}
                                </button>
                              )}
                            </div>
                          )}

                          <input
                            className="bjt-note-input"
                            placeholder="Ghi chú..."
                            defaultValue={nv}
                            onBlur={e => saveNote(t.id, e.target.value)}
                          />
                        </div>
                        <div className="bjt-task-min">
                          {t.min > 0 ? t.min + 'ph' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Phrase Bank panel (NEW) ── */}
      {showPhraseBank && (
        <div className="bjt-phrase-bank">
          <div className="bjt-phrase-bank-hdr" onClick={() => setShowPhraseBank(false)}>
            <span className="bjt-phrase-bank-title">📚 Phrase Bank</span>
            {phraseBank.length > 0 && (
              <span className="bjt-phrase-bank-count">{phraseBank.length}</span>
            )}
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>← đóng</span>
          </div>
          <div className="bjt-phrase-entries">
            {phraseBank.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '8px 0' }}>
                Chưa có phrase nào — mở Tips của task và bấm 💾 để lưu
              </div>
            ) : (
              phraseBank.map(entry => (
                <div key={entry.id} className="bjt-phrase-entry">
                  <div className="bjt-phrase-entry-body">
                    <div className="bjt-phrase-entry-task">{entry.taskName}</div>
                    <div className="bjt-phrase-entry-tip">{entry.tip}</div>
                    <div className="bjt-phrase-entry-time">{localTimeAgo(entry.savedAt)}</div>
                  </div>
                  <button className="bjt-phrase-delete" onClick={() => removePhrase(entry.id)} aria-label="Xóa">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  )
}
