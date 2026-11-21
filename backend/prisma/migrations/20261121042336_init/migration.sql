-- CreateTable
CREATE TABLE "movies" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "release_year" INTEGER NOT NULL,
    "runtime_minutes" INTEGER NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_prerequisites" (
    "movie_id" INTEGER NOT NULL,
    "prerequisite_id" INTEGER NOT NULL,

    CONSTRAINT "movie_prerequisites_pkey" PRIMARY KEY ("movie_id","prerequisite_id")
);

-- CreateTable
CREATE TABLE "cinemas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cinemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cinema_bundles" (
    "id" SERIAL NOT NULL,
    "cinema_id" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "cinema_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_prerequisites_prerequisite_id_idx" ON "movie_prerequisites"("prerequisite_id");

-- CreateIndex
CREATE UNIQUE INDEX "cinema_bundles_cinema_id_size_key" ON "cinema_bundles"("cinema_id", "size");

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinema_bundles" ADD CONSTRAINT "cinema_bundles_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "cinemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
