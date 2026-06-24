import { useState } from 'react'
import FormLayout from '../components/FormLayout'
import { yanitKaydet } from '../api/form'
import { ETKILESIM_SORULAR } from '../data/envanter_sorular'

// KB/NB/BB/GB/TB kodları kaldırıldı — sadece tam metin
const OLCEK = [
  { kod: 'KB', metin: 'Kesinlikle böyle davranmam' },
  { kod: 'NB', metin: 'Nadiren böyle davranırım' },
  { kod: 'BB', metin: 'Bazen böyle davranırım' },
  { kod: 'GB', metin: 'Genellikle böyle davranırım' },
  { kod: 'TB', metin: 'Tamamen, hemen hemen her zaman böyle davranırım' },
]

const SAYFA_BOYUTU = 10
const TOPLAM_SAYFA = Math.ceil(ETKILESIM_SORULAR.length / SAYFA_BOYUTU)

export default function EtkilesimForm({ token, bilgi, onTamamlandi }) {
  const mevcutYanitlar = bilgi.mevcut_yanitlar || {}
  const [yanitlar, setYanitlar] = useState(mevcutYanitlar.yanitlar || {})
  const [sayfa, setSayfa] = useState(-1)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const giris = sayfa === -1
  const ozet = sayfa === TOPLAM_SAYFA
  const ilerleme = giris ? 0 : ((sayfa + 1) / (TOPLAM_SAYFA + 1)) * 100
  const sayfaSorular = (!giris && !ozet) ? ETKILESIM_SORULAR.slice(sayfa * SAYFA_BOYUTU, (sayfa + 1) * SAYFA_BOYUTU) : []

  const adimlar = [
    { id: 'giris', label: 'Başlangıç', aktif: giris, tamamlandi: !giris },
    ...Array.from({ length: TOPLAM_SAYFA }, (_, i) => ({
      id: `sayfa${i}`, label: `${i * 10 + 1}-${Math.min((i + 1) * 10, 40)}`,
      aktif: sayfa === i, tamamlandi: sayfa > i,
    })),
    { id: 'ozet', label: 'Özet', aktif: ozet, tamamlandi: false },
  ]

  const handleIleri = async () => {
    setHata('')
    if (giris) { setSayfa(0); return }
    if (!ozet) {
      const eksik = sayfaSorular.filter(s => !yanitlar[s.id]).length
      if (eksik > 0) { setHata(`${eksik} soru yanıtsız. Lütfen tüm soruları yanıtlayın.`); return }
      try { await yanitKaydet(token, { yanitlar }, false) } catch (e) {}
      setSayfa(p => p + 1)
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
      envanter="Kişilerarası Etkileşim Testi"
      adimlar={adimlar}
      ilerlemeYuzdesi={ilerleme}
      onGeri={() => { setHata(''); setSayfa(p => p - 1) }}
      onIleri={handleIleri}
      geriGoster={!giris}
      ileriLabel={giris ? 'Başla →' : ozet ? 'Gönder ✓' : 'Devam et →'}
      yukleniyor={yukleniyor}
      hata={hata}
      scrollKey={sayfa}
    >

      {/* Giriş */}
      {giris && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-2xl mb-3">🤝</div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Kişilerarası Etkileşim Testi</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Bu test, iletişim tarzınızı ve farklı durumlarda — özellikle baskı altındayken — nasıl davrandığınızı
            anlamak için tasarlanmıştır. Sonuçlar, ilişki kurma ve iletişim güçlerinizi ortaya koyacaktır.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-medium text-blue-800 mb-2">📋 Nasıl doldurulur?</div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">1.</span>
              <span>Her ifadeyi dikkatlice okuyun ve <strong>bugünkü iş yaşantınızı</strong> düşünerek yanıtlayın.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">2.</span>
              <span>5 seçenek arasından size en uygun olanı seçin: <strong>"Kesinlikle böyle davranmam"</strong>dan <strong>"Her zaman böyle davranırım"</strong>a kadar.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">3.</span>
              <span>Geçmişteki veya gelecekteki davranışlarınızı değil, <strong>şu anki gerçek davranışlarınızı</strong> yansıtın.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="flex-shrink-0 font-medium">4.</span>
              <span>Toplam <strong>40 soru</strong> var. Yaklaşık <strong>10-15 dakika</strong> sürer.</span>
            </div>
          </div>
        </div>
      )}

      {/* Soru sayfaları */}
      {!giris && !ozet && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">
            {sayfa * 10 + 1}–{Math.min((sayfa + 1) * 10, 40)}. Sorular
          </h2>
          <p className="text-sm text-gray-500 mb-5">Bugünkü iş yaşantınızı düşünerek yanıtlayın.</p>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="space-y-3">
            {sayfaSorular.map(soru => (
              <div key={soru.id} className="bg-white rounded-xl border border-gray-200 p-4">
                
                <p className="text-sm text-gray-800 mb-3 leading-relaxed font-medium">{soru.metin}</p>
                <div className="space-y-1.5">
                  {OLCEK.map(s => {
                    const secili = yanitlar[soru.id] === s.kod
                    return (
                      <button key={s.kod}
                        onClick={() => setYanitlar(p => ({ ...p, [soru.id]: s.kod }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                          secili ? 'border-tatko bg-blue-50 border-2' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${secili ? 'border-tatko' : 'border-gray-300'}`}>
                          {secili && <div className="w-2 h-2 rounded-full bg-tatko" />}
                        </div>
                        <span className={`text-sm flex-1 ${secili ? 'text-tatko font-medium' : 'text-gray-700'}`}>{s.metin}</span>
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
      {ozet && (
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-1">Göndermeye hazır mısınız?</h2>
          {hata && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Tüm sorular yanıtlandı</div>
                <div className="text-xs text-gray-500 mt-0.5">{Object.keys(yanitlar).length} / 40 soru tamamlandı</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormLayout>
  )
}
