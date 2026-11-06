-- Zomato Lite schema.
-- restaurants: one row per restaurant (facts only).
-- reviews: one row per review event (facts only).
-- There is NO average_rating column and NO latest_review column.
-- Averages and "latest" are computed at read time (M3), never stored.

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS restaurants;

CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  area TEXT NOT NULL
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO restaurants (name, cuisine, area)
VALUES ('Ludhiana Burrito', 'Indian', 'Sector 32');

-- Seed three reviews, dated 8 / 6 / 2 days ago so "latest" is meaningful.
-- IDs start at 101 so they match the lesson document.
INSERT INTO reviews (id, restaurant_id, rating, comment, created_at)
VALUES
  (101, 1, 5, 'Paneer burrito is unreal', now() - interval '8 days'),
  (102, 1, 4, 'Good, but slow service',  now() - interval '6 days'),
  (103, 1, 4, 'Solid. Would repeat.',    now() - interval '2 days');

-- Re-sync the id counter so Priya's next review becomes id 104.
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
