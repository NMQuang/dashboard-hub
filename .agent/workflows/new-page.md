# New Dashboard Page

Create a new page in the dashboard-hub.hq dashboard following project conventions.

## Steps

1. Ask the user: "What route do you want? (e.g. `/learn/vocabulary`, `/work/notes`)"

2. Map route to file path:
   - `/learn/vocabulary` → `app/learn/vocabulary/page.tsx`
   - Confirm the parent folder exists; create it if not.

3. Create the page file at the correct path using this template:
   ```tsx
   import type { Metadata } from 'next'
   import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

   export const metadata: Metadata = { title: '{Title}' }

   export default function {Name}Page() {
     return (
       <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>
         <div style={{ marginBottom: 24 }}>
           <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
             {breadcrumb}
           </div>
           <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
             {Title} <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>{subtitle}</span>
           </h1>
         </div>
         <Card>
           <CardHeader><CardTitle>{Title}</CardTitle></CardHeader>
           {/* TODO: add content */}
         </Card>
       </div>
     )
   }
   ```

4. Add a nav link to `lib/constants.ts` in the correct `NAV_ITEMS` group.

5. If the page is a top-level section, add it to the quick-nav grid in `app/page.tsx`.

6. If the page needs client interactivity:
   - Create `components/widgets/{Name}Client.tsx` with `'use client'`
   - Import and use it in the page

7. If the page needs new API data:
   - Create `app/api/{name}/route.ts`
   - Create `services/{name}.ts`
   - Add env var documentation to `app/settings/page.tsx`

8. Confirm the result by listing the files created.
