-- Adds the Backlog bucket for todos. Run once in the Supabase SQL Editor.
alter table todos add column if not exists backlog boolean not null default false;
