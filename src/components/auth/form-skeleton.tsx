export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <div className="mb-2 h-3 w-20 animate-pulse bg-sand" />
          <div className="h-12 animate-pulse bg-sand/70" />
        </div>
      ))}
      <div className="h-12 animate-pulse bg-sand" />
    </div>
  );
}
