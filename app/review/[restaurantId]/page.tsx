'use client';

// Screen 1 — /review/[restaurantId]
// A star picker, a comment box, a Submit button. Nothing else.
// When Submit is pressed this screen hands three things to
// POST /api/reviews and steps back. If the backend says 400,
// the wording shown is the backend's own — we do not invent
// a second customer-service voice in the frontend.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Next.js 16 (cacheComponents): URL data read via useParams() in a client
// component must sit inside a Suspense boundary so the page shell can
// prerender instantly and the content streams in after.
export default function WriteReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1a1a1a]">
          <p className="text-sm text-[#6f6a63]">Loading…</p>
        </main>
      }
    >
      <WriteReviewContent />
    </Suspense>
  );
}

function WriteReviewContent() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); // visual preview only
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kindness only: fetch the name so the reviewer knows what they're rating.
    // All the actual data of the page lives on the restaurant screen.
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const body = await res.json();
        setRestaurantName(body.restaurant.name);
      })
      .catch(() => setNotFound(true));
  }, [restaurantId]);

  const canSubmit = rating >= 1 && comment.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: Number(restaurantId),
        rating,
        comment: comment.trim(),
      }),
    });

    if (res.ok) {
      // Success → straight to the restaurant page, where the fresh
      // average has already been recomputed by the backend.
      router.push(`/restaurant/${restaurantId}`);
      return;
    }

    // Failure → display exactly what the backend said.
    const body = await res.json().catch(() => null);
    setError(body?.error ?? 'Something went wrong. Please try again.');
    setSubmitting(false);
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1a1a1a]">
        <p className="text-sm text-[#6f6a63]">Restaurant not found.</p>
      </main>
    );
  }

  const shownRating = hoverRating || rating;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1a1a1a]">
      <div className="mx-auto max-w-[560px] px-6 py-14">
        <h1 className="text-2xl font-semibold tracking-tight">
          {restaurantName ?? 'Loading…'}
        </h1>
        <p className="mt-1 text-sm text-[#6f6a63]">How was it?</p>

        <form onSubmit={handleSubmit} className="mt-10">
          {/* Star picker — 1 to 5, clickable, clear selected state */}
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                className={`text-4xl transition-colors ${
                  n <= shownRating ? 'text-[#b45309]' : 'text-[#ddd6cb]'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Comment box */}
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="What did you think?"
            className="mt-8 w-full resize-none rounded-lg border border-[#e5e0d8] bg-[#fffcf7] px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#b45309]"
          />

          {/* Backend's message, verbatim */}
          {error !== null && (
            <p className="mt-4 text-sm text-[#9f3b1e]">{error}</p>
          )}

          {/* Submit — disabled until a rating is picked AND comment non-empty */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full rounded-lg bg-[#1a1a1a] py-3 text-sm font-medium text-[#faf9f6] disabled:opacity-40"
          >
            {submitting ? 'Thank you — taking you to the reviews…' : 'Submit'}
          </button>
        </form>
      </div>
    </main>
  );
}
