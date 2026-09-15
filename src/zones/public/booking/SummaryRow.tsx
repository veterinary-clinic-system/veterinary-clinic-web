
export function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-none">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
