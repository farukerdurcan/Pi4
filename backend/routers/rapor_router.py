import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Katilimci, Atama, AtamaDurumu, PuanSonucu, EnvanterTipi
from auth import ik_gerektir, yonetici_veya_ik_gerektir, User

router = APIRouter(prefix="/api/rapor", tags=["Raporlar"])

ENVANTER_ADLARI = {
    "liderlik_stili": "Liderlik Stili",
    "motivasyon": "Motivasyon İhtiyacı",
    "kisisel_etkilesim": "Kişilerarası Etkileşim",
    "problem_cozme": "Problem Çözme Tarzı",
}

# ─── Yorum kütüphanesi ───────────────────────────────────────────────────────

LIDERLIK_YORUMLAR = {
    "Cesur": {
        "guclu": ["Hızlı karar verebilme", "Sonuç odaklılık", "Bağımsız çalışabilme"],
        "gelisim": ["Dinleme becerilerini geliştirme", "Sabır ve empati", "Risk yönetimi"],
        "yonetim": [
            "Yetkili bir pozisyon ve meydan okuyucu projeler verin",
            "Yenilikçi fikirlerini onaylayın ve destekleyin",
            "Kısa vadeli, somut hedefler belirleyin",
        ]
    },
    "Etkileyici": {
        "guclu": ["İkna ve motivasyon gücü", "İnsan odaklı yaklaşım", "Pozitif enerji"],
        "gelisim": ["Yapısal düşünme", "Detay yönetimi", "Zamanı verimli kullanma"],
        "yonetim": [
            "Sosyal etkileşim ve takım çalışması fırsatları tanıyın",
            "Sunum yapma ve fikirlerini paylaşma alanı yaratın",
            "Arkadaşça ve destekleyici bir ortam sağlayın",
        ]
    },
    "Sempatik": {
        "guclu": ["Güven oluşturma", "Sadakat ve bağlılık", "İş birliği ve uyum"],
        "gelisim": ["Değişime açıklık", "Kararlılık ve girişkenlik", "Çatışma yönetimi"],
        "yonetim": [
            "Rutin ve istikrarlı görevler verin",
            "Çalışmasını takdir edin, minnettarlığınızı ifade edin",
            "Değişimleri yavaş ve önceden bildirerek yapın",
        ]
    },
    "Teknik": {
        "guclu": ["Detaylara dikkat", "Doğruluk ve titizlik", "Analitik düşünce"],
        "gelisim": ["Hız ve karar alma", "Kişiler arası iletişim", "Esneklik"],
        "yonetim": [
            "Net yapı ve organizasyon sağlayın",
            "Adım adım görev tanımı yapın",
            "Mantıksal analiz yapabileceği fırsatlar tanıyın",
        ]
    },
}

PROBLEM_YORUMLAR = {
    "İdealist": {
        "guclu": ["Vizyon ve ileri görüşlülük", "Hedef belirleme", "Büyük resmi görme"],
        "gelisim": ["Harekete geçme", "Pratik uygulama", "Sabırsızlık yönetimi"],
    },
    "Aktivist": {
        "guclu": ["Hızlı aksiyon alma", "Girişimcilik", "Enerji ve hız"],
        "gelisim": ["Analiz ve planlama", "Risk değerlendirme", "Sabır"],
    },
    "Realist": {
        "guclu": ["Analitik düşünce", "Veri odaklılık", "Dikkatli değerlendirme"],
        "gelisim": ["Harekete geçme hızı", "Belirsizliğe tolerans", "Vizyon geliştirme"],
    },
}

# ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

def puan_getir(atama: Atama, db: Session) -> Optional[Dict]:
    """Atamaya ait puan sonucunu veritabanından çeker"""
    kayit = db.query(PuanSonucu).filter(PuanSonucu.atama_id == atama.id).first()
    if kayit:
        try:
            return json.loads(kayit.sonuclar)
        except Exception:
            return None
    return None

def bireysel_rapor_olustur(atama: Atama, db: Session) -> Dict:
    """Tek envanter için zenginleştirilmiş rapor"""
    puan = puan_getir(atama, db)
    if not puan:
        return {"envanter_tipi": atama.envanter_tipi.value, "puan_yok": True}

    tip = atama.envanter_tipi.value
    rapor = {
        "envanter_tipi": tip,
        "envanter_adi": ENVANTER_ADLARI.get(tip, tip),
        "atama_id": atama.id,
        "tamamlanma_tarihi": atama.tamamlanma_tarihi.isoformat() if atama.tamamlanma_tarihi else None,
        "puanlar": puan,
    }

    # Liderlik yorumları
    if tip == "liderlik_stili":
        birincil = puan.get("birincil_stil", "")
        yorumlar = LIDERLIK_YORUMLAR.get(birincil, {})
        rapor["guclu_yonler"] = yorumlar.get("guclu", [])
        rapor["gelisim_alanlari"] = yorumlar.get("gelisim", [])
        rapor["yonetim_onerileri"] = yorumlar.get("yonetim", [])

    # Problem çözme yorumları
    elif tip == "problem_cozme":
        birincil = puan.get("birincil_tarz", "")
        yorumlar = PROBLEM_YORUMLAR.get(birincil, {})
        rapor["guclu_yonler"] = yorumlar.get("guclu", [])
        rapor["gelisim_alanlari"] = yorumlar.get("gelisim", [])

    return rapor


