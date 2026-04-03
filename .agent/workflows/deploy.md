# Deploy to Vercel

Full deployment workflow for dashboard-hub.hq dashboard.

## Steps

1. Run pre-deploy checks locally:
   ```bash
   npm run build
   npm run lint
   ```
   Fix any TypeScript or lint errors before continuing.

2. Ensure `.env.local` has all required keys. Check `app/settings/page.tsx`
   for the full list of required environment variables.

3. Commit all changes:
   ```bash
   git add -A
   git commit -m "chore: pre-deploy cleanup"
   git push origin main
   ```

4. If first deploy:
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
   Select: Link to existing project OR create new project named `my-dashboard`.

5. Add ALL environment variables in Vercel Dashboard:
   Go to: https://vercel.com → Project → Settings → Environment Variables
   Add each key from `.env.local.example` with the actual values.
   Set scope: Production + Preview + Development.

6. Trigger production deploy:
   ```bash
   vercel --prod
   ```
   Or: push to `main` branch if auto-deploy is configured.

7. Verify deployment:
   - Visit the Vercel URL
   - Check `/` (Home) loads correctly
   - Check `/api/prices` returns JSON
   - Check `/learn/japanese` chat works
   - Check `/invest/market` shows data (or placeholder if API key missing)

8. Set up custom domain (optional):
   Vercel Dashboard → Domains → Add `dashboard.yourdomain.com`

9. Confirm: "Deployed successfully to https://{app}.vercel.app"
