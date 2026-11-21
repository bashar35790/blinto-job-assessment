#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE doomsday_test'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doomsday_test')\gexec
EOSQL