# ─── Endpoint'ler ────────────────────────────────────────────────────────────

@router.get("/{katilimci_id}/bireysel/{atama_id}")
def bireysel_rapor(
    katilimci_id: int,
    atama_id: int,
    db: Session = Depends(get_db),
    kullanici: User = Depends(yonetici_veya_ik_gerektir)
):
    """Tek bir envanterin detaylı raporu"""
    atama = db.query(Atama).filter(
        Atama.id == atama_id,
        Atama.katilimci_id == katilimci_id
    ).first()
    if not atama:
        raise HTTPException(status_code=404, detail="Atama bulunamadı")
    if atama.durum not in [AtamaDurumu.tamamlandi, AtamaDurumu.raporlandi]:
        raise HTTPException(status_code=400, detail="Bu form henüz tamamlanmadı")

    k = db.query(Katilimci).filter(
        Katilimci.id == katilimci_id,
        Katilimci.firma_id == kullanici.firma_id
    ).first()
    if not k:
        raise HTTPException(status_code=404, detail="Katılımcı bulunamadı")
    return {
        "katilimci": {
            "id": k.id, "ad": k.ad, "soyad": k.soyad,
            "departman": k.departman, "pozisyon": k.pozisyon, "tip": k.tip.value
        },
        "rapor": bireysel_rapor_olustur(atama, db)
    }


@router.get("/{katilimci_id}/butunlesik")
def butunlesik_rapor(
    katilimci_id: int,
    db: Session = Depends(get_db),
    kullanici: User = Depends(yonetici_veya_ik_gerektir)
):
    """Katılımcının tüm tamamlanmış envanterleri tek raporda"""
    k = db.query(Katilimci).filter(
        Katilimci.id == katilimci_id,
        Katilimci.firma_id == kullanici.firma_id
    ).first()
    if not k:
        raise HTTPException(status_code=404, detail="Katılımcı bulunamadı")

    tamamlanan_atamalar = [
        a for a in k.atamalar
        if a.durum in [AtamaDurumu.tamamlandi, AtamaDurumu.raporlandi]
    ]

    raporlar = [bireysel_rapor_olustur(a, db) for a in tamamlanan_atamalar]

    # Radar grafik için normalize edilmiş veri (0-100 arası)
    radar_verisi = {}
    for rapor in raporlar:
        tip = rapor.get("envanter_tipi")
        puanlar = rapor.get("puanlar", {})
        if tip == "liderlik_stili":
            maks = 32
            radar_verisi["Cesur"] = round(puanlar.get("cesur", 0) / maks * 100)
            radar_verisi["Etkileyici"] = round(puanlar.get("etkileyici", 0) / maks * 100)
            radar_verisi["Sempatik"] = round(puanlar.get("sempatik", 0) / maks * 100)
            radar_verisi["Teknik"] = round(puanlar.get("teknik", 0) / maks * 100)
        elif tip == "motivasyon":
            maks = 40
            for boyut in ["basari", "etkileme", "iliski", "guvenlik"]:
                ad = {"basari": "Başarı", "etkileme": "Etkileme", "iliski": "İlişki", "guvenlik": "Güvenlik"}[boyut]
                radar_verisi[ad] = round(puanlar.get(boyut, 0) / maks * 100)
        elif tip == "problem_cozme":
            maks = 100
            for tarz in ["idealist", "aktivist", "realist"]:
                ad = tarz.capitalize()
                radar_verisi[ad] = round(puanlar.get(tarz, 0) / maks * 100)

    return {
        "katilimci": {
            "id": k.id, "ad": k.ad, "soyad": k.soyad,
            "departman": k.departman, "pozisyon": k.pozisyon, "tip": k.tip.value
        },
        "raporlar": raporlar,
        "tamamlanan_sayi": len(raporlar),
        "toplam_atama": len(k.atamalar),
        "radar_verisi": radar_verisi,
    }


@router.post("/karsilastirma")
def karsilastirma_raporu(
    katilimci_idler: List[int],
    db: Session = Depends(get_db),
    kullanici: User = Depends(ik_gerektir)
):
    """2-3 katılımcıyı yan yana karşılaştırır"""
    if len(katilimci_idler) < 2:
        raise HTTPException(status_code=400, detail="En az 2 katılımcı gereklidir")
    if len(katilimci_idler) > 3:
        raise HTTPException(status_code=400, detail="En fazla 3 katılımcı karşılaştırılabilir")

    sonuclar = []
    for kid in katilimci_idler:
        k = db.query(Katilimci).filter(
            Katilimci.id == kid,
            Katilimci.firma_id == kullanici.firma_id
        ).first()
        if not k:
            continue
        tamamlanan = [
            a for a in k.atamalar
            if a.durum in [AtamaDurumu.tamamlandi, AtamaDurumu.raporlandi]
        ]
        sonuclar.append({
            "katilimci": {
                "id": k.id, "ad": k.ad, "soyad": k.soyad,
                "departman": k.departman, "pozisyon": k.pozisyon, "tip": k.tip.value
            },
            "raporlar": {
                a.envanter_tipi.value: bireysel_rapor_olustur(a, db)
                for a in tamamlanan
            }
        })

    return {"karsilastirma": sonuclar}
