import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { katilimciListesi } from '../api/katilimci'
import { karsilastirmaRaporu } from '../api/rapor'

const ENV_BILGI = {
  liderlik_stili:    { ad: 'Liderlik Stili',          emoji: '🧭', renk: 'bg-blue-100 text-blue-700'   },
  motivasyon:        { ad: 'Motivasyon İhtiyacı',     emoji: '💡', renk: 'bg-green-100 text-green-700'  },
  kisisel_etkilesim: { ad: 'Kişilerarası Etkileşim',  emoji: '🤝', renk: 'bg-orange-100 text-orange-700'},
  problem_cozme:     { ad: 'Problem Çözme Tarzı',     emoji: '🧩', renk: 'bg-purple-100 text-purple-700'},
}

const KATILIMCI_RENKLERI = [
  { bar: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  { bar: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { bar: 'bg-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
]

function anaMetrik(rapor) {
  if (!rapor || rapor.puan_yok) return null
  const meta = rapor.puanlar || {}
  const tip = rapor.envanter_tipi
  if (tip === 'liderlik_stili')    return { birincil: meta.birincil_stil, ikincil: meta.ikincil_stil }
  if (tip === 'motivasyon')        return { birincil: meta.temel_ihtiyac, ikincil: meta.motivasyon_seviyesi }
  if (tip === 'kisisel_etkilesim') return { birincil: meta.profil_kodu,   ikincil: meta.birincil_stil }
  if (tip === 'problem_cozme')     return { birincil: meta.birincil_tarz, ikincil: meta.seviyeler?.[meta.birincil_tarz?.toLowerCase()] }
  return null
}

function MiniBar({ label, puan, maks, renk }) {
  const yuzde = maks > 0 ? Math.min(100, Math.round((Number(puan) / maks) * 100)) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-700">{Number(puan) || 0}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${renk}`} style={{ width: `${yuzde}%` }} />
      </div>
    </div>
  )
}

function KatilimciKart({ katilimciData, rapor, renk }) {
  const k = katilimciData
  const bas = `${k.ad?.[0] || ''}${k.soyad?.[0] || ''}`.toUpperCase()
  const metrik = anaMetrik(rapor)

  return (
    <div className={`rounded-xl border p-4 ${renk.bg} ${renk.border}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${renk.bg} ${renk.text} border ${renk.border}`}>
          {bas}
        </div>
        <div>
          <div className={`text-xs font-medium ${renk.text}`}>{k.ad} {k.soyad}</div>
          <div className="text-xs text-gray-400">{k.pozisyon || k.departman || '—'}</div>
        </div>
      </div>

      {!rapor || rapor.puan_yok ? (
        <div className="text-xs text-gray-400 italic py-2">Bu envanter tamamlanmamış</div>
      ) : (
        <>
          {metrik && (
            <div className="mb-3">
              <div className={`text-base font-medium ${renk.text}`}>{metrik.birincil}</div>
              {metrik.ikincil && (
                <div className="text-xs text-gray-500 mt-0.5">{metrik.ikincil}</div>
              )}
            </div>
          )}

          {rapor.envanter_tipi === 'liderlik_stili' && (() => {
            const p = rapor.puanlar?.puanlar || {}
            return (
              <>
                <MiniBar label="Cesur"      puan={p.cesur}      maks={32} renk={renk.bar} />
                <MiniBar label="Etkileyici" puan={p.etkileyici} maks={32} renk={renk.bar} />
                <MiniBar label="Sempatik"   puan={p.sempatik}   maks={32} renk={renk.bar} />
                <MiniBar label="Teknik"     puan={p.teknik}     maks={32} renk={renk.bar} />
              </>
            )
          })()}

          {rapor.envanter_tipi === 'motivasyon' && (() => {
            const p = rapor.puanlar?.puanlar || {}
            return (
              <>
                <MiniBar label="Başarı"   puan={p.basari}   maks={40} renk={renk.bar} />
                <MiniBar label="Etkileme" puan={p.etkileme} maks={40} renk={renk.bar} />
                <MiniBar label="İlişki"   puan={p.iliski}   maks={40} renk={renk.bar} />
                <MiniBar label="Güvenlik" puan={p.guvenlik} maks={40} renk={renk.bar} />
              </>
            )
          })()}

          {rapor.envanter_tipi === 'kisisel_etkilesim' && (
            (rapor.puanlar?.sirali_stiller || []).map(s => (
              <MiniBar key={s.ad} label={s.ad} puan={s.puan} maks={50} renk={renk.bar} />
            ))
          )}

          {rapor.envanter_tipi === 'problem_cozme' && (() => {
            const p = rapor.puanlar?.puanlar || {}
            return (
              <>
                <MiniBar label="İdealist" puan={p.idealist} maks={100} renk={renk.bar} />
                <MiniBar label="Aktivist" puan={p.aktivist} maks={100} renk={renk.bar} />
                <MiniBar label="Realist"  puan={p.realist}  maks={100} renk={renk.bar} />
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}

function EnvanterSection({ tip, karsilastirmaVerisi }) {
  const bilgi = ENV_BILGI[tip] || { ad: tip, emoji: '📋' }
  const cols = karsilastirmaVerisi.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">{bilgi.emoji}</span>
        <span className="text-sm font-medium text-gray-900">{bilgi.ad}</span>
      </div>
      <div className="p-4">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {karsilastirmaVerisi.map((kd, i) => (
            <KatilimciKart
              key={kd.katilimci.id}
              katilimciData={kd.katilimci}
              rapor={kd.raporlar?.[tip] || null}
              renk={KATILIMCI_RENKLERI[i] || KATILIMCI_RENKLERI[0]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Raporlar() {
  const navigate = useNavigate()
  const [katilimcilar, setKatilimcilar] = useState([])
  const [listYukleniyor, setListYukleniyor] = useState(true)
  const [seciliIdler, setSeciliIdler] = useState([])
  const [karsilastirma, setKarsilastirma] = useState(null)
  const [karsilastirmaYukleniyor, setKarsilastirmaYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')

  useEffect(() => {
    katilimciListesi()
      .then(data => setKatilimcilar(data))
      .catch(() => setHata('Katılımcılar yüklenemedi'))
      .finally(() => setListYukleniyor(false))
  }, [])

  const toggleSecim = (id) => {
    setKarsilastirma(null)
    setSeciliIdler(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const handleKarsilastir = async () => {
    if (seciliIdler.length === 1) {
      navigate(`/katilimcilar/${seciliIdler[0]}/rapor`)
      return
    }
    if (seciliIdler.length < 2) return
    setKarsilastirmaYukleniyor(true)
    setHata('')
    try {
      const data = await karsilastirmaRaporu(seciliIdler)
      setKarsilastirma(data.karsilastirma)
    } catch (e) {
      setHata('Karşılaştırma yüklenemedi. Tekrar deneyin.')
    } finally {
      setKarsilastirmaYukleniyor(false)
    }
  }

  const filtreliListe = katilimcilar.filter(k =>
    arama === '' ||
    `${k.ad} ${k.soyad}`.toLowerCase().includes(arama.toLowerCase()) ||
    k.email.toLowerCase().includes(arama.toLowerCase())
  )

  // Karşılaştırmada gösterilecek envanter tiplerini çıkar
  const envanterTipleri = karsilastirma
    ? [...new Set(
        karsilastirma.flatMap(kd => Object.keys(kd.raporlar || {}))
      )]
    : []

  return (
    <Layout>
      <div className="no-print h-13 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Karşılaştırmalı Rapor</h1>
      </div>

      <div className="flex-1 overflow-hidden flex bg-gray-50">

        {/* Sol panel — Katılımcı seçici */}
        <div className="no-print w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Katılımcı ara..."
              value={arama}
              onChange={e => setArama(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tatko"
            />
          </div>

          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {seciliIdler.length > 0
                ? `${seciliIdler.length} katılımcı seçildi`
                : 'En az 2 seçin'}
            </span>
            {seciliIdler.length > 0 && (
              <button
                onClick={() => { setSeciliIdler([]); setKarsilastirma(null) }}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-2">
            {listYukleniyor ? (
              <div className="text-xs text-gray-400 text-center py-8">Yükleniyor...</div>
            ) : filtreliListe.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8">
                {arama ? 'Sonuç bulunamadı' : 'Tamamlanmış envanteri olan katılımcı yok'}
              </div>
            ) : (
              filtreliListe.map(k => {
                const secili = seciliIdler.includes(k.id)
                const tamamlandi = k.tamamlanan_sayisi > 0
                const dolu = seciliIdler.length >= 3 && !secili
                const secilemez = !tamamlandi || dolu
                const bas = `${k.ad?.[0] || ''}${k.soyad?.[0] || ''}`.toUpperCase()
                const seciliIndex = seciliIdler.indexOf(k.id)
                const renk = seciliIndex >= 0 ? KATILIMCI_RENKLERI[seciliIndex] : null

                return (
                  <div
                    key={k.id}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 group ${
                      secili
                        ? `${renk.bg} border ${renk.border}`
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {/* Karşılaştırma seçim butonu */}
                    <button
                      onClick={() => tamamlandi && !dolu && toggleSecim(k.id)}
                      disabled={secilemez && !secili}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      title={!tamamlandi ? 'Henüz tamamlanmış envanter yok' : ''}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        secili ? `${renk.bg} ${renk.text} border ${renk.border}` : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bas}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${secili ? renk.text : tamamlandi ? 'text-gray-700' : 'text-gray-400'}`}>
                          {k.ad} {k.soyad}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {k.pozisyon || k.departman || k.email}
                          {!tamamlandi && <span className="ml-1 text-gray-300">· envanter yok</span>}
                        </div>
                      </div>
                      {tamamlandi && (
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          secili ? `${renk.bar.replace('bg-', 'bg-').replace('400', '500')} border-transparent` : 'border-gray-300'
                        }`}>
                          {secili && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                      )}
                    </button>

                    {/* Bireysel rapor linki */}
                    <button
                      onClick={() => navigate(`/katilimcilar/${k.id}/rapor`)}
                      className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 border border-blue-200 hover:border-blue-300 whitespace-nowrap"
                      title="Bireysel raporu görüntüle"
                    >
                      Rapor
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Karşılaştır butonu */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleKarsilastir}
              disabled={seciliIdler.length === 0 || karsilastirmaYukleniyor}
              className="w-full bg-tatko text-white text-xs font-medium py-2.5 rounded-lg hover:bg-tatko-koyu disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {karsilastirmaYukleniyor
                ? 'Yükleniyor...'
                : seciliIdler.length === 0
                  ? '1 veya daha fazla katılımcı seçin'
                  : seciliIdler.length === 1
                    ? 'Bireysel raporu görüntüle →'
                    : `${seciliIdler.length} kişiyi karşılaştır →`}
            </button>
          </div>
        </div>

        {/* Sağ alan — Karşılaştırma sonuçları */}
        <div className="flex-1 overflow-auto p-6 print-area">

          {hata && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{hata}</div>
          )}

          {!karsilastirma && !karsilastirmaYukleniyor && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-sm font-medium text-gray-700 mb-2">Karşılaştırma yapmaya hazır</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Sol panelden 2 veya 3 katılımcı seçin, ardından "Karşılaştır" butonuna tıklayın.
                </div>
              </div>
            </div>
          )}

          {karsilastirmaYukleniyor && (
            <div className="h-full flex items-center justify-center">
              <div className="text-sm text-gray-400">Karşılaştırma yükleniyor...</div>
            </div>
          )}

          {karsilastirma && !karsilastirmaYukleniyor && (
            <div className="space-y-4">

              {/* Yazdırma başlığı */}
              <div className="print-only mb-2 pb-3 border-b border-gray-300">
                <div className="text-xs text-gray-500 mb-0.5">TATKO PI Envanter Raporu</div>
                <div className="text-lg font-medium text-gray-900">Karşılaştırmalı Rapor</div>
              </div>

              {/* Başlık — seçili katılımcılar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="no-print flex justify-end mb-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    📄 PDF indir
                  </button>
                </div>
                <div className="text-xs text-gray-400 mb-3">Karşılaştırılan katılımcılar</div>
                <div className="flex gap-3 flex-wrap">
                  {karsilastirma.map((kd, i) => {
                    const renk = KATILIMCI_RENKLERI[i] || KATILIMCI_RENKLERI[0]
                    const bas = `${kd.katilimci.ad?.[0] || ''}${kd.katilimci.soyad?.[0] || ''}`.toUpperCase()
                    return (
                      <div key={kd.katilimci.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${renk.bg} ${renk.border}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${renk.bg} ${renk.text} border ${renk.border}`}>
                          {bas}
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${renk.text}`}>{kd.katilimci.ad} {kd.katilimci.soyad}</div>
                          <div className="text-xs text-gray-400">{kd.katilimci.pozisyon || kd.katilimci.departman || '—'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {envanterTipleri.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  Ortak tamamlanmış envanter bulunamadı.
                </div>
              ) : (
                envanterTipleri.map(tip => (
                  <EnvanterSection
                    key={tip}
                    tip={tip}
                    karsilastirmaVerisi={karsilastirma}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
