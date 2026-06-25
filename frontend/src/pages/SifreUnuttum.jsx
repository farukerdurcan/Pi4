import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sifreSifirlaIste } from '../api'

export default function SifreUnuttum() {
  const [email, setEmail] = useState('')
  const [gonderildi, setGonderildi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  const handleGonder = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await sifreSifirlaIste(email)
      setGonderildi(true)
    } catch (err) {
      setHata(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
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
          <h1 className="text-xl font-medium text-gray-900">Şifremi unuttum</h1>
          <p className="text-sm text-gray-500 mt-1">E-postanıza sıfırlama linki gönderelim.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {gonderildi ? (
            <div className="text-center">
              <div className="text-3xl mb-3">📧</div>
              <p className="text-sm text-gray-700 font-medium mb-1">Link gönderildi</p>
              <p className="text-xs text-gray-500">
                E-posta adresiniz kayıtlıysa 45 dakika geçerli bir sıfırlama linki gönderildi.
                Spam klasörünü de kontrol edin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleGonder} className="space-y-4">
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

              {hata && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-red-600">{hata}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full bg-tatko hover:bg-tatko-koyu text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {yukleniyor ? 'Gönderiliyor...' : 'Sıfırlama linki gönder'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-tatko transition-colors">
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  )
}
