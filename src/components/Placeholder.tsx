/**
 * Temporary shell for pages not yet built out. DESIGN.md hadn't been added to the repo
 * yet when this project was scaffolded (see CLAUDE.md), so real visual work on these
 * screens is intentionally deferred until it exists and src/components/basic/ is built
 * against it - the routing/data-fetching skeleton around them is already real.
 */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {note && <p className="mt-2 text-muted">{note}</p>}
    </div>
  );
}
