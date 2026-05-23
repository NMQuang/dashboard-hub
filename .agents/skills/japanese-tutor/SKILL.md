---
name: japanese-tutor
description: >
  Build or improve Japanese learning features: AI conversation, shadowing,
  JLPT practice, vocabulary drills, listening exercises. Triggered when the user
  asks about "Japanese page", "add listening feature", "JLPT N2 practice",
  "shadowing", "kanji", or any Japanese language learning UI.
---

# Skill: Japanese Learning Features

## Context
The user is a Vietnamese engineer preparing for JLPT N2 and onsite work in Japan at IBM.
Target: business Japanese, workplace conversation, keigo (honorific language).
Current level: intermediate (N2 target). Primary focus: **listening** and **speaking**.

## Pages
- Main: `app/learn/japanese/page.tsx`
- ChatBox: uses `context: "japanese"` → loads COBOL-tutor system prompt from `services/ai.ts`

## System prompt (already in services/ai.ts)
Key points already configured:
- Responds in Japanese + English mix
- Corrects grammar gently with explanation
- Uses furigana format: `日本語(にほんご)`
- Roleplays IBM workplace scenarios on request

## Feature patterns

### Shadowing exercise component
```tsx
// components/widgets/ShadowingPlayer.tsx
'use client'
// 1. Show Japanese sentence + furigana
// 2. Play audio (NHK Web Easy URL or Google TTS)
// 3. Record user voice with MediaRecorder API
// 4. Send recording to AI for pronunciation feedback
```

### JLPT N2 quiz generator
```tsx
// Prompt to send to /api/ai-chat with context: "japanese"
const quizPrompt = `
JLPT N2レベルの問題を1問作成してください。
形式：
問題文：___
選択肢：A) B) C) D)
答え：X
解説：（日本語と英語で）
`
```

### Quick prompt buttons
Add to the `QUICK_PROMPTS` array in `app/learn/japanese/page.tsx`:
```ts
'IBMオフィスでの自己紹介練習',
'メールの敬語表現を教えて',
'今日のシャドーイング文を提案して',
'N2文法：〜ために / 〜ように の違い',
```

### Study tracker (localStorage)
```ts
// lib/hooks.ts → useStudyTracker
const [streak, setStreak] = useLocalStorage('jp-streak', 0)
const [lastStudied, setLastStudied] = useLocalStorage('jp-last', '')
// Update on each session start
```

### Useful Japanese patterns for IBM workplace
| Japanese | Reading | Usage |
|----------|---------|-------|
| よろしくお願いします | よろしくおねがいします | General polite request / sign-off |
| ご確認ください | ごかくにんください | "Please confirm/check" |
| 承知しました | しょうちしました | "Understood" (formal) |
| お疲れ様です | おつかれさまです | Greeting colleagues |
| 少々お待ちください | しょうしょうおまちください | "Please wait a moment" |
| ご質問はありますか | ごしつもんはありますか | "Do you have any questions?" |

## NHK Web Easy integration
```ts
// NHK Web Easy RSS for easy Japanese articles
const NHK_RSS = 'https://www3.nhk.or.jp/news/easy/k10013000811000/k10013000811000.html'
// Fetch article → send to AI with prompt:
// "このNHK記事を使ってN2レベルのシャドーイング練習を作ってください"
```

## Progress tracking structure
Update `app/learn/japanese/page.tsx` progress bars:
```ts
const skills = [
  { skill: 'Vocabulary', pct: 68, target: 'N2: 3,750 words' },
  { skill: 'Grammar',    pct: 55, target: 'N2: 168 patterns' },
  { skill: 'Reading',    pct: 50, target: 'N2: JLPT practice' },
  { skill: 'Listening',  pct: 40, target: 'NHK Easy daily' },
  { skill: 'Speaking',   pct: 30, target: 'AI conversation' },
]
```
