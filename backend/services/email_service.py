import os
import httpx
from datetime import datetime
from pathlib import Path

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "pi@supertakimlar.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "PI4 Değerlendirme")

# Dev modunda e-postalar bu klasöre dosya olarak kaydedilir
EMAIL_KLASORU = Path(__file__).parent.parent / "emails"


def _resend_gonder(alici_email: str, alici_ad: str, konu: str, html: str) -> bool:
    """Resend API üzerinden e-posta gönderir."""
    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>",
                    "to": [f"{alici_ad} <{alici_email}>"],
                    "subject": konu,
                    "html": html,
                },
            )
        if r.status_code in (200, 201):
            print(f"📧 E-posta gönderildi: {alici_email}")
            return True
        print(f"❌ Resend hatası {r.status_code}: {r.text}")
        return False
    except Exception as e:
        print(f"❌ E-posta gönderilemedi: {e}")
        return False


def _dosyaya_kaydet(alici_email: str, alici_ad: str, konu: str, html: str) -> bool:
    """Dev modunda e-postayı backend/emails/ klasörüne kaydeder."""
    try:
        EMAIL_KLASORU.mkdir(exist_ok=True)
        import uuid
        zaman = datetime.now().strftime("%Y%m%d_%H%M%S")
        benzersiz = uuid.uuid4().hex[:6]
        dosya = EMAIL_KLASORU / f"{zaman}_{benzersiz}_{alici_email.replace('@','_').replace('.','_')}.html"
        dosya.write_text(html, encoding="utf-8")
        print(f"📧 E-posta kaydedildi (dev): {dosya.name}")
        return True
    except Exception as e:
        print(f"❌ E-posta kaydedilemedi: {e}")
        return False


def email_gonder(alici_email: str, alici_ad: str, konu: str, html: str) -> bool:
    if RESEND_API_KEY:
        return _resend_gonder(alici_email, alici_ad, konu, html)
    return _dosyaya_kaydet(alici_email, alici_ad, konu, html)


def _html_sarmal(baslik: str, icerik_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{baslik}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
      <tr><td style="background:#1d4ed8;padding:24px 32px;">
        <span style="color:#fff;font-size:18px;font-weight:700;">PI4</span>
        <span style="color:#93c5fd;font-size:14px;margin-left:8px;">Değerlendirme Platformu</span>
      </td></tr>
      <tr><td style="padding:32px;">
        {icerik_html}
      </td></tr>
      <tr><td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Bu e-posta PI4 Değerlendirme Platformu tarafından otomatik gönderilmiştir.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def davet_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    envanter_adi: str,
    form_linki: str,
    dil: str = "tr",
) -> bool:
    if dil == "tr":
        konu = f"PI4 Değerlendirme — {envanter_adi} formu"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  İnsan Kaynakları ekibi tarafından sizin için bir değerlendirme formu hazırlanmıştır.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:8px;padding:16px;width:100%;">
  <tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Envanter</td>
      <td style="font-size:13px;color:#111827;font-weight:600;padding:4px 0;">{envanter_adi}</td></tr>
</table>
<a href="{form_linki}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Formu doldur →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  Bağlantı çalışmıyorsa şu adresi tarayıcınıza kopyalayın:<br>
  <span style="color:#6b7280;">{form_linki}</span>
</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Saygılarımızla,<br><strong>İnsan Kaynakları</strong></p>"""
    else:
        konu = f"PI4 Assessment — {envanter_adi} form"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  The Human Resources team has prepared an assessment form for you.
</p>
<a href="{form_linki}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Complete the form →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  If the button doesn't work, copy this URL: <span style="color:#6b7280;">{form_linki}</span>
</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Best regards,<br><strong>Human Resources</strong></p>"""

    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik))


def ik_davet_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    firma_adi: str,
    sifre: str,
    giris_linki: str,
) -> bool:
    """Super admin tarafından oluşturulan IK yöneticisine giriş bilgilerini gönderir."""
    konu = "PI4 Değerlendirme — Hesabınız oluşturuldu"
    icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
  <strong>{firma_adi}</strong> için PI4 Değerlendirme Platformu hesabınız oluşturulmuştur.
  Aşağıdaki bilgilerle sisteme giriş yapabilirsiniz.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:8px;padding:16px;width:100%;">
  <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;width:100px;">E-posta</td>
      <td style="font-size:13px;color:#111827;font-weight:600;padding:6px 0;">{alici_email}</td></tr>
  <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;">Şifre</td>
      <td style="font-size:13px;color:#111827;font-weight:600;padding:6px 0;">{sifre}</td></tr>
</table>
<a href="{giris_linki}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Sisteme giriş yap →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Güvenliğiniz için ilk girişten sonra şifrenizi değiştirmenizi öneririz.</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Saygılarımızla,<br><strong>PI4 Değerlendirme Platformu</strong></p>"""
    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik))


def hatirlatma_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    envanter_adi: str,
    form_linki: str,
    dil: str = "tr",
) -> bool:
    if dil == "tr":
        konu = f"Hatırlatma: {envanter_adi} formu henüz tamamlanmadı"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  Size daha önce iletilen <strong>{envanter_adi}</strong> değerlendirme formunun henüz tamamlanmadığını fark ettik.
  Uygun bir zamanda doldurmanızı rica ederiz.
</p>
<a href="{form_linki}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Formu doldur →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">{form_linki}</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Saygılarımızla,<br><strong>İnsan Kaynakları</strong></p>"""
    else:
        konu = f"Reminder: {envanter_adi} form not yet completed"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  We noticed that the <strong>{envanter_adi}</strong> assessment form has not been completed yet.
  Please complete it at your earliest convenience.
</p>
<a href="{form_linki}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Complete the form →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">{form_linki}</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Best regards,<br><strong>Tatko Human Resources</strong></p>"""

    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik))
