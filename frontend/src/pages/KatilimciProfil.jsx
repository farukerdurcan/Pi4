import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { katilimciDetay, katilimciRaporOzeti, notEkle, hatirlatmaGonder, envanterAta } from '../api/katilimci'

const ENV = {
  liderlik_stili:    { kisalt: 'LS',  renk: 'bg-blue-100 text-blue-700',   nokta: 'bg-blue-500'   },
  motivasyon:        { kisalt: 'Mot', renk: 'bg-green-100 text-green-700',  nokta: 'bg-green-500'  },
  kisisel_etkilesim: { kisalt: 'KE',  renk: 'bg-orange-100 text-orange-700',nokta: 'bg-orange-500' },
  problem_cozme:     { kisalt: 'PC',  renk: 'bg-purple-100 text-purple-700',nokta: 'bg-purple-500' },
}

const DURUM = {
  gonderildi:    { label: 'Gönderildi',     cls: 'bg-blue-100 text-blue-700'   },
  devam_ediyor:  { label: 'Devam ediyor',   cls: 'bg-yellow-100 text-yellow-700'},
  tamamlandi:    { label: 'Tamamlandı',     cls: 'bg-green-100 text-green-700' },
  raporlandi:    { label: 'Raporlandı',     cls: 'bg-gray-100 text-gray-600'   },
}

// Envanter için özet metin üret
function envanter_ozeti(envanter_tipi, rapor) {
  if (!rapor || rapor.puan_yok) return null
  const meta = rapor.puanlar || {}
  switch (envanter_tipi) {
    case 'liderlik_stili':
      if (meta.birincil_stil && meta.ikincil_stil)
        return `${meta.birincil_stil} · ${meta.ikincil_stil}`
      if (meta.birincil_stil) return meta.birincil_stil
      return null
    case 'motivasyon':
      if (meta.temel_ihtiyac && meta.motivasyon_seviyesi)
        return `${meta.temel_ihtiyac} · ${meta.motivasyon_seviyesi}`
      return null
    case 'kisisel_etkilesim':
      return meta.profil_kodu || null
    case 'problem_cozme':
      if (meta.birincil_tarz && meta.seviyeler)
        return `${meta.birincil_tarz} · ${meta.seviyeler?.[meta.birincil_tarz?.toLowerCase()] || ''}`
      return null
    default: return null
  }
}

