-- Migration: Update saved_recipes table
-- Adds last_cooked_at column for tracking when a recipe was last prepared
-- This is used to exclude recently cooked recipes from generation suggestions

-- Add last_cooked_at column
ALTER TABLE saved_recipes ADD COLUMN IF NOT EXISTS last_cooked_at TIMESTAMPTZ DEFAULT NULL;

-- Delete all existing saved recipes to start fresh with the new model
DELETE FROM saved_recipes;
