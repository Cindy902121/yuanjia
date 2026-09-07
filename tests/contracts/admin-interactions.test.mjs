import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
// Execute real TypeScript modules; only external service boundaries are substituted.
function load(relative, mocks = {}, cache = new Map()) {
  const path = resolve(root, relative);
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} }; cache.set(path, module);
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    const base = id.startsWith('@/') ? resolve(root, 'src', id.slice(2)) : id.startsWith('.') ? resolve(dirname(path), id) : null;
    if (!base) return require(id);
    const candidate = existsSync(base + '.ts') ? base + '.ts' : base;
    return load(candidate, mocks, cache);
  };
  new Function('exports', 'require', 'module', source)(module.exports, localRequire, module);
  return module.exports;
}
const dates = load('src/lib/admin-dates.ts');
const views = load('src/lib/admin-view.ts');
const analytics = load('src/lib/analytics/report.ts');
const now = new Date('2026-09-06T04:00:00Z');
const period = (from, to) => analytics.parseAnalyticsFilters(new URLSearchParams({date_from: from, date_to: to}), now);

test('default dates use seven complete Taipei days and the UTC half-open boundaries', () => {
  const { query } = analytics.parseAnalyticsFilters(new URLSearchParams(), now);
  assert.equal(query.dateFromValue, '2026-08-30'); assert.equal(query.dateToValue, '2026-09-05');
  assert.equal(query.dateFrom, '2026-08-29T16:00:00.000Z'); assert.equal(query.dateTo, '2026-09-05T16:00:00.000Z');
  assert.equal(query.previousDateFromValue, '2026-08-23'); assert.equal(query.previousDateToValue, '2026-08-29');
  assert.equal(dates.taipeiDay(new Date('2026-09-05T16:00:00Z')), '2026-09-06');
  const explicit = new URLSearchParams({date_from: query.dateFromValue, date_to: query.dateToValue});
  assert.equal(dates.resolvePeriod(explicit, new Date('2026-09-07T04:00:00Z')).to, '2026-09-05');
});
test('UI and API both reject impossible, reversed, missing, future and duplicate dates', () => {
  for (const search of ['date_from=2026-02-30&date_to=2026-03-01', 'date_from=2026-09-05', 'date_from=2026-09-06&date_to=2026-09-05', 'date_from=2026-09-07&date_to=2026-09-07', 'date_from=2026-09-01&date_from=2026-09-02&date_to=2026-09-05']) {
    assert.ok(dates.resolvePeriod(new URLSearchParams(search), now).error, search);
    assert.ok(analytics.parseAnalyticsFilters(new URLSearchParams(search), now).error, search);
  }
  assert.ok(period('2026-09-06','2026-09-06').query);
});
test('24 calendar months accept exact limit, reject one day earlier and clamp leap days', () => {
  assert.ok(period('2024-09-05','2026-09-05').query); assert.ok(period('2024-09-04','2026-09-05').error);
  assert.equal(dates.earliestDay('2024-02-29'), '2022-02-28');
  assert.ok(period('2022-02-28','2024-02-29').query); assert.ok(period('2022-02-27','2024-02-29').error);
});
test('90/91/365/366 days select correct grain and edge buckets show actual coverage', () => {
  for (const [days, grain] of [[90,'day'],[91,'week'],[365,'week'],[366,'month']]) assert.equal(period(dates.shiftDay('2026-09-05',1-days),'2026-09-05').query.grain, grain);
  assert.deepEqual(dates.bucketRange('2026-08-24','week','2026-08-30','2026-09-05'), {from:'2026-08-30',to:'2026-08-30',partial:true});
  assert.deepEqual(dates.bucketRange('2026-09-01','month','2026-08-30','2026-09-05'), {from:'2026-09-01',to:'2026-09-05',partial:true});
});
test('navigation defaults, role constraints and invalid single values normalize deterministically', () => {
  assert.equal(views.normalizeAdminView('', 'admin').activeTab, 'overview');
  assert.equal(views.normalizeAdminView('', 'business').activeTab, 'b2b-products');
  const result = views.normalizeAdminView('tab=analytics&rfq_status=new&rfq_status=closed&rfq_page=abc', 'business');
  assert.equal(result.activeTab, 'b2b-products'); assert.equal(result.params.getAll('rfq_status').length,1); assert.equal(result.params.get('rfq_page'),'1'); assert.ok(result.corrected);
  assert.equal(views.normalizeAdminView(result.params.toString(),'business').corrected,false);
});
test('API pagination rejects ambiguous and unbounded input instead of expanding queries', () => {
  for (const value of ['page=0','page=-1','page=1.2','page=100001','page_size=501','status=new&status=closed','page=1&page=2']) assert.equal(views.parsePage(new URLSearchParams(value),25,500), null, value);
  assert.deepEqual(views.parsePage(new URLSearchParams('page=2&page_size=25'),25,500), {page:2,pageSize:25});
});
function summary(trend = []) { return {totals:{events:3,active_companies:1,active_sessions:1,rfq_submits:1},trend,rfq_summary:{rfqs:1,active_companies:1,line_items:1,requested_quantity:2}}; }
test('successful coverage fills absent buckets with zero without summing distinct-company totals', async () => {
  const query=period('2026-08-30','2026-09-05').query;
  const report=await analytics.getB2bAnalyticsReport({rpc:async()=>({data:summary([{date_bucket:'2026-08-30',events:3,active_companies:1,active_sessions:1}]),error:null})},query);
  assert.equal(report.trend.length,7); assert.equal(report.trend[1].events,0); assert.equal(report.totals.active_companies,1); assert.equal(report.rfq_summary.rfqs,1);
});
test('unknown coverage and RPC failures cannot masquerade as empty successful analytics', async () => {
  const query=period('2026-08-30','2026-09-05').query;
  for (const payload of [{data:null,error:null},{data:{totals:{},rfq_summary:{}},error:null},{data:null,error:{message:'offline'}}]) await assert.rejects(analytics.getB2bAnalyticsReport({rpc:async()=>payload},query));
});
function rfqApi(response, denied) {
  const calls=[];
  const chain = new Proxy({}, {get(_,key) { if(key==='then') return (ok)=>Promise.resolve(response).then(ok); return (...args)=>{ calls.push([key,...args]);return chain; }; }});
  return {calls, route:load('src/app/api/admin/rfqs/route.ts',{'@/lib/admin-auth':{requireBusinessAdmin:async()=>({response:denied})},'@/lib/supabase/admin':{createAdminClient:()=>({from:(...args)=>{calls.push(['from',...args]);return chain;}})}})};
}
const id='12345678-1234-4234-8234-123456789abc';
const patch=(body)=>new Request('http://localhost/api/admin/rfqs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('RFQ writes require a version and preserve the atomic equality predicate', async () => {
  const api=rfqApi({data:{id,status:'processing'},error:null});
  assert.equal((await api.route.PATCH(patch({rfq_id:id,status:'processing'}))).status,428); assert.equal(api.calls.length,0);
  const version='2026-09-05T04:00:00Z';
  assert.equal((await api.route.PATCH(patch({rfq_id:id,status:'processing',expected_updated_at:version}))).status,200);
  assert.ok(api.calls.some(([method,key,value])=>method==='eq'&&key==='updated_at'&&value===version));
});
test('RFQ stale writes return 409 and authorization stops before database access', async () => {
  const api=rfqApi({data:null,error:null});
  assert.equal((await api.route.PATCH(patch({rfq_id:id,status:'closed',expected_updated_at:'2026-09-05T04:00:00Z'}))).status,409);
  const denied=rfqApi(null,new Response(null,{status:403}));
  assert.equal((await denied.route.GET(new Request('http://localhost/api/admin/rfqs'))).status,403); assert.equal(denied.calls.length,0);
});
test('RFQ API rejects invalid filters, and detail lookup ignores source status/page', async () => {
  const api=rfqApi({data:[],error:null,count:0});
  for (const query of ['status=', 'status=invalid','sort=invalid','page=abc','status=new&status=closed','id=bad']) assert.equal((await api.route.GET(new Request('http://localhost/api/admin/rfqs?'+query))).status,400,query);
  assert.equal(api.calls.length,0);
  await api.route.GET(new Request(`http://localhost/api/admin/rfqs?id=${id}&status=new&page=2`));
  assert.ok(api.calls.some(([method,key,value])=>method==='eq'&&key==='id'&&value===id));
  assert.ok(!api.calls.some(([method,key])=>method==='eq'&&key==='status'));
  assert.deepEqual(api.calls.filter(([method])=>method==='range').at(-1),['range',0,0]);
});
