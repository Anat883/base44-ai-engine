-- Doll City - optional dev seed
--
-- The MVP client does NOT read from `content_items` (it uses the bundled
-- src/data catalog), so this seed is optional. It exists to demonstrate the
-- shape future content-pack rows would take, for local Supabase development
-- (`supabase db reset` runs this automatically).

insert into public.content_items (id, entity_type, data) values
  (
    'dog_01',
    'pet',
    '{"id":"dog_01","type":"pet","name":"Buddy","species":"dog","assetKey":"pet_dog","thumbnail":"pet_dog","tags":["dog","pet"],"category":"pet","primaryColor":"#E8B27C","canBeCarried":true}'::jsonb
  ),
  (
    'cat_01',
    'pet',
    '{"id":"cat_01","type":"pet","name":"Whiskers","species":"cat","assetKey":"pet_cat","thumbnail":"pet_cat","tags":["cat","pet"],"category":"pet","primaryColor":"#B98CFF","canBeCarried":true}'::jsonb
  ),
  (
    'fancy_dress_01',
    'outfit',
    '{"id":"fancy_dress_01","type":"outfit","name":"Sparkle Gala Dress","category":"formalDress","assetKey":"outfit_fancy_dress","thumbnail":"outfit_fancy_dress","tags":["formal","festive","fancy"],"primaryColor":"#FF8FD1","secondaryColor":"#B98CFF"}'::jsonb
  )
on conflict (id) do update set data = excluded.data, updated_at = now();
