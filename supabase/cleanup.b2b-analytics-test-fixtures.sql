-- 元家 B2B Analytics 報表測試 fixture 的安全清理（選用）
-- 只處理本 fixture 的 session／RFQ 標記，不刪除其他測試或展示資料。

begin;

delete from public.analytics_events
where surface = 'b2b'
  and session_id like 'fixture-b2b-analytics-%';

delete from public.b2b_rfq_items item
using public.b2b_rfqs rfq
where item.rfq_id = rfq.id
  and rfq.total_note in (
    'fixture:b2b-analytics:rfq-1',
    'fixture:b2b-analytics:rfq-2'
  );

delete from public.b2b_rfqs
where total_note in (
  'fixture:b2b-analytics:rfq-1',
  'fixture:b2b-analytics:rfq-2'
);

commit;
