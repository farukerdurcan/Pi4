import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole

# SECRET_KEY tanımlı değilse uygulama başlatılmaz (fail-fast)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY ortam değişkeni tanımlı değil. "
        "'.env' dosyasına SECRET_KEY ekleyin (openssl rand -hex 32)."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def sifreyi_dogrula(duz_sifre: str, hashli_sifre: str) -> bool:
    """Kullanıcının girdiği şifreyi veritabanındaki hashli şifreyle karşılaştırır"""
    return bcrypt.checkpw(duz_sifre.encode("utf-8"), hashli_sifre.encode("utf-8"))

def sifreyi_hashle(sifre: str) -> str:
    """Düz metni güvenli hash formatına çevirir"""
    return bcrypt.hashpw(sifre.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def token_olustur(data: dict, sure: Optional[timedelta] = None) -> str:
    """JWT token üretir — içinde kullanıcı bilgileri şifreli olarak saklanır"""
    kopyala = data.copy()
    if sure:
        bitis = datetime.utcnow() + sure
    else:
        bitis = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    kopyala.update({"exp": bitis})
    return jwt.encode(kopyala, SECRET_KEY, algorithm=ALGORITHM)

def kullanici_getir(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def kullanici_dogrula(db: Session, email: str, sifre: str) -> Optional[User]:
    """E-posta ve şifre ile kullanıcıyı bulur ve doğrular"""
    kullanici = kullanici_getir(db, email)
    if not kullanici:
        return None
    if not sifreyi_dogrula(sifre, kullanici.hashed_password):
        return None
    return kullanici

async def aktif_kullanici(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Her korumalı endpoint'te token'ı çözümler ve kullanıcıyı döndürür"""
    kimlik_hatasi = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise kimlik_hatasi
    except JWTError:
        raise kimlik_hatasi

    kullanici = kullanici_getir(db, email)
    if kullanici is None or not kullanici.aktif:
        raise kimlik_hatasi
    return kullanici

def super_admin_gerektir(kullanici: User = Depends(aktif_kullanici)) -> User:
    """Sadece süper yöneticinin erişebileceği endpoint'ler için"""
    if kullanici.rol != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için süper yönetici yetkisi gereklidir"
        )
    return kullanici

def ik_gerektir(kullanici: User = Depends(aktif_kullanici)) -> User:
    """Sadece İK yöneticisinin erişebileceği endpoint'ler için"""
    if kullanici.rol != UserRole.ik_yoneticisi:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için İK yöneticisi yetkisi gereklidir"
        )
    return kullanici

def yonetici_veya_ik_gerektir(kullanici: User = Depends(aktif_kullanici)) -> User:
    """İK veya yöneticinin erişebileceği endpoint'ler için"""
    if kullanici.rol not in [UserRole.ik_yoneticisi, UserRole.yonetici]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu sayfaya erişim yetkiniz yok"
        )
    return kullanici
