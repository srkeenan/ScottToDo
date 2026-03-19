# Build Your Own AI-Powered Todo Dashboard

## What You'll Build
A personal project dashboard where you can forward emails and AI automatically sorts them into todos, decisions, and notes across your projects. Includes dark mode, drag-and-drop reordering, due dates, recurring todos, priority flags, search, mobile layout, and a weekly history view.

## What You Need (all free tiers work)
1. A GitHub account
2. Node.js installed on your computer (https://nodejs.org)
3. Claude Code CLI installed (https://docs.anthropic.com/en/docs/claude-code)

## Step 1: Sign Up for Services (15 mins)

### Supabase (your database)
1. Go to https://supabase.com and sign up
2. Click "New Project" and give it a name
3. Set a database password (save this somewhere)
4. Once created, go to Settings > API
5. Copy your **Project URL** (looks like https://xxxxx.supabase.co)
6. Copy your **anon public key** (long string starting with "eyJ...")

### Vercel (your hosting)
1. Go to https://vercel.com and sign up with your GitHub account
2. That's it for now. We'll connect it later.

### Postmark (email ingestion)
1. Go to https://postmarkapp.com and sign up
2. Once in, go to Servers > your server > Inbound
3. Note the inbound email address (something like xxxxx@inbound.postmarkapp.com)
4. Set up email forwarding from your email provider to forward messages from your admin email to this Postmark inbound address

### Anthropic (AI)
1. Go to https://console.anthropic.com and sign up
2. Go to API Keys and create a new key
3. Copy the key (starts with "sk-ant-...")

## Step 2: Set Up the Project (5 mins)

### Clone the repo
```
git clone https://github.com/srkeenan/ScottToDo.git my-todo-app
cd my-todo-app
npm install
```

### Create your environment file
Create a file called `.env.local` in the project root with:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DASHBOARD_PASSWORD=pick_any_password_you_want
INGEST_TOKEN=pick_any_random_string_for_webhook_security
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Set up the database
Go to Supabase > SQL Editor and run this:

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
  role text,
  email text,
  phone text,
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

-- Enable Row Level Security
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

-- Add your first projects
INSERT INTO projects (name, status, sort_order) VALUES
  ('Work', 'active', 0),
  ('Side Project', 'active', 1),
  ('Personal', 'active', 2);
```

Feel free to change the project names to whatever you want.

### Test locally
```
npm run dev
```
Open http://localhost:3000 and log in with the DASHBOARD_PASSWORD you set.

## Step 3: Deploy to Vercel (2 mins)

1. Push your code to a new GitHub repo (do NOT commit .env.local)
```
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push
```
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. In the Environment Variables section, add all 5 variables from your .env.local
5. Click Deploy

## Step 4: Connect Postmark Webhook (2 mins)

1. In Postmark, go to Servers > your server > Inbound > Settings
2. Set the Inbound Webhook URL to:
```
https://YOUR-APP.vercel.app/api/ingest?token=YOUR_INGEST_TOKEN
```
(Replace with your actual Vercel URL and the INGEST_TOKEN you chose)

## Step 5: Set Up Email Forwarding

Set up automatic forwarding from your email to your Postmark inbound address. In Gmail:
1. Settings > Forwarding > Add a forwarding address
2. Enter your Postmark inbound address
3. Confirm the forwarding

Or you can manually forward individual emails whenever you want them processed.

## You're Done!

Forward an email to your admin address and it should appear on your dashboard within a few seconds. The AI will automatically categorize it and assign it to the right project.

## Features Included

- Drag-and-drop reordering for todos, decisions, meetings, and notes
- AI-powered email classification (forwards become todos/decisions/notes automatically)
- Optional due dates with overdue highlighting
- Priority flags (bold + exclamation mark)
- Recurring todos (daily, weekly, monthly)
- Dark mode toggle (persists in localStorage)
- Search/filter across all items
- Mobile-friendly layout with tab switching
- History view grouped by week (completed todos + archived decisions)
- "Completed this week" section on main dashboard
- Password-protected dashboard
- Collapsible project lanes
- Row Level Security on all database tables

## Customizing with Claude Code

Want to customize the look, add features, or change how the AI categorizes emails? Just open the project in Claude Code and ask it to make changes. Some ideas:
- Change the color scheme
- Add new project types
- Modify the AI classification rules
- Add Slack or SMS integration
- Add project progress summaries
