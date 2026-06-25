import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sifreDegistir } from '../api'

export default function SifreDegistir() {
  const navigate = useNavigate()
  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || 'null')

  const [mevcutSifre, setMevcutSifre] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  if (!localStorage.getItem('tatko_token')) {
    navigate('/login', { replace: true })
    return null
  }

  const handleGonder = async (e) => {
    e.preventDefault()
    setHata('')

    if (yeniSifre.length < 6) {
      setHata('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Yeni şifreler eşleşmiyor.')
      return
    }

    setYukleniyor(true)
    try {
      await sifreDegistir(mevcutSifre, yeniSifre)

      // localStorage'daki sifre_degistirildi bayrağını güncelle
      if (kullanici) {
        kullanici.sifre_degistirildi = true
        localStorage.setItem('tatko_kullanici', JSON.stringify(kullanici))
      }

      // Role göre yönlendir
      const rol = kullanici?.rol
      if (rol === 'super_admin') navigate('/yonetim', { replace: true })
      else if (rol === 'ik_yoneticisi') navigate('/panel', { replace: true })
      else if (rol === 'yonetici') navigate('/raporlar', { replace: true })
      else navigate('/login', { replace: true })
    } catch (err) {
      setHata(err.message || 'Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-tatko rounded-xl mb-4">
            <span className="text-white text-2xl font-medium">PI</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">Şifre Değiştir</h1>
          <p className="text-sm text-gray-500 mt-1">
            Güvenliğiniz için şifrenizi değiştirmeniz gerekiyor.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleGonder} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Mevcut şifre
              </label>
              <input
                type="password"
                value={mevcutSifre}
                onChange={(e) => setMevcutSifre(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Yeni şifre
              </label>
              <input
                type="password"
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                placeholder="En az 6 karakter"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Yeni şifre (tekrar)
              </label>
              <input
                type="password"
                value={yeniSifreTekrar}
                onChange={(e) => setYeniSifreTekrar(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko focus:border-transparent"
              />
            </div>

            {hata && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-600">{hata}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-tatko hover:bg-tatko-koyu text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-2"
            >
              {yukleniyor ? 'Kaydediliyor...' : 'Şifremi güncelle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
