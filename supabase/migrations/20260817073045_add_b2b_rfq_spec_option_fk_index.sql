begin;

create index if not exists b2b_rfq_items_specification_option_product_idx
  on public.b2b_rfq_items (specification_option_id, product_id);

commit;
