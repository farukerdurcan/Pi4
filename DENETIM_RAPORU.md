# Tatko PI Envanter — Kod Denetim Raporu

> Liderlik / Motivasyon / Kişilerarası Etkileşim / Problem Çözme envanterlerini
> yöneten çok kiracılı (firma bazlı) SaaS uygulaması.
>
> **Yığın:** FastAPI · SQLAlchemy · JWT · PostgreSQL/SQLite · React 18 · Tailwind · Docker
> **Denetim odağı:** Güvenlik · Mimari / çok-kiracılılık · Doğruluk · UI/UX
> **Yöntem:** Statik kod incelemesi (otomatik SAST/DAST yapılmamıştır)

---

## Önem dağılımı (bulgu sayısı)

| Kritik | Yüksek | Orta | Düşük |
|:---:|:---:|:---:|:---:|
| 2 | 4 | 8 | 9 |

---

## En acil iki konu

1. **Süper admin kimlik bilgileri kaynak koduna gömülü** ve her açılışta yeniden
   oluşturuluyor — repoya erişen herkes her kuruluma süper admin olarak girebilir.
2. **Firma izolasyonu eksik (IDOR)** — bir firmanın İK'sı ID tahmini ile başka
   firmanın katılımcı/yönetici verisine erişip değiştirebiliyor.

---

## 1) Güvenlik bulguları

| Önem | Bulgu | Konum | Öneri |
|---|---|---|---|
| 🔴 Kritik | Süper admin kimlik bilgileri kaynak kodunda sabit (`faruk@core-tr.com` / `12345`) ve her açılışta otomatik oluşturuluyor. | `backend/main.py:95-108` | Seed hesabını koddan kaldırın; ilk kurulumda env'den okuyun veya tek seferlik script ile güçlü, rastgele şifre üretin. |
| 🔴 Kritik | Çok kiracılı izolasyonu eksik — IDOR. Birçok endpoint `firma_id` filtrelemiyor; A firmasının İK'sı ID tahmini ile B firmasının verisini güncelleyebilir/atayabilir. | `participant_router.py` (guncelle / envanter-ata / hatirlatma / not), `yonetici_router.py` | Tüm kayıt erişimlerinde `kullanici.firma_id` eşitliğini zorunlu kılın; ortak bir "firma sahiplik" kontrolü ekleyin. |
| 🟠 Yüksek | Zayıf varsayılan `SECRET_KEY` fallback'i. Env tanımlı değilse JWT'ler tahmin edilebilir anahtarla imzalanır ve taklit edilebilir. | `backend/auth.py:13` | `SECRET_KEY` yoksa uygulamayı başlatmayı reddedin (fail-fast); varsayılan değer bırakmayın. |
| 🟠 Yüksek | Seed İK şifresi `123456` kodda sabit; README ise `tatko2026` diyor (tutarsız ve zayıf). | `backend/main.py:140` + `README.md` | İlk girişte şifre değiştirmeyi zorunlu kılın; seed şifreyi env'den alın. |
| 🟠 Yüksek | Login'de brute-force koruması / rate limit / hesap kilitleme yok. | `routers/auth_router.py` `/api/auth/login` | IP + kullanıcı bazlı rate limit (ör. `slowapi`) ve başarısız deneme sayacı ekleyin. |
| 🟡 Orta | JWT `localStorage`'da tutuluyor — XSS ile sızdırılabilir. | `frontend/src/api/index.js`, `KorumaRota.jsx` | httpOnly + Secure + SameSite çerez tercih edin veya en azından sıkı CSP uygulayın. |
| 🟡 Orta | Yeni İK kullanıcısına şifre düz metin olarak e-posta ile gönderiliyor. | `yonetim_router.py:183` + `email_service.ik_davet_emaili_olustur` | Tek kullanımlık "şifre belirleme" linki gönderin; şifreyi e-postaya yazmayın. |
| 🟡 Orta | Swagger `/docs` ve `/openapi.json` prod'da kimlik doğrulamasız açık (bilgi ifşası). | `backend/main.py` (FastAPI varsayılan) | Prod'da `docs_url=None` / `openapi_url=None` veya kimlik koruması. |
| 🟡 Orta | Güvenlik başlıkları yok (HSTS, CSP, X-Frame-Options, X-Content-Type-Options). | `nginx/pi4.conf`, `frontend/Dockerfile` nginx conf | nginx katmanında güvenlik başlıklarını ekleyin. |
| 🟡 Orta | Davet linki token'ı asla sona ermiyor; `son_kullanim_tarihi` tanımlı ama kullanılmıyor. Token'ı ele geçiren PII (ad/e-posta) görür. | `models.py` `DavetLinki`, `routers/form_router.py` | Token'a son kullanım tarihi ekleyip kontrol edin; tamamlanan/iptal linkleri geçersiz kılın. |
| 🟢 Düşük | CORS `allow_methods` ve `allow_headers` = `*` + `allow_credentials=True` (origin kısıtlı olduğu için risk sınırlı). | `backend/main.py:30-36` | İhtiyaç duyulan method/header'larla daraltın. |
| 🟢 Düşük | Şifre politikası zayıf (yalnızca min 6 karakter). | `auth_router.py:86` | Uzunluk + karmaşıklık + sızmış şifre kontrolü ekleyin. |
| 🟢 Düşük | Backend Dockerfile `COPY . .` — `tatko.db`, `emails/`, `__pycache__` imaja sızabilir (`.dockerignore` yok). | `backend/Dockerfile:8` | `.dockerignore` ekleyin (db, emails, venv, pycache). |

