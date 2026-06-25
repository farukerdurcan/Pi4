import json
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import DavetLinki, Atama, AtamaDurumu, FormYaniti, Katilimci, PuanSonucu, Firma
from services.puanlama import puan_hesapla
from services.email_service import tamamlandi_emaili_olustur

router = APIRouter(prefix="/api/form", tags=["Form"])

# ------- Pydantic şemaları -------

class FormBilgisi(BaseModel):
    """Link doğrulandığında dönen bilgi"""
    token: str
    katilimci_ad: str
    katilimci_soyad: str
    katilimci_email: str
    envanter_tipi: str
    envanter_adi: str
    atama_id: int
    tamamlandi: bool
    firma_adi: str = ""
    mevcut_yanitlar: Dict[str, Any] = {}

class YanitKaydet(BaseModel):
    """Kısmi veya tam form yanıtı"""
    yanitlar: Dict[str, Any]
    tamamlandi: bool = False

ENVANTER_ADLARI = {
    "liderlik_stili": "Liderlik Stili",
    "motivasyon": "Motivasyon İhtiyacı",
    "kisisel_etkilesim": "Kişilerarası Etkileşim",
    "problem_cozme": "Problem Çözme Tarzı",
}

# ------- Endpoint'ler -------

@router.get("/{token}", response_model=FormBilgisi)
def form_bilgisi_getir(token: str, db: Session = Depends(get_db)):
    """
    Token ile form bilgisini getirir.
    Katılımcı linke tıkladığında bu endpoint çağrılır.
    """
    link = db.query(DavetLinki).filter(DavetLinki.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Geçersiz veya süresi dolmuş link")
    if link.son_kullanim_tarihi and link.son_kullanim_tarihi.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Bu bağlantının süresi dolmuş")

    atama = link.atama
    katilimci = atama.katilimci

    # Mevcut yanıtları getir (yarım kalan form)
    mevcut = db.query(FormYaniti).filter(FormYaniti.atama_id == atama.id).first()
    mevcut_yanitlar = json.loads(mevcut.yanitlar) if mevcut else {}
    tamamlandi = mevcut.tamamlandi if mevcut else False

    firma_adi = katilimci.firma.ad if katilimci.firma else ""

    return FormBilgisi(
        token=token,
        katilimci_ad=katilimci.ad,
        katilimci_soyad=katilimci.soyad,
        katilimci_email=katilimci.email,
        envanter_tipi=atama.envanter_tipi.value,
        envanter_adi=ENVANTER_ADLARI.get(atama.envanter_tipi.value, atama.envanter_tipi.value),
        atama_id=atama.id,
        tamamlandi=tamamlandi,
        firma_adi=firma_adi,
        mevcut_yanitlar=mevcut_yanitlar
    )


@router.post("/{token}/kaydet", response_model=dict)
def yanit_kaydet(
    token: str,
    veri: YanitKaydet,
    db: Session = Depends(get_db)
):
    """
    Form yanıtlarını kaydeder.
    tamamlandi=False → ara kayıt (devam et)
    tamamlandi=True → formu tamamla
    """
    link = db.query(DavetLinki).filter(DavetLinki.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Geçersiz link")
    if link.son_kullanim_tarihi and link.son_kullanim_tarihi.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Bu bağlantının süresi dolmuş")

    atama = link.atama

    if atama.durum == AtamaDurumu.tamamlandi:
        raise HTTPException(status_code=400, detail="Bu form zaten tamamlandı")

    # Mevcut yanıtı güncelle veya yeni oluştur
    form_yaniti = db.query(FormYaniti).filter(FormYaniti.atama_id == atama.id).first()
    if form_yaniti:
        form_yaniti.yanitlar = json.dumps(veri.yanitlar, ensure_ascii=False)
        form_yaniti.tamamlandi = veri.tamamlandi
    else:
        form_yaniti = FormYaniti(
            atama_id=atama.id,
            yanitlar=json.dumps(veri.yanitlar, ensure_ascii=False),
            tamamlandi=veri.tamamlandi
        )
        db.add(form_yaniti)

    # Durum güncelle
    if veri.tamamlandi:
        atama.durum = AtamaDurumu.tamamlandi
        atama.tamamlanma_tarihi = datetime.utcnow()
        link.kullanildi = True

        # Otomatik puanlama
        try:
            sonuclar = puan_hesapla(
                atama.envanter_tipi.value,
                json.dumps(veri.yanitlar, ensure_ascii=False)
            )
            mevcut_puan = db.query(PuanSonucu).filter(PuanSonucu.atama_id == atama.id).first()
            if mevcut_puan:
                mevcut_puan.sonuclar = json.dumps(sonuclar, ensure_ascii=False)
            else:
                db.add(PuanSonucu(
                    atama_id=atama.id,
                    sonuclar=json.dumps(sonuclar, ensure_ascii=False)
                ))
        except Exception as e:
            print(f"Puanlama hatası: {e}")

        mesaj = "Form başarıyla tamamlandı"

        # Tamamlandı bildirim e-postası
        try:
            katilimci = atama.katilimci
            firma_adi = katilimci.firma.ad if katilimci.firma else ""
            envanter_adi = ENVANTER_ADLARI.get(atama.envanter_tipi.value, atama.envanter_tipi.value)
            tamamlandi_emaili_olustur(
                alici_email=katilimci.email,
                alici_ad=katilimci.tam_ad,
                envanter_adi=envanter_adi,
                firma_adi=firma_adi,
            )
        except Exception as e:
            print(f"Tamamlandı e-postası gönderilemedi: {e}")
    else:
        if atama.durum == AtamaDurumu.gonderildi:
            atama.durum = AtamaDurumu.devam_ediyor
        mesaj = "İlerleme kaydedildi"

    db.commit()
    return {"mesaj": mesaj, "tamamlandi": veri.tamamlandi}
