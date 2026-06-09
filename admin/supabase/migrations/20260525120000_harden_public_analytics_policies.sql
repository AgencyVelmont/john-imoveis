drop policy if exists "Allow public read property_events" on property_events;

drop policy if exists "Public can read property images rows" on property_images;
create policy "Public can read property images rows"
on property_images
for select
to anon
using (
  exists (
    select 1
    from properties
    where properties.id = property_images.property_id
      and properties.status = 'publicado'
  )
);
