-- Segredos de aplicação gerados pelo próprio servidor quando não vêm do
-- ambiente. Hoje guarda apenas o JWT_SECRET_KEY: sem isto, um deploy sem a
-- variável configurada não conseguia assinar token nenhum e derrubava login,
-- cadastro e OAuth. A variável de ambiente, quando existe, continua tendo
-- precedência — esta tabela é só o fallback durável.
--
-- O valor tem a mesma sensibilidade dos dados que protege: quem alcança esta
-- tabela já alcança as demais, então guardá-lo aqui não amplia a superfície.

CREATE TABLE IF NOT EXISTS app_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
