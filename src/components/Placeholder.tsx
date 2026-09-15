
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {note && <p className="mt-2 text-muted">{note}</p>}
    </div>
  );
}