export default function KatilimciProfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [k, setK] = useState(null)
  const [raporlar, setRaporlar] = useState({}) // atama_id → rapor
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [yeniNot, setYeniNot] = useState('')
  const [notRaporaDahil, setNotRaporaDahil] = useState(false)
  const [notYoneticidentGizle, setNotYoneticidentGizle] = useState(false)
  const [notYukleniyor, setNotYukleniyor] = useState(false)
  const [formGonderModal, setFormGonderModal] = useState(false)
  const [seciliEnvanterler, setSeciliEnvanterler] = useState([])
  const [gonderYukleniyor, setGonderYukleniyor] = useState(false)
  const [gonderHata, setGonderHata] = useState('')
  const [hatirlatmaBasari, setHatirlatmaBasari] = useState(null)

  const yukle = async () => {
    try {
      const data = await katilimciDetay(id)
      setK(data)
      setHata('')
      // Tamamlanan envanterlerin raporlarını çek
      if (data.atamalar.some(a => a.durum === 'tamamlandi' || a.durum === 'raporlandi')) {
        try {
          const ozet = await katilimciRaporOzeti(id)
          const raporMap = {}
          for (const r of (ozet.raporlar || [])) {
            // atama_id ile eşleştir
            const atama = data.atamalar.find(a => a.envanter_tipi === r.envanter_tipi)
            if (atama) raporMap[atama.id] = r
          }
          setRaporlar(raporMap)
        } catch (e) { /* rapor yoksa sessizce geç */ }
      }
    } catch (e) {
      setHata('Katılımcı yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { yukle() }, [id])

  const handleNot = async () => {
    if (!yeniNot.trim()) return
    setNotYukleniyor(true)
    try {
      await notEkle(id, yeniNot, notRaporaDahil, notYoneticidentGizle)
      setYeniNot('')
      setNotRaporaDahil(false)
      setNotYoneticidentGizle(false)
      yukle()
    }
    catch (e) { alert('Not eklenemedi') }
    finally { setNotYukleniyor(false) }
  }

  const handleFormGonder = async () => {
    if (seciliEnvanterler.length === 0) return
    setGonderYukleniyor(true)
    setGonderHata('')
    try {
      await envanterAta(id, seciliEnvanterler)
      setFormGonderModal(false)
      setSeciliEnvanterler([])
      yukle()
    } catch (e) {
      setGonderHata(e.message || 'Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setGonderYukleniyor(false)
    }
  }

  const handleHatirlatma = async (atamaId) => {
    try {
      await hatirlatmaGonder(id, atamaId)
      setHatirlatmaBasari(atamaId)
      setTimeout(() => setHatirlatmaBasari(null), 3000)
    } catch { /* sessiz */ }
  }

  if (yukleniyor) return <Layout><div className="flex-1 flex items-center justify-center text-sm text-gray-400">Yükleniyor...</div></Layout>
  if (hata || !k) return <Layout><div className="flex-1 flex items-center justify-center text-sm text-red-400">{hata || 'Bulunamadı'}</div></Layout>

  const bas = `${k.ad?.[0] || ''}${k.soyad?.[0] || ''}`.toUpperCase()
  const tarih = new Date(k.olusturulma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-slate-200 flex items-center px-6 gap-2 flex-shrink-0">
        <button onClick={() => navigate('/katilimcilar')} className="text-xs text-gray-400 hover:text-gray-600">Katılımcılar</button>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-medium text-gray-700">{k.ad} {k.soyad}</span>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="flex gap-4">

          {/* Sol kolon */}
          <div className="w-56 flex-shrink-0 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-medium mx-auto mb-3">{bas}</div>
              <div className="text-sm font-medium text-gray-900">{k.ad} {k.soyad}</div>
              <div className="text-xs text-gray-500 mt-1">{k.pozisyon || '—'}</div>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${k.tip === 'aday' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {k.tip === 'aday' ? '💼 Dış aday' : '🏢 Çalışan'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
              {[['E-posta', k.email], ['Departman', k.departman || '—'], ['Eklenme', tarih]].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">{lbl}</span>
                  <span className="text-xs text-gray-700 text-right truncate">{val}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setFormGonderModal(true); setGonderHata(''); setSeciliEnvanterler([]) }}
                className="w-full bg-tatko text-white text-xs font-medium py-2.5 rounded-lg hover:bg-tatko-koyu">
                📤 Form gönder
              </button>
              <button
                onClick={() => navigate(`/katilimcilar/${id}/rapor`)}
                className="w-full border border-gray-200 text-gray-600 text-xs py-2.5 rounded-lg hover:bg-gray-50">
                📊 Raporu görüntüle
              </button>
            </div>
          </div>

          {/* Sağ kolon */}
          <div className="flex-1 space-y-4">

            {/* Envanter durumu */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Envanter durumu</span>
              </div>
              {k.atamalar.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Henüz envanter atanmamış</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {[...k.atamalar].sort((a, b) => {
                    const SIRA = { liderlik_stili: 1, kisisel_etkilesim: 2, problem_cozme: 3, motivasyon: 4 }
                    return (SIRA[a.envanter_tipi] || 99) - (SIRA[b.envanter_tipi] || 99)
                  }).map(a => {
                    const b = ENV[a.envanter_tipi] || { kisalt: '?', renk: 'bg-gray-100 text-gray-600', nokta: 'bg-gray-400' }
                    const d = DURUM[a.durum] || { label: a.durum, cls: 'bg-gray-100 text-gray-600' }
                    const yuzde = a.durum === 'tamamlandi' || a.durum === 'raporlandi' ? 100 : a.durum === 'devam_ediyor' ? 50 : 0
                    const rapor = raporlar[a.id]
                    const ozet = (a.durum === 'tamamlandi' || a.durum === 'raporlandi')
                      ? envanter_ozeti(a.envanter_tipi, rapor)
                      : null

                    return (
                      <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${b.renk}`}>{b.kisalt}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{a.envanter_adi}</div>
                            {/* Özet sonuç */}
                            {ozet && (
                              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                {ozet}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {a.durum === 'gonderildi' && 'Henüz başlanmadı'}
                            {a.durum === 'devam_ediyor' && 'Doldurulmaya devam ediliyor'}
                            {a.durum === 'tamamlandi' && 'Tamamlandı'}
                            {a.durum === 'raporlandi' && 'Raporlandı'}
                          </div>
                          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden w-48">
                            <div className={`h-full rounded-full ${b.nokta}`} style={{ width: `${yuzde}%` }} />
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${d.cls}`}>{d.label}</span>
                        {a.durum === 'gonderildi' && (
                          hatirlatmaBasari === a.id
                            ? <span className="text-xs text-green-600 flex-shrink-0">✓ Gönderildi</span>
                            : <button onClick={() => handleHatirlatma(a.id)} className="text-xs text-gray-400 hover:text-blue-600 flex-shrink-0" title="Hatırlatma gönder">🔔</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Notlar */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Notlar</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <textarea rows={2} placeholder="Not ekle..." value={yeniNot} onChange={e => setYeniNot(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-tatko" />
                  <button onClick={handleNot} disabled={!yeniNot.trim() || notYukleniyor}
                    className="bg-tatko text-white text-xs px-3 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
                    {notYukleniyor ? '...' : 'Ekle'}
                  </button>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={notRaporaDahil} onChange={e => setNotRaporaDahil(e.target.checked)} className="w-3.5 h-3.5 accent-tatko" />
                    <span className="text-xs text-gray-500">Rapora dahil et</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={notYoneticidentGizle} onChange={e => setNotYoneticidentGizle(e.target.checked)} className="w-3.5 h-3.5 accent-tatko" />
                    <span className="text-xs text-gray-500">Yöneticiden gizle</span>
                  </label>
                </div>
                {k.notlar.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-2">Henüz not eklenmedi</div>
                ) : (
                  <div className="space-y-2.5">
                    {k.notlar.map(n => (
                      <div key={n.id} className="border-l-2 border-gray-200 pl-3 py-0.5">
                        <div className="text-xs text-gray-400 mb-1">{n.ik_adi} · {new Date(n.olusturulma_tarihi).toLocaleDateString('tr-TR')}</div>
                        <div className="text-sm text-gray-700">{n.metin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Form gönder modalı */}
      {formGonderModal && (() => {
        const TUMENVANTER = [
          { tip: 'liderlik_stili',    ad: 'Liderlik Stili',         emoji: '🧭' },
          { tip: 'motivasyon',        ad: 'Motivasyon İhtiyacı',    emoji: '💡' },
          { tip: 'kisisel_etkilesim', ad: 'Kişilerarası Etkileşim', emoji: '🤝' },
          { tip: 'problem_cozme',     ad: 'Problem Çözme Tarzı',    emoji: '🧩' },
        ]
        const atanenTipler = (k?.atamalar || []).map(a => a.envanter_tipi)
        const atanabilir = TUMENVANTER.filter(e => !atanenTipler.includes(e.tip))

        const toggleSecim = (tip) => {
          setSeciliEnvanterler(p => p.includes(tip) ? p.filter(t => t !== tip) : [...p, tip])
        }

        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Form gönder</h2>
                <button onClick={() => setFormGonderModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>

              <div className="px-5 py-4">
                <p className="text-xs text-gray-500 mb-4">
                  <span className="font-medium text-gray-700">{k.ad} {k.soyad}</span>'a gönderilecek envanteri seçin.
                </p>

                {atanabilir.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm text-gray-500">Tüm envanterler zaten atanmış.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {atanabilir.map(e => {
                      const secili = seciliEnvanterler.includes(e.tip)
                      return (
                        <button key={e.tip} onClick={() => toggleSecim(e.tip)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            secili ? 'border-tatko bg-blue-50 border-2' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                          <span className="text-lg">{e.emoji}</span>
                          <span className={`text-sm flex-1 ${secili ? 'text-tatko font-medium' : 'text-gray-700'}`}>{e.ad}</span>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${secili ? 'border-tatko bg-tatko' : 'border-gray-300'}`}>
                            {secili && <span className="text-white text-xs leading-none">✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {gonderHata && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{gonderHata}</div>
                )}
              </div>

              {atanabilir.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => setFormGonderModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 text-xs py-2.5 rounded-lg hover:bg-gray-50">
                    İptal
                  </button>
                  <button onClick={handleFormGonder}
                    disabled={seciliEnvanterler.length === 0 || gonderYukleniyor}
                    className="flex-1 bg-tatko text-white text-xs font-medium py-2.5 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
                    {gonderYukleniyor ? 'Gönderiliyor...' : `Gönder (${seciliEnvanterler.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </Layout>
  )
}
