import os
import httpx
from datetime import datetime
from pathlib import Path

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "pi@supertakimlar.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "PI4 Değerlendirme")

# Dev modunda e-postalar bu klasöre dosya olarak kaydedilir
EMAIL_KLASORU = Path(__file__).parent.parent / "emails"

ENVANTER_ACIKLAMALARI = {
    "liderlik_stili": (
        "Bu değerlendirme, liderlik davranışlarınızı ve başkalarıyla çalışma tarzınızı anlamaya "
        "yardımcı olur. Sonuçlar; liderlik eğilimleriniz hakkında içgörü sunar ve güçlü "
        "yönlerinizi daha görünür hale getirir."
    ),
    "motivasyon": (
        "Bu değerlendirme, iş hayatında sizi motive eden unsurları göstererek sizi en çok neyin "
        "harekete geçirdiğine dair farkındalık sağlar."
    ),
    "kisisel_etkilesim": (
        "Bu değerlendirme, iletişim tarzınızı ve farklı durumlarda insanlarla nasıl etkileşim "
        "kurduğunuzu anlamaya yardımcı olur. Sonuçlar, ilişki kurma ve iletişim yaklaşımınıza "
        "dair farkındalık sağlar."
    ),
    "problem_cozme": (
        "Bu değerlendirme, sorunlara yaklaşım ve karar alma biçiminizi anlamaya yardımcı olur. "
        "Sonuçlar, düşünme ve problem çözme yaklaşımınızdaki doğal eğilimleri görünür hale getirir."
    ),
}

ENVANTER_SURELERI = {
    "liderlik_stili": "10-15 dakika",
    "motivasyon": "10 dakika",
    "kisisel_etkilesim": "10-15 dakika",
    "problem_cozme": "5-10 dakika",
}


def _resend_gonder(alici_email: str, alici_ad: str, konu: str, html: str, from_name: str = "") -> bool:
    """Resend API üzerinden e-posta gönderir."""
    gonderici_ad = from_name or EMAIL_FROM_NAME
    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"{gonderici_ad} <{EMAIL_FROM}>",
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


def email_gonder(alici_email: str, alici_ad: str, konu: str, html: str, from_name: str = "") -> bool:
    gonderici_ad = from_name or EMAIL_FROM_NAME
    if RESEND_API_KEY:
        return _resend_gonder(alici_email, alici_ad, konu, html, gonderici_ad)
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
      <tr><td style="background:#132D50;padding:24px 32px;">
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
    firma_adi: str = "",
    dil: str = "tr",
    envanter_tipi: str = "",
) -> bool:
    from_name = f"{firma_adi} — PI4 Değerlendirme" if firma_adi else EMAIL_FROM_NAME
    ik_imza = firma_adi if firma_adi else "İnsan Kaynakları"
    firma_satir = firma_adi if firma_adi else "İnsan Kaynakları ekibi"

    aciklama = ENVANTER_ACIKLAMALARI.get(envanter_tipi, "")
    sure = ENVANTER_SURELERI.get(envanter_tipi, "")

    aciklama_html = (
        f'<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">{aciklama}</p>'
        if aciklama else ""
    )
    sure_html = (
        f'<p style="margin:0 0 0;font-size:12px;color:#9ca3af;">⏱ Tahmini tamamlama süresi: {sure}</p>'
        if sure else ""
    )

    if dil == "tr":
        konu = f"PI4 Değerlendirme | {envanter_adi} Davetiniz"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
  <strong>{firma_satir}</strong> tarafından sizin için bir değerlendirme çalışması planlanmıştır.
</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  Bu çalışma bir sınav değildir; doğru veya yanlış cevap bulunmaz. Amaç, çalışma tarzınızı,
  güçlü yönlerinizi ve sizi daha yakından tanımaktır. Sonuçlar yalnızca gelişim, kariyer
  planlama veya değerlendirme süreçlerine katkı sağlamak amacıyla kullanılır.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:8px;padding:16px;width:100%;box-sizing:border-box;">
  <tr><td style="font-size:12px;color:#9ca3af;padding:0 0 6px 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Değerlendirme</td></tr>
  <tr><td style="font-size:15px;color:#111827;font-weight:700;padding:0 0 10px 0;">{envanter_adi}</td></tr>
  <tr><td>{aciklama_html}{sure_html}</td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;color:#374151;">Değerlendirmeyi başlatmak için aşağıdaki butona tıklayabilirsiniz.</p>
