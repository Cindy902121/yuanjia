# Supabase migration archive

`supabase/migrations/` is the only active migration directory. The active
chain starts at the remote-schema baseline and contains the 10 migration
versions recorded by the last remote read-only audit, plus the current
branch's B2C editor-fields and B2B tag-replacement migrations.

`legacy/` contains SQL that was either part of the original baseline or a
local draft that never became part of the remote migration history. It is
kept for audit and diff context only:

- `20260810054414_create_mvp_foundation.sql`
- `20260810055532_add_demo_catalog_data.sql`
- `20260810161047_harden_public_privileges.sql`
- `20260810161048_extend_b2c_catalog.sql`
- `20260810161049_create_b2c_media_storage.sql`
- `20260819074622_add_admin_catalog_media_and_management.sql`
- `20260825022150_add_admin_roles_and_b2b_status.sql`
- `20260825030000_fix_admin_b2b_status_rpc.sql`

The active Admin media, role/status and corrective migrations use the
versions recorded remotely:

- `20260825024950_add_admin_catalog_media_and_management.sql`
- `20260825025003_add_admin_roles_and_b2b_status.sql`
- `20260827031543_fix_admin_bulk_status_ambiguity.sql`

Do not replay files from `legacy/` or use `migration repair` for them. Repair
is only valid when the exact SQL has already been applied and the history row
alone is missing.
