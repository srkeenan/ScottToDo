# 🟢 AI-Powered Todo Dashboard

A personal project management dashboard that turns your emails into organized todos, decisions, and notes using AI. Forward an email and it automatically lands in the right project.

**Built in half a day with Claude Code. You can set yours up in 20 minutes.**

![Dashboard](https://img.shields.io/badge/status-live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-database-3ECF8E) ![Vercel](https://img.shields.io/badge/Vercel-hosted-black)

## Features

- **AI Email Ingestion** - Forward emails and AI sorts them into todos, decisions, or notes in the right project
- **Drag-and-Drop Reordering** - Reorder everything with drag and drop
- **Due Dates** - Optional due dates with overdue highlighting (red) and due-soon warnings (amber)
- **Priority Flags** - Bold items with a ! marker for high priority
- **Recurring Todos** - Set tasks to repeat daily, weekly, or monthly
- **Calendar View** - See all dated items on a timeline, with undated items in a side panel
- **Dark Mode** - Toggle between light and dark themes (persists across sessions)
- **Search** - Filter across all items instantly
- **Mobile Layout** - Responsive tab-based layout on small screens
- **History View** - Completed todos and archived decisions grouped by week
- **Color-Coded Workstreams** - Each project lane gets its own header color
- **Key Meetings** - Track meetings with dates, shown on the calendar
- **Email Filtering** - Only emails from your addresses create todos (prevents spam)
- **Password Protected** - Simple password auth for your dashboard
- **Row Level Security** - Database-level security on all tables

## Prerequisites

- **A custom domain** (e.g., yourname.com) - Required for Postmark email ingestion. You can't use a plain Gmail address as the admin email. Domains cost ~$10/year from Squarespace, Namecheap, etc.
- **Node.js** installed on your computer ([nodejs.org](https://nodejs.org))
- **Claude Code CLI** installed ([docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code))

## Tech Stack

| Service | Purpose | Cost |
|---------|---------|------|
| [Supabase](https://supabase.com) | PostgreSQL database | Free tier |
| [Vercel](https://vercel.com) | Hosting & deployment | Free tier |
| [Postmark](https://postmarkapp.com) | Inbound email processing | Free tier |
| [Anthropic](https://anthropic.com) | Claude AI for email classification | API credits (pay-per-use, ~$0.01/email) |

**Claude Code** (used for setup/customization) requires a [Claude Pro or Max subscription](https://claude.ai/pricing) ($20/mo+) or an Anthropic API key with credits. The free version of Claude does not include Claude Code.

## Quick Start (20 minutes)

### 1. Sign up for services

Create accounts on Supabase (free), Vercel (free), Postmark (free), and Anthropic (pay-per-use). Grab your API keys from each.

### 2. Clone and install

```bash
git clone https://github.com/srkeenan/ScottToDo.git my-todo-app
cd my-todo-app
npm install
```

### 3. Create `.env.local`

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DASHBOARD_PASSWORD=pick_any_password
INGEST_TOKEN=pick_any_random_string
ANTHROPIC_API_KEY=your_anthropic_api_key
OWNER_EMAILS=you@gmail.com,you@work.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Set up the database

Go to **Supabase > SQL Editor** and run:

```sql
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text DEFAULT 'active',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  text text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  due_date date,
  priority boolean DEFAULT false,
  recurring text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE decisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  text text NOT NULL,
  archived boolean DEFAULT false,
  decided_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  name text NOT NULL,
  meeting_date date,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  text text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON todos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON decisions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Add your projects (change these names!)
INSERT INTO projects (name, status, sort_order) VALUES
  ('Work', 'active', 0),
  ('Side Project', 'active', 1),
  ('Personal', 'active', 2);
```

### 5. Test locally

```bash
npm run dev
```

Open http://localhost:3000 and log in with your password.

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Add all 7 environment variables in the Vercel dashboard.

### 7. Connect Postmark

In Postmark, set the **Inbound Webhook URL** to:

```
https://YOUR-APP.vercel.app/api/ingest?token=YOUR_INGEST_TOKEN
```

### 8. Set up email forwarding

Forward your admin email to your Postmark inbound address (in Gmail: Settings > Forwarding).

## Customizing with Claude Code

Want to personalize everything? Open this project in [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and paste the prompt from [`CLAUDE_CODE_INSTRUCTIONS.md`](./CLAUDE_CODE_INSTRUCTIONS.md). It will walk you through:

- Renaming the dashboard
- Choosing your color scheme
- Setting up your project names
- Configuring dark/light mode default
- Customizing the watermark
- Setting up email filtering for your addresses

## Email Filtering Rules

- Only emails **from your addresses** (set in `OWNER_EMAILS`) are processed
- Emails sent/forwarded **directly to** your admin email are processed normally
- If admin email is **CC'd**, it only processes if you include `AI - [instruction]` in your message
- Emails from anyone else are automatically ignored

## License

MIT

---

*vibe-designed by Scott Keenan*
