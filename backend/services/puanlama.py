"""
Puanlama Servisi — 4 envanter için otomatik puan hesaplama
Form yanıtları JSON'dan okunur, puanlar hesaplanır ve döndürülür.
"""
import json
from typing import Dict, Any

# ─── Liderlik Stili ─────────────────────────────────────────────────────────

def liderlik_hesapla(yanitlar: Dict) -> Dict:
    """
    Bölüm 1 (17 soru) + Bölüm 2 (15 soru) = 32 soru
    C/E/S/T harflerini sayar. ≥15 = baskın stil.
    """
    bolum1 = yanitlar.get("bolum1", {})
    bolum2 = yanitlar.get("bolum2", {})

    sayim = {"C": 0, "E": 0, "S": 0, "T": 0}
    for harf in bolum1.values():
        if harf in sayim:
            sayim[harf] += 1
    for harf in bolum2.values():
        if harf in sayim:
            sayim[harf] += 1

    stil_adlari = {"C": "Cesur", "E": "Etkileyici", "S": "Sempatik", "T": "Teknik"}

    # Büyükten küçüğe sırala
    sirali = sorted(sayim.items(), key=lambda x: x[1], reverse=True)
    en_yuksek = sirali[0][0]
    ikinci = sirali[1][0] if len(sirali) > 1 else None

    # ≥15 puan alanlar baskın stil sayılır
    baskin = [h for h, p in sayim.items() if p >= 15]

    return {
        "envanter": "liderlik_stili",
        "puanlar": {
            "cesur": sayim["C"],
            "etkileyici": sayim["E"],
            "sempatik": sayim["S"],
            "teknik": sayim["T"],
        },
        "baskin_stiller": [stil_adlari[h] for h in baskin],
        "birincil_stil": stil_adlari[en_yuksek],
        "birincil_puan": sayim[en_yuksek],
        "ikincil_stil": stil_adlari[ikinci] if ikinci else None,
        "ikincil_puan": sayim[ikinci] if ikinci else 0,
        "baskin_var": len(baskin) > 0,
        "toplam_soru": len(bolum1) + len(bolum2),
    }


# ─── Motivasyon İhtiyacı ────────────────────────────────────────────────────

MOTIVASYON_GRUPLARI = {
    "basari":   [1, 5, 6, 12, 13, 22, 23, 32, 33, 38],
    "etkileme": [3, 8, 9, 14, 15, 20, 21, 28, 29, 36],
    "iliski":   [2, 7, 16, 17, 24, 26, 27, 34, 37, 40],
    "guvenlik": [4, 10, 11, 18, 19, 25, 30, 31, 35, 39],
}
MOTIVASYON_DEGER = {"A": 1, "B": 2, "C": 3, "D": 4}
BOYUT_ADLARI = {
    "basari": "Başarı", "etkileme": "Etkileme",
    "iliski": "İlişki", "guvenlik": "Güvenlik"
}