<a href="{form_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Değerlendirmeyi Başlat →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  Bağlantı çalışmıyorsa şu adresi tarayıcınıza kopyalayın:<br>
  <span style="color:#6b7280;">{form_linki}</span>
</p>
<p style="margin:24px 0 16px;font-size:13px;color:#9ca3af;background:#f8fafc;border-radius:6px;padding:12px;line-height:1.6;">
  🔒 Bu değerlendirmede doğru veya yanlış cevap yoktur. En doğru sonuçlar için soruları
  içten ve kendinizi olduğunuz gibi yansıtarak yanıtlamanızı öneririz.
  Yanıtlarınız gizli tutulur ve yalnızca ilgili değerlendirme sürecine katkı sağlamak
  amacıyla kullanılır.
</p>
<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Katılımınız için teşekkür ederiz.<br><br>Saygılarımızla,<br><strong>{ik_imza} İnsan Kaynakları</strong><br>PI4 Değerlendirme Platformu</p>"""
    else:
        konu = f"PI4 Assessment | {envanter_adi} Invitation"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
  <strong>{firma_satir}</strong> has scheduled an assessment for you.
</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  This is not an exam — there are no right or wrong answers. The goal is to better understand
  your working style and strengths. Results are used solely to support your development.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:8px;padding:16px;width:100%;box-sizing:border-box;">
  <tr><td style="font-size:12px;color:#9ca3af;padding:0 0 6px 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Assessment</td></tr>
  <tr><td style="font-size:15px;color:#111827;font-weight:700;padding:0 0 10px 0;">{envanter_adi}</td></tr>
  <tr><td>{sure_html}</td></tr>
</table>
<a href="{form_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Start Assessment →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  If the button doesn't work, copy this URL: <span style="color:#6b7280;">{form_linki}</span>
</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Thank you for your participation.<br><br>Best regards,<br><strong>{ik_imza} Human Resources</strong><br>PI4 Assessment Platform</p>"""

    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik), from_name)


def ik_davet_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    firma_adi: str,
    hesap_kur_linki: str,
) -> bool:
    """Yeni oluşturulan kullanıcıya şifre belirleme linki gönderir."""
    konu = "PI4 Değerlendirme | Hesabınızı Aktifleştirin"
    icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  <strong>{firma_adi}</strong> adına PI4 Değerlendirme Platformuna davet edildiniz.
  Hesabınızı oluşturmak ve şifrenizi belirlemek için aşağıdaki butona tıklayın.
</p>
<a href="{hesap_kur_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Hesabımı Aktifleştir →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  Bu bağlantı 72 saat boyunca geçerlidir.<br>
  Bağlantı çalışmıyorsa şu adresi tarayıcınıza kopyalayabilirsiniz:<br>
  <span style="color:#6b7280;">{hesap_kur_linki}</span>
</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Saygılarımızla,<br><strong>PI4 Değerlendirme Platformu</strong></p>"""
    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik))


def sifre_sifirla_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    sifre_sifirla_linki: str,
) -> bool:
    """Şifre sıfırlama linki içeren e-posta gönderir (45 dk geçerli)."""
    konu = "PI4 Değerlendirme | Şifre Sıfırlama Talebi"
    icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  Hesabınız için bir şifre sıfırlama talebi alındı.
  Yeni şifrenizi belirlemek için aşağıdaki butona tıklayabilirsiniz.
  Bu bağlantı güvenlik nedeniyle <strong>45 dakika</strong> boyunca geçerlidir.
</p>
<a href="{sifre_sifirla_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Şifremi Sıfırla →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
  Bu talebi siz oluşturmadıysanız herhangi bir işlem yapmanıza gerek yoktur; bu e-postayı dikkate almayabilirsiniz.<br>
  Bağlantı çalışmıyorsa: <span style="color:#6b7280;">{sifre_sifirla_linki}</span>
</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Saygılarımızla,<br><strong>PI4 Değerlendirme Platformu</strong></p>"""
    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik))


