import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from database import engine, SessionLocal
from models import Base, User, UserRole, Firma, Katilimci
from auth import sifreyi_hashle
from routers import auth_router
from routers import participant_router
from routers import form_router
from routers import rapor_router
from routers import yonetici_router
from routers import yonetim_router

# Prod'da nginx /pi4/ prefix'i soyar; root_path OpenAPI docs için bilgi sağlar
ROOT_PATH = os.getenv("ROOT_PATH", "")

# Docs sadece DOCS_ENABLED=true olduğunda açık
_docs_url = "/docs" if os.getenv("DOCS_ENABLED", "false").lower() == "true" else None
_openapi_url = "/openapi.json" if _docs_url else None

app = FastAPI(
    title="Tatko PI Envanter Sistemi",
    description="Liderlik Stili, Motivasyon, Kişilerarası Etkileşim ve Problem Çözme envanterlerini yönetir",
    version="1.0.0",
    root_path=ROOT_PATH,
    docs_url=_docs_url,
    openapi_url=_openapi_url,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — geliştirmede farklı port, prod'da aynı origin (nginx)
_izin_verilen_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_izin_verilen_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları bağla
app.include_router(auth_router.router)
app.include_router(participant_router.router)
app.include_router(form_router.router)
app.include_router(rapor_router.router)
app.include_router(yonetici_router.router)
app.include_router(yonetim_router.router)

def _kolonlari_guncelle(db):
    """Mevcut tablolara eksik kolonları ekler (SQLite ALTER TABLE)."""
    from sqlalchemy import text
    eklemeler = [
        ("notlar",        "rapora_dahil",      "BOOLEAN DEFAULT 0"),
        ("notlar",        "yoneticiden_gizle", "BOOLEAN DEFAULT 0"),
        ("users",         "firma_id",              "INTEGER"),
        ("users",         "davet_token_hash",        "VARCHAR"),
        ("users",         "davet_token_son_kullanim", "TIMESTAMP WITH TIME ZONE"),
        ("users",         "sifirla_token_hash",      "VARCHAR"),
        ("users",         "sifirla_token_son_kullanim", "TIMESTAMP WITH TIME ZONE"),
        ("katilimcilar",  "firma_id",          "INTEGER"),
    ]
    for tablo, kolon, tip in eklemeler:
        try:
            db.execute(text(f"ALTER TABLE {tablo} ADD COLUMN IF NOT EXISTS {kolon} {tip}"))
            db.commit()
            print(f"  ✅ {tablo}.{kolon} kontrol edildi")
        except Exception as e:
            db.rollback()
            print(f"  ⚠️ {tablo}.{kolon}: {e}")

    # katilimcilar.email global unique → (firma_id, email) bileşik unique
    try:
        db.execute(text("ALTER TABLE katilimcilar DROP CONSTRAINT IF EXISTS katilimcilar_email_key"))
        db.commit()
        print("  ✅ katilimcilar eski email unique kısıtı kaldırıldı")
    except Exception as e:
        db.rollback()
        print(f"  ⚠️ katilimcilar email kısıt kaldırma: {e}")
    try:
        db.execute(text(
            "ALTER TABLE katilimcilar ADD CONSTRAINT uq_katilimci_firma_email "
            "UNIQUE (firma_id, email)"
        ))
        db.commit()
        print("  ✅ katilimcilar (firma_id, email) bileşik unique eklendi")
    except Exception as e:
        db.rollback()
        print(f"  ⚠️ katilimcilar bileşik unique: {e}")

    # hashed_password NOT NULL kısıtını kaldır (davet akışı için nullable olmalı)
    try:
        db.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
        db.commit()
        print("  ✅ users.hashed_password NOT NULL kısıtı kaldırıldı")
    except Exception as e:
        db.rollback()
        print(f"  ⚠️ users.hashed_password NOT NULL: {e}")

    # PostgreSQL enum'una super_admin değeri ekle (yoksa)
    try:
        db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin'"))
        db.commit()
        print("  ✅ userrole enum: super_admin kontrol edildi")
    except Exception as e:
        db.rollback()
        print(f"  ⚠️ userrole enum: {e}")


@app.on_event("startup")
async def uygulama_baslarken():
    """
    Uygulama her başladığında:
    1. Veritabanı tablolarını oluşturur (zaten varsa dokunmaz)
    2. Eksik kolonları ekler (migration)
    3. İlk İK yöneticisi hesabı yoksa oluşturur
    """
    # Tabloları oluştur
    Base.metadata.create_all(bind=engine)

    # Eksik kolonları ekle
    db = SessionLocal()
    _kolonlari_guncelle(db)
    db.close()

    # Seed: super_admin + Tatko firması + mevcut veriler
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # 1. Super admin oluştur (env'den oku)
        sa_email = os.getenv("SUPER_ADMIN_EMAIL")
        sa_sifre = os.getenv("SUPER_ADMIN_SIFRE")
        if sa_email and sa_sifre:
            super_admin = db.query(User).filter(User.email == sa_email).first()
            if not super_admin:
                super_admin = User(
                    ad=os.getenv("SUPER_ADMIN_AD", "Admin"),
                    soyad=os.getenv("SUPER_ADMIN_SOYAD", ""),
                    email=sa_email,
                    hashed_password=sifreyi_hashle(sa_sifre),
                    rol=UserRole.super_admin,
                    firma_id=None,
                    aktif=True
                )
                db.add(super_admin)
                db.commit()
                print(f"✅ Super admin oluşturuldu: {sa_email}")
        else:
            print("⚠️ SUPER_ADMIN_EMAIL veya SUPER_ADMIN_SIFRE tanımlı değil — super admin oluşturulmadı")

        # 2. Tatko firmasını oluştur
        tatko = db.query(Firma).filter(Firma.slug == "tatko").first()
        if not tatko:
            tatko = Firma(ad="Tatko", slug="tatko", aktif=True)
            db.add(tatko)
            db.commit()
            db.refresh(tatko)
            print(f"✅ Tatko firması oluşturuldu (id={tatko.id})")
        else:
            print(f"✅ Tatko firması mevcut (id={tatko.id})")

        # 3. firma_id olmayan kullanıcıları (super_admin hariç) Tatko'ya bağla
        db.execute(text(
            f"UPDATE users SET firma_id = {tatko.id} "
            f"WHERE firma_id IS NULL AND rol != 'super_admin'"
        ))
        # 4. firma_id olmayan katılımcıları Tatko'ya bağla
        db.execute(text(
            f"UPDATE katilimcilar SET firma_id = {tatko.id} WHERE firma_id IS NULL"
        ))
        db.commit()
        print("✅ Mevcut veriler Tatko firmasına bağlandı")

        # 5. İlk IK hesabı (env'den oku)
        ik_email = os.getenv("IK_EMAIL")
        ik_sifre = os.getenv("IK_BASLANGIC_SIFRE")
        if ik_email and ik_sifre:
            ilk_ik = db.query(User).filter(User.email == ik_email).first()
            if not ilk_ik:
                ilk_ik = User(
                    ad="İK",
                    soyad="Yöneticisi",
                    email=ik_email,
                    hashed_password=sifreyi_hashle(ik_sifre),
                    rol=UserRole.ik_yoneticisi,
                    firma_id=tatko.id,
                    aktif=True
                )
                db.add(ilk_ik)
                db.commit()
                print(f"✅ İlk İK hesabı oluşturuldu: {ik_email}")
        else:
            print("⚠️ IK_EMAIL veya IK_BASLANGIC_SIFRE tanımlı değil — IK seed hesabı oluşturulmadı")

    finally:
        db.close()

@app.get("/")
async def ana_sayfa():
    return {"mesaj": "Tatko PI Envanter API çalışıyor", "versiyon": "1.0.0"}

@app.get("/saglik")
async def saglik_kontrolu():
    """Sistemin ayakta olup olmadığını kontrol eder"""
    return {"durum": "tamam"}
