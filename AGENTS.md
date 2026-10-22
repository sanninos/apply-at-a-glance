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

- The index route owns the employment list; existing /llamado/$jobId URLs retain the job-detail screen so shared links keep working.
- Job list presentation and filtering live in a focused component and browser-safe helper; public list reads project only display fields and paginate Supabase results to avoid silently missing rows.
