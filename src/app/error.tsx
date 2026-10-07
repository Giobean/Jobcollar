"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <p className="kicker">Something went wrong</p>
      <h1>We couldn&apos;t load this space.</h1>
      <p>Your information is safe. Try loading the page again.</p>
      <button className="button button-dark" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
