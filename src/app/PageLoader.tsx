export function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
      <div className="size-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
    </div>
  );
}
