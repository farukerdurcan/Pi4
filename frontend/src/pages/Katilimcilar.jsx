import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import YeniKatilimciModal from '../components/YeniKatilimciModal'
import { katilimciListesi } from '../api/katilimci'

const AVATAR_RENKLER = ['bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-purple-100 text-purple-700','bg-orange-100 text-orange-700','bg-pink-100 text-pink-700']

export default function Katilimcilar() {
  const navigate = useNavigate()
  const [liste, setListe] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')
  const [modalAcik, setModalAcik] = useState(false)
  const [hata, setHata] = useState('')

  const yukle = async (a = '') => {
    setYukleniyor(true)
    try {
      const data = await katilimciListesi(a)
      setListe(data)
      setHata('')
    } catch (e) {
      setHata('Veriler yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { yukle() }, [])

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Katılımcılar</h1>
        <div className="flex items-center gap-3">
          <input
            type="text" placeholder="Ara..." value={arama}
            onChange={e => setArama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && yukle(arama)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none w-48"
          />
          <button onClick={() => setModalAcik(true)} className="bg-tatko text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-tatko-koyu">
            + Yeni katılımcı
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {hata && <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-600">{hata}</div>}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
            <span>Kişi</span><span>Durum</span><span>Eklenme</span><span></span>
          </div>

          {yukleniyor && <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>}

          {!yukleniyor && liste.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">👥</div>
              <div className="text-sm font-medium text-gray-700 mb-1">{arama ? 'Sonuç bulunamadı' : 'Henüz katılımcı yok'}</div>
              {!arama && <button onClick={() => setModalAcik(true)} className="mt-3 bg-tatko text-white text-xs px-4 py-2 rounded-lg">+ Ekle</button>}
            </div>
          )}

          {!yukleniyor && liste.map((k, i) => {
            const tarih = new Date(k.olusturulma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
            const durum = k.tamamlanan_sayisi > 0 && k.tamamlanan_sayisi === k.atama_sayisi ? 'tamamlandi' : 'gonderildi'
            const rozetCls = durum === 'tamamlandi' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            const rozetLbl = durum === 'tamamlandi' ? 'Tamamlandı' : 'Gönderildi'
            return (
              <div key={k.id} className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-3.5 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${AVATAR_RENKLER[i % AVATAR_RENKLER.length]}`}>{k.ad?.[0]}{k.soyad?.[0]}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{k.ad} {k.soyad}</div>
                    <div className="text-xs text-gray-500">{k.pozisyon || k.departman || k.email}</div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${rozetCls}`}>{rozetLbl}</span>
                <span className="text-xs text-gray-500">{tarih}</span>
                <button onClick={() => navigate(`/katilimcilar/${k.id}`)} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:border-blue-300 transition-colors">Profil</button>
              </div>
            )
          })}
        </div>
      </div>

      {modalAcik && <YeniKatilimciModal onKapat={() => setModalAcik(false)} onEklendi={() => { setModalAcik(false); yukle() }} />}
    </Layout>
  )
}
