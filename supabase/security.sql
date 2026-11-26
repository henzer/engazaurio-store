-- Engazaurio: close public access to the database.
-- Before: anyone with the public (anon) key could read and modify everything.
-- After: only users signed in to the CRM. The store uses the secret
-- (service_role) key from Cloudflare, which bypasses these policies.
-- Paste the whole file into Supabase > SQL Editor > Run.

drop policy if exists "Allow all on products"    on products;
drop policy if exists "Allow all on shippings"   on shippings;
drop policy if exists "Allow all on customers"   on customers;
drop policy if exists "Allow all on channels"    on channels;
drop policy if exists "Allow all on orders"      on orders;
drop policy if exists "Allow all on order_items" on order_items;
drop policy if exists "Allow all on expenses"    on expenses;

drop policy if exists "CRM users only" on products;
drop policy if exists "CRM users only" on shippings;
drop policy if exists "CRM users only" on customers;
drop policy if exists "CRM users only" on channels;
drop policy if exists "CRM users only" on orders;
drop policy if exists "CRM users only" on order_items;
drop policy if exists "CRM users only" on expenses;

create policy "CRM users only" on products    for all to authenticated using (true) with check (true);
create policy "CRM users only" on shippings   for all to authenticated using (true) with check (true);
create policy "CRM users only" on customers   for all to authenticated using (true) with check (true);
create policy "CRM users only" on channels    for all to authenticated using (true) with check (true);
create policy "CRM users only" on orders      for all to authenticated using (true) with check (true);
create policy "CRM users only" on order_items for all to authenticated using (true) with check (true);
create policy "CRM users only" on expenses    for all to authenticated using (true) with check (true);

-- Channel for web orders (if it does not exist). 'Tienda web' is a data value.
insert into channels (name)
select 'Tienda web' where not exists (select 1 from channels where name = 'Tienda web');

-- IMPORTANT: in Supabase > Authentication > Sign In / Providers, turn off
-- "Allow new users to sign up". Otherwise anyone could create an account
-- and pass as a "CRM user".
