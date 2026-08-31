-- Add the B2C fields and relations required by the product-list and detail pages.

alter table public.b2c_products
  add column currency text not null default 'TWD',
  add column short_description text,
  add column is_featured boolean not null default false,
  add column featured_sort_order integer,
  add column published_at timestamptz,
  add column inventory_status text generated always as (
    case when mock_inventory > 0 then 'in_stock' else 'out_of_stock' end
  ) stored,
  add constraint b2c_products_currency_iso_code check (currency ~ '^[A-Z]{3}$'),
  add constraint b2c_products_featured_sort_order_nonnegative
    check (featured_sort_order is null or featured_sort_order >= 0);

update public.b2c_products
set short_description = left(description, 160),
    published_at = created_at
where short_description is null or published_at is null;

alter table public.b2c_products
  alter column short_description set not null,
  alter column published_at set default now();

create table public.b2c_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2c_categories_slug_not_blank check (length(trim(slug)) > 0),
  constraint b2c_categories_name_not_blank check (length(trim(name)) > 0)
);

create table public.b2c_product_categories (
  product_id uuid not null references public.b2c_products (id) on delete cascade,
  category_id uuid not null references public.b2c_categories (id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create unique index b2c_product_categories_one_primary_per_product_idx
  on public.b2c_product_categories (product_id)
  where is_primary = true;
create index b2c_product_categories_category_id_idx
  on public.b2c_product_categories (category_id, sort_order, product_id);

create table public.b2c_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.b2c_products (id) on delete cascade,
  storage_path text not null,
  image_role text not null default 'detail' check (image_role in ('cover', 'detail')),
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2c_product_images_storage_path_not_blank check (length(trim(storage_path)) > 0)
);

create unique index b2c_product_images_one_cover_per_product_idx
  on public.b2c_product_images (product_id)
  where image_role = 'cover';
create index b2c_product_images_product_sort_idx
  on public.b2c_product_images (product_id, sort_order, id);

create table public.b2c_certifications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  issuer text,
  description text,
  certificate_image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2c_certifications_slug_not_blank check (length(trim(slug)) > 0),
  constraint b2c_certifications_name_not_blank check (length(trim(name)) > 0)
);

create table public.b2c_product_certifications (
  product_id uuid not null references public.b2c_products (id) on delete cascade,
  certification_id uuid not null references public.b2c_certifications (id) on delete cascade,
  certificate_number text,
  valid_from date,
  valid_until date,
  note text,
  created_at timestamptz not null default now(),
  primary key (product_id, certification_id),
  constraint b2c_product_certifications_valid_period
    check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create index b2c_product_certifications_certification_id_idx
  on public.b2c_product_certifications (certification_id, product_id);
create index b2c_products_listing_idx
  on public.b2c_products (is_active, published_at desc, created_at desc);
create index b2c_products_featured_idx
  on public.b2c_products (featured_sort_order, published_at desc)
  where is_active = true and is_featured = true;

create trigger b2c_categories_set_updated_at
before update on public.b2c_categories
for each row execute function public.set_updated_at();

create trigger b2c_product_images_set_updated_at
before update on public.b2c_product_images
for each row execute function public.set_updated_at();

create trigger b2c_certifications_set_updated_at
before update on public.b2c_certifications
for each row execute function public.set_updated_at();

alter table public.b2c_categories enable row level security;
alter table public.b2c_product_categories enable row level security;
alter table public.b2c_product_images enable row level security;
alter table public.b2c_certifications enable row level security;
alter table public.b2c_product_certifications enable row level security;

grant select on table public.b2c_categories to anon, authenticated;
grant select on table public.b2c_product_categories to anon, authenticated;
grant select on table public.b2c_product_images to anon, authenticated;
grant select on table public.b2c_certifications to anon, authenticated;
grant select on table public.b2c_product_certifications to anon, authenticated;

grant all on table public.b2c_categories to service_role;
grant all on table public.b2c_product_categories to service_role;
grant all on table public.b2c_product_images to service_role;
grant all on table public.b2c_certifications to service_role;
grant all on table public.b2c_product_certifications to service_role;

create policy "public can read active b2c categories"
on public.b2c_categories for select to anon, authenticated
using (is_active = true);

create policy "public can read active b2c product categories"
on public.b2c_product_categories for select to anon, authenticated
using (
  exists (
    select 1
    from public.b2c_products product
    join public.b2c_categories category on category.id = b2c_product_categories.category_id
    where product.id = b2c_product_categories.product_id
      and product.is_active = true
      and category.is_active = true
  )
);

create policy "public can read active b2c product images"
on public.b2c_product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.b2c_products product
    where product.id = b2c_product_images.product_id
      and product.is_active = true
  )
);

create policy "public can read active b2c certifications"
on public.b2c_certifications for select to anon, authenticated
using (is_active = true);

create policy "public can read active b2c product certifications"
on public.b2c_product_certifications for select to anon, authenticated
using (
  exists (
    select 1
    from public.b2c_products product
    join public.b2c_certifications certification
      on certification.id = b2c_product_certifications.certification_id
    where product.id = b2c_product_certifications.product_id
      and product.is_active = true
      and certification.is_active = true
  )
);

insert into public.b2c_categories (slug, name, sort_order)
values
  ('shrimp-and-crab', '蝦蟹類', 10),
  ('fish', '魚類', 20),
  ('shellfish', '貝類', 30),
  ('cephalopods', '軟體類', 40),
  ('meat', '肉類', 50),
  ('prepared-food', '調理食品', 60)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.b2c_product_categories (product_id, category_id, is_primary)
select product.id, category.id, true
from public.b2c_products product
join public.b2c_product_tags product_tag on product_tag.product_id = product.id
join public.b2c_tags tag on tag.id = product_tag.tag_id
join public.b2c_categories category on category.slug = case tag.slug
  when 'fish' then 'fish'
  when 'shrimp' then 'shrimp-and-crab'
  when 'shellfish' then 'shellfish'
end
where tag.slug in ('fish', 'shrimp', 'shellfish')
on conflict (product_id, category_id) do update
set is_primary = excluded.is_primary;

insert into public.b2c_product_categories (product_id, category_id, is_primary)
select product.id, category.id, false
from public.b2c_products product
join public.b2c_product_tags product_tag on product_tag.product_id = product.id
join public.b2c_tags tag on tag.id = product_tag.tag_id and tag.slug = 'seasoned'
join public.b2c_categories category on category.slug = 'prepared-food'
on conflict (product_id, category_id) do nothing;

insert into public.b2c_product_images (
  product_id, storage_path, image_role, alt_text, sort_order
)
select id, image_path, 'cover', name, 0
from public.b2c_products
where image_path is not null and length(trim(image_path)) > 0
on conflict do nothing;

comment on column public.b2c_products.category is
  'Legacy single-category field retained temporarily; use b2c_product_categories for new reads.';
comment on column public.b2c_products.image_path is
  'Legacy cover-image field retained temporarily; use b2c_product_images for new reads.';
