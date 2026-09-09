-- `create_category` faz upsert com `updated_at = NOW()` (é o caminho que
-- reativa uma categoria arquivada), mas a coluna nunca existiu em categories:
-- recriar uma categoria de nome já usado quebrava com UndefinedColumn.
--
-- Alinha categories com users e budgets, que já têm updated_at + trigger.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
