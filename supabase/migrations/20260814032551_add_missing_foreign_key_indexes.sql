-- P2 performance follow-up for the remote MVP schema.
--
-- The Supabase performance advisor identified these three foreign keys without
-- a covering index. Keep this migration separate from the functional API and
-- security work so it can be reviewed and applied after the integration path.
--
-- This migration targets the normalized names from
-- 20260812150000_baseline_remote_schema.sql.

create index if not exists b2b_rfq_items_product_id_idx
  on public.b2b_rfq_items (product_id);

create index if not exists b2c_order_items_mock_order_id_idx
  on public.b2c_order_items (mock_order_id);

create index if not exists b2c_order_items_product_id_idx
  on public.b2c_order_items (product_id);
