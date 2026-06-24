# Tatko PI Envanter Sistemi

Liderlik Stili, Motivasyon İhtiyacı, Kişilerarası Etkileşim ve Problem Çözme Tarzı
envanterlerini dijital ortamda yönetmek için geliştirilmiş web uygulaması.

---

## Gereksinimler

- Python 3.11 veya üzeri
- Node.js 18 veya üzeri

---

## Kurulum ve Çalıştırma

### 1. Projeyi indir ve klasöre gir

```
cd tatko-pi
```

### 2. Backend'i başlat

Terminalde şu komutları sırayla çalıştır:

```
cd backend
python -m venv venv
venv\Scripts\activate        (Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend `http://localhost:8000` adresinde çalışmaya başlar.
İlk başlatmada otomatik olarak `tatko.db` veritabanı oluşur
ve ilk İK yöneticisi hesabı eklenir.

### 3. Frontend'i başlat (yeni bir terminal penceresi)

```
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde açılır.

---

## Giriş Bilgileri

| Rol | E-posta | Şifre |
|---|---|---|
| İK Yöneticisi | ik@tatko.com.tr | tatko2026 |

---

## API Dokümantasyonu

Backend çalışırken `http://localhost:8000/docs` adresini aç.
Tüm endpoint'ler otomatik olarak listelenir ve test edilebilir.

---

## Faz Durumu

- [x] Faz 1 — Temel iskelet, giriş sistemi, rol yönetimi
- [ ] Faz 2 — Katılımcı yönetimi, e-posta gönderimi
- [ ] Faz 3 — Form arayüzü
- [ ] Faz 4 — Puanlama ve raporlama
- [ ] Faz 5 — PDF ve yönetici erişimi
- [ ] Faz 6 — Dil, tasarım ve entegrasyon
