import { useState } from 'react'
import FormLayout from '../components/FormLayout'
import { yanitKaydet } from '../api/form'
import { LIDERLIK_BOLUM1, LIDERLIK_BOLUM2 } from '../data/envanter_sorular'

const ADIMLAR = [
  { id: 'giris', label: 'Başlangıç' },
  { id: 'bolum1', label: 'Kelime Grupları' },
  { id: 'bolum2', label: 'Durum Analizi' },
  { id: 'ozet', label: 'Özet' },
]

export default function LiderlikForm({ token, bilgi, firmaAdi, onTamamlandi }) {
  const mevcutYanitlar = bilgi.mevcut_yanitlar || {}
  const [bolum1Yanitlar, setBolum1Yanitlar] = useState(mevcutYanitlar.bolum1 || {})
  const [bolum2Yanitlar, setBolum2Yanitlar] = useState(mevcutYanitlar.bolum2 || {})
  const [adim, setAdim] = useState('giris')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const adimIndex = ADIMLAR.findIndex(a => a.id === adim)
  const ilerleme = (adimIndex / ADIMLAR.length) * 100

  const adimlar = ADIMLAR.map((a, i) => ({
    ...a, aktif: a.id === adim, tamamlandi: i < adimIndex,
  }))

  const araKaydet = async (yanitlar) => {
    try { await yanitKaydet(token, yanitlar, false) } catch (e) {}
  }

  const handleIleri = async () => {
    setHata('')
    if (adim === 'giris') {
      setAdim('bolum1')
    } else if (adim === 'bolum1') {
      const eksik = LIDERLIK_BOLUM1.filter(s => !bolum1Yanitlar[s.id]).length
      if (eksik > 0) { setHata(`${eksik} satır henüz seçilmedi. Lütfen tüm satırları doldurun.`); return }
      await araKaydet({ bolum1: bolum1Yanitlar })
      setAdim('bolum2')
    } else if (adim === 'bolum2') {
      const eksik = LIDERLIK_BOLUM2.filter(s => !bolum2Yanitlar[s.id]).length
      if (eksik > 0) { setHata(`${eksik} soru henüz yanıtlanmadı. Lütfen tüm soruları yanıtlayın.`); return }
      await araKaydet({ bolum1: bolum1Yanitlar, bolum2: bolum2Yanitlar })
      setAdim('ozet')
    } else if (adim === 'ozet') {
      setYukleniyor(true)
      try {
        await yanitKaydet(token, { bolum1: bolum1Yanitlar, bolum2: bolum2Yanitlar }, true)
        onTamamlandi()
      } catch (e) {
        setHata(e.message || 'Gönderim sırasında bir hata oluştu.')
      } finally {
        setYukleniyor(false)
      }
    }
  }

  const handleGeri = () => {
    setHata('')
    const sira = ['giris', 'bolum1', 'bolum2', 'ozet']
    const i = sira.indexOf(adim)
    if (i > 0) setAdim(sira[i - 1])
  }

  return (
    <FormLayout
      katilimciAd={`${bilgi.katilimci_ad} ${bilgi.katilimci_soyad}`}
      firmaAdi={firmaAdi}
      envanter="Liderlik Stili Testi"
      adimlar={adimlar}
      ilerlemeYuzdesi={ilerleme}
      onGeri={handleGeri}
      onIleri={handleIleri}
      geriGoster={adim !== 'giris'}
      ileriLabel={adim === 'giris' ? 'Başla →' : adim === 'ozet' ? 'Gönder ✓' : 'Devam et →'}
      yukleniyor={yukleniyor}
      hata={hata}
      scrollKey={adim}
    >

      {/* Giriş */}
      {adim === 'giris' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="text-2xl mb-3">🧭</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Liderlik Stili Testi</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Bu test, liderlik davranışlarınızı ve başkalarıyla çalışma tarzınızı ortaya koymak için tasarlanmıştır.
              Sonuçlar, güçlü yönlerinizi keşfetmenize ve ekibinizle daha etkili iletişim kurmanıza yardımcı olacaktır.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="text-xs font-medium text-blue-800 mb-2">📋 Nasıl doldurulur?</div>
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="flex-shrink-0 font-medium">1.</span>
                <span><strong>Bölüm 1:</strong> Her satırda 4 kelime grubu göreceksiniz. Sizi en iyi tanımlayan grubu seçin.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="flex-shrink-0 font-medium">2.</span>
                <span><strong>Bölüm 2:</strong> Her cümlede bir boşluk var. Size en uygun seçeneği işaretleyin.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="flex-shrink-0 font-medium">3.</span>
                <span>Doğru ya da yanlış cevap yoktur. <strong>Nasıl olmak istediğinizi değil, gerçekte nasıl olduğunuzu</strong> yansıtın.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="flex-shrink-0 font-medium">4.</span>
                <span>Toplam <strong>32 soru</strong> var. Tamamlamanız yaklaşık <strong>10-15 dakika</strong> sürer.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bölüm 1 — Kelime grupları */}
      {adim === 'bolum1' && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Bölüm 1 — Kelime Grupları</h2>
          <p className="text-sm text-gray-500 mb-5">Her satırda sizi en çok tanımlayan kelime grubunu seçin.</p>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="space-y-3">
            {LIDERLIK_BOLUM1.map(soru => (
              <div key={soru.id} className="bg-white rounded-xl border border-gray-200 p-3">
                
                <div className="grid grid-cols-2 gap-2">
                  {soru.secenekler.map((s, idx) => {
                    const secili = bolum1Yanitlar[soru.id] === s.harf
                    return (
                      <button
                        key={s.harf}
                        onClick={() => setBolum1Yanitlar(p => ({ ...p, [soru.id]: s.harf }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                          secili
                            ? 'border-tatko bg-blue-50 border-2'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${secili ? 'border-tatko' : 'border-gray-300'}`}>
                          {secili && <div className="w-2 h-2 rounded-full bg-tatko" />}
                        </div>
                        <span className={`text-xs leading-relaxed ${secili ? 'text-tatko font-medium' : 'text-gray-700'}`}>
                          {s.kelimeler}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bölüm 2 — Durum analizi */}
      {adim === 'bolum2' && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Bölüm 2 — Durum Analizi</h2>
          <p className="text-sm text-gray-500 mb-5">Her cümledeki boşluğu en iyi anlatan seçeneği işaretleyin.</p>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="space-y-3">
            {LIDERLIK_BOLUM2.map(soru => (
              <div key={soru.id} className="bg-white rounded-xl border border-gray-200 p-4">
                
                <p className="text-sm text-gray-800 mb-3 leading-relaxed">{soru.soru}</p>
                <div className="space-y-2">
                  {soru.secenekler.map(s => {
                    const secili = bolum2Yanitlar[soru.id] === s.harf
                    return (
                      <button
                        key={s.harf}
                        onClick={() => setBolum2Yanitlar(p => ({ ...p, [soru.id]: s.harf }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                          secili ? 'border-tatko bg-blue-50 border-2' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${secili ? 'border-tatko' : 'border-gray-300'}`}>
                          {secili && <div className="w-2 h-2 rounded-full bg-tatko" />}
                        </div>
                        <span className="text-sm text-gray-700">{s.metin}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Özet */}
      {adim === 'ozet' && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Göndermeye hazır mısınız?</h2>
          <p className="text-sm text-gray-500 mb-5">Yanıtlarınız kaydedilecek. Gönderildikten sonra değiştirilemez.</p>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Tüm sorular yanıtlandı</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Bölüm 1: {Object.keys(bolum1Yanitlar).length}/17 · Bölüm 2: {Object.keys(bolum2Yanitlar).length}/15
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormLayout>
  )
}
