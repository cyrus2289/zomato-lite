// GET /api/restaurants/[id] — load the restaurant page's data.
// Out (shaped like the screen, so the frontend has nothing left to figure out):
// {
//   restaurant: { id, name, cuisine, area },
//   averageRating: 4.3,      // null when there are no reviews (never 0 — 0 would lie)
//   totalReviews: 3,
//   latestReview: { ... },   // newest by created_at, or null
//   reviews: [ ... ]         // every review EXCEPT the latest, newest first
// }
//
// Every number here is COMPUTED at request time, fresh:
// AVG(rating) and COUNT(*) run on every call. We never store a computed value.

import { db } from '@/lib/db';

type RestaurantRow = { id: number; name: string; cuisine: string; area: string };
type StatsRow = { total: number; average: number | null };
type ReviewRow = { id: number; restaurantId: number; rating: number; comment: string; createdAt: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 16 the dynamic part of the URL is a Promise — unwrap it.
  const { id } = await params;
  const restaurantId = Number(id);
  const sql = db();

  // Does the restaurant exist? If not: 404.
  const restaurantRows = (await sql.query(
    'SELECT id, name, cuisine, area FROM restaurants WHERE id = $1',
    [restaurantId]
  )) as unknown as RestaurantRow[];
  if (restaurantRows.length === 0) {
    return Response.json({ error: 'Restaurant not found.' }, { status: 404 });
  }
  const restaurant = restaurantRows[0];

  // The three lines of intelligence. Computed now, from facts, every time.
  const statRows = (await sql.query(
    'SELECT COUNT(*)::int AS total, AVG(rating) AS average FROM reviews WHERE restaurant_id = $1',
    [restaurantId]
  )) as unknown as StatsRow[];
  const { total, average } = statRows[0];

  // All reviews for this restaurant, newest first.
  const allReviews = (await sql.query(
    'SELECT id, restaurant_id AS "restaurantId", rating, comment, created_at AS "createdAt" FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [restaurantId]
  )) as unknown as ReviewRow[];

  // The page shows the latest review separately — don't print it twice.
  const latestReview: ReviewRow | null = allReviews[0] ?? null;
  const olderReviews = allReviews.slice(1);

  // Round to one decimal HERE, in the backend. The frontend does zero maths.
  const averageRating =
    average === null ? null : Math.round(Number(average) * 10) / 10;

  return Response.json({
    restaurant,
    averageRating,
    totalReviews: Number(total),
    latestReview,
    reviews: olderReviews,
  });
}
