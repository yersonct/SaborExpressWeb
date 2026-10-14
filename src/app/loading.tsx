export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 rounded-xl bg-white/70" />
      <div className="h-4 w-96 rounded-lg bg-white/60" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white/70" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-white/60" />
    </div>
  );
}
