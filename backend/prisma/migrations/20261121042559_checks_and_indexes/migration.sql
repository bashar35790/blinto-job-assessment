-- Enforce case-insensitive uniqueness
CREATE UNIQUE INDEX "idx_movies_unique_lower_title" ON "movies" (LOWER("title"));
CREATE UNIQUE INDEX "idx_cinemas_unique_lower_name" ON "cinemas" (LOWER("name"));

-- Domain CHECK constraints
ALTER TABLE "movies"
  ADD CONSTRAINT "chk_movies_runtime" CHECK ("runtime_minutes" BETWEEN 1 AND 300),
  ADD CONSTRAINT "chk_movies_release_year" CHECK ("release_year" BETWEEN 1888 AND 2100);

ALTER TABLE "movie_prerequisites"
  ADD CONSTRAINT "chk_prerequisites_no_self" CHECK ("movie_id" != "prerequisite_id");

ALTER TABLE "cinema_bundles"
  ADD CONSTRAINT "chk_bundles_size" CHECK ("size" BETWEEN 1 AND 500);
