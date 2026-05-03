#!/usr/bin/env node
/**
 * Google Photos OAuth setup — use the in-app flow instead.
 *
 * Run your dev server first:
 *   npm run dev
 *
 * Then visit:
 *   http://localhost:3000/family/setup   (or :3001 if 3000 is taken)
 *
 * The setup page will walk you through:
 *   1. Adding the redirect URI to Google Cloud Console
 *   2. Enabling the Photos Library API
 *   3. Authorizing and saving the token automatically
 */

console.log('─────────────────────────────────────────────────────────')
console.log(' Google Photos OAuth Setup')
console.log('─────────────────────────────────────────────────────────')
console.log('')
console.log('Use the in-app setup page instead of this script.')
console.log('')
console.log('1. Start the dev server:  npm run dev')
console.log('')
console.log('2. Open in browser:')
console.log('     http://localhost:3000/family/setup')
console.log('   or if port 3000 is taken:')
console.log('     http://localhost:3001/family/setup')
console.log('')
console.log('The page will guide you through:')
console.log('  - Adding the callback URI to Google Cloud Console')
console.log('  - Enabling the Photos Library API')
console.log('  - Connecting your account (token saved automatically)')
console.log('')
