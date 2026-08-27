# Supabase migration archive

`supabase/migrations/` is the only active migration directory. As of
2026-08-27 it contains the linked remote project's nine recorded versions and
one pending corrective migration; do not replay files from this directory.

`legacy/` contains SQL that was either part of the original baseline or a
local draft that never became part of the remote migration history. It is kept
for audit and diff context only:

- `20260810054414_create_mvp_foundation.sql`
- `20260810055532_add_demo_catalog_data.sql`
- `20260810161047_harden_public_privileges.sql`
- `20260810161048_extend_b2c_catalog.sql`
- `20260810161049_create_b2c_media_storage.sql`
- `20260819074622_add_admin_catalog_media_and_management.sql`

The remote Admin catalog/media migration is
`20260825024950_add_admin_catalog_media_and_management.sql`; the older
`20260819074622` file is its superseded local draft. The remote Admin role
and B2B status migration is `20260825025003_add_admin_roles_and_b2b_status.sql`.
`20260827031543_fix_admin_bulk_status_ambiguity.sql` is a new local corrective
migration; dry-run it before deployment and do not treat it as remote-applied.

Do not use `migration repair` for any archived file. Repair is only valid
when the exact SQL has already been applied and the history row alone is
missing.
