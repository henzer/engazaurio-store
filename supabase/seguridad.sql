-- Engazaurio: cerrar el acceso público a la base de datos.
-- Antes: cualquiera con la clave pública (anon) podía leer y modificar todo.
-- Después: solo usuarios con sesión iniciada en el CRM. La tienda usa la clave
-- secreta (service_role) desde Cloudflare, que no pasa por estas reglas.
-- Pegar completo en Supabase > SQL Editor > Run.

drop policy if exists "Allow all on products"    on products;
drop policy if exists "Allow all on shippings"   on shippings;
drop policy if exists "Allow all on customers"   on customers;
drop policy if exists "Allow all on channels"    on channels;
drop policy if exists "Allow all on orders"      on orders;
drop policy if exists "Allow all on order_items" on order_items;
drop policy if exists "Allow all on expenses"    on expenses;

create policy "Solo usuarios del CRM" on products    for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on shippings   for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on customers   for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on channels    for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on orders      for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on order_items for all to authenticated using (true) with check (true);
create policy "Solo usuarios del CRM" on expenses    for all to authenticated using (true) with check (true);

-- Canal para los pedidos de la web (si no existe)
insert into channels (name)
select 'Tienda web' where not exists (select 1 from channels where name = 'Tienda web');

-- IMPORTANTE: en Supabase > Authentication > Sign In / Providers, desactiva
-- "Allow new users to sign up". Si no, cualquiera podría crearse una cuenta
-- y pasar como "usuario del CRM".
