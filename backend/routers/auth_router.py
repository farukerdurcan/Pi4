from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from auth import (
    kullanici_dogrula,
    token_olustur,
    aktif_kullanici,
    sifreyi_hashle
)
from limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Kimlik Doğrulama"])

# Token yanıtı için veri şeması
class TokenYaniti(BaseModel):
    access_token: str
    token_type: str
    kullanici_ad: str
    kullanici_rol: str
    kullanici_email: str

class KullaniciBilgisi(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    rol: str
    aktif: bool

    class Config:
        from_attributes = True

@router.post("/login", response_model=TokenYaniti)
@limiter.limit("5/minute")
async def giris_yap(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı girişi.
    E-posta ve şifre ile giriş yapılır, JWT token döner.
    """
    kullanici = kullanici_dogrula(db, form_data.username, form_data.password)
    if not kullanici:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not kullanici.aktif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmış"
        )
    if not kullanici.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız henüz aktifleştirilmemiş. E-postanızdaki davet linkine tıklayarak şifrenizi belirleyin."
        )

    token = token_olustur(data={"sub": kullanici.email})

    return TokenYaniti(
        access_token=token,
        token_type="bearer",
        kullanici_ad=kullanici.tam_ad,
        kullanici_rol=kullanici.rol.value,
        kullanici_email=kullanici.email
    )

@router.get("/ben", response_model=KullaniciBilgisi)
async def benim_bilgilerim(kullanici: User = Depends(aktif_kullanici)):
    return kullanici


class SifreDegistir(BaseModel):
    mevcut_sifre: str
    yeni_sifre: str


@router.post("/sifre-degistir")
async def sifre_degistir(
    veri: SifreDegistir,
    kullanici: User = Depends(aktif_kullanici),
    db: Session = Depends(get_db)
):
    from auth import sifreyi_dogrula
    if not sifreyi_dogrula(veri.mevcut_sifre, kullanici.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    if len(veri.yeni_sifre) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı")
    kullanici.hashed_password = sifreyi_hashle(veri.yeni_sifre)
    db.commit()
    return {"mesaj": "Şifre başarıyla güncellendi"}


@router.post("/sifre-sifirla-iste")
def sifre_sifirla_iste(veri: SifreSifirlaIste, db: Session = Depends(get_db)):
    """E-posta adresine şifre sıfırlama linki gönderir."""
    import secrets, hashlib, os
    from datetime import datetime, timedelta
    from services.email_service import sifre_sifirla_emaili_olustur

    kullanici = db.query(User).filter(User.email == veri.email).first()
    # Güvenlik: hesap yoksa da aynı mesajı döndür
    if kullanici and kullanici.aktif:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        kullanici.sifirla_token_hash = token_hash
        kullanici.sifirla_token_son_kullanim = datetime.utcnow() + timedelta(minutes=45)
        db.commit()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        link = f"{frontend_url}/sifre-sifirla?token={token}"
        try:
            sifre_sifirla_emaili_olustur(
                alici_email=kullanici.email,
                alici_ad=kullanici.tam_ad,
                sifre_sifirla_linki=link
            )
        except Exception:
            pass

    return {"mesaj": "E-posta adresiniz kayıtlıysa şifre sıfırlama linki gönderildi."}


@router.post("/sifre-sifirla-tamamla")
def sifre_sifirla_tamamla(veri: SifreSifralaTokenle, db: Session = Depends(get_db)):
    """Token ile yeni şifre belirler."""
    import hashlib
    from datetime import datetime

    if len(veri.yeni_sifre) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")

    token_hash = hashlib.sha256(veri.token.encode()).hexdigest()
    kullanici = db.query(User).filter(
        User.sifirla_token_hash == token_hash,
        User.sifirla_token_son_kullanim > datetime.utcnow()
    ).first()

    if not kullanici:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş link")

    kullanici.hashed_password = sifreyi_hashle(veri.yeni_sifre)
    kullanici.sifirla_token_hash = None
    kullanici.sifirla_token_son_kullanim = None
    db.commit()
    return {"mesaj": "Şifreniz güncellendi. Giriş yapabilirsiniz."}


class SifreSifirlaIste(BaseModel):
    email: str


class SifreSifralaTokenle(BaseModel):
    token: str
    yeni_sifre: str


class HesapKur(BaseModel):
    token: str
    yeni_sifre: str


@router.post("/hesap-kur")
def hesap_kur(veri: HesapKur, db: Session = Depends(get_db)):
    """Davet tokenı ile ilk şifre belirleme."""
    import hashlib
    from datetime import datetime

    if len(veri.yeni_sifre) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")

    token_hash = hashlib.sha256(veri.token.encode()).hexdigest()
    kullanici = db.query(User).filter(
        User.davet_token_hash == token_hash,
        User.davet_token_son_kullanim > datetime.utcnow()
    ).first()

    if not kullanici:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş davet linki")

    kullanici.hashed_password = sifreyi_hashle(veri.yeni_sifre)
    kullanici.davet_token_hash = None
    kullanici.davet_token_son_kullanim = None
    db.commit()
    return {"mesaj": "Şifreniz başarıyla belirlendi. Giriş yapabilirsiniz."}
