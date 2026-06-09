drop policy if exists "Public can read property images rows" on property_images;

create policy "Public can read property images rows"
on property_images
for select
to anon
using (true);