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
- New-offer badges use browser-local viewed IDs scoped by account (or guest); record views only on mounted detail screens, not preloads, to avoid marking unopened offers as seen or adding private reads to public loaders.
- The home new-offers notice reuses the badge's unseen-offer predicate; dismissing the notice never records views, and its local filter stays scoped to the active account to avoid mixing histories.
- Home filters use a separate drawer with a local draft applied on confirmation; use selectors for high-cardinality real location and contract options to keep the panel compact.
- Home advertisement placement is a separate reserved frame before the search header; keep its dimensions stable and do not invent campaign content or personalized delivery without a real source.
- Curriculum uses account-keyed expandable editors and serialized automatic saves after a brief typing pause or field blur; wait for initial loading, retain failed drafts and queue edits made during a save. Unsupported personal fields and photo uploads must not pretend to persist.
- Bottom navigation preloads only on intent; public screen queries retain a short freshness window to avoid duplicate reads, and slow initial reads show a shared pending screen with navigation available and no minimum wait.
- Job detail uses shared query options with a short freshness window and intent-based link preloading so navigation reuses complete detail responses without duplicate reads or prefetching the entire list.
- Company and poster images resolve through a shared browser-safe fallback attached to the current element, so a photo that fails after mount still falls back instead of rendering a broken image.
- Home logo resolution accepts the job poster as an intermediate fallback using the existing fixed logo frame; other screens omit that fallback to preserve their presentation.
- Home poster browsing uses a focused horizontal carousel over the existing filtered list data, with lazy whole-poster images and intent-only detail preloading to avoid extra list reads or layout overflow.
- Radar uses Google Maps JavaScript with a callback-based asynchronous loader and public display-only paginated job reads; parse stored coordinates in a browser-safe helper to keep invalid locations off the map.
- App access uses Supabase Auth, a single root session subscriber, and a private profiles table created by a signup trigger; keep public browsing available and clear query caches before sign-out.
- Android Google login uses a registered Capacitor Credential Manager plugin restricted to the configured app HTTPS origin; send a hashed nonce to Google and its raw value to Supabase, never fall back to browser OAuth on native Android, and never log tokens.
- Profile is a public session-aware screen linked from the bottom navigation; display actual account data and keep unimplemented access and consent controls disabled rather than inventing activity or consent.
- Account-deletion requests use authenticated server functions, shared validation, account-email matching and own-row RLS; persist one request per account, read it back for confirmation, and never delete accounts automatically.
- Alertas opens a focused configuration drawer with local draft preferences; do not simulate saved alerts or notification delivery until persistence and delivery are implemented, and explicitly disclose that submission does not save.
- Mis postulaciones reads only the signed-in user's own rows from the postulaciones table (own-row RLS, one card per offer, offers only); the detail-screen "Postularme" records the application with upsert (unique user_id+job_id) and the button reflects the stored estado.
- Saved offers use authenticated server functions with own-row RLS and a unique user+job pair; both detail bookmarks share one query, and the session-aware list is accessed from Profile, keeping private reads out of public loaders.
- JobsDetails allows public display-column reads for all offers and llamados (the home list shows both), never applicant/contact fields or client writes; Usuario and Empresa are owner-read-only, visibility_settings is service-only, and legacy privileged RPCs are not client-callable to prevent bypassing RLS.
- Bottom-nav badges reflect real state only: Social counts posters not yet seen (id registry written when the social list loads, seen ids recorded as each poster scrolls into view, stored in localStorage); Alertas uses an authenticated exact count of own unread Notificaciones, including alert notices, in a per-account shared query refreshed every 30 seconds and on focus, so configured searches and localStorage cannot inflate the count or leak it across accounts. Private counts never run in public loaders or block navigation.
- Contract filtering maps the free-text `tipoContrato` values onto the ten fixed Uruguayan contract types (indeterminado, plazo fijo, obra determinada, eventual, temporada/zafral, suplencia, aprendizaje, práctica para egresados, primera experiencia, a prueba) through a browser-safe helper; values that carry no contract information match no type, so new stored spellings must be mapped there rather than adding another filter option.
- The home PRO bar sits right after the third offer, uses the exact background #f5d118 with a fixed dark foreground, plays the animated premium badge, and is display only (no link or button target) apart from its close X; it never appears on /buscar or /puestos.

- Subscriptions use RevenueCat (Capacitor plugin + UI package) only on native builds that include the plugin; a single root provider configures the SDK once and follows the Supabase user with logIn/logOut, serialized. The `pro` entitlement covers the `lifetime`, `yearly` and `monthly` products; the dashboard paywall is presented only when Pro is not active, Customer Center only when there is purchase history, and the Profile block is shown to signed-in users on native builds only. The Google Play `goog_` key is the code default (the native app loads the hosted web build, so the key cannot depend on a regenerated .env); VITE_REVENUECAT_API_KEY only overrides it, and the `test_` key is Test Store only. Keep the Activity `launchMode` at `singleTop`.
- The Premium plans screen (carpincho paywall) takes its prices, billing text and free-trial length from the current RevenueCat offering (monthly, annual and lifetime packages) and promises a trial only when Google Play reports the customer as eligible; buying requires a signed-in account, and on the web or builds without the plugin the screen shows an unavailable notice instead of purchase buttons.
