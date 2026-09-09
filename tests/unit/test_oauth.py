from __future__ import annotations

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.oauth import consume_oauth_state, create_oauth_state


def test_oauth_state_is_stateless_and_signed(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "unit-secret-key-for-tests-32-chars")
    state = create_oauth_state("google")

    # No server-side storage is consulted: validation relies only on the signed
    # token plus the double-submit cookie, so any invocation can validate it.
    consume_oauth_state(state, "google", state)

    # Provider mismatch is rejected.
    with pytest.raises(HTTPException):
        consume_oauth_state(state, "github", state)

    # Missing cookie (CSRF double-submit) is rejected.
    with pytest.raises(HTTPException):
        consume_oauth_state(state, "google", None)

    # Tampered/forged state fails signature verification.
    with pytest.raises(HTTPException):
        consume_oauth_state(state + "x", "google", state + "x")


@pytest.mark.asyncio
async def test_oauth_providers_without_credentials(monkeypatch):
    for name in (
        "OAUTH_REDIRECT_BASE_URL",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
        "FACEBOOK_CLIENT_ID",
        "FACEBOOK_CLIENT_SECRET",
    ):
        monkeypatch.delenv(name, raising=False)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/oauth/providers")
    assert response.status_code == 200
    payload = response.json()["providers"]
    for provider in ("google", "github", "facebook"):
        assert provider in payload
        assert payload[provider]["enabled"] is False


@pytest.mark.asyncio
async def test_oauth_authorize_unconfigured_returns_503(monkeypatch):
    for name in ("OAUTH_REDIRECT_BASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"):
        monkeypatch.delenv(name, raising=False)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/oauth/google/authorize", follow_redirects=False)
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_oauth_authorize_configured_sets_state_cookie(monkeypatch):
    monkeypatch.setenv("OAUTH_REDIRECT_BASE_URL", "http://test")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-secret")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/oauth/google/authorize", follow_redirects=False)

    assert response.status_code == 302
    assert "https://accounts.google.com/o/oauth2/v2/auth" in response.headers["location"]
    assert "trevo_oauth_state=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]


@pytest.mark.asyncio
async def test_oauth_callback_invalid_state_redirects(monkeypatch):
    monkeypatch.setenv("OAUTH_FRONTEND_CALLBACK_URL", "http://frontend.test/oauth/callback")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/auth/oauth/google/callback?code=fake&state=invalid",
            follow_redirects=False,
        )
    assert response.status_code == 302
    assert "error=" in response.headers["location"]
    assert "trevo_oauth_state=" in response.headers["set-cookie"]


def test_frontend_callback_uses_request_origin(monkeypatch):
    """Sem env vars, o retorno vai para a própria origem — não para localhost.

    Regressão: em produção de mesma origem (ALLOWED_ORIGINS vazio) o fallback
    mandava o usuário para http://localhost:3000 depois de logar no provedor.
    """
    from app import oauth as oauth_module

    monkeypatch.delenv("OAUTH_FRONTEND_CALLBACK_URL", raising=False)
    monkeypatch.setenv("ALLOWED_ORIGINS", "")
    oauth_module.set_request_origin("https://trevo-finance.vercel.app/")

    assert oauth_module.oauth_frontend_callback_url() == "https://trevo-finance.vercel.app/oauth/callback"


def test_provider_callback_uses_request_origin(monkeypatch):
    from app import oauth as oauth_module

    monkeypatch.delenv("OAUTH_REDIRECT_BASE_URL", raising=False)
    oauth_module.set_request_origin("https://trevo-finance.vercel.app/")

    assert (
        oauth_module.provider_callback_url("google")
        == "https://trevo-finance.vercel.app/api/auth/oauth/google/callback"
    )


def test_explicit_env_still_wins(monkeypatch):
    from app import oauth as oauth_module

    monkeypatch.setenv("OAUTH_FRONTEND_CALLBACK_URL", "https://app.exemplo.com/oauth/callback")
    oauth_module.set_request_origin("https://outra-origem.test/")

    assert oauth_module.oauth_frontend_callback_url() == "https://app.exemplo.com/oauth/callback"
