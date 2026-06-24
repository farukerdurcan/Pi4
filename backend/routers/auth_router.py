from fastapi import APIRouter, Depends, HTTPException, status
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
async def giris_yap(
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
