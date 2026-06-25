import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from database import get_db

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
from models import (
    Katilimci, KatilimciTipi, Atama, AtamaDurumu,
    EnvanterTipi, DavetLinki, Not, User, UserRole, YoneticiKatilimci, Firma
)
from auth import ik_gerektir, aktif_kullanici, yonetici_veya_ik_gerektir
from services.email_service import davet_emaili_olustur, hatirlatma_emaili_olustur

router = APIRouter(prefix="/api/katilimcilar", tags=["Katılımcılar"])

# Envanter adları Türkçe karşılıkları
ENVANTER_ADLARI = {
    "liderlik_stili": "Liderlik Stili",
    "motivasyon": "Motivasyon İhtiyacı",
    "kisisel_etkilesim": "Kişilerarası Etkileşim",
    "problem_cozme": "Problem Çözme Tarzı",
}

# ------- Pydantic şemaları (gelen/giden veri yapıları) -------

class KatilimciOlustur(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    departman: Optional[str] = None
    pozisyon: Optional[str] = None
    tip: KatilimciTipi = KatilimciTipi.aday

class KatilimciGuncelle(BaseModel):
    ad: Optional[str] = None
    soyad: Optional[str] = None
    departman: Optional[str] = None
    pozisyon: Optional[str] = None
    tip: Optional[KatilimciTipi] = None

class AsamaYaniti(BaseModel):
    id: int
    envanter_tipi: str
    envanter_adi: str
    durum: str
    gonderim_tarihi: Optional[datetime]
    tamamlanma_tarihi: Optional[datetime]
    token: Optional[str]

    class Config:
        from_attributes = True

class NotYaniti(BaseModel):
    id: int
    metin: str
    ik_adi: str
    rapora_dahil: bool = False
    yoneticiden_gizle: bool = False
    olusturulma_tarihi: datetime

    class Config:
        from_attributes = True

class KatilimciYaniti(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    departman: Optional[str]
    pozisyon: Optional[str]
    tip: str
    olusturulma_tarihi: datetime
    atamalar: List[AsamaYaniti] = []
    notlar: List[NotYaniti] = []

    class Config:
        from_attributes = True

class KatilimciListeYaniti(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    departman: Optional[str]
    pozisyon: Optional[str]
    tip: str
    olusturulma_tarihi: datetime
    atama_sayisi: int = 0
    tamamlanan_sayisi: int = 0

class EnvanterAta(BaseModel):
    envanter_tipleri: List[EnvanterTipi]
    dil: str = "tr"

class NotEkle(BaseModel):
    metin: str
    rapora_dahil: bool = False
    yoneticiden_gizle: bool = False

class PanelIstatistik(BaseModel):
    toplam: int
    bekleyen: int
    tamamlanan: int
    raporlanan: int

# ------- Helper fonksiyonlar -------

def _firma_adini_getir(firma_id: int, db: Session) -> str:
    """IK kullanıcısının firmasının adını döner."""
    firma = db.query(Firma).filter(Firma.id == firma_id).first()
    return firma.ad if firma else ""


def _firma_katilimcisini_getir(katilimci_id: int, firma_id: int, db: Session) -> Katilimci:
    """Katılımcıyı getirir; firma uyuşmazlığında 404 fırlatır (IDOR önlemi)."""
    k = db.query(Katilimci).filter(
        Katilimci.id == katilimci_id,
        Katilimci.firma_id == firma_id,
        Katilimci.aktif == True
    ).first()
    if not k:
        raise HTTPException(status_code=404, detail="Katılımcı bulunamadı")
    return k


def atama_yaniti_olustur(atama: Atama) -> AsamaYaniti:
    token = atama.davet_linki.token if atama.davet_linki else None
    return AsamaYaniti(
        id=atama.id,
        envanter_tipi=atama.envanter_tipi.value,
        envanter_adi=ENVANTER_ADLARI.get(atama.envanter_tipi.value, atama.envanter_tipi.value),
        durum=atama.durum.value,
        gonderim_tarihi=atama.gonderim_tarihi,
        tamamlanma_tarihi=atama.tamamlanma_tarihi,
        token=token
    )

# ------- Endpoint'ler -------

@router.get("/istatistik", response_model=PanelIstatistik)
def panel_istatistik(
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Ana paneldeki 4 metrik kartın verilerini döner"""
    firma_id = kullanici.firma_id
    toplam = db.query(Katilimci).filter(Katilimci.aktif == True, Katilimci.firma_id == firma_id).count()

    # Bekleyen: en az 1 atama var ama hiç tamamlanmamış
    bekleyen = db.query(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == firma_id,
        Katilimci.atamalar.any(Atama.durum.in_([
            AtamaDurumu.gonderildi, AtamaDurumu.devam_ediyor
        ]))
    ).count()

    # Tamamlanan: en az 1 atama tamamlanmış
    tamamlanan = db.query(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == firma_id,
        Katilimci.atamalar.any(Atama.durum == AtamaDurumu.tamamlandi)
    ).count()

    # Raporlanan: en az 1 atama raporlanmış
    raporlanan = db.query(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == firma_id,
        Katilimci.atamalar.any(Atama.durum == AtamaDurumu.raporlandi)
    ).count()

    return PanelIstatistik(
        toplam=toplam,
        bekleyen=bekleyen,
        tamamlanan=tamamlanan,
        raporlanan=raporlanan
    )


@router.get("", response_model=List[KatilimciListeYaniti])
def katilimci_listesi(
    arama: Optional[str] = None,
    departman: Optional[str] = None,
    tip: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    kullanici: User = Depends(yonetici_veya_ik_gerektir)
):
    """Tüm katılımcıları listeler. Yönetici ise sadece atanmışları görür."""
    sorgu = db.query(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == kullanici.firma_id
    ).options(joinedload(Katilimci.atamalar))

    # Yönetici sadece kendisine atanmış katılımcıları görür
    if kullanici.rol == UserRole.yonetici:
        atanan_idler = db.query(YoneticiKatilimci.katilimci_id).filter(
            YoneticiKatilimci.yonetici_id == kullanici.id
        ).subquery()
        sorgu = sorgu.filter(Katilimci.id.in_(atanan_idler))

    if arama:
        sorgu = sorgu.filter(
            (Katilimci.ad + " " + Katilimci.soyad).ilike(f"%{arama}%") |
            Katilimci.email.ilike(f"%{arama}%")
        )
    if departman:
        sorgu = sorgu.filter(Katilimci.departman == departman)
    if tip:
        sorgu = sorgu.filter(Katilimci.tip == tip)

    sorgu = sorgu.order_by(Katilimci.olusturulma_tarihi.desc())
    if limit:
        sorgu = sorgu.limit(limit)
    katilimcilar = sorgu.all()

    sonuc = []
    for k in katilimcilar:
        atama_sayisi = len(k.atamalar)
        tamamlanan = sum(1 for a in k.atamalar if a.durum == AtamaDurumu.tamamlandi)
        sonuc.append(KatilimciListeYaniti(
            id=k.id, ad=k.ad, soyad=k.soyad, email=k.email,
            departman=k.departman, pozisyon=k.pozisyon,
            tip=k.tip.value,
            olusturulma_tarihi=k.olusturulma_tarihi,
            atama_sayisi=atama_sayisi,
            tamamlanan_sayisi=tamamlanan
        ))
    return sonuc


class KatilimciOlusturRequest(BaseModel):
    ad: str
    soyad: str
    email: EmailStr
    departman: Optional[str] = None
    pozisyon: Optional[str] = None
    tip: KatilimciTipi = KatilimciTipi.aday
    envanter_tipleri: Optional[List[EnvanterTipi]] = None
    dil: str = "tr"

@router.post("", response_model=KatilimciYaniti, status_code=status.HTTP_201_CREATED)
def katilimci_ekle(
    istek: KatilimciOlusturRequest,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Yeni katılımcı ekler. İsteğe bağlı olarak envanter de atayabilir."""
    veri = istek
    envanter_tipleri = istek.envanter_tipleri or []
    dil = istek.dil
    # E-posta tekrarını firma bazında kontrol et
    mevcut = db.query(Katilimci).filter(
        Katilimci.email == veri.email,
        Katilimci.firma_id == kullanici.firma_id
    ).first()
    if mevcut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle kayıtlı bir katılımcı zaten var"
        )

    katilimci = Katilimci(
        ad=veri.ad, soyad=veri.soyad, email=veri.email,
        departman=veri.departman, pozisyon=veri.pozisyon, tip=veri.tip,
        firma_id=kullanici.firma_id
    )
    db.add(katilimci)
    db.flush()

    # Envanter atamaları varsa ekle
    firma_adi = _firma_adini_getir(kullanici.firma_id, db)
    if envanter_tipleri:
        for tip in envanter_tipleri:
            atama = Atama(
                katilimci_id=katilimci.id,
                envanter_tipi=tip,
                durum=AtamaDurumu.gonderildi
            )
            db.add(atama)
            db.flush()

            # Benzersiz token üret
            token = str(uuid.uuid4())
            link = DavetLinki(
                atama_id=atama.id,
                token=token,
                son_kullanim_tarihi=datetime.utcnow() + timedelta(days=30)
            )
            db.add(link)
            db.flush()

            form_linki = f"{FRONTEND_URL}/form/{token}"
            envanter_adi = ENVANTER_ADLARI.get(tip.value, tip.value)
            davet_emaili_olustur(
                alici_email=katilimci.email,
                alici_ad=katilimci.tam_ad,
                envanter_adi=envanter_adi,
                form_linki=form_linki,
                firma_adi=firma_adi,
                dil=dil
            )

    db.commit()
    db.refresh(katilimci)

    return _katilimci_yaniti_olustur(katilimci)


class GonderimYaniti(BaseModel):
    atama_id: int
    katilimci_id: int
    katilimci_ad: str
    katilimci_email: str
    departman: Optional[str]
    pozisyon: Optional[str]
    envanter_tipi: str
    envanter_adi: str
    durum: str
    gonderim_tarihi: Optional[datetime]
    tamamlanma_tarihi: Optional[datetime]
    gecen_gun: Optional[int]


@router.get("/gonderimleri", response_model=List[GonderimYaniti])
def gonderimleri_listele(
    durum: Optional[str] = None,
    envanter_tipi: Optional[str] = None,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Tüm atamaları gönderim takip listesi olarak döner."""
    sorgu = db.query(Atama).join(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == kullanici.firma_id
    )
    if durum:
        sorgu = sorgu.filter(Atama.durum == durum)
    if envanter_tipi:
        sorgu = sorgu.filter(Atama.envanter_tipi == envanter_tipi)
    sorgu = sorgu.order_by(Atama.gonderim_tarihi.desc())

    simdi = datetime.utcnow()
    sonuc = []
    for a in sorgu.all():
        k = a.katilimci
        gecen = None
        if a.gonderim_tarihi and a.durum not in (AtamaDurumu.tamamlandi, AtamaDurumu.raporlandi):
            gonderim = a.gonderim_tarihi.replace(tzinfo=None) if a.gonderim_tarihi.tzinfo else a.gonderim_tarihi
            gecen = (simdi - gonderim).days
        sonuc.append(GonderimYaniti(
            atama_id=a.id,
            katilimci_id=k.id,
            katilimci_ad=k.tam_ad,
            katilimci_email=k.email,
            departman=k.departman,
            pozisyon=k.pozisyon,
            envanter_tipi=a.envanter_tipi.value,
            envanter_adi=ENVANTER_ADLARI.get(a.envanter_tipi.value, a.envanter_tipi.value),
            durum=a.durum.value,
            gonderim_tarihi=a.gonderim_tarihi,
            tamamlanma_tarihi=a.tamamlanma_tarihi,
            gecen_gun=gecen
        ))
    return sonuc


@router.post("/toplu-hatirlatma")
def toplu_hatirlatma_gonder(
    gun_esigi: int = 5,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """5+ gündür tamamlanmamış atamalara toplu hatırlatma e-postası gönderir."""
    esik = datetime.utcnow() - timedelta(days=gun_esigi)

    atamalar = db.query(Atama).join(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == kullanici.firma_id,
        Atama.durum.in_([AtamaDurumu.gonderildi, AtamaDurumu.devam_ediyor]),
        Atama.gonderim_tarihi <= esik
    ).all()

    firma_adi = _firma_adini_getir(kullanici.firma_id, db)
    gonderilen = 0
    for a in atamalar:
        k = a.katilimci
        token = a.davet_linki.token if a.davet_linki else None
        if not token:
            continue
        form_linki = f"{FRONTEND_URL}/form/{token}"
        envanter_adi = ENVANTER_ADLARI.get(a.envanter_tipi.value, a.envanter_tipi.value)
        try:
            hatirlatma_emaili_olustur(
                alici_email=k.email,
                alici_ad=k.tam_ad,
                envanter_adi=envanter_adi,
                form_linki=form_linki,
                firma_adi=firma_adi,
                dil="tr"
            )
            gonderilen += 1
        except Exception:
            pass

    return {"mesaj": f"{gonderilen} kişiye hatırlatma gönderildi", "toplam": gonderilen}


@router.get("/bekleme-sayisi")
def bekleme_sayisi(
    gun_esigi: int = 5,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Panel uyarı bandı için: N+ gündür bekleyen atama sayısını döner."""
    esik = datetime.utcnow() - timedelta(days=gun_esigi)
    sayi = db.query(Atama).join(Katilimci).filter(
        Katilimci.aktif == True,
        Katilimci.firma_id == kullanici.firma_id,
        Atama.durum.in_([AtamaDurumu.gonderildi, AtamaDurumu.devam_ediyor]),
        Atama.gonderim_tarihi <= esik
    ).count()
    return {"sayi": sayi, "gun_esigi": gun_esigi}


@router.get("/{katilimci_id}", response_model=KatilimciYaniti)
def katilimci_detay(
    katilimci_id: int,
    db: Session = Depends(get_db),
    kullanici: User = Depends(yonetici_veya_ik_gerektir)
):
    """Katılımcı profil sayfası için tüm bilgileri döner"""
    # Yönetici sadece kendisine atanmış katılımcıyı görebilir
    if kullanici.rol == UserRole.yonetici:
        atama = db.query(YoneticiKatilimci).filter(
            YoneticiKatilimci.yonetici_id == kullanici.id,
            YoneticiKatilimci.katilimci_id == katilimci_id
        ).first()
        if not atama:
            raise HTTPException(status_code=403, detail="Bu katılımcıya erişim yetkiniz yok")

    k = _firma_katilimcisini_getir(katilimci_id, kullanici.firma_id, db)
    return _katilimci_yaniti_olustur(k)


@router.patch("/{katilimci_id}", response_model=KatilimciYaniti)
def katilimci_guncelle(
    katilimci_id: int,
    veri: KatilimciGuncelle,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Katılımcı bilgilerini günceller"""
    k = _firma_katilimcisini_getir(katilimci_id, kullanici.firma_id, db)

    for alan, deger in veri.model_dump(exclude_unset=True).items():
        setattr(k, alan, deger)
    db.commit()
    db.refresh(k)
    return _katilimci_yaniti_olustur(k)


@router.post("/{katilimci_id}/envanter-ata", response_model=KatilimciYaniti)
def envanter_ata(
    katilimci_id: int,
    veri: EnvanterAta,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Var olan katılımcıya yeni envanter(ler) atar ve e-posta gönderir"""
    k = _firma_katilimcisini_getir(katilimci_id, kullanici.firma_id, db)

    for tip in veri.envanter_tipleri:
        # Aynı envanter zaten atanmış mı?
        mevcut = db.query(Atama).filter(
            Atama.katilimci_id == katilimci_id,
            Atama.envanter_tipi == tip
        ).first()
        if mevcut:
            continue

        atama = Atama(
            katilimci_id=katilimci_id,
            envanter_tipi=tip,
            durum=AtamaDurumu.gonderildi
        )
        db.add(atama)
        db.flush()

        token = str(uuid.uuid4())
        link = DavetLinki(atama_id=atama.id, token=token)
        db.add(link)
        db.flush()

        form_linki = f"{FRONTEND_URL}/form/{token}"
        envanter_adi = ENVANTER_ADLARI.get(tip.value, tip.value)
        davet_emaili_olustur(
            alici_email=k.email,
            alici_ad=k.tam_ad,
            envanter_adi=envanter_adi,
            form_linki=form_linki,
            firma_adi=_firma_adini_getir(kullanici.firma_id, db),
            dil=veri.dil
        )

    db.commit()
    db.refresh(k)
    return _katilimci_yaniti_olustur(k)


@router.post("/{katilimci_id}/hatirlatma/{atama_id}")
def hatirlatma_gonder(
    katilimci_id: int,
    atama_id: int,
    dil: str = "tr",
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Belirtilen atama için hatırlatma e-postası gönderir"""
    k = _firma_katilimcisini_getir(katilimci_id, kullanici.firma_id, db)

    atama = db.query(Atama).filter(
        Atama.id == atama_id,
        Atama.katilimci_id == katilimci_id
    ).first()
    if not atama:
        raise HTTPException(status_code=404, detail="Atama bulunamadı")

    if atama.durum == AtamaDurumu.tamamlandi:
        raise HTTPException(status_code=400, detail="Bu form zaten tamamlandı")

    token = atama.davet_linki.token if atama.davet_linki else None
    if not token:
        raise HTTPException(status_code=400, detail="Bu atama için link bulunamadı")

    form_linki = f"{FRONTEND_URL}/form/{token}"
    envanter_adi = ENVANTER_ADLARI.get(atama.envanter_tipi.value, atama.envanter_tipi.value)

    hatirlatma_emaili_olustur(
        alici_email=k.email,
        alici_ad=k.tam_ad,
        envanter_adi=envanter_adi,
        form_linki=form_linki,
        firma_adi=_firma_adini_getir(kullanici.firma_id, db),
        dil=dil
    )
    return {"mesaj": "Hatırlatma e-postası gönderildi"}


@router.post("/{katilimci_id}/not", response_model=NotYaniti)
def not_ekle(
    katilimci_id: int,
    veri: NotEkle,
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """Katılımcıya İK notu ekler"""
    k = _firma_katilimcisini_getir(katilimci_id, kullanici.firma_id, db)

    not_kaydi = Not(
        katilimci_id=katilimci_id,
        ik_kullanici_id=kullanici.id,
        metin=veri.metin,
        rapora_dahil=veri.rapora_dahil,
        yoneticiden_gizle=veri.yoneticiden_gizle
    )
    db.add(not_kaydi)
    db.commit()
    db.refresh(not_kaydi)

    return NotYaniti(
        id=not_kaydi.id,
        metin=not_kaydi.metin,
        ik_adi=kullanici.tam_ad,
        olusturulma_tarihi=not_kaydi.olusturulma_tarihi
    )


def _katilimci_yaniti_olustur(k: Katilimci) -> KatilimciYaniti:
    """Katılımcı modelini API yanıtına dönüştürür"""
    atamalar = [atama_yaniti_olustur(a) for a in k.atamalar]
    notlar = [
        NotYaniti(
            id=n.id,
            metin=n.metin,
            ik_adi=n.ik_kullanici.tam_ad if n.ik_kullanici else "İK",
            rapora_dahil=n.rapora_dahil,
            yoneticiden_gizle=n.yoneticiden_gizle,
            olusturulma_tarihi=n.olusturulma_tarihi
        )
        for n in sorted(k.notlar, key=lambda x: x.olusturulma_tarihi, reverse=True)
    ]
    return KatilimciYaniti(
        id=k.id, ad=k.ad, soyad=k.soyad, email=k.email,
        departman=k.departman, pozisyon=k.pozisyon,
        tip=k.tip.value,
        olusturulma_tarihi=k.olusturulma_tarihi,
        atamalar=atamalar,
        notlar=notlar
    )

