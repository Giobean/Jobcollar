export default function Loading() {
  return (
    <main className="loading-page" aria-busy="true" aria-live="polite">
      <span className="loading-mark" aria-hidden="true" />
      <p>Loading CreatorAdSpace…</p>
    </main>
  );
}
