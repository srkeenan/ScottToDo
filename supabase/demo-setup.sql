-- ============================================
-- ScottToDo Demo: Schema + Seed Data
-- Run this in your demo Supabase project's SQL Editor
-- ============================================

-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'pending', 'passed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Todos table
create table todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  due_date date,
  priority boolean not null default false,
  recurring text,
  created_at timestamptz not null default now()
);

-- Decisions table
create table decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  archived boolean not null default false,
  decided_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Contacts table
create table contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  meeting_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (allow all for anon)
alter table projects enable row level security;
alter table todos enable row level security;
alter table decisions enable row level security;
alter table contacts enable row level security;
alter table notes enable row level security;

create policy "Allow all" on projects for all using (true) with check (true);
create policy "Allow all" on todos for all using (true) with check (true);
create policy "Allow all" on decisions for all using (true) with check (true);
create policy "Allow all" on contacts for all using (true) with check (true);
create policy "Allow all" on notes for all using (true) with check (true);

-- ============================================
-- Sample data for demo
-- ============================================

-- Projects
insert into projects (name, status, sort_order) values
  ('Werk', 'active', 0),
  ('$ide Hustle', 'active', 1),
  ('Home Reno', 'pending', 2),
  ('Vibing', 'active', 3);

-- Todos
insert into todos (project_id, text, sort_order, due_date, priority) values
  -- Werk
  ((select id from projects where name = 'Werk'), 'Prep slide deck for Monday all-hands (keep it under 40 slides this time)', 0, current_date + interval '3 days', true),
  ((select id from projects where name = 'Werk'), 'Reply to that email from 2 weeks ago before it becomes 3 weeks ago', 1, current_date + interval '1 day', true),
  ((select id from projects where name = 'Werk'), 'Schedule 1:1 with manager before review cycle', 2, current_date + interval '5 days', false),
  ((select id from projects where name = 'Werk'), 'Update project timeline (again)', 3, current_date + interval '7 days', false),
  ((select id from projects where name = 'Werk'), 'Figure out why the staging server is doing that weird thing', 4, current_date + interval '2 days', true),
  -- $ide Hustle
  ((select id from projects where name = '$ide Hustle'), 'Finish landing page before motivation expires', 0, current_date + interval '4 days', true),
  ((select id from projects where name = '$ide Hustle'), 'Set up Stripe so people can actually pay us', 1, current_date + interval '6 days', false),
  ((select id from projects where name = '$ide Hustle'), 'Write "About Us" page (make 2 people sound like a real company)', 2, current_date + interval '8 days', false),
  ((select id from projects where name = '$ide Hustle'), 'Post on Product Hunt and pretend to be calm about it', 3, current_date + interval '14 days', false),
  ((select id from projects where name = '$ide Hustle'), 'Fix that bug where the signup button does absolutely nothing', 4, current_date + interval '1 day', true),
  -- Home Reno
  ((select id from projects where name = 'Home Reno'), 'Pick paint color (only 47 shades of white to choose from)', 0, current_date + interval '5 days', false),
  ((select id from projects where name = 'Home Reno'), 'Get 3 contractor quotes and try not to faint', 1, current_date + interval '10 days', true),
  ((select id from projects where name = 'Home Reno'), 'Measure kitchen twice, order cabinets once', 2, current_date + interval '12 days', false),
  ((select id from projects where name = 'Home Reno'), 'Return the "easy install" tile that was not easy to install', 3, null, false),
  -- Vibing
  ((select id from projects where name = 'Vibing'), 'Let Scott know once you''ve successfully replicated the ToDo dashboard!', 0, null, true),
  ((select id from projects where name = 'Vibing'), 'Plan weekend trip that''s been "next month" for 6 months', 1, current_date + interval '7 days', false),
  ((select id from projects where name = 'Vibing'), 'Finally start that book everyone keeps recommending', 2, null, false),
  ((select id from projects where name = 'Vibing'), 'Touch grass (literally, go outside)', 3, current_date + interval '1 day', false),
  ((select id from projects where name = 'Vibing'), 'Update Spotify playlist — it''s been the same 30 songs since 2023', 4, null, false);

-- Decisions
insert into decisions (project_id, text, sort_order) values
  ((select id from projects where name = 'Werk'), 'Push back on deadline or just quietly work the weekend?', 0),
  ((select id from projects where name = 'Werk'), 'Ask for a raise now or wait until after the reorg?', 1),
  ((select id from projects where name = '$ide Hustle'), 'Freemium model or just charge from day one?', 0),
  ((select id from projects where name = '$ide Hustle'), 'Build the mobile app now or wait for traction?', 1),
  ((select id from projects where name = 'Home Reno'), 'Hardwood floors or luxury vinyl? (a.k.a. the great debate)', 0),
  ((select id from projects where name = 'Vibing'), 'Beach vacation or mountain cabin this summer?', 0);

-- Contacts
insert into contacts (project_id, name, role, email, phone, meeting_date, sort_order) values
  ((select id from projects where name = 'Werk'), 'Jordan Blake', 'Manager', 'jordan@example.com', '555-0101', current_date + interval '3 days', 0),
  ((select id from projects where name = 'Werk'), 'Taylor Swift (not that one)', 'PM Lead', 'taylor@example.com', '555-0102', current_date + interval '5 days', 1),
  ((select id from projects where name = '$ide Hustle'), 'Marcus Johnson', 'Co-founder / Chief Optimist', 'marcus@example.com', '555-0201', current_date + interval '2 days', 0),
  ((select id from projects where name = '$ide Hustle'), 'Priya Sharma', 'Freelance Designer', 'priya@example.com', null, current_date + interval '6 days', 1),
  ((select id from projects where name = 'Home Reno'), 'Dave''s Contracting', 'General Contractor', 'dave@example.com', '555-0301', current_date + interval '8 days', 0),
  ((select id from projects where name = 'Home Reno'), 'Lisa at Home Depot', 'Kitchen Specialist', 'lisa@example.com', '555-0302', null, 1),
  ((select id from projects where name = 'Vibing'), 'The Group Chat', 'Trip Planning Committee', null, null, null, 0);

-- Notes
insert into notes (project_id, text, sort_order) values
  ((select id from projects where name = 'Werk'), 'New VP starts next month — lay low and look busy', 0),
  ((select id from projects where name = 'Werk'), 'Free lunch Wednesdays are the only thing keeping morale alive', 1),
  ((select id from projects where name = '$ide Hustle'), 'Competitor just raised $2M. We have $200 in Venmo. Stay focused.', 0),
  ((select id from projects where name = '$ide Hustle'), 'The domain name we wanted costs $4,800. Going with plan B.', 1),
  ((select id from projects where name = 'Home Reno'), 'Load-bearing wall confirmed — open concept dream is dead', 0),
  ((select id from projects where name = 'Vibing'), 'This demo was built with Claude Code + Next.js + Supabase + Vercel. All free tier.', 0);
