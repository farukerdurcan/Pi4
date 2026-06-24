import { useState } from 'react'
import { katilimciEkle } from '../api/katilimci'

const ENVANTERLER = [
  { value: 'liderlik_stili', label: 'Liderlik Stili', nokta: 'bg-blue-500' },
  { value: 'motivasyon', label: 'Motivasyon İhtiyacı', nokta: 'bg-green-500' },
  { value: 'kisisel_etkilesim', label: 'Kişilerarası Etkileşim', nokta: 'bg-orange-500' },
  { value: 'problem_cozme', label: 'Problem Çözme Tarzı', nokta: 'bg-purple-500' },
]
const DEPARTMANLAR = ['Satış','Pazarlama','Operasyon','İnsan Kaynakları','Finans','Bilgi Teknolojileri','Lojistik','Üretim']

export default function YeniKatilimciModal({ onKapat, onEklendi }) {
  const [tip, setTip] = useState('aday')
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', departman: '', pozisyon: '' })
  const [envanterler, setEnvanterler] = useState([])
  const [yonetim, setYonetim] = useState('link')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const toggle = (v) => setEnvanterler(p => p.includes(v) ? p.filter(e => e !== v) : [...p, v])

  const kaydet = async (e) => {
    e.preventDefault()
    if (!form.ad.trim() || !form.soyad.trim() || !form.email.trim()) {
      setHata('Ad, soyad ve e-posta zorunludur'); return
    }
    if (envanterler.length === 0) {
      setHata('En az bir envanter seçmelisiniz'); return
    }
    setHata(''); setYukleniyor(true)
    try {
      await katilimciEkle({ ...form, tip }, envanterler)
      onEklendi()
    } catch (err) {
      // err artık her zaman Error nesnesi — message string
      setHata(err.message || 'Bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="bg-tatko px-5 py-4 flex items-center justify-between">
          <span className="text-white font-medium text-sm">👤 Yeni katılımcı ekle</span>
          <button onClick={onKapat} className="text-white/60 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={kaydet} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Tip */}
          <div className="flex gap-2">
            {[{v:'aday',l:'💼 Dış aday'},{v:'calisan',l:'🏢 Mevcut çalışan'}].map(t => (
              <button key={t.v} type="button" onClick={() => setTip(t.v)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${tip===t.v ? 'bg-blue-50 border-tatko text-tatko border-2 font-medium' : 'bg-white border-gray-200 text-gray-600'}`}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Kişi bilgileri */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ad</label>
              <input type="text" placeholder="Ahmet" value={form.ad}
                onChange={e => setForm(p => ({...p, ad: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Soyad</label>
              <input type="text" placeholder="Yılmaz" value={form.soyad}
                onChange={e => setForm(p => ({...p, soyad: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
            <input type="email" placeholder="ahmet@email.com" value={form.email}
              onChange={e => setForm(p => ({...p, email: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departman</label>
              <select value={form.departman} onChange={e => setForm(p => ({...p, departman: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko bg-white">
                <option value="">Seç...</option>
                {DEPARTMANLAR.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pozisyon</label>
              <input type="text" placeholder="Satış Müdürü" value={form.pozisyon}
                onChange={e => setForm(p => ({...p, pozisyon: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Envanter seçimi */}
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Envanter seçimi</div>
            <div className="grid grid-cols-2 gap-2">
              {ENVANTERLER.map(env => {
                const secili = envanterler.includes(env.value)
                return (
                  <button key={env.value} type="button" onClick={() => toggle(env.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${secili ? 'border-tatko bg-blue-50 border-2' : 'border-gray-200 bg-white'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${env.nokta}`} />
                    <span className={secili ? 'text-tatko font-medium' : 'text-gray-700'}>{env.label}</span>
                    {secili && <span className="ml-auto text-tatko text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Gönderim yöntemi */}
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Gönderim yöntemi</div>
            <div className="space-y-2">
              {[
                {v:'link', b:'Bağlantı ile gönder — hesap gerekmez', a:'Tek kullanımlık link e-posta ile gönderilir'},
                {v:'hesap', b:'Sisteme davet et — hesap oluşturulsun', a:'Katılımcı geçmişi kayıt altına alınır'},
              ].map(y => (
                <div key={y.v} onClick={() => setYonetim(y.v)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${yonetim===y.v ? 'border-tatko bg-blue-50 border-2' : 'border-gray-200'}`}>
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${yonetim===y.v ? 'border-tatko' : 'border-gray-300'}`}>
                    {yonetim===y.v && <div className="w-2 h-2 rounded-full bg-tatko" />}
                  </div>
                  <div>
                    <div className={`text-sm ${yonetim===y.v ? 'text-tatko font-medium' : 'text-gray-700'}`}>{y.b}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{y.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hata — artık her zaman string */}
          {hata && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-600">{String(hata)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onKapat}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Vazgeç
            </button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 py-2.5 bg-tatko text-white rounded-lg text-sm font-medium hover:bg-tatko-koyu disabled:opacity-60 flex items-center justify-center gap-2">
              {yukleniyor ? 'Kaydediliyor...' : '📤 Kaydet ve gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
