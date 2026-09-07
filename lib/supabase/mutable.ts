/**
 * The installed @supabase/postgrest-js version fails to infer Insert/Update/rpc
 * argument and result types from our hand-written Database type (its generic
 * builder chain collapses to `never` specifically for .insert()/.update()/.rpc(),
 * while .select() reads infer correctly) — a known-broken interaction we could not
 * root-cause against this library version. `mutable()` deliberately drops to `any`
 * for those specific calls so writes aren't blocked by a bug in the type layer;
 * runtime behavior (and the DB's own constraints/RLS) are unaffected.
 */
export function mutable(client: unknown): any {
  return client;
}
