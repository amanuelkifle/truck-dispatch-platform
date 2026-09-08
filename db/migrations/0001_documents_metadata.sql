-- Phase 6 (Documents): the documents table (db/schema.sql) already has
-- storage_key, but nothing human-readable to show in a list UI. Add the
-- original filename, size, and content type so the Documents page doesn't
-- have to parse them back out of the storage key.
--
-- Run this once in the Supabase SQL Editor (same place you ran
-- db/schema.sql originally) before using document uploads.

alter table documents
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists content_type text;
