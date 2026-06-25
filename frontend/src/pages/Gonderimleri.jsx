import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { gonderimleriListele, hatirlatmaGonder } from '../api/katilimci'

const DURUM_ROZET = {
  gonderildi:    { label: 'Gönderildi',    cls: 'bg-blue-100 text-blue-700'   },
  devam_ediyor:  { label: 'Devam ediyor',  cls: 'bg-yellow-100 text-yellow-700'},
  tamamlandi:    { label: 'Tamamlandı',    cls: 'bg-green-100 text-green-700'  },
  raporlandi:    { label: 'Raporlandı',    cls: 'bg-gray-100 text-gray-600'    },
}

const ENV_RENK = {
  liderlik_stili:    'bg-blue-100 text-blue-700',
  motivasyon:        'bg-green-100 text-green-700',
  kisisel_etkilesim: 'bg-orange-100 text-orange-700',
  problem_cozme:     'bg-purple-100 text-purple-700',
}

const DURUM_SECENEKLER = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'gonderildi', label: 'Gönderildi' },
  { value: 'devam_ediyor', label: 'Devam ediyor' },
  { value: 'tamamlandi', label: 'Tamamlandı' },
  { value: 'raporlandi', label: 'Raporlandı' },
]

const ENV_SECENEKLER = [
  { value: '', label: 'Tüm envanterler' },
  { value: 'liderlik_stili', label: 'Liderlik Stili' },
  { value: 'motivasyon', label: 'Motivasyon İhtiyacı' },
  { value: 'kisisel_etkilesim', label: 'Kişilerarası Etkileşim' },
  { value: 'problem_cozme', label: 'Problem Çözme' },
]

export default function Gonderimleri() {
  const navigate = useNavigate()
  const [gonderimleri, setGonderimleri] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('')
  const [envFiltre, setEnvFiltre] = useState('')
  const [arama, setArama] = useState('')
  const [hatirlatmaYukleniyor, setHatirlatmaYukleniyor] = useState(null)

  const veriYukle = async () => {
    try {
      setHata('')
      const data = await gonderimleriListele(durumFiltre, envFiltre)
      setGonderimleri(data)
    } catch {
      setHata('Gönderimler yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { veriYukle() }, [durumFiltre, envFiltre])

  const handleHatirlatma = async (g) => {
    setHatirlatmaYukleniyor(g.atama_id)
    try {
      await hatirlatmaGonder(g.katilimci_id, g.atama_id)
    } catch {
      // sessiz hata
    } finally {
      setHatirlatmaYukleniyor(null)
    }
  }

  const filtrelenmis = gonderimleri.filter(g =>
    arama === '' ||
    g.katilimci_ad.toLowerCase().includes(arama.toLowerCase()) ||
    g.katilimci_email.toLowerCase().includes(arama.toLowerCase())
  )

  const bekleyenler = gonderimleri.filter(g =>
    ['gonderildi', 'devam_ediyor'].includes(g.durum) && g.gecen_gun >= 5
  ).length

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Gönderimler</h1>
        <div className="text-xs text-gray-500">{filtrelenmis.length} gönderi</div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">

        {/* Filtre çubuğu */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Kişi ara..."
            value={arama}
            onChange={e => setArama(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-tatko w-48"
          />
          <select
            value={durumFiltre}
            onChange={e => setDurumFiltre(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-tatko"
          >
            {DURUM_SECENEKLER.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={envFiltre}
            onChange={e => setEnvFiltre(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-tatko"
          >
            {ENV_SECENEKLER.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="p-6">
          {hata && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-600">{hata}</div>
          )}

          {yukleniyor ? (
            <div className="text-center py-16 text-sm text-gray-400">Yükleniyor...</div>
          ) : filtrelenmis.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <div className="text-3xl mb-3">📭</div>
              <div className="text-sm text-gray-500">Gönderi bulunamadı</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px_80px] px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                <span>Kişi</span>
                <span>Envanter</span>
                <span>Durum</span>
                <span>Gönderildi</span>
                <span>Bekliyor</span>
                <span></span>
              </div>

              {filtrelenmis.map(g => {
                const rozet = DURUM_ROZET[g.durum] || { label: g.durum, cls: 'bg-gray-100 text-gray-600' }
                const envRenk = ENV_RENK[g.envanter_tipi] || 'bg-gray-100 text-gray-600'
                const gonderimTarih = g.gonderim_tarihi
                  ? new Date(g.gonderim_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                  : '—'
                const bekliyor = ['gonderildi', 'devam_ediyor'].includes(g.durum)
                const gecikme = bekliyor && g.gecen_gun >= 5

                return (
                  <div
                    key={g.atama_id}
                    className={`grid grid-cols-[2fr_1fr_1fr_80px_80px_80px] px-5 py-3 border-b border-gray-100 last:border-0 items-center ${gecikme ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <button
                        onClick={() => navigate(`/katilimcilar/${g.katilimci_id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {g.katilimci_ad}
                      </button>
                      <div className="text-xs text-gray-400">{g.pozisyon || g.departman || g.katilimci_email}</div>
                    </div>

                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${envRenk}`}>
                      {g.envanter_adi}
                    </span>

                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${rozet.cls}`}>
                      {rozet.label}
                    </span>

                    <span className="text-xs text-gray-500">{gonderimTarih}</span>

                    <span className={`text-xs font-medium ${gecikme ? 'text-red-500' : 'text-gray-400'}`}>
                      {bekliyor && g.gecen_gun != null ? `${g.gecen_gun} gün` : '—'}
                    </span>

                    <div className="flex justify-end">
                      {bekliyor && (
                        <button
                          onClick={() => handleHatirlatma(g)}
                          disabled={hatirlatmaYukleniyor === g.atama_id}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                          title="Hatırlatma gönder"
                        >
                          {hatirlatmaYukleniyor === g.atama_id ? '...' : '📧'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
