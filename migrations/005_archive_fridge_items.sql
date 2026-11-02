-- Migration 005: Archive fridge items
-- Allows marking items that should be excluded from the shopping list and budget.

ALTER TABLE fridge_items
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_fridge_items_user_archived
  ON fridge_items(user_id, archived);
