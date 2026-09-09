from __future__ import annotations

import pytest

from app.core import signing as signing_module
from app.core.signing import resolve_jwt_secret


@pytest.fixture(autouse=True)
def clear_cache():
    signing_module.reset_cache()
    yield
    signing_module.reset_cache()


def test_env_secret_wins(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "a" * 40)
    assert resolve_jwt_secret() == "a" * 40


def test_short_env_secret_is_rejected(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "curto-demais")
    with pytest.raises(RuntimeError, match="32 characters"):
        resolve_jwt_secret()


def test_falls_back_to_database(monkeypatch):
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.setattr(signing_module, "_load_or_create_from_db", lambda: "segredo-vindo-do-banco-com-tamanho-ok")
    assert resolve_jwt_secret() == "segredo-vindo-do-banco-com-tamanho-ok"


def test_database_value_is_cached(monkeypatch):
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    calls = []

    def fake_load():
        calls.append(1)
        return "segredo-persistido-uma-vez-so-aqui"

    monkeypatch.setattr(signing_module, "_load_or_create_from_db", fake_load)
    first = resolve_jwt_secret()
    second = resolve_jwt_secret()

    # Uma leitura por processo: assinar token não pode custar uma query.
    assert first == second
    assert len(calls) == 1


def test_unreachable_database_raises_clear_error(monkeypatch):
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    def boom():
        raise ConnectionError("sem banco")

    monkeypatch.setattr(signing_module, "_load_or_create_from_db", boom)
    with pytest.raises(RuntimeError, match="não pôde ser provisionado"):
        resolve_jwt_secret()