def motivasyon_hesapla(yanitlar: Dict) -> Dict:
    """
    40 soru, A=1 B=2 C=3 D=4.
    4 boyut toplanır. En düşük = temel ihtiyaç.
    Toplam: ≤90 demotive, 91-104 orta, ≥105 yüksek.
    """
    soru_yanitlari = yanitlar.get("yanitlar", {})

    boyut_puanlari = {}
    for boyut, sorular in MOTIVASYON_GRUPLARI.items():
        toplam = sum(
            MOTIVASYON_DEGER.get(soru_yanitlari.get(str(s), ""), 0)
            for s in sorular
        )
        boyut_puanlari[boyut] = toplam

    genel_toplam = sum(boyut_puanlari.values())
    temel_ihtiyac = min(boyut_puanlari, key=boyut_puanlari.get)

    if genel_toplam <= 90:
        motivasyon_seviyesi = "Düşük"
        motivasyon_aciklama = "Mevcut ortamda motivasyon ihtiyaçları yeterince karşılanamıyor olabilir."
    elif genel_toplam <= 104:
        motivasyon_seviyesi = "Orta"
        motivasyon_aciklama = "Motivasyon dengeli bir seviyede, belirli alanlarda güçlendirme yapılabilir."
    else:
        motivasyon_seviyesi = "Yüksek"
        motivasyon_aciklama = "Mevcut ortamda motivasyon ihtiyaçları büyük ölçüde karşılanıyor."

    return {
        "envanter": "motivasyon",
        "puanlar": {
            "basari": boyut_puanlari["basari"],
            "etkileme": boyut_puanlari["etkileme"],
            "iliski": boyut_puanlari["iliski"],
            "guvenlik": boyut_puanlari["guvenlik"],
        },
        "genel_toplam": genel_toplam,
        "temel_ihtiyac": BOYUT_ADLARI[temel_ihtiyac],
        "temel_ihtiyac_puan": boyut_puanlari[temel_ihtiyac],
        "motivasyon_seviyesi": motivasyon_seviyesi,
        "motivasyon_aciklama": motivasyon_aciklama,
        "toplam_soru": len(soru_yanitlari),
    }


# ─── Kişilerarası Etkileşim ─────────────────────────────────────────────────