---

## 2) Mimari & çok kiracılılık / doğruluk

| Önem | Bulgu | Konum | Öneri |
|---|---|---|---|
| 🟠 Yüksek | `Katilimci.email` ve `User.email` global benzersiz — iki farklı firma aynı e-postayı kullanamaz; katılımcı ekleme firma bazlı değil global kontrol ediyor. | `models.py:54,74` + `participant_router.py:240` | Benzersizliği `(firma_id, email)` bileşik kısıtına çevirin; çok kiracılılık için kritik. |
| 🟡 Orta | `yonetici/{id}/katilimcilar` atamasında verilen `katilimci_id`'ler aynı firmaya ait mi kontrol edilmiyor. | `yonetici_router.py:152-176` | Atanacak katılımcıların `firma_id`'sini doğrulayın. |
| 🟡 Orta | Elle SQLite/PG migration'ları (`ALTER TABLE ... IF NOT EXISTS`). SQLite bunu desteklemez; hatalar `except` ile yutuluyor. | `backend/main.py:46-71` | Alembic ile sürümlü migration'a geçin. |
| 🟢 Düşük | Puanlama anahtarlarında Kiril harf karışması: `giriskен` (е/н Kiril). İçeride tutarlı çalışıyor ama kırılgan ve hataya açık. | `services/puanlama.py:117-177` | `girişken` (Latin) olarak düzeltin. |
| 🟢 Düşük | Deprecated `@app.on_event('startup')`; geniş `except Exception: pass` bloklarıyla hatalar sessizce yutuluyor. | `main.py:74`, `participant_router.py:380` | `lifespan` handler + yapılandırılmış loglama (`print` yerine `logging`). |
| 🟢 Düşük | Ölü/yinelenen kod: `KatilimciOlustur` vs `KatilimciOlusturRequest`; kullanılmayan `passlib` bağımlılığı (kod doğrudan `bcrypt` kullanıyor). | `participant_router.py:31`, `requirements.txt:4` | Kullanılmayan şema/bağımlılıkları temizleyin. |

---

## 3) UI / UX & frontend

| Önem | Bulgu | Konum | Öneri |
|---|---|---|---|
| 🟡 Orta | `KorumaRota` bilinmeyen rolü `/form`'a yönlendiriyor ama eşleşen rota yok (yalnızca `/form/:token`) → login'e geri sapma. | `components/KorumaRota.jsx:15` + `App.jsx` | Geçersiz rolü doğrudan `/login`'e yönlendirin. |
| 🟡 Orta | Çok dillilik tamamlanmamış: `dil` parametresi yalnızca e-postalarda (TR/EN), uygulama arayüzü sadece TR (Faz 6 açık). | frontend genel + README Faz 6 | i18n altyapısı (ör. `i18next`) ile arayüzü de yerelleştirin. |
| 🟢 Düşük | Login UX eksikleri: şifre göster/gizle yok, "şifremi unuttum" akışı yok, caps-lock uyarısı yok. | `pages/Login.jsx` | Erişilebilir parola alanı ve şifre sıfırlama akışı ekleyin. |
| 🟢 Düşük | Erişilebilirlik: hata mesajları `aria-describedby` ile alana bağlı değil; odak yönetimi yok. | `pages/Login.jsx`, form sayfaları | `aria-invalid` / `aria-describedby` ve `role=alert` ekleyin. |
| 🟢 Düşük | Marka tutarsızlığı (Tatko / PI4 / supertakimlar) ve repo kökünde başıboş prototip dosyaları (`index.html`, `4pi-dashboard.html`). | root `index.html`, `4pi-dashboard.html`, e-posta şablonları | Marka adını tekleştirin; ölü dosyaları kaldırın. |

---

## 4) Öncelikli aksiyon planı

| Sıra | Aksiyon | Önem |
|:---:|---|---|
| 1 | Sabit süper admin & seed şifrelerini koddan kaldır, env'e taşı, fail-fast `SECRET_KEY` | 🔴 Kritik |
| 2 | Tüm endpoint'lerde `firma_id` sahiplik kontrolünü merkezi hale getir (IDOR kapat) | 🔴 Kritik |
| 3 | Login rate limit + hesap kilitleme; prod'da `/docs` kapat | 🟠 Yüksek |
| 4 | Şifreyi e-postayla gönderme → tek kullanımlık şifre belirleme linki | 🟠 Yüksek |
| 5 | nginx güvenlik başlıkları (HSTS / CSP / X-Frame-Options) + `.dockerignore` | 🟡 Orta |
| 6 | Alembic migration; `(firma_id, email)` bileşik benzersizlik; davet token süresi | 🟡 Orta |
| 7 | Kiril harf düzeltmesi, i18n, `KorumaRota` yönlendirme, ölü kod temizliği | 🟢 Düşük |

---

## İyi yapılmış yönler

- Parolalar **bcrypt** ile hash'leniyor; rol bazlı yetki bağımlılıkları
  (super_admin / İK / yönetici) net ayrılmış.
- **SQLAlchemy ORM** ile parametreli sorgular — kullanıcı girdisinde SQL
  enjeksiyon yüzeyi düşük.
- Temiz router/şema ayrımı; e-posta servisinde dev (dosyaya yaz) ve prod (Resend)
  ayrımı düşünülmüş.
- Çok aşamalı frontend Docker build + varlık cache stratejisi; Postgres
  healthcheck, restart policy, env tabanlı yapılandırma.

---

*Kaynak: `tatko-pi` deposu statik kod incelemesi.*
