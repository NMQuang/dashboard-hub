---
name: add-account-link
description: >
  Add a new account or website link to the Accounts page under the Work category.
  Triggered when the user asks to "thêm account vào trang accounts", "add an account to work/accounts", "thêm link tài khoản", or similar.
---

# Skill: Add an Account to `/work/accounts`

## Context
The Accounts page is located at `app/work/accounts/page.tsx`.
It displays a list of important accounts and web platforms as a grid of Cards.
The data is driven by a static array `ACCOUNTS`.

## The `Account` object format
Each account link requires the following properties:
- `label`: The name of the platform (e.g., 'GitHub', 'AWS Console')
- `desc`: A short, descriptive subtitle (e.g., 'Source code repositories & CI/CD')
- `url`: The full URL to the platform (e.g., 'https://github.com/')
- `icon`: A single unicode character or emoji to represent the service (e.g., '🐙', '☁', '◈')
- `color`: A subtle HEX color code for the icon's background (e.g., '#f0f0ed', '#eef6ff')

```tsx
interface Account {
  label: string
  desc: string
  url: string
  icon: string
  color: string
}
```

## Steps to Execute

### 1. Gather Information
If the user provides a service name but no URL or details, either:
- Infer the default dashboard/console URL for that service and pick a sensible unicode icon/color.
- Or, if ambiguous, briefly ask the user for the specific URL.

### 2. Locate the Array
Use your file modifying tools to read `app/work/accounts/page.tsx`.
Find the `const ACCOUNTS: Account[] = [` array definition.

### 3. Insert the New Account
Add the newly formulated `Account` object block to the end of the `ACCOUNTS` array before the closing `]`.
Example of what to insert:
```tsx
  {
    label: 'Notion',
    desc: 'Workspace & Notes',
    url: 'https://notion.so/',
    icon: 'N',
    color: '#f5f4f2',
  },
```

### 4. Apply Changes
Use the `replace_file_content` tool to replace the end of the array with the new object included.
If asked to remove the "opens in new tab" label, remember that it might have been commented out or deleted previously, so verify the file structure first.

## Color Guide
Try to match the service's brand color lightly to ensure it looks nice with `var(--ink)` typography:
- Blueish tint: `#eef6ff` or `#f0f5fd`
- Greenish tint: `#eefcf5`
- Redish/Orange tint: `#fdf3f2`
- Yellowish/Amber tint: `#fffbf0`
- Grayscale/Light Gray: `#f0f0ed` or `#f5f4f2`
