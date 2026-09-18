export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-0">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mist-3 border-t-accent" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-mist-3">
          Loading
        </span>
      </div>
    </div>
  );
}
