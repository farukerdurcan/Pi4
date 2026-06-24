import { useState } from 'react'
import Layout from '../components/Layout'
import { apiFetch } from '../api/index'

export default function Ayarlar() {
  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || '{}')

  const [sifreForm, setSifreForm] = useState({ mevcut: '', yeni: '', tekrar: '' })
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)
  const [sifreMesaj, setSifreMesaj] = useState(null) // { tip: 'basari'|'hata', metin }

  const handleSifreDegistir = async (e) => {
    e.preventDefault()
    setSifreMesaj(null)
    if (sifreForm.yeni !== sifreForm.tekrar) {
      setSifreMesaj({ tip: 'hata', metin: 'Yeni şifreler eşleşmiyor' })
      return
    }
    if (sifreForm.yeni.length < 6) {
      setSifreMesaj({ tip: 'hata', metin: 'Yeni şifre en az 6 karakter olmalı' })
      return
    }
    setSifreYukleniyor(true)
    try {
      await apiFetch('/api/auth/sifre-degistir', {
        method: 'POST',
        body: JSON.stringify({ mevcut_sifre: sifreForm.mevcut, yeni_sifre: sifreForm.yeni })
      })
      setSifreMesaj({ tip: 'basari', metin: 'Şifre başarıyla güncellendi' })
      setSifreForm({ mevcut: '', yeni: '', tekrar: '' })
    } catch (err) {
      setSifreMesaj({ tip: 'hata', metin: err.message || 'Bir hata oluştu' })
    } finally {
      setSifreYukleniyor(false)
    }
  }

  return (
    <Layout>
      <div className="h-13 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">Ayarlar</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-2xl space-y-5">

          {/* Hesap bilgileri */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Hesap bilgileri</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-tatko flex items-center justify-center text-white text-sm font-medium">
                  {kullanici.ad?.split(' ').map(k => k[0]).join('').slice(0, 2).toUpperCase() || 'IK'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{kullanici.ad || '—'}</div>
                  <div className="text-xs text-gray-500">{kullanici.email || '—'}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Rol</span>
                    <div className="font-medium text-gray-700 mt-0.5">
                      {kullanici.rol === 'ik_yoneticisi' ? 'İK Yöneticisi' : kullanici.rol === 'yonetici' ? 'Yönetici' : kullanici.rol}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Şifre değiştir */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Şifre değiştir</h2>
            <form onSubmit={handleSifreDegistir} className="space-y-3">
              {sifreMesaj && (
                <div className={`rounded-lg px-3 py-2 text-xs ${
                  sifreMesaj.tip === 'basari'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {sifreMesaj.metin}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mevcut şifre</label>
                <input
                  type="password"
                  value={sifreForm.mevcut}
                  onChange={e => setSifreForm(p => ({ ...p, mevcut: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Yeni şifre</label>
                <input
                  type="password"
                  value={sifreForm.yeni}
                  onChange={e => setSifreForm(p => ({ ...p, yeni: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko"
                  placeholder="En az 6 karakter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Yeni şifre (tekrar)</label>
                <input
                  type="password"
                  value={sifreForm.tekrar}
                  onChange={e => setSifreForm(p => ({ ...p, tekrar: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tatko"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={sifreYukleniyor || !sifreForm.mevcut || !sifreForm.yeni}
                  className="bg-tatko text-white text-sm px-4 py-2 rounded-lg hover:bg-tatko-koyu disabled:opacity-40"
                >
                  {sifreYukleniyor ? 'Kaydediliyor...' : 'Şifreyi güncelle'}
                </button>
              </div>
            </form>
          </div>

          {/* Sistem bilgisi */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Sistem bilgisi</h2>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Uygulama</span>
                <span className="text-gray-700 font-medium">Tatko PI Envanter</span>
              </div>
              <div className="flex justify-between">
                <span>Versiyon</span>
                <span className="text-gray-700 font-medium">1.1</span>
              </div>
              <div className="flex justify-between">
                <span>Backend</span>
                <span className="text-gray-700 font-medium">FastAPI + SQLite</span>
              </div>
              <div className="flex justify-between">
                <span>Frontend</span>
                <span className="text-gray-700 font-medium">React + Tailwind CSS</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}
