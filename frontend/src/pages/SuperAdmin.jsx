import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  firmaListesi, firmaOlustur, firmaGuncelle,
  firmaKullanicilari, ikKullaniciEkle, ikKullaniciSil, sifreSifirla
} from '../api/yonetim'

function Modal({ baslik, onKapat, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{baslik}</h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function YeniFirmaModal({ onKapat, onEklendi }) {
  const [form, setForm] = useState({ ad: '', slug: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const slugOlustur = (ad) => ad.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleAdChange = (v) => {
    setForm({ ad: v, slug: slugOlustur(v) })
  }

  const handleGonder = async (e) => {
    e.preventDefault()
    if (!form.ad.trim() || !form.slug.trim()) return
    setYukleniyor(true)
    setHata('')
    try {
      await firmaOlustur({ ad: form.ad.trim(), slug: form.slug.trim() })
      onEklendi()
    } catch (err) {
      setHata(err.message || 'Firma oluşturulamadı')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal baslik="Yeni Firma" onKapat={onKapat}>
      <form onSubmit={handleGonder} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı</label>
          <input
            type="text"
            value={form.ad}
            onChange={e => handleAdChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko"
            placeholder="Örn: Acme A.Ş."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Slug (URL kimliği)</label>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tatko"
            placeholder="acme"
          />
          <p className="mt-1 text-xs text-gray-400">Küçük harf, tire kullanılabilir, boşluk olmaz</p>
        </div>
        {hata && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{hata}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onKapat} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={yukleniyor} className="flex-1 bg-tatko text-white text-sm py-2 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
            {yukleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function IKEkleModal({ firma, onKapat, onEklendi }) {
  const [form, setForm] = useState({ ad: '', soyad: '', email: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const handleGonder = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    try {
      await ikKullaniciEkle(firma.id, form)
      onEklendi()
    } catch (err) {
      setHata(err.message || 'Kullanıcı oluşturulamadı')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal baslik={`IK Yöneticisi Ekle — ${firma.ad}`} onKapat={onKapat}>
      <form onSubmit={handleGonder} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad</label>
            <input type="text" required value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Soyad</label>
            <input type="text" required value={form.soyad} onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko" />
        </div>
        <p className="text-xs text-gray-400 bg-blue-50 rounded-lg px-3 py-2">
          Kullanıcıya e-posta ile şifre belirleme linki gönderilecek (72 saat geçerli).
        </p>
        {hata && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{hata}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onKapat} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={yukleniyor} className="flex-1 bg-tatko text-white text-sm py-2 rounded-lg hover:bg-tatko-koyu disabled:opacity-50">
            {yukleniyor ? 'Ekleniyor...' : 'Ekle ve Davet Gönder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SifreSifirlaModal({ firma, kullanici, onKapat, onTamamlandi }) {
  const [sifre, setSifre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const handleGonder = async (e) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    try {
      await sifreSifirla(firma.id, kullanici.id, sifre)
      onTamamlandi()
    } catch (err) {
      setHata(err.message || 'Şifre güncellenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal baslik={`Şifre Sıfırla — ${kullanici.ad} ${kullanici.soyad}`} onKapat={onKapat}>
      <form onSubmit={handleGonder} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Şifre</label>
          <input type="text" required minLength={6} value={sifre} onChange={e => setSifre(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tatko"
            placeholder="En az 6 karakter" />
        </div>
        {hata && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{hata}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onKapat} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50">İptal</button>
          <button type="submit" disabled={yukleniyor} className="flex-1 bg-orange-500 text-white text-sm py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {yukleniyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function FirmaDetay({ firma, onGuncellendi }) {
  const [kullanicilar, setKullanicilar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ikEkleAcik, setIkEkleAcik] = useState(false)
  const [sifreSifirlaHedef, setSifreSifirlaHedef] = useState(null)
  const [silOnay, setSilOnay] = useState(null)

  const yukle = () => {
    setYukleniyor(true)
    firmaKullanicilari(firma.id)
      .then(setKullanicilar)
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [firma.id])

  const handleSil = async (k) => {
    try {
      await ikKullaniciSil(firma.id, k.id)
      setSilOnay(null)
      yukle()
    } catch {}
  }

  const handleToggleAktif = async () => {
    try {
      await firmaGuncelle(firma.id, { aktif: !firma.aktif })
      onGuncellendi()
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{firma.ad}</div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{firma.slug}</div>
        </div>
        <button
          onClick={handleToggleAktif}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
            firma.aktif
              ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
              : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
          }`}
        >
          {firma.aktif ? 'Aktif' : 'Pasif'}
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IK Yöneticileri</span>
          <button
            onClick={() => setIkEkleAcik(true)}
            className="text-xs bg-tatko text-white px-3 py-1.5 rounded-lg hover:bg-tatko-koyu"
          >
            + Ekle
          </button>
        </div>

        {yukleniyor ? (
          <p className="text-xs text-gray-400 py-4 text-center">Yükleniyor...</p>
        ) : kullanicilar.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Henüz IK yöneticisi eklenmemiş.</p>
        ) : (
          <div className="space-y-2">
            {kullanicilar.map(k => (
              <div key={k.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${k.aktif ? 'border-gray-100 bg-gray-50' : 'border-red-100 bg-red-50 opacity-60'}`}>
                <div className="w-8 h-8 rounded-full bg-tatko/10 flex items-center justify-center text-tatko text-xs font-semibold flex-shrink-0">
                  {k.ad[0]}{k.soyad[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{k.ad} {k.soyad}</div>
                  <div className="text-xs text-gray-500 truncate">{k.email}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setSifreSifirlaHedef(k)}
                    className="text-xs text-gray-400 hover:text-orange-600 px-2 py-1 rounded hover:bg-orange-50"
                    title="Şifre sıfırla"
                  >
                    🔑
                  </button>
                  {k.aktif && (
                    <button
                      onClick={() => setSilOnay(k)}
                      className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      title="Pasife al"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ikEkleAcik && (
        <IKEkleModal
          firma={firma}
          onKapat={() => setIkEkleAcik(false)}
          onEklendi={() => { setIkEkleAcik(false); yukle(); onGuncellendi() }}
        />
      )}

      {sifreSifirlaHedef && (
        <SifreSifirlaModal
          firma={firma}
          kullanici={sifreSifirlaHedef}
          onKapat={() => setSifreSifirlaHedef(null)}
          onTamamlandi={() => { setSifreSifirlaHedef(null) }}
        />
      )}

      {silOnay && (
        <Modal baslik="Kullanıcıyı pasife al" onKapat={() => setSilOnay(null)}>
          <p className="text-sm text-gray-600 mb-4">
            <strong>{silOnay.ad} {silOnay.soyad}</strong> kullanıcısı pasife alınacak ve sisteme giremeyecek.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSilOnay(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg">İptal</button>
            <button onClick={() => handleSil(silOnay)} className="flex-1 bg-red-600 text-white text-sm py-2 rounded-lg hover:bg-red-700">Pasife Al</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function SuperAdmin() {
  const navigate = useNavigate()
  const [firmalar, setFirmalar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secilenFirma, setSecilenFirma] = useState(null)
  const [yeniFirmaAcik, setYeniFirmaAcik] = useState(false)

  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || '{}')

  const yukle = () => {
    firmaListesi()
      .then(data => {
        setFirmalar(data)
        if (secilenFirma) {
          const guncellendi = data.find(f => f.id === secilenFirma.id)
          if (guncellendi) setSecilenFirma(guncellendi)
        }
      })
      .finally(() => setYukleniyor(false))
  }

  useEffect(() => { yukle() }, [])

  const cikisYap = () => {
    localStorage.removeItem('tatko_token')
    localStorage.removeItem('tatko_kullanici')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-tatko text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-tatko font-bold text-sm">PI</span>
          </div>
          <div>
            <div className="text-sm font-semibold">PI4 Değerlendirme</div>
            <div className="text-xs text-white/60">Süper Yönetim Paneli</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/70">{kullanici.email}</span>
          <button onClick={cikisYap} className="text-xs text-white/60 hover:text-white">Çıkış ⇥</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Firmalar</h1>
            <p className="text-sm text-gray-500 mt-0.5">{firmalar.length} firma kayıtlı</p>
          </div>
          <button
            onClick={() => setYeniFirmaAcik(true)}
            className="bg-tatko text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-tatko-koyu"
          >
            + Yeni Firma
          </button>
        </div>

        {yukleniyor ? (
          <div className="text-sm text-gray-400 text-center py-16">Yükleniyor...</div>
        ) : firmalar.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-16">
            <div className="text-3xl mb-3">🏢</div>
            Henüz firma eklenmemiş.
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1.4fr] gap-6">
            {/* Sol: Firma listesi */}
            <div className="space-y-2">
              {firmalar.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSecilenFirma(f)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                    secilenFirma?.id === f.id
                      ? 'border-tatko bg-tatko/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-tatko/10 flex items-center justify-center text-tatko font-bold text-sm flex-shrink-0">
                        {f.ad[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{f.ad}</div>
                        <div className="text-xs text-gray-400 font-mono">{f.slug}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {f.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                      <span className="text-xs text-gray-400">{f.ik_sayisi} IK · {f.katilimci_sayisi} katılımcı</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Sağ: Firma detayı */}
            <div>
              {secilenFirma ? (
                <FirmaDetay
                  firma={secilenFirma}
                  onGuncellendi={yukle}
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-200 border-dashed">
                  <p className="text-sm text-gray-400">Detayları görmek için bir firma seçin</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {yeniFirmaAcik && (
        <YeniFirmaModal
          onKapat={() => setYeniFirmaAcik(false)}
          onEklendi={() => { setYeniFirmaAcik(false); yukle() }}
        />
      )}
    </div>
  )
}
