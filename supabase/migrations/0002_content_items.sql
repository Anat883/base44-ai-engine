-- Doll City - shared content catalog
--
-- Every future content type (buildings, recipes, gift definitions, new
-- outfits, ...) shares one generic table rather than a bespoke table per
-- entity kind, per the project's "don't over-normalize static content"
-- guidance. The MVP client still reads its seed content straight from
-- src/data (bundled, zero network round-trips) - this table exists so a
-- future creator/admin tool has somewhere durable to write new content
-- without shipping a client rebuild, and so the client can eventually layer
-- "extra content packs" on top of the bundled defaults.
--
-- `entity_type` mirrors the `EntityType` union in src/types/entities.ts and
-- `data` mirrors the matching entity shape.

create table if not exists public.content_items (
  id text primary key,
  entity_type text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_entity_type_idx on public.content_items (entity_type);

alter table public.content_items enable row level security;

-- Content is game-designed, not player-owned: everyone (including anonymous
-- players) may read it, but only privileged server-side calls (service role,
-- which bypasses RLS entirely) may write it - there is intentionally no
-- insert/update/delete policy for anon/authenticated roles here.
create policy "content_items: public read" on public.content_items
  for select using (true);

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();