ETKILESIM_GRUPLARI = {
    "girişken":     [1, 5, 9, 13, 17, 21, 25, 29, 33, 37],
    "pasif":        [2, 6, 10, 14, 18, 22, 26, 30, 34, 38],
    "sakli_agresif":[3, 7, 11, 15, 19, 23, 27, 31, 35, 39],
    "acik_agresif": [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
}
ETKILESIM_DEGER = {"TB": 5, "GB": 4, "BB": 3, "NB": 2, "KB": 1}
ETKILESIM_HARF = {
    "girişken": "G", "pasif": "P",
    "sakli_agresif": "S", "acik_agresif": "A"
}
ETKILESIM_AD = {
    "girişken": "Girişken", "pasif": "Pasif",
    "sakli_agresif": "Saklı Agresif", "acik_agresif": "Açık Agresif"
}

def etkilesim_hesapla(yanitlar: Dict) -> Dict:
    """
    40 soru, TB=5…KB=1.
    4 boyut toplanır, büyükten küçüğe sıralanarak profil kodu oluşturulur (G/A/S/P).
    Toplam: ≤105 zayıf, 105-130 dengeli, ≥131 yoğun.
    """
    soru_yanitlari = yanitlar.get("yanitlar", {})

    boyut_puanlari = {}
    for boyut, sorular in ETKILESIM_GRUPLARI.items():
        toplam = sum(
            ETKILESIM_DEGER.get(soru_yanitlari.get(str(s), ""), 0)
            for s in sorular
        )
        boyut_puanlari[boyut] = toplam

    genel_toplam = sum(boyut_puanlari.values())

    # Büyükten küçüğe sırala → profil kodu
    sirali = sorted(boyut_puanlari.items(), key=lambda x: x[1], reverse=True)
    profil_kodu = "".join(ETKILESIM_HARF[b] for b, _ in sirali)

    if genel_toplam <= 105:
        iletisim_seviyesi = "Zayıf"
        iletisim_aciklama = "İletişim stilinde belirgin bir zayıflık görülüyor. Durumu değiştirmekte güçlük çekilebilir."
    elif genel_toplam <= 130:
        iletisim_seviyesi = "Dengeli"
        iletisim_aciklama = "Ne zaman konuşup ne zaman dinleyeceğini iyi kestiren, dengeli bir iletişimci profili."
    else:
        iletisim_seviyesi = "Yoğun"
        iletisim_aciklama = "İletişim dozunun yüksek olabileceği, diğerlerini zaman zaman bunaltabilecek bir profil."

    # Birincil stil
    birincil = sirali[0][0]

    return {
        "envanter": "kisisel_etkilesim",
        "puanlar": {
            "girişken": boyut_puanlari["girişken"],
            "pasif": boyut_puanlari["pasif"],
            "sakli_agresif": boyut_puanlari["sakli_agresif"],
            "acik_agresif": boyut_puanlari["acik_agresif"],
        },
        "genel_toplam": genel_toplam,
        "profil_kodu": profil_kodu,
        "birincil_stil": ETKILESIM_AD[birincil],
        "iletisim_seviyesi": iletisim_seviyesi,
        "iletisim_aciklama": iletisim_aciklama,
        "sirali_stiller": [
            {"ad": ETKILESIM_AD[b], "puan": p} for b, p in sirali
        ],
        "toplam_soru": len(soru_yanitlari),
    }


# ─── Problem Çözme Tarzı ────────────────────────────────────────────────────

PROBLEM_KOLON = {
    1: "idealist",  # 1. kolon
    2: "aktivist",  # 2. kolon
    3: "realist",   # 3. kolon
}

PROBLEM_SEVIYE = [
    (0, 9, "Çok Düşük"),
    (10, 19, "Düşük"),
    (20, 45, "Orta"),
    (46, 60, "Orta Üstü"),
    (61, 84, "Yüksek"),
    (85, 100, "Çok Yüksek"),
]

def problem_seviye_belirle(puan: int) -> str:
    for alt, ust, seviye in PROBLEM_SEVIYE:
        if alt <= puan <= ust:
            return seviye
    return "—"

def problem_hesapla(yanitlar: Dict) -> Dict:
    """
    10 grup × 3 seçenek, her gruptan 10 puan dağıtımı.
    Kolon toplamları: İdealist (1.kolon), Aktivist (2.kolon), Realist (3.kolon).
    """
    soru_yanitlari = yanitlar.get("yanitlar", {})

    toplam = {"idealist": 0, "aktivist": 0, "realist": 0}

    for soru_id_str, grup in soru_yanitlari.items():
        for kolon_str, puan in grup.items():
            kolon = int(kolon_str)
            tip = PROBLEM_KOLON.get(kolon)
            if tip:
                toplam[tip] += int(puan or 0)

    en_yuksek = max(toplam, key=toplam.get)
    stil_adlari = {
        "idealist": "İdealist", "aktivist": "Aktivist", "realist": "Realist"
    }

    return {
        "envanter": "problem_cozme",
        "puanlar": {
            "idealist": toplam["idealist"],
            "aktivist": toplam["aktivist"],
            "realist": toplam["realist"],
        },
        "birincil_tarz": stil_adlari[en_yuksek],
        "birincil_puan": toplam[en_yuksek],
        "seviyeler": {
            "idealist": problem_seviye_belirle(toplam["idealist"]),
            "aktivist": problem_seviye_belirle(toplam["aktivist"]),
            "realist": problem_seviye_belirle(toplam["realist"]),
        },
        "toplam_kontrol": sum(toplam.values()),  # 100 olmalı
    }


# ─── Ana hesaplama fonksiyonu ────────────────────────────────────────────────

def puan_hesapla(envanter_tipi: str, yanitlar_json: str) -> Dict:
    """
    Form yanıtlarını alıp ilgili hesaplama fonksiyonunu çağırır.
    """
    try:
        yanitlar = json.loads(yanitlar_json)
    except Exception:
        yanitlar = {}

    if envanter_tipi == "liderlik_stili":
        return liderlik_hesapla(yanitlar)
    elif envanter_tipi == "motivasyon":
        return motivasyon_hesapla(yanitlar)
    elif envanter_tipi == "kisisel_etkilesim":
        return etkilesim_hesapla(yanitlar)
    elif envanter_tipi == "problem_cozme":
        return problem_hesapla(yanitlar)
    else:
        return {"hata": f"Bilinmeyen envanter tipi: {envanter_tipi}"}
