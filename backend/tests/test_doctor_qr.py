import pytest

from app.auth.security import create_record_qr_token, decode_record_qr_token


def test_signed_record_token_roundtrip():
    token = create_record_qr_token("507f1f77bcf86cd799439011")
    assert decode_record_qr_token(token) == "507f1f77bcf86cd799439011"


def test_signed_record_token_rejects_tampering():
    token = create_record_qr_token("507f1f77bcf86cd799439011")
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    with pytest.raises(ValueError):
        decode_record_qr_token(tampered)
