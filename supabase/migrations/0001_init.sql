-- Doll City - initial schema
--
-- Two tables for the MVP: `profiles` (one row per anonymous player) and
-- `game_saves` (the versioned JSONB save blob). Row Level Security ensures a
-- player can only ever read/write their own data, keyed off auth.uid() -
-- never a client-supplied user id.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row the moment a new (anonymous) auth user signs in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- game_saves
-- ---------------------------------------------------------------------------
create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  save_version integer not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active save per player (matches the client's local-first, single-save model).
create unique index if not exists game_saves_user_id_key on public.game_saves (user_id);
create index if not exists game_saves_updated_at_idx on public.game_saves (updated_at desc);

alter table public.game_saves enable row level security;

create policy "game_saves: select own" on public.game_saves
  for select using (auth.uid() = user_id);

create policy "game_saves: insert own" on public.game_saves
  for insert with check (auth.uid() = user_id);

create policy "game_saves: update own" on public.game_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "game_saves: delete own" on public.game_saves
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists game_saves_set_updated_at on public.game_saves;
create trigger game_saves_set_updated_at
  before update on public.game_saves
  for each row execute function public.set_updated_at();
