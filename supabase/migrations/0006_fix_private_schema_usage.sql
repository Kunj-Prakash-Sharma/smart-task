-- ============================================================
-- FIX: 0001 revoked ALL privileges on the private schema (including
-- USAGE) from authenticated, and 0005 only re-granted EXECUTE on the
-- individual helper functions. Calls to private.* functions embedded
-- inside an RLS policy expression apparently don't hit this check, but
-- a direct call from PL/pgSQL (e.g. reorder_tasks() calling
-- private.can_manage_list(...) directly) does, and fails with
-- "permission denied for schema private" without schema-level USAGE.
-- ============================================================

grant usage on schema private to authenticated;