def hatirlatma_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    envanter_adi: str,
    form_linki: str,
    firma_adi: str = "",
    dil: str = "tr",
) -> bool:
    from_name = f"{firma_adi} — PI4 Değerlendirme" if firma_adi else EMAIL_FROM_NAME
    ik_imza = firma_adi if firma_adi else "İnsan Kaynakları"

    if dil == "tr":
        konu = f"Hatırlatma | {envanter_adi} değerlendirmeniz sizi bekliyor"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
  Size daha önce iletilen <strong>{envanter_adi}</strong> değerlendirmesi henüz tamamlanmamış görünüyor.
</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  Bu çalışma bir sınav değildir ve doğru ya da yanlış cevap içermez. Amaç, çalışma tarzınızı
  ve güçlü yönlerinizi daha iyi anlamaktır. Uygun olduğunuz bir zamanda tamamlayabilirsiniz.
</p>
<a href="{form_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Değerlendirmeyi Tamamla →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">{form_linki}</p>
<p style="margin:24px 0 16px;font-size:13px;color:#9ca3af;background:#f8fafc;border-radius:6px;padding:12px;line-height:1.6;">
  🔒 Yanıtlarınız gizli tutulur ve yalnızca ilgili değerlendirme sürecine katkı sağlamak
  amacıyla kullanılır.
</p>
<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Katılımınız için teşekkür ederiz.<br><br>Saygılarımızla,<br><strong>{ik_imza} İnsan Kaynakları</strong><br>PI4 Değerlendirme Platformu</p>"""
    else:
        konu = f"Reminder | {envanter_adi} assessment is waiting for you"
        icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  The <strong>{envanter_adi}</strong> assessment we sent you earlier has not been completed yet.
  This is not an exam — there are no right or wrong answers. Please complete it at your convenience.
</p>
<a href="{form_linki}" style="display:inline-block;background:#132D50;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Complete Assessment →</a>
<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">{form_linki}</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Thank you for your participation.<br><br>Best regards,<br><strong>{ik_imza} Human Resources</strong><br>PI4 Assessment Platform</p>"""

    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik), from_name)


def tamamlandi_emaili_olustur(
    alici_email: str,
    alici_ad: str,
    envanter_adi: str,
    firma_adi: str = "",
) -> bool:
    """Katılımcı formu tamamladığında otomatik gönderilir."""
    from_name = f"{firma_adi} — PI4 Değerlendirme" if firma_adi else EMAIL_FROM_NAME
    ik_imza = firma_adi if firma_adi else "İnsan Kaynakları"
    konu = "PI4 Değerlendirme | Katılımınız için teşekkür ederiz"
    icerik = f"""
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Sayın <strong>{alici_ad}</strong>,</p>
<p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
  <strong>{envanter_adi}</strong> değerlendirmenizi başarıyla tamamladınız.
</p>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
  Katılımınız için teşekkür ederiz.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f0fdf4;border-radius:8px;padding:16px;width:100%;box-sizing:border-box;border-left:4px solid #22c55e;">
  <tr><td style="font-size:13px;color:#166534;line-height:1.6;">
    Bu çalışma, güçlü yönlerinizi, çalışma tarzınızı ve gelişim alanlarınızı daha iyi anlamaya
    yardımcı olmak amacıyla kullanılacaktır. Gerekli durumlarda sonuçlarınız ilgili yöneticileriniz
    veya İnsan Kaynakları ekibi tarafından sizinle paylaşılabilir.
  </td></tr>
</table>
<p style="margin:0 0 0;font-size:13px;color:#6b7280;">İlginiz ve katkınız için teşekkür ederiz.<br><br>Saygılarımızla,<br><strong>{ik_imza} İnsan Kaynakları</strong><br>PI4 Değerlendirme Platformu</p>"""
    return email_gonder(alici_email, alici_ad, konu, _html_sarmal(konu, icerik), from_name)
