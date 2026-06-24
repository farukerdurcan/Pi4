import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import YeniKatilimciModal from '../components/YeniKatilimciModal'
import { panelIstatistik, katilimciListesi, beklemesSayisi, topluHatirlatmaGonder } from '../api/katilimci'

const DURUM_ROZET = {
  gonderildi: { label: 'Gönderildi', cls: 'bg-blue-100 text-blue-700' },
  devam_ediyor: { label: 'Devam ediyor', cls: 'bg-yellow-100 text-yellow-700' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
  raporlandi: { label: 'Raporlandı', cls: 'bg-gray-100 text-gray-600' },
}
const AVATAR_RENKLER = ['bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-purple-100 text-purple-700','bg-orange-100 text-orange-700']

export default function Panel() {
  const navigate = useNavigate()
  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || '{}')
  const [istatistik, setIstatistik] = useState({ toplam: 0, bekleyen: 0, tamamlanan: 0, raporlanan: 0 })
  const [katilimcilar, setKatilimcilar] = useState([])
  const [modalAcik, setModalAcik] = useState(false)
  const [hata, setHata] = useState('')
  const [bekleyenSayi, setBekleyenSayi] = useState(0)
  const [hatirlatmaYukleniyor, setHatirlatmaYukleniyor] = useState(false)
  const [hatirlatmaMesaj, setHatirlatmaMesaj] = useState('')

  const veriYukle = async () => {
    try {
      setHata('')
      const [istat, liste] = await Promise.all([panelIstatistik(), katilimciListesi('', 5)])
      setIstatistik(istat)
      setKatilimcilar(liste)
    } catch (e) {
      setHata('Veriler yüklenemedi')
      console.error(e)
    }
    // Bekleme sayısı ayrı yüklenir — hata olursa paneli bozmasın
    try {
      const bekSayi = await beklemesSayisi()
      setBekleyenSayi(bekSayi.sayi || 0)
    } catch { /* sessiz */ }
  }

  const handleTopluHatirlatma = async () => {
    setHatirlatmaYukleniyor(true)
    setHatirlatmaMesaj('')
    try {
      const sonuc = await topluHatirlatmaGonder()
      setHatirlatmaMesaj(`✓ ${sonuc.toplam} kişiye hatırlatma gönderildi`)
      setBekleyenSayi(0)
    } catch {
      setHatirlatmaMesaj('Gönderilemedi, tekrar deneyin')
    } finally {
      setHatirlatmaYukleniyor(false)
    }
  }

  useEffect(() => { veriYukle() }, [])

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Ana panel</h1>
        <button onClick={() => setModalAcik(true)} className="flex items-center gap-1.5 bg-tatko text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-tatko-koyu">
          + Yeni katılımcı
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="mb-4 text-sm text-gray-600">
          Hoş geldiniz, <span className="font-medium text-gray-900">{kullanici.ad}</span>
        </div>

        {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-600">{hata}</div>}

        {bekleyenSayi > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-amber-500 text-base">⚠</span>
              <span className="text-xs text-amber-800">
                <span className="font-semibold">{bekleyenSayi} form</span>, 5 günden uzun süredir bekleniyor
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {hatirlatmaMesaj && (
                <span className="text-xs text-amber-700">{hatirlatmaMesaj}</span>
              )}
              <button
                onClick={handleTopluHatirlatma}
                disabled={hatirlatmaYukleniyor}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {hatirlatmaYukleniyor ? 'Gönderiliyor...' : 'Toplu hatırlatma gönder'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { etiket: 'Toplam katılımcı', deger: istatistik.toplam, renk: 'text-gray-900', alt: 'Kayıtlı kişi' },
            { etiket: 'Bekleyen form', deger: istatistik.bekleyen, renk: 'text-yellow-600', alt: 'Doldurulmayı bekliyor' },
            { etiket: 'Tamamlanan', deger: istatistik.tamamlanan, renk: 'text-green-600', alt: 'Form dolduruldu' },
            { etiket: 'Raporlanan', deger: istatistik.raporlanan, renk: 'text-blue-600', alt: 'Rapor üretildi' },
          ].map(k => (
            <div key={k.etiket} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1.5">{k.etiket}</div>
              <div className={`text-2xl font-medium ${k.renk}`}>{k.deger}</div>
              <div className="text-xs text-gray-400 mt-1">{k.alt}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Son katılımcılar</span>
            <button onClick={() => navigate('/katilimcilar')} className="text-xs text-blue-600">Tümünü gör →</button>
          </div>

          {katilimcilar.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">👥</div>
              <div className="text-sm font-medium text-gray-700 mb-1">Henüz katılımcı eklenmedi</div>
              <div className="text-xs text-gray-400 mb-4">Sağ üstteki "Yeni katılımcı" butonuyla başlayabilirsiniz</div>
              <button onClick={() => setModalAcik(true)} className="bg-tatko text-white text-xs px-4 py-2 rounded-lg">+ İlk katılımcıyı ekle</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                <span>Kişi</span><span>Durum</span><span>Eklenme</span><span></span>
              </div>
              {katilimcilar.map((k, i) => {
                const avatarRenk = AVATAR_RENKLER[i % AVATAR_RENKLER.length]
                const tarih = new Date(k.olusturulma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                const durum = k.tamamlanan_sayisi > 0 && k.tamamlanan_sayisi === k.atama_sayisi ? 'tamamlandi' : 'gonderildi'
                const rozet = DURUM_ROZET[durum]
                return (
                  <div key={k.id} className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-3 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${avatarRenk}`}>{k.ad?.[0]}{k.soyad?.[0]}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{k.ad} {k.soyad}</div>
                        <div className="text-xs text-gray-500">{k.pozisyon || k.departman || ''}</div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${rozet?.cls}`}>{rozet?.label}</span>
                    <span className="text-xs text-gray-500">{tarih}</span>
                    <button onClick={() => navigate(`/katilimcilar/${k.id}`)} className="text-xs text-blue-600 hover:text-blue-800">Profil →</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {modalAcik && <YeniKatilimciModal onKapat={() => setModalAcik(false)} onEklendi={() => { setModalAcik(false); veriYukle() }} />}
    </Layout>
  )
}
