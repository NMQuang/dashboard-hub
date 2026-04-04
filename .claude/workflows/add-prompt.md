# Add Saved Prompt

Add a new saved prompt to the AI Hub prompt library.

## Steps

1. Ask: "What category is this prompt for? (COBOL, Japanese, Market, AWS, General)"

2. Ask: "What's the title and text of the prompt?"

3. Add to `data/prompts.ts`:
   ```ts
   {
     id: '{category}-{n}',         // e.g. 'cobol-4', 'jp-5'
     category: '{Category}',
     tag: '{short tag}',           // displayed as badge
     title: '{Short title}',
     text: '{Full prompt text}',
   }
   ```

4. If it's a Japanese prompt, also add a short version to `QUICK_PROMPTS` in
   `app/learn/japanese/page.tsx`.

5. If it's a COBOL prompt, also add to `QUICK_PROMPTS` in
   `app/learn/mainframe/page.tsx`.

6. Verify the prompt appears in `/work/ai-hub` saved prompts section.

7. Confirm: "Prompt '{title}' added to the {Category} library."
