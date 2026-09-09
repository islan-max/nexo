"""Resolução do segredo de assinatura de tokens.

Ordem de precedência:

1. ``JWT_SECRET_KEY`` no ambiente — o caminho recomendado, e o único usado em
   testes e desenvolvimento.
2. Um segredo gerado pelo servidor e guardado na tabela ``app_secrets``.

O passo 2 existe porque um deploy sem a variável configurada não conseguia
assinar nada: login, cadastro e OAuth respondiam 500 e o app ficava inutilizável
mesmo com o banco de pé. Gerar e persistir uma vez resolve isso sem inventar um
segredo novo a cada cold start (o que invalidaria as sessões de todo mundo a
cada poucos minutos em serverless).
"""

from __future__ import annotations

import logging
import os
import secrets

logger = logging.getLogger("trevo.signing")

JWT_SECRET_NAME = "jwt_secret_key"
MIN_SECRET_LENGTH = 32

# Cache de processo: evita ir ao banco a cada assinatura de token.
_cached_secret: str | None = None


def _generate() -> str:
    return secrets.token_urlsafe(48)


def _load_or_create_from_db() -> str:
    # Import tardio: app.core.database importa app.core.config, e importar o
    # banco no topo daqui fecharia um ciclo.
    from app.core.database import db_cursor

    with db_cursor(commit=True) as cursor:
        # INSERT-then-SELECT sob ON CONFLICT: se duas instâncias subirem juntas,
        # ambas terminam lendo o mesmo valor — o primeiro que gravou.
        cursor.execute(
            """
            INSERT INTO app_secrets (name, value)
            VALUES (%s, %s)
            ON CONFLICT (name) DO NOTHING
            """,
            (JWT_SECRET_NAME, _generate()),
        )
        cursor.execute("SELECT value FROM app_secrets WHERE name = %s", (JWT_SECRET_NAME,))
        row = cursor.fetchone()

    if not row:
        raise RuntimeError("Não foi possível provisionar o segredo de assinatura.")
    return str(row["value"])


def resolve_jwt_secret() -> str:
    """Devolve o segredo de assinatura, provisionando-o se necessário."""
    global _cached_secret

    env_secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if env_secret:
        if len(env_secret) < MIN_SECRET_LENGTH:
            raise RuntimeError("JWT_SECRET_KEY must have at least 32 characters.")
        return env_secret

    if _cached_secret:
        return _cached_secret

    try:
        _cached_secret = _load_or_create_from_db()
    except Exception as exc:
        raise RuntimeError(
            "JWT_SECRET_KEY não está definida e o segredo não pôde ser provisionado no banco."
        ) from exc

    logger.info("Segredo de assinatura carregado da tabela app_secrets")
    return _cached_secret


def reset_cache() -> None:
    """Descarta o segredo em cache (usado nos testes)."""
    global _cached_secret
    _cached_secret = None
