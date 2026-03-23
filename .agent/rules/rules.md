# nexus.hq — Agent Rules

## Project overview
Personal dashboard: Japanese learning · IBM Mainframe/COBOL · Market prices · AI Hub · GitHub projects.
Stack: Next.js 14 App Router · TypeScript strict · Tailwind CSS · Vercel deploy.

## Code conventions

### TypeScript
- Strict mode always. No `any`, no `// @ts-ignore`.
- All props and return types must be explicitly typed.
- Use `satisfies` operator for type-narrowing without widening.
- Interfaces go in `types/index.ts`. Do NOT create local type files.

### Next.js App Router
- Server Components by default. Add `'use client'` only when using hooks, browser APIs, or event handlers.
- Data fetching in Server Components using `fetch()` with `next: { revalidate: N }`.
- Client-side data fetching uses SWR or hooks in `lib/hooks.ts`.
- API routes live in `app/api/*/route.ts`. Use `NextRequest` / `NextResponse`.
- Dynamic routes use `[param]` folder naming. Params typed as `{ params: { param: string } }`.

### Styling
- Tailwind utility classes for layout and spacing.
- CSS custom properties (`var(--ink)`, `var(--surface)`, etc.) for colors — defined in `globals.css`.
- Do NOT hardcode hex colors in components. Always use CSS variables.
- No inline `style={{ color: '#333' }}` — use CSS variables.
- Component-level styles via inline `style={{}}` only for dynamic values (e.g. widths from JS).

### File structure
```
app/                  → Pages and API routes only
components/layout/    → Sidebar, Header (shared layout)
components/ui/        → Reusable primitives (Card, ChatBox, etc.)
components/widgets/   → Page-specific client components
lib/                  → utils.ts, constants.ts, hooks.ts
services/             → Server-side fetch functions (market, github, ai, dify)
types/index.ts        → All TypeScript interfaces
data/                 → Static data files (prompts, cheatsheets)
```

### Naming
- Files: `kebab-case.tsx` (components), `camelCase.ts` (utils/services)
- Components: PascalCase, named exports (except page.tsx which uses default export)
- Hooks: `use` prefix, e.g. `useMarket`, `useClock`
- API route handlers: named `GET`, `POST`, etc.

## Forbidden actions
- ❌ Do NOT `npm install` new packages without asking first
- ❌ Do NOT modify `globals.css` color variables without asking
- ❌ Do NOT commit `.env.local` or any file containing API keys
- ❌ Do NOT use `console.log` in production code — use `console.error` for errors only
- ❌ Do NOT create `pages/` directory — this project uses App Router only
- ❌ Do NOT use `getServerSideProps` or `getStaticProps` — use Server Components
- ❌ Do NOT add `'use client'` to files in `services/` or `lib/`

## API key handling
- All API keys are server-only: `ANTHROPIC_API_KEY`, `GOLD_API_KEY`, etc.
- Keys prefixed `NEXT_PUBLIC_` are safe to expose to the client.
- Never read `process.env.SECRET_KEY` inside a Client Component.
- Services in `services/*.ts` are server-only — never import them in Client Components.

## Error handling
- API routes must return `NextResponse.json({ error: string }, { status: N })` on failure.
- Service functions throw descriptive errors: `throw new Error(\`GitHub API error: \${res.status}\`)`
- Client components catch fetch errors and show inline error states, never crash.

## Performance
- Images: use `next/image` with explicit `width` and `height`.
- Fonts: loaded via Google Fonts in `globals.css`, not imported per-component.
- `revalidate` values: prices=60s, github=300s, weather=1800s, static=3600s.
- Prefer Server Components for data-heavy pages to avoid client bundle bloat.

## Git
- Commit messages: `type(scope): short description` — e.g. `feat(market): add recharts price chart`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`
- Never commit directly to `main` — use feature branches
