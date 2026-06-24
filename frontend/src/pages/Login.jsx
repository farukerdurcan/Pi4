import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { girisYap } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleGiris = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const data = await girisYap(email, sifre)
      // Token ve kullanıcı bilgisini kaydet
      localStorage.setItem('tatko_token', data.access_token)
      localStorage.setItem('tatko_kullanici', JSON.stringify({
        ad: data.kullanici_ad,
        rol: data.kullanici_rol,
        email: data.kullanici_email
      }))
      // Role göre yönlendir
      if (data.kullanici_rol === 'super_admin') {
        navigate('/yonetim')
      } else if (data.kullanici_rol === 'ik_yoneticisi') {
        navigate('/panel')
      } else if (data.kullanici_rol === 'yonetici') {
        navigate('/raporlar')
      } else {
        navigate('/form')
      }
    } catch (err) {
      setHata(err.response?.data?.detail || 'Giriş başarısız. Bilgilerinizi kontrol edin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-tatko rounded-xl mb-4">
            <span className="text-white text-2xl font-medium">PI</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">PI Envanter</h1>
          <p className="text-sm text-gray-500 mt-1">Kişisel Gelişim Platformu</p>
        </div>

        {/* Kart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-base font-medium text-gray-900 mb-6">Sisteme giriş yap</h2>

          <form onSubmit={handleGiris} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tatko focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
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
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          PI Envanter Sistemi
        </p>
      </div>
    </div>
  )
}
