-- Migration 006: Security hardening (SOC 2 CC6.1 / ISO 27001 A.8.3 / ISO 27701 7.3.6, 7.4.5)
-- Idempotente: se puede ejecutar varias veces.

-- 1. RLS garantizado en tablas cuyas políticas no estaban versionadas en el repo.
ALTER TABLE fridge_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hardening_fridge_items_own" ON fridge_items;
CREATE POLICY "hardening_fridge_items_own"
  ON fridge_items FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "hardening_saved_recipes_own" ON saved_recipes;
CREATE POLICY "hardening_saved_recipes_own"
  ON saved_recipes FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. Una compra solo puede referenciar un alimento del propio usuario (antes solo se validaba la sesión).
DROP POLICY IF EXISTS "users_insert_own_purchases" ON budget_purchases;
CREATE POLICY "users_insert_own_purchases"
  ON budget_purchases FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_sessions s
      WHERE s.id = budget_purchases.session_id AND s.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM fridge_items f
      WHERE f.id = budget_purchases.item_id AND f.user_id = (SELECT auth.uid())
    )
  );

-- 3. Derecho de supresión: el usuario borra su cuenta y todos sus datos personales.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  DELETE FROM public.budget_sessions WHERE user_id = uid; -- arrastra budget_purchases (ON DELETE CASCADE)
  DELETE FROM public.saved_recipes  WHERE user_id = uid;
  DELETE FROM public.fridge_items   WHERE user_id = uid;
  DELETE FROM auth.users            WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- Verificación (ejecutar a mano y revisar el resultado):
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';          -- todas deben ser true
--   SELECT tablename, policyname, roles, cmd, qual FROM pg_policies
--   WHERE schemaname = 'public';                                             -- ninguna con qual = 'true'
