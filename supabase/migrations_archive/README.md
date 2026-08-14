# Archived migrations

The two migrations in `legacy/` were the original 2026-08-10 MVP setup.
They are retained for audit only and must not be replayed by Supabase CLI.

The remote database's actual schema was captured in
`../migrations/20260812150000_baseline_remote_schema.sql` and that baseline
was marked as applied on the Yuanjia production project before the security
migration `20260812150001_establish_mvp_security_contract.sql` was deployed.

Use `supabase/migrations/` as the sole active migration history from this
point forward.
