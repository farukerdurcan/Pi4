import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { yoneticiListesi, yoneticiOlustur, yoneticiDetay, katilimciAta } from '../api/yonetici'
import { katilimciListesi } from '../api/katilimci'

// ------- Yönetici oluşturma modal -------
function YeniYoneticiModal({ onKapat, onOlusturuldu }) {
  const [form, setForm] = useState({ ad: '', soyad: '', email: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ad || !form.soyad || !form.email) {
      setHata('Tüm alanlar zorunludur')
      return
    }
    setYukleniyor(true)
    setHata('')
    try {
      await yoneticiOlustur(form)
      onOlusturuldu()
    } catch (err) {
      setHata(err.message || 'Bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Yeni yönetici ekle</h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {hata && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{hata}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ad</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.ad} onChange={e => setForm(p => ({ ...p, ad: e.target.value }))} placeholder="Mehmet" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Soyad</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.soyad} onChange={e => setForm(p => ({ ...p, soyad: e.target.value }))} placeholder="Yılmaz" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="mehmet@tatko.com.tr" />
          </div>
          <p className="text-xs text-gray-400 bg-blue-50 rounded-lg px-3 py-2">
            Yöneticiye e-posta ile şifre belirleme linki gönderilecek (72 saat geçerli).
          </p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onKapat} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor} className="flex-1 bg-tatko text-white text-sm py-2 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
              {yukleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ------- Katılımcı atama modal -------
function KatilimciAtaModal({ yonetici, onKapat, onKayit }) {
  const [tumKatilimcilar, setTumKatilimcilar] = useState([])
  const [secili, setSecili] = useState(new Set())
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')

  useEffect(() => {
    const yukle = async () => {
      try {
        const [tumListe, detay] = await Promise.all([
          katilimciListesi(),
          yoneticiDetay(yonetici.id)
        ])
        setTumKatilimcilar(tumListe)
        const mevcutIdler = new Set(detay.atanan_katilimcilar.map(k => k.id))
        setSecili(mevcutIdler)
      } catch {
        setHata('Veriler yüklenemedi')
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [yonetici.id])

  const toggle = (id) => {
    setSecili(prev => {
      const yeni = new Set(prev)
      yeni.has(id) ? yeni.delete(id) : yeni.add(id)
      return yeni
    })
  }

  const handleKaydet = async () => {
    setKayitYukleniyor(true)
    try {
      await katilimciAta(yonetici.id, Array.from(secili))
      onKayit()
    } catch {
      setHata('Kaydedilemedi')
    } finally {
      setKayitYukleniyor(false)
    }
  }

  const filtrelenmis = tumKatilimcilar.filter(k =>
    `${k.ad} ${k.soyad} ${k.email}`.toLowerCase().includes(arama.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Katılımcı ata</h2>
            <p className="text-xs text-gray-500 mt-0.5">{yonetici.ad} {yonetici.soyad}</p>
          </div>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Katılımcı ara..."
            value={arama}
            onChange={e => setArama(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto px-6 py-3">
          {hata && <div className="text-xs text-red-500 mb-2">{hata}</div>}
          {yukleniyor ? (
            <div className="text-center py-8 text-sm text-gray-400">Yükleniyor...</div>
          ) : filtrelenmis.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">Katılımcı bulunamadı</div>
          ) : (
            <div className="space-y-1">
              {filtrelenmis.map(k => (
                <label key={k.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secili.has(k.id)}
                    onChange={() => toggle(k.id)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{k.ad} {k.soyad}</div>
                    <div className="text-xs text-gray-500 truncate">{k.pozisyon || k.departman || k.email}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <span className="text-xs text-gray-500">{secili.size} katılımcı seçildi</span>
          <div className="flex gap-2">
            <button onClick={onKapat} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">
              İptal
            </button>
            <button onClick={handleKaydet} disabled={kayitYukleniyor} className="bg-tatko text-white text-sm px-4 py-2 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
              {kayitYukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ------- Ana sayfa -------
export default function Yoneticiler() {
  const [yoneticiler, setYoneticiler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [yeniModal, setYeniModal] = useState(false)
  const [ataModal, setAtaModal] = useState(null) // seçili yönetici objesi

  const veriYukle = async () => {
    try {
      setHata('')
      const liste = await yoneticiListesi()
      setYoneticiler(liste)
    } catch {
      setHata('Yöneticiler yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { veriYukle() }, [])

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Yöneticiler</h1>
        <button
          onClick={() => setYeniModal(true)}
          className="flex items-center gap-1.5 bg-tatko text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-tatko-koyu"
        >
          + Yeni yönetici
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {hata && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-600">{hata}</div>
        )}

        {yukleniyor ? (
          <div className="text-center py-16 text-sm text-gray-400">Yükleniyor...</div>
        ) : yoneticiler.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <div className="text-3xl mb-3">🏢</div>
            <div className="text-sm font-medium text-gray-700 mb-1">Henüz yönetici eklenmedi</div>
            <div className="text-xs text-gray-400 mb-4">Yöneticiler giriş yapıp sadece atanmış katılımcıların raporlarını görüntüleyebilir</div>
            <button
              onClick={() => setYeniModal(true)}
              className="bg-tatko text-white text-xs px-4 py-2 rounded-lg"
            >
              + İlk yöneticiyi ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-w-3xl">
            {yoneticiler.map(y => (
              <div key={y.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium flex-shrink-0">
                  {y.ad[0]}{y.soyad[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{y.ad} {y.soyad}</div>
                  <div className="text-xs text-gray-500">{y.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{y.atanan_katilimci_sayisi}</div>
                    <div className="text-xs text-gray-400">katılımcı</div>
                  </div>
                  <button
                    onClick={() => setAtaModal(y)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
                  >
                    Katılımcı ata
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {yeniModal && (
        <YeniYoneticiModal
          onKapat={() => setYeniModal(false)}
          onOlusturuldu={() => { setYeniModal(false); veriYukle() }}
        />
      )}

      {ataModal && (
        <KatilimciAtaModal
          yonetici={ataModal}
          onKapat={() => setAtaModal(null)}
          onKayit={() => { setAtaModal(null); veriYukle() }}
        />
      )}
    </Layout>
  )
}
