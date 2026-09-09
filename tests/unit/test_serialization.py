from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder

import app.main as main_module  # noqa: F401  (aplica o encoder de Decimal ao importar)
from app.main import as_utc_datetime, normalize_row


def test_decimal_serializa_como_numero():
    """Dinheiro precisa sair como número JSON, não string.

    O frontend declara esses campos como `number`; quando a serialização mudou
    para string, comparações e gráficos quebraram silenciosamente.
    """
    encoded = jsonable_encoder({"amount": Decimal("125.50"), "zero": Decimal("0.00")})
    assert encoded["amount"] == 125.5
    assert isinstance(encoded["amount"], float)
    assert encoded["zero"] == 0


def test_as_utc_datetime_aceita_iso_do_normalize_row():
    """normalize_row entrega datetime como texto ISO.

    as_utc_datetime precisa entender esse formato: era por não entender que a
    invalidação de token na troca de senha e o bloqueio de login por tentativas
    ficavam desligados sem erro nenhum.
    """
    moment = datetime.now(UTC).replace(microsecond=0)
    row = normalize_row({"password_changed_at": moment})
    assert isinstance(row["password_changed_at"], str)

    parsed = as_utc_datetime(row["password_changed_at"])
    assert parsed == moment

    # Um token emitido antes da troca precisa ser reconhecido como anterior.
    issued_before = moment - timedelta(seconds=5)
    assert issued_before < parsed


def test_as_utc_datetime_rejeita_lixo():
    assert as_utc_datetime(None) is None
    assert as_utc_datetime("nao é data") is None
    assert as_utc_datetime(12345) is None


def test_app_expoe_contrato_de_dinheiro_em_rota_real():
    app = FastAPI()

    @app.get("/valor")
    def valor():
        return {"total": Decimal("2500.00")}

    from fastapi.testclient import TestClient

    body = TestClient(app).get("/valor").json()
    assert body["total"] == 2500
    assert not isinstance(body["total"], str)
