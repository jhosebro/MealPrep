-- Migration 002: Budget sessions and purchases

CREATE TABLE IF NOT EXISTS budget_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spent >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_budget_sessions_user_active
  ON budget_sessions(user_id, status)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS budget_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES budget_sessions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES fridge_items(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  previous_status TEXT NOT NULL CHECK (previous_status IN ('available', 'low', 'empty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_purchases_session
  ON budget_purchases(session_id, created_at DESC);
