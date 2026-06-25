import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { gonderimleriListele, hatirlatmaGonder } from '../api/katilimci'

const KOLONLAR = [
  { tip: 'liderlik_stili',    kisalt: 'LS',  ad: 'Liderlik Stili',         bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { tip: 'kisisel_etkilesim', kisalt: 'KE',  ad: 'Kişilerarası Etkileşim', bg: 'bg-orange-100', text: 'text-orange-700' },
  { tip: 'problem_cozme',     kisalt: 'PC',  ad: 'Problem Çözme',           bg: 'bg-purple-100', text: 'text-purple-700' },
  { tip: 'motivasyon',        kisalt: 'Mot', ad: 'Motivasyon İhtiyacı',     bg: 'bg-green-100',  text: 'text-green-700'  },
]

function MatrisHucre({ atama, katilimciId, onHatirlatma, hatirlatmaYukleniyor }) {
  if (!atama) {
    return (
      <td className="px-4 py-3.5 text-center border-l border-slate-100">
        <span className="text-slate-200 text-sm select-none">—</span>
      </td>
    )
  }

  const { durum, atama_id, gecen_gun } = atama
  const tamamlandi = durum === 'tamamlandi' || durum === 'raporlandi'
  const bekliyor   = durum === 'gonderildi' || durum === 'devam_ediyor'
  const gecikti    = bekliyor && gecen_gun != null && gecen_gun >= 5

  if (tamamlandi) {
    return (
      <td className="px-4 py-3.5 text-center border-l border-slate-100">
        <div className="inline-flex w-7 h-7 rounded-full bg-green-100 text-green-600 items-center justify-center text-sm font-bold">
          ✓
        </div>
      </td>
    )
  }

  if (bekliyor) {
    return (
      <td className="px-4 py-3.5 text-center border-l border-slate-100">
        <div className="group relative inline-flex items-center justify-center w-14 h-7">
          {/* Normal durum */}
          <div className={`group-hover:invisible flex items-center gap-1.5 ${gecikti ? 'text-red-500' : 'text-amber-500'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gecikti ? 'bg-red-400' : 'bg-amber-400'}`} />
            {gecen_gun != null && (
              <span className="text-xs font-medium">{gecen_gun}g</span>
            )}
          </div>
          {/* Hover: hatırlatma butonu */}
          <button
            onClick={() => onHatirlatma(katilimciId, atama_id)}
            disabled={hatirlatmaYukleniyor === atama_id}
            className="absolute inset-0 invisible group-hover:visible flex items-center justify-center"
            title="Hatırlatma gönder"
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors
              ${hatirlatmaYukleniyor === atama_id
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {hatirlatmaYukleniyor === atama_id ? '⋯' : '🔔'}
            </span>
          </button>
        </div>
      </td>
    )
  }

  return (
    <td className="px-4 py-3.5 text-center border-l border-slate-100">
      <span className="text-slate-300 text-xs">{durum}</span>
    </td>
  )
}

export default function Gonderimleri() {
  const navigate = useNavigate()
  const [gonderimleri, setGonderimleri] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')
  const [hatirlatmaYukleniyor, setHatirlatmaYukleniyor] = useState(null)
  const [bildirim, setBildirim] = useState('')

  useEffect(() => {
    gonderimleriListele()
      .then(setGonderimleri)
      .catch(() => setHata('Gönderimler yüklenemedi'))
      .finally(() => setYukleniyor(false))
  }, [])

  const handleHatirlatma = async (katilimciId, atamaId) => {
    setHatirlatmaYukleniyor(atamaId)
    try {
      await hatirlatmaGonder(katilimciId, atamaId)
      setBildirim('Hatırlatma gönderildi ✓')
      setTimeout(() => setBildirim(''), 3000)
    } catch {
      setBildirim('Gönderim başarısız')
      setTimeout(() => setBildirim(''), 3000)
    } finally {
      setHatirlatmaYukleniyor(null)
    }
  }

  // Flat listeyi katılımcı bazında matrise çevir
  const katilimcilar = useMemo(() => {
    const map = new Map()
    gonderimleri.forEach(g => {
      if (!map.has(g.katilimci_id)) {
        map.set(g.katilimci_id, {
          id: g.katilimci_id,
          ad: g.katilimci_ad,
          email: g.katilimci_email,
          pozisyon: g.pozisyon,
          departman: g.departman,
          envanterler: {},
        })
      }
      map.get(g.katilimci_id).envanterler[g.envanter_tipi] = {
        atama_id: g.atama_id,
        durum: g.durum,
        gecen_gun: g.gecen_gun,
        gonderim_tarihi: g.gonderim_tarihi,
      }
    })
    return Array.from(map.values())
  }, [gonderimleri])

  const filtrelenmis = useMemo(() =>
    katilimcilar.filter(k =>
      arama === '' ||
      k.ad.toLowerCase().includes(arama.toLowerCase()) ||
      k.email.toLowerCase().includes(arama.toLowerCase())
    ),
    [katilimcilar, arama]
  )

  // Özet sayılar
  const bekleyenSayi = gonderimleri.filter(g =>
    ['gonderildi', 'devam_ediyor'].includes(g.durum) && g.gecen_gun >= 5
  ).length

  return (
    <Layout>
      <div className="bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0" style={{ height: 52 }}>
        <h1 className="text-sm font-medium text-slate-900">Gönderimler</h1>
        <div className="flex items-center gap-3">
          {bekleyenSayi > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {bekleyenSayi} gecikmeli
            </span>
          )}
          <span className="text-xs text-slate-400">{filtrelenmis.length} katılımcı</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6">

          {/* Arama */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Kişi ara..."
              value={arama}
              onChange={e => setArama(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko w-64 bg-white"
            />
          </div>

          {hata && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-600">{hata}</div>
          )}

          {yukleniyor ? (
            <div className="text-center py-16 text-sm text-slate-400">Yükleniyor...</div>
          ) : filtrelenmis.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <div className="text-3xl mb-3">📭</div>
              <div className="text-sm text-slate-500">Katılımcı bulunamadı</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Katılımcı
                    </th>
                    {KOLONLAR.map(k => (
                      <th key={k.tip} className="text-center px-4 py-3 border-l border-slate-100">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${k.bg} ${k.text}`}>
                            {k.kisalt}
                          </span>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden xl:block">
                            {k.ad}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map(k => (
                    <tr key={k.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/katilimcilar/${k.id}`)}
                          className="text-sm font-medium text-slate-900 hover:text-tatko text-left leading-tight"
                        >
                          {k.ad}
                        </button>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {k.pozisyon || k.departman || k.email}
                        </div>
                      </td>
                      {KOLONLAR.map(kol => (
                        <MatrisHucre
                          key={kol.tip}
                          atama={k.envanterler[kol.tip]}
                          katilimciId={k.id}
                          onHatirlatma={handleHatirlatma}
                          hatirlatmaYukleniyor={hatirlatmaYukleniyor}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Açıklama */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Tamamlandı</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>3g</span></div>
                  <span>Bekliyor (gün sayısı)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /><span>7g</span></div>
                  <span>5+ gün gecikmeli</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>Üzerine gel → hatırlatma gönder</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Toast bildirimi */}
      {bildirim && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white transition-all
          ${bildirim.includes('başarısız') ? 'bg-red-500' : 'bg-green-500'}`}>
          {bildirim}
        </div>
      )}
    </Layout>
  )
}
