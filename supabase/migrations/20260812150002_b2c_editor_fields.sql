-- B2C admin editor fields kept to the MVP surface.
--
-- Formal categories, certifications, featured ordering and other normalized
-- B2C expansion remain deferred. These two fields are required by the current
-- editor and are intentionally separate from the archived expansion draft.

begin;

alter table public.b2c_products
  add column currency text not null default 'TWD',
  add column short_description text;

alter table public.b2c_products
  add constraint b2c_products_currency_iso_code
    check (currency ~ '^[A-Z]{3}$');

update public.b2c_products
set short_description = left(description, 160)
where short_description is null;

alter table public.b2c_products
  alter column short_description set not null;

commit;
