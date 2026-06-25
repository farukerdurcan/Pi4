import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { hesapKur } from '../api'

export default function HesapKur() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [hata, setHata] = useState('')
  const [basarili, setBasarili] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-base font-medium text-gray-900 mb-2">Geçersiz Link</h2>
          <p className="text-sm text-gray-500">Bu link eksik veya hatalı. Lütfen e-postanızdaki linke tıklayın.</p>
        </div>
      </div>
    )
  }

  const handleGonder = async (e) => {
    e.preventDefault()
    setHata('')

    if (yeniSifre.length < 6) {
      setHata('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Şifreler eşleşmiyor.')
      return
    }

    setYukleniyor(true)
    try {
      await hesapKur(token, yeniSifre)
      setBasarili(true)
    } catch (err) {
      setHata(err.message || 'Geçersiz veya süresi dolmuş davet linki.')
    } finally {
      setYukleniyor(false)
    }
  }

  if (basarili) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900 mb-2">Hesabınız aktifleştirildi</h1>
          <p className="text-sm text-gray-500 mb-6">Şifreniz belirlendi. Artık sisteme giriş yapabilirsiniz.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-tatko hover:bg-tatko-koyu text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Giriş yap →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-tatko rounded-xl mb-4">
            <span className="text-white text-2xl font-medium">PI</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">Hesabınızı kurun</h1>
          <p className="text-sm text-gray-500 mt-1">Sisteme girmek için bir şifre belirleyin.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleGonder} className="space-y-4">
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
                Şifre tekrar
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
              {yukleniyor ? 'Kaydediliyor...' : 'Hesabımı aktifleştir'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
