import { useState } from 'react'
import FormLayout from '../components/FormLayout'
import { yanitKaydet } from '../api/form'
import { PROBLEM_SORULAR } from '../data/envanter_sorular'

export default function ProblemForm({ token, bilgi, onTamamlandi }) {
  const mevcutYanitlar = bilgi.mevcut_yanitlar || {}
  const [yanitlar, setYanitlar] = useState(mevcutYanitlar.yanitlar || {})
  const [adim, setAdim] = useState('giris')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const ilerleme = adim === 'giris' ? 0 : adim === 'ozet' ? 90 : 50

  const adimlar = [
    { id: 'giris', label: 'Başlangıç', aktif: adim === 'giris', tamamlandi: adim !== 'giris' },
    { id: 'form', label: 'Puan Dağıtımı', aktif: adim === 'form', tamamlandi: adim === 'ozet' },
    { id: 'ozet', label: 'Özet', aktif: adim === 'ozet', tamamlandi: false },
  ]

  const toplamAl = (soruId) => {
    const grup = yanitlar[soruId] || {}
    return Object.values(grup).reduce((a, b) => a + (Number(b) || 0), 0)
  }

  const setPuan = (soruId, kolon, deger) => {
    const num = Math.max(0, Math.min(10, parseInt(deger) || 0))
    setYanitlar(p => ({ ...p, [soruId]: { ...(p[soruId] || {}), [kolon]: num } }))
  }

  const validateForm = () => {
    for (const soru of PROBLEM_SORULAR) {
      const toplam = toplamAl(soru.id)
      if (toplam !== 10) return `Soru grubu ${soru.id}: Toplam ${toplam}/10 — Her gruptan tam 10 puan dağıtılmalıdır.`
    }
    return null
  }

  const handleIleri = async () => {
    setHata('')
    if (adim === 'giris') { setAdim('form'); return }
    if (adim === 'form') {
      const err = validateForm()
      if (err) { setHata(err); return }
      try { await yanitKaydet(token, { yanitlar }, false) } catch (e) {}
      setAdim('ozet')
    } else {
      setYukleniyor(true)
      try {
        await yanitKaydet(token, { yanitlar }, true)
        onTamamlandi()
      } catch (e) {
        setHata(e.message || 'Gönderim sırasında bir hata oluştu.')
      } finally {
        setYukleniyor(false)
      }
    }
  }

  return (
    <FormLayout
      katilimciAd={`${bilgi.katilimci_ad} ${bilgi.katilimci_soyad}`}
      envanter="Problem Çözme Tarzı Testi"
      adimlar={adimlar}
      ilerlemeYuzdesi={ilerleme}
      onGeri={() => { setHata(''); setAdim(adim === 'ozet' ? 'form' : 'giris') }}
      onIleri={handleIleri}
      geriGoster={adim !== 'giris'}
      ileriLabel={adim === 'giris' ? 'Başla →' : adim === 'ozet' ? 'Gönder ✓' : 'Devam et →'}
      yukleniyor={yukleniyor}
      hata={hata}
      scrollKey={adim}
    >

      {/* Giriş */}
      {adim === 'giris' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl mb-3">🧩</div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Problem Çözme Tarzı Testi</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Bu test, sorunlara yaklaşım biçiminizi ve karar alma tarzınızı anlamak için tasarlanmıştır.
            Sonuçlar, düşünme stilinizin güçlü yönlerini ve problem çözmedeki tercihlerinizi ortaya koyacaktır.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-medium text-blue-800 mb-2">📋 Nasıl doldurulur?</div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">1.</span>
              <span>Her soru grubunda <strong>3 farklı yaklaşım</strong> göreceksiniz.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">2.</span>
              <span>Elinizde <strong>10 puan</strong> var. Bu puanı 3 seçenek arasında istediğiniz gibi dağıtın. Toplamın tam olarak <strong>10</strong> olması gerekir.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">3.</span>
              <span>Örnek: 6 + 3 + 1 = 10 ✓ &nbsp;|&nbsp; Bir seçeneğe 0 da verebilirsiniz.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">4.</span>
              <span>Toplam <strong>10 soru grubu</strong> var. Yaklaşık <strong>5-10 dakika</strong> sürer.</span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {adim === 'form' && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Puan Dağıtımı</h2>
          <p className="text-sm text-gray-500 mb-5">Her gruptaki 3 seçeneğe toplamda 10 puan dağıtın.</p>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="space-y-4">
            {PROBLEM_SORULAR.map(soru => {
              const toplam = toplamAl(soru.id)
              const tamam = toplam === 10
              const fazla = toplam > 10
              return (
                <div key={soru.id} className={`bg-white rounded-xl border p-4 ${fazla ? 'border-red-300' : tamam ? 'border-green-300' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      fazla ? 'bg-red-100 text-red-700' : tamam ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {toplam} / 10 {tamam ? '✓' : fazla ? '— Fazla' : ''}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {soru.secenekler.map(s => {
                      const puan = yanitlar[soru.id]?.[s.kolon] ?? ''
                      return (
                        <div key={s.kolon} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 flex-1 leading-snug">{s.metin}</span>
                          <input
                            type="number" min="0" max="10"
                            value={puan}
                            onChange={e => setPuan(soru.id, s.kolon, e.target.value)}
                            className={`w-14 text-center text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-tatko ${
                              fazla ? 'border-red-300' : tamam ? 'border-green-300' : 'border-gray-300'
                            }`}
                            placeholder="0"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Özet */}
      {adim === 'ozet' && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Göndermeye hazır mısınız?</h2>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <div className="text-sm font-medium text-gray-900">10 soru grubu tamamlandı</div>
                <div className="text-xs text-gray-500 mt-0.5">Her gruptan 10 puan dağıtıldı</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormLayout>
  )
}
