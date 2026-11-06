// POST /api/reviews — save a review.
// Contract:
//   In:  { "restaurantId": 1, "rating": 4, "comment": "Good, but slow service" }
//   Out: 201 { "success": true, "reviewId": 104 }
//   Or  400 { "error": "<plain English reason>" }
//
// This endpoint writes FACTS only — exactly one row into reviews.
// It does not compute or update any average or "latest" anywhere.

import { db } from '@/lib/db';

export async function POST(request: Request) {
  // 0. The body must be parseable JSON at all.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const { restaurantId, rating, comment } = (body ?? {}) as Record<string, unknown>;

  // Check 1 (in contract order): rating is a whole number from 1 to 5.
  // The frontend star picker already limits this — we check again anyway,
  // because anyone with a terminal can call this endpoint directly.
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: 'Rating must be a whole number from 1 to 5.' },
      { status: 400 }
    );
  }

  // Check 2: comment is a non-empty string after trimming whitespace.
  if (typeof comment !== 'string' || comment.trim().length === 0) {
    return Response.json({ error: 'Comment cannot be empty.' }, { status: 400 });
  }

  // Check 3: the restaurant actually exists. This one needs the database.
  const restaurantIdNumber = Number(restaurantId);
  if (!Number.isInteger(restaurantIdNumber)) {
    return Response.json({ error: 'Restaurant not found.' }, { status: 400 });
  }
  const sql = db();
  const matchingRestaurants = await sql.query(
    'SELECT id FROM restaurants WHERE id = $1',
    [restaurantIdNumber]
  );
  if (matchingRestaurants.length === 0) {
    return Response.json(
      { error: `Restaurant ${restaurantIdNumber} does not exist.` },
      { status: 400 }
    );
  }

  // All checks passed: insert exactly one row of fact. Nothing else changes.
  const inserted = await sql.query(
    'INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id',
    [restaurantIdNumber, rating, comment.trim()]
  );
  const reviewId = (inserted[0] as { id: number }).id;

  return Response.json({ success: true, reviewId }, { status: 201 });
}
