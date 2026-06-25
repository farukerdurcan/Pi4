from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Kullanıcı rolleri
class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    ik_yoneticisi = "ik_yoneticisi"
    yonetici = "yonetici"
    katilimci = "katilimci"


# Firma (tenant) tablosu
class Firma(Base):
    __tablename__ = "firmalar"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    aktif = Column(Boolean, default=True)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    kullanicilar = relationship("User", back_populates="firma")
    katilimcilar = relationship("Katilimci", back_populates="firma")

# Katılımcı tipi: şirketteki çalışan mı, dışarıdan aday mı
class KatilimciTipi(str, enum.Enum):
    aday = "aday"
    calisan = "calisan"

# 4 envanter tipi
class EnvanterTipi(str, enum.Enum):
    liderlik_stili = "liderlik_stili"
    motivasyon = "motivasyon"
    kisisel_etkilesim = "kisisel_etkilesim"
    problem_cozme = "problem_cozme"

# Atama durumu — formun hangi aşamada olduğu
class AtamaDurumu(str, enum.Enum):
    gonderildi = "gonderildi"
    devam_ediyor = "devam_ediyor"
    tamamlandi = "tamamlandi"
    raporlandi = "raporlandi"

# Kullanıcı tablosu
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String, nullable=False)
    soyad = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    rol = Column(Enum(UserRole), default=UserRole.katilimci)
    aktif = Column(Boolean, default=True)
    davet_token_hash = Column(String, nullable=True)
    davet_token_son_kullanim = Column(DateTime(timezone=True), nullable=True)
    firma_id = Column(Integer, ForeignKey("firmalar.id"), nullable=True)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    firma = relationship("Firma", back_populates="kullanicilar")

    @property
    def tam_ad(self):
        return f"{self.ad} {self.soyad}"

# Katılımcı tablosu — form dolduracak kişiler (aday veya çalışan)
class Katilimci(Base):
    __tablename__ = "katilimcilar"
    __table_args__ = (
        UniqueConstraint('firma_id', 'email', name='uq_katilimci_firma_email'),
    )

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String, nullable=False)
    soyad = Column(String, nullable=False)
    email = Column(String, index=True, nullable=False)
    departman = Column(String, nullable=True)
    pozisyon = Column(String, nullable=True)
    tip = Column(Enum(KatilimciTipi), default=KatilimciTipi.aday)
    aktif = Column(Boolean, default=True)
    firma_id = Column(Integer, ForeignKey("firmalar.id"), nullable=True)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    firma = relationship("Firma", back_populates="katilimcilar")
    atamalar = relationship("Atama", back_populates="katilimci", cascade="all, delete-orphan")
    notlar = relationship("Not", back_populates="katilimci", cascade="all, delete-orphan")

    @property
    def tam_ad(self):
        return f"{self.ad} {self.soyad}"

# Atama tablosu — hangi katılımcıya hangi envanter atandı
class Atama(Base):
    __tablename__ = "atamalar"

    id = Column(Integer, primary_key=True, index=True)
    katilimci_id = Column(Integer, ForeignKey("katilimcilar.id"), nullable=False)
    envanter_tipi = Column(Enum(EnvanterTipi), nullable=False)
    durum = Column(Enum(AtamaDurumu), default=AtamaDurumu.gonderildi)
    gonderim_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    tamamlanma_tarihi = Column(DateTime(timezone=True), nullable=True)

    # İlişkiler
    katilimci = relationship("Katilimci", back_populates="atamalar")
    davet_linki = relationship("DavetLinki", back_populates="atama", uselist=False, cascade="all, delete-orphan")

# Davet linki tablosu — her atama için tek kullanımlık benzersiz URL
class DavetLinki(Base):
    __tablename__ = "davet_linkleri"

    id = Column(Integer, primary_key=True, index=True)
    atama_id = Column(Integer, ForeignKey("atamalar.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)  # UUID — URL'de kullanılır
    kullanildi = Column(Boolean, default=False)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    son_kullanim_tarihi = Column(DateTime(timezone=True), nullable=True)  # İleride son kullanım tarihi eklenebilir

    atama = relationship("Atama", back_populates="davet_linki")

# Puan sonucu tablosu — her atama için hesaplanan puanlar JSON olarak saklanır
class PuanSonucu(Base):
    __tablename__ = "puan_sonuclari"

    id = Column(Integer, primary_key=True, index=True)
    atama_id = Column(Integer, ForeignKey("atamalar.id"), unique=True, nullable=False)
    sonuclar = Column(Text, nullable=False, default="{}")  # JSON
    hesaplanma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    atama = relationship("Atama", backref="puan_sonucu", lazy="select")

# Form yanıtı tablosu — katılımcının doldurduğu form verileri JSON olarak saklanır
class FormYaniti(Base):
    __tablename__ = "form_yanitlari"

    id = Column(Integer, primary_key=True, index=True)
    atama_id = Column(Integer, ForeignKey("atamalar.id"), unique=True, nullable=False)
    # Yanıtlar JSON string olarak saklanır — her envanterin kendi formatı var
    yanitlar = Column(Text, nullable=False, default="{}")
    tamamlandi = Column(Boolean, default=False)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())
    guncelleme_tarihi = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    atama = relationship("Atama", backref="form_yaniti")

# Yönetici-katılımcı atama tablosu — hangi yönetici hangi katılımcıları görebilir
class YoneticiKatilimci(Base):
    __tablename__ = "yonetici_katilimcilar"

    id = Column(Integer, primary_key=True, index=True)
    yonetici_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    katilimci_id = Column(Integer, ForeignKey("katilimcilar.id"), nullable=False)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())


# Not tablosu — İK'nın katılımcılar hakkında tuttuğu notlar
class Not(Base):
    __tablename__ = "notlar"

    id = Column(Integer, primary_key=True, index=True)
    katilimci_id = Column(Integer, ForeignKey("katilimcilar.id"), nullable=False)
    ik_kullanici_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    metin = Column(Text, nullable=False)
    rapora_dahil = Column(Boolean, default=False)
    yoneticiden_gizle = Column(Boolean, default=False)
    olusturulma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    katilimci = relationship("Katilimci", back_populates="notlar")
    ik_kullanici = relationship("User")
