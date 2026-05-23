-- Enable RLS
ALTER TABLE budget_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_purchases ENABLE ROW LEVEL SECURITY;

-- Budget sessions: users manage their own
CREATE POLICY "users_select_own_sessions"
  ON budget_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_sessions"
  ON budget_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_sessions"
  ON budget_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Budget purchases: users manage purchases linked to their sessions
CREATE POLICY "users_select_own_purchases"
  ON budget_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_sessions
      WHERE budget_sessions.id = budget_purchases.session_id
        AND budget_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_purchases"
  ON budget_purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_sessions
      WHERE budget_sessions.id = budget_purchases.session_id
        AND budget_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_purchases"
  ON budget_purchases FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budget_sessions
      WHERE budget_sessions.id = budget_purchases.session_id
        AND budget_sessions.user_id = auth.uid()
    )
  );
