# Sync GitHub Docs

Pull documentation from the user's GitHub repos into the dashboard's Learn pages.

## Steps

1. Ask: "Which repo and which files do you want to sync?
   Options: ibm (COBOL/JCL docs), aws (infrastructure notes), claude (AI tools), ai (agents)"

2. Fetch the file listing from the target repo:
   Call `/api/github?action=contents&repo={repo}` to list all files.
   Filter for `.md` files.

3. For each markdown doc, create or update a static reference in `data/`:
   - `data/docs-ibm.ts` — IBM/COBOL docs
   - `data/docs-aws.ts` — AWS notes
   - `data/docs-claude.ts` — Claude/AI docs

   Format:
   ```ts
   export const IBM_DOCS = [
     { path: 'cobol-cheatsheet.md', title: 'COBOL Cheatsheet', repo: 'ibm' },
     { path: 'jcl-reference.md',    title: 'JCL Reference',    repo: 'ibm' },
   ]
   ```

4. Update the relevant Learn page to render the doc list:
   - `/learn/mainframe` → show IBM docs
   - `/learn/ai-dev`   → show Claude/AWS docs

5. Make each doc clickable: link to `/work/projects/{repo}?file={path}`
   which renders the raw markdown via `fetchFileContent()` in `services/github.ts`.

6. Add a "Last synced" timestamp shown in the page header using `lib/utils.ts → timeAgo()`.

7. Confirm: "Synced N docs from {repo} repo. They are now visible in /{page}."
