<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The employment list is the home screen ("/"); /empleos redirects there so older links keep working, and /llamado/$jobId retains the original detail screen.
- Job list presentation and filtering live in a focused component and browser-safe helper; public list reads project only display fields and paginate Supabase results to avoid silently missing rows.
- Bottom navigation preloads only on intent; public screen queries retain a short freshness window to avoid duplicate reads, and slow initial reads show a shared pending screen with navigation available and no minimum wait.
- Job detail uses shared query options with a short freshness window and intent-based link preloading so navigation reuses complete detail responses without duplicate reads or prefetching the entire list.
- Company and poster images resolve through a shared browser-safe fallback attached to the current element, so a photo that fails after mount still falls back instead of rendering a broken image.
- Radar uses Google Maps JavaScript with a callback-based asynchronous loader and public display-only paginated job reads; parse stored coordinates in a browser-safe helper to keep invalid locations off the map.
- App access uses Supabase Auth, a single root session subscriber, and a private profiles table created by a signup trigger; keep public browsing available and clear query caches before sign-out.
- Profile is a public session-aware screen linked from the bottom navigation; display actual account data and keep unimplemented access and consent controls disabled rather than inventing activity or consent.
- Alertas opens a focused configuration drawer with local draft preferences; do not simulate saved alerts or notification delivery until persistence and delivery are implemented, and explicitly disclose that submission does not save.
- Mis postulaciones reads only the signed-in user's own rows from the postulaciones table (own-row RLS, one card per offer, offers only); the detail-screen "Postularme" records the application with upsert (unique user_id+job_id) and the button reflects the stored estado.
- Saved offers use authenticated server functions with own-row RLS and a unique user+job pair; both detail bookmarks share one query, and the session-aware list is accessed from Profile, keeping private reads out of public loaders.
- JobsDetails allows public display-column reads for all offers and llamados (the home list shows both), never applicant/contact fields or client writes; Usuario and Empresa are owner-read-only, visibility_settings is service-only, and legacy privileged RPCs are not client-callable to prevent bypassing RLS.
