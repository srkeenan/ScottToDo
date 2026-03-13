-- Run this in your Supabase SQL Editor (SQL Editor tab in dashboard)

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
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Decisions table
create table decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  archived boolean not null default false,
  decided_at timestamptz,
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
  created_at timestamptz not null default now()
);

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Seed default projects
insert into projects (name, status, sort_order) values
  ('Campgrounds', 'pending', 0),
  ('CMO / Storage Syndicator', 'pending', 1),
  ('Instructure', 'pending', 2),
  ('Personal / Networking', 'active', 3);
