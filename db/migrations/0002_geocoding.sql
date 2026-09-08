-- Phase 7 (Load Scoring / truck-load matching) needs real coordinates to
-- compute deadhead and reload distances, since the app only stores free-text
-- city/state. These get filled in automatically (geocoded via Mapbox) when a
-- truck or load is created/edited with a location - see lib/mapbox.ts and
-- lib/actions/{trucks,loads}.ts. Nullable: a truck/load created before this
-- migration, or one whose location fails to geocode, just skips the
-- location-dependent parts of scoring rather than breaking.
--
-- Run this once in the Supabase SQL Editor.

alter table trucks
  add column if not exists current_latitude numeric,
  add column if not exists current_longitude numeric;

alter table loads
  add column if not exists origin_latitude numeric,
  add column if not exists origin_longitude numeric,
  add column if not exists destination_latitude numeric,
  add column if not exists destination_longitude numeric;
