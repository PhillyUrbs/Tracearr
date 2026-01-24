-- Initialize TimescaleDB extensions
-- This script runs automatically when the database is first created

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
