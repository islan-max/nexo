-- Índice de cobertura para as agregações mensais.
--
-- Praticamente toda query do produto filtra por
-- (user_id, COALESCE(billing_month, substring(transaction_date,1,7))) e depois
-- soma `amount` agrupando por `type`. O índice existente
-- (idx_transactions_user_month) cobre o filtro, mas o Postgres ainda precisa
-- visitar a heap para ler amount e type. Incluindo as duas colunas, dashboard,
-- metas, score e alertas passam a resolver por index-only scan.
--
-- A expressão precisa bater exatamente com a usada nas queries, senão o
-- planejador não usa o índice.

CREATE INDEX IF NOT EXISTS idx_transactions_user_effective_month
  ON transactions (
    user_id,
    (COALESCE(billing_month, substring(transaction_date FROM 1 FOR 7)))
  )
  INCLUDE (amount, type, category_id);

-- Alertas e relatórios cruzam categoria dentro do mês.
CREATE INDEX IF NOT EXISTS idx_transactions_user_month_category
  ON transactions (
    user_id,
    (COALESCE(billing_month, substring(transaction_date FROM 1 FOR 7))),
    category_id
  )
  WHERE type = 'expense';
