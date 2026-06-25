import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models import User, UserRole, Katilimci, YoneticiKatilimci
from auth import ik_gerektir

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/api/yoneticiler", tags=["Yöneticiler"])


# ------- Pydantic şemaları -------

class YoneticiOlustur(BaseModel):
    ad: str
    soyad: str
    email: EmailStr


class YoneticiYaniti(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    aktif: bool
    atanan_katilimci_sayisi: int = 0

    class Config:
        from_attributes = True


class AtananKatilimci(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    departman: Optional[str]
    pozisyon: Optional[str]

    class Config:
        from_attributes = True


class YoneticiDetay(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    aktif: bool
    atanan_katilimcilar: List[AtananKatilimci] = []

    class Config:
        from_attributes = True


class KatilimciAtaIstek(BaseModel):
    katilimci_idler: List[int]


# ------- Endpoint'ler -------

@router.get("", response_model=List[YoneticiYaniti])
def yonetici_listesi(
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    yoneticiler = db.query(User).filter(
        User.rol == UserRole.yonetici,
        User.firma_id == kullanici.firma_id,
        User.aktif == True
    ).order_by(User.ad).all()

    sonuc = []
    for y in yoneticiler:
        sayi = db.query(YoneticiKatilimci).filter(
            YoneticiKatilimci.yonetici_id == y.id
        ).count()
        sonuc.append(YoneticiYaniti(
            id=y.id, ad=y.ad, soyad=y.soyad,
            email=y.email, aktif=y.aktif,
            atanan_katilimci_sayisi=sayi
        ))
    return sonuc


@router.post("", response_model=YoneticiYaniti, status_code=status.HTTP_201_CREATED)
def yonetici_olustur(
    istek: YoneticiOlustur,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    mevcut = db.query(User).filter(User.email == istek.email).first()
    if mevcut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanımda"
        )

    davet_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(davet_token.encode()).hexdigest()
    token_son_kullanim = datetime.utcnow() + timedelta(hours=72)

    yeni = User(
        ad=istek.ad,
        soyad=istek.soyad,
        email=istek.email,
        hashed_password=None,
        rol=UserRole.yonetici,
        firma_id=kullanici.firma_id,
        aktif=True,
        davet_token_hash=token_hash,
        davet_token_son_kullanim=token_son_kullanim
    )
    db.add(yeni)
    db.commit()
    db.refresh(yeni)

    hesap_kur_linki = f"{FRONTEND_URL}/hesap-kur?token={davet_token}"
    try:
        from services.email_service import ik_davet_emaili_olustur
        firma_adi = kullanici.firma.ad if kullanici.firma else ""
        ik_davet_emaili_olustur(
            alici_email=yeni.email,
            alici_ad=yeni.tam_ad,
            firma_adi=firma_adi,
            hesap_kur_linki=hesap_kur_linki
        )
    except Exception:
        pass

    return YoneticiYaniti(
        id=yeni.id, ad=yeni.ad, soyad=yeni.soyad,
        email=yeni.email, aktif=yeni.aktif,
        atanan_katilimci_sayisi=0
    )


@router.get("/{yonetici_id}", response_model=YoneticiDetay)
def yonetici_detay(
    yonetici_id: int,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    yonetici = db.query(User).filter(
        User.id == yonetici_id,
        User.rol == UserRole.yonetici,
        User.firma_id == kullanici.firma_id
    ).first()
    if not yonetici:
        raise HTTPException(status_code=404, detail="Yönetici bulunamadı")

    atamalar = db.query(YoneticiKatilimci).filter(
        YoneticiKatilimci.yonetici_id == yonetici_id
    ).all()
    katilimci_idler = [a.katilimci_id for a in atamalar]
    katilimcilar = db.query(Katilimci).filter(
        Katilimci.id.in_(katilimci_idler)
    ).all() if katilimci_idler else []

    return YoneticiDetay(
        id=yonetici.id, ad=yonetici.ad, soyad=yonetici.soyad,
        email=yonetici.email, aktif=yonetici.aktif,
        atanan_katilimcilar=[
            AtananKatilimci(
                id=k.id, ad=k.ad, soyad=k.soyad,
                email=k.email, departman=k.departman, pozisyon=k.pozisyon
            ) for k in katilimcilar
        ]
    )


@router.put("/{yonetici_id}/katilimcilar")
def katilimci_ata(
    yonetici_id: int,
    istek: KatilimciAtaIstek,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Yöneticinin erişebileceği katılımcı listesini tamamen günceller (üzerine yazar)."""
    yonetici = db.query(User).filter(
        User.id == yonetici_id,
        User.rol == UserRole.yonetici,
        User.firma_id == kullanici.firma_id
    ).first()
    if not yonetici:
        raise HTTPException(status_code=404, detail="Yönetici bulunamadı")

    # Atanacak katılımcıların bu firmaya ait olduğunu doğrula
    if istek.katilimci_idler:
        firma_katilimci_sayisi = db.query(Katilimci).filter(
            Katilimci.id.in_(istek.katilimci_idler),
            Katilimci.firma_id == kullanici.firma_id
        ).count()
        if firma_katilimci_sayisi != len(istek.katilimci_idler):
            raise HTTPException(status_code=403, detail="Bazı katılımcılar bu firmaya ait değil")

    # Mevcut atamaları sil, yenileri ekle
    db.query(YoneticiKatilimci).filter(
        YoneticiKatilimci.yonetici_id == yonetici_id
    ).delete()

    for kid in istek.katilimci_idler:
        db.add(YoneticiKatilimci(yonetici_id=yonetici_id, katilimci_id=kid))

    db.commit()
    return {"mesaj": f"{len(istek.katilimci_idler)} katılımcı atandı"}
