import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models import Firma, User, UserRole, Katilimci
from auth import super_admin_gerektir
from services.email_service import ik_davet_emaili_olustur

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/api/yonetim", tags=["Süper Yönetim"])


# ─── Pydantic şemaları ────────────────────────────────────────────────────────

class FirmaOlustur(BaseModel):
    ad: str
    slug: str
    aktif: bool = True


class FirmaGuncelle(BaseModel):
    ad: Optional[str] = None
    aktif: Optional[bool] = None


class IKKullaniciOlustur(BaseModel):
    ad: str
    soyad: str
    email: EmailStr


class SifreSifirla(BaseModel):
    yeni_sifre: str


class FirmaYaniti(BaseModel):
    id: int
    ad: str
    slug: str
    aktif: bool
    ik_sayisi: int = 0
    katilimci_sayisi: int = 0

    class Config:
        from_attributes = True


class IKKullaniciYaniti(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    aktif: bool

    class Config:
        from_attributes = True


# ─── Firma endpoint'leri ──────────────────────────────────────────────────────

@router.get("/firmalar", response_model=List[FirmaYaniti])
def firma_listesi(
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    firmalar = db.query(Firma).order_by(Firma.olusturulma_tarihi.desc()).all()
    sonuc = []
    for f in firmalar:
        ik_sayisi = db.query(User).filter(
            User.firma_id == f.id,
            User.rol == UserRole.ik_yoneticisi
        ).count()
        katilimci_sayisi = db.query(Katilimci).filter(
            Katilimci.firma_id == f.id,
            Katilimci.aktif == True
        ).count()
        sonuc.append(FirmaYaniti(
            id=f.id, ad=f.ad, slug=f.slug, aktif=f.aktif,
            ik_sayisi=ik_sayisi, katilimci_sayisi=katilimci_sayisi
        ))
    return sonuc


@router.post("/firmalar", response_model=FirmaYaniti, status_code=status.HTTP_201_CREATED)
def firma_olustur(
    istek: FirmaOlustur,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    mevcut = db.query(Firma).filter(Firma.slug == istek.slug).first()
    if mevcut:
        raise HTTPException(status_code=400, detail="Bu slug zaten kullanımda")

    firma = Firma(ad=istek.ad, slug=istek.slug, aktif=istek.aktif)
    db.add(firma)
    db.commit()
    db.refresh(firma)
    return FirmaYaniti(id=firma.id, ad=firma.ad, slug=firma.slug, aktif=firma.aktif)


@router.patch("/firmalar/{firma_id}", response_model=FirmaYaniti)
def firma_guncelle(
    firma_id: int,
    istek: FirmaGuncelle,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    firma = db.query(Firma).filter(Firma.id == firma_id).first()
    if not firma:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")

    if istek.ad is not None:
        firma.ad = istek.ad
    if istek.aktif is not None:
        firma.aktif = istek.aktif

    db.commit()
    db.refresh(firma)

    ik_sayisi = db.query(User).filter(
        User.firma_id == firma.id, User.rol == UserRole.ik_yoneticisi
    ).count()
    katilimci_sayisi = db.query(Katilimci).filter(
        Katilimci.firma_id == firma.id, Katilimci.aktif == True
    ).count()
    return FirmaYaniti(
        id=firma.id, ad=firma.ad, slug=firma.slug, aktif=firma.aktif,
        ik_sayisi=ik_sayisi, katilimci_sayisi=katilimci_sayisi
    )


# ─── IK kullanıcı endpoint'leri ──────────────────────────────────────────────

@router.get("/firmalar/{firma_id}/kullanicilar", response_model=List[IKKullaniciYaniti])
def firma_kullanicilari(
    firma_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    firma = db.query(Firma).filter(Firma.id == firma_id).first()
    if not firma:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")

    kullanicilar = db.query(User).filter(
        User.firma_id == firma_id,
        User.rol == UserRole.ik_yoneticisi
    ).order_by(User.ad).all()
    return kullanicilar


@router.post("/firmalar/{firma_id}/kullanicilar", response_model=IKKullaniciYaniti, status_code=status.HTTP_201_CREATED)
def ik_kullanici_ekle(
    firma_id: int,
    istek: IKKullaniciOlustur,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    firma = db.query(Firma).filter(Firma.id == firma_id).first()
    if not firma:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")

    mevcut = db.query(User).filter(User.email == istek.email).first()
    if mevcut:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda")

    davet_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(davet_token.encode()).hexdigest()
    token_son_kullanim = datetime.utcnow() + timedelta(hours=72)

    kullanici = User(
        ad=istek.ad,
        soyad=istek.soyad,
        email=istek.email,
        hashed_password=None,
        rol=UserRole.ik_yoneticisi,
        firma_id=firma_id,
        aktif=True,
        davet_token_hash=token_hash,
        davet_token_son_kullanim=token_son_kullanim
    )
    db.add(kullanici)
    db.commit()
    db.refresh(kullanici)

    hesap_kur_linki = f"{FRONTEND_URL}/hesap-kur?token={davet_token}"
    try:
        ik_davet_emaili_olustur(
            alici_email=kullanici.email,
            alici_ad=kullanici.tam_ad,
            firma_adi=firma.ad,
            hesap_kur_linki=hesap_kur_linki
        )
    except Exception:
        pass

    return kullanici


@router.delete("/firmalar/{firma_id}/kullanicilar/{kullanici_id}", status_code=status.HTTP_204_NO_CONTENT)
def ik_kullanici_sil(
    firma_id: int,
    kullanici_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    kullanici = db.query(User).filter(
        User.id == kullanici_id,
        User.firma_id == firma_id,
        User.rol == UserRole.ik_yoneticisi
    ).first()
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    kullanici.aktif = False
    db.commit()


@router.post("/firmalar/{firma_id}/kullanicilar/{kullanici_id}/sifre")
def sifre_sifirla(
    firma_id: int,
    kullanici_id: int,
    istek: SifreSifirla,
    db: Session = Depends(get_db),
    _: User = Depends(super_admin_gerektir)
):
    kullanici = db.query(User).filter(
        User.id == kullanici_id,
        User.firma_id == firma_id,
        User.rol == UserRole.ik_yoneticisi
    ).first()
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    kullanici.hashed_password = sifreyi_hashle(istek.yeni_sifre)
    db.commit()
    return {"mesaj": "Şifre güncellendi"}
