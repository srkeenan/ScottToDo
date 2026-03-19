# Instructions for Claude Code

Copy and paste the section below into Claude Code after cloning the repo and running `npm install`.

---

## Prompt to Give Claude Code

```
I just cloned a project management dashboard app. I need your help getting it set up for my own use. Walk me through each step one at a time.

STEP 1 - ASK ME THESE QUESTIONS FIRST (before doing anything else):
- What do you want to name your dashboard? (this replaces "ScottToDo" in the header)
- How many project/workstream panels do you want, and what should they be called? (e.g., "Work", "Side Project", "Personal")
- Do you prefer dark mode or light mode as the default?
- What background color do you want? Pick one:
  a) Forest green (default)
  b) Navy blue
  c) Charcoal/dark gray
  d) Custom (give me a hex code or describe it)
- Do you want to change the watermark text? (currently says "vibe-designed by Scott Keenan")
- What email addresses do you send from? (list all of them, e.g., your personal Gmail, work email, etc. — these are the only addresses that will be allowed to create todos via email)
- What will your admin/ingest email address be? (e.g., admin@yourdomain.com — this is the address you'll forward emails to)

STEP 2 - ENVIRONMENT:
I've already created accounts on Supabase, Vercel, Postmark, and Anthropic. Help me create a .env.local file with the right variable names. I'll fill in my own values. The variables needed are:
- SUPABASE_URL (my Supabase project URL)
- SUPABASE_ANON_KEY (my Supabase anon/public key)
- DASHBOARD_PASSWORD (any password I choose for logging into the dashboard)
- INGEST_TOKEN (any random string I choose to secure the Postmark webhook)
- ANTHROPIC_API_KEY (my Claude API key)
- OWNER_EMAILS (comma-separated list of my email addresses from Step 1)
- ADMIN_EMAIL (my admin/ingest email address from Step 1)

STEP 3 - DATABASE:
Give me the SQL to run in Supabase SQL Editor to create all the tables (projects, todos, decisions, contacts, notes) with ALL columns including:
- sort_order on all tables (for drag-and-drop)
- due_date, priority, recurring on todos
- completed_at on todos
- decided_at on decisions
- meeting_date on contacts
- RLS enabled with anon policies on all tables
Include INSERT statements for my projects using the names I gave you in Step 1.

STEP 4 - CUSTOMIZATION:
Based on my answers in Step 1, update the code:
- Change the app name in the header and page title (layout.tsx metadata)
- Change the background color in Dashboard.tsx (the bgColor variable and loading screen)
- Change the default dark mode state if I picked dark mode
- Update the watermark text if I wanted to change it

STEP 5 - TEST:
Help me run it locally with `npm run dev` and verify everything works.

STEP 6 - DEPLOY:
Help me deploy to Vercel using the CLI (`npx vercel --prod`) and make sure I add ALL env vars to the Vercel project, including OWNER_EMAILS and ADMIN_EMAIL.

STEP 7 - POSTMARK WEBHOOK:
After deploy, remind me to set the Postmark inbound webhook URL to:
https://MY-APP.vercel.app/api/ingest?token=MY_INGEST_TOKEN

Also explain the email filtering rules:
- Only emails FROM my owner addresses will be processed
- If I send or forward directly TO my admin email, it gets processed normally
- If I CC my admin email on a thread, it will ONLY process if I include "AI - [instruction]" somewhere in my message
- Emails from anyone else are automatically ignored
```
