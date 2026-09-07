-- ============================================================
-- FIX: RLS policies call these SECURITY DEFINER helper functions,
-- but SECURITY DEFINER only changes what the function body can see
-- internally (bypassing RLS on nested lookups) — it does NOT let a
-- caller invoke the function without EXECUTE privilege. 0001 revoked
-- EXECUTE from `authenticated`, which breaks every policy that
-- references these functions ("permission denied for function ...").
-- ============================================================

grant execute
on function private.can_access_list(uuid, uuid)
to authenticated;

grant execute
on function private.can_access_task(uuid, uuid)
to authenticated;

grant execute
on function private.can_access_tag(uuid, uuid)
to authenticated;

grant execute
on function private.can_manage_list(uuid, uuid)
to authenticated;
