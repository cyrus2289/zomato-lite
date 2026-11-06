'use client';

// Screen 2 — /restaurant/[id]
// This component is a display layer. It calls GET /api/restaurants/[id]
// and prints what it receives. There is NO maths here: no rounding, no
// averaging, no sorting. The backend did all of that already.

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Review = {
  id: number;
  restaurantId: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type PageData = {
  restaurant: { id: number; name: string; cuisine: string; area: string };
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

// Display formatting only: turns "2026-11-04T04:28:06.396Z" into "4 Nov, 9:58 am".
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Next.js 16 (cacheComponents): URL data read via useParams() in a client
// component must sit inside a Suspense boundary so the page shell can
// prerender instantly and the content streams in after.
export default function RestaurantPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1a1a1a]">
          <p className="text-sm text-[#6f6a63]">Loading…</p>
        </main>
      }
    >
      <RestaurantContent />
    </Suspense>
  );
}

function RestaurantContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<PageData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setData((await res.json()) as PageData);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1a1a1a]">
        <p className="text-sm text-[#6f6a63]">Restaurant not found.</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1a1a1a]">
        <p className="text-sm text-[#6f6a63]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1a1a1a]">
      <div className="mx-auto max-w-[560px] px-6 py-14">
        {/* 1. Who */}
        <h1 className="text-3xl font-semibold tracking-tight">
          {data.restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-[#6f6a63]">
          {data.restaurant.cuisine} · {data.restaurant.area}
        </p>

        {/* 2. The big number. The where-it-gets-printed line:
              averageRating arrives as 4.3 and is printed as 4.3. */}
        <div className="mt-10">
          <p className="text-6xl font-semibold tracking-tight">
            {data.averageRating ?? '—'}
          </p>
          <p className="mt-1 text-sm text-[#6f6a63]">
            {data.totalReviews} review{data.totalReviews === 1 ? '' : 's'}
          </p>
        </div>

        {/* 3 + 4. Reviews, or an honest empty state. */}
        {data.averageRating === null ? (
          <div className="mt-12 rounded-lg border border-[#e5e0d8] bg-[#fffcf7] p-6 text-center">
            <div className="text-2xl text-[#d8d2c8]">☆☆☆☆☆</div>
            <p className="mt-2 text-sm text-[#6f6a63]">
              No reviews yet. Be the first one.
            </p>
            <Link
              href={`/review/${data.restaurant.id}`}
              className="mt-4 inline-block rounded-lg border border-[#1a1a1a] px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] hover:text-[#faf9f6]"
            >
              Write a review
            </Link>
          </div>
        ) : (
          <>
            {data.latestReview !== null && (
              <figure className="mt-12 rounded-lg border border-[#e5e0d8] border-l-[3px] border-l-[#b45309] bg-[#fffcf7] p-5">
                <blockquote className="text-[15px] leading-relaxed">
                  “{data.latestReview.comment}”
                </blockquote>
                <figcaption className="mt-3 text-xs text-[#6f6a63]">
                  <span className="text-[#b45309]">
                    {'★'.repeat(data.latestReview.rating)}
                    {'☆'.repeat(5 - data.latestReview.rating)}
                  </span>{' '}
                  · {formatDate(data.latestReview.createdAt)} · latest
                </figcaption>
              </figure>
            )}

            <ul className="mt-6 space-y-6">
              {data.reviews.map((review) => (
                <li key={review.id}>
                  <p className="text-[15px] leading-relaxed">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-xs text-[#6f6a63]">
                    <span className="text-[#b45309]">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>{' '}
                    · {formatDate(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <Link
                href={`/review/${data.restaurant.id}`}
                className="inline-block rounded-lg border border-[#1a1a1a] px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] hover:text-[#faf9f6]"
              >
                Write a review
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
