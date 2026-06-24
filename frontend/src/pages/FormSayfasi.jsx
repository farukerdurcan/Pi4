import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { formBilgisiGetir } from '../api/form'
import LiderlikForm from './LiderlikForm'
import MotivasjonForm from './MotivasyonForm'
import EtkilesimForm from './EtkilesimForm'
import ProblemForm from './ProblemForm'
import TesekkurSayfasi from './TesekkurSayfasi'

export default function FormSayfasi() {
  const { token } = useParams()
  const [bilgi, setBilgi] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [tamamlandi, setTamamlandi] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      try {
        const data = await formBilgisiGetir(token)
        setBilgi(data)
        if (data.tamamlandi) setTamamlandi(true)
      } catch (e) {
        setHata(e.message || 'Geçersiz veya süresi dolmuş link')
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [token])

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-tatko rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-medium">T</span>
          </div>
          <p className="text-sm text-gray-500">Form yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (hata) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-base font-medium text-gray-900 mb-2">Link Geçersiz</h2>
          <p className="text-sm text-gray-500">{hata}</p>
        </div>
      </div>
    )
  }

  if (tamamlandi) {
    return <TesekkurSayfasi bilgi={bilgi} />
  }

  const ortakProps = {
    token,
    bilgi,
    onTamamlandi: () => setTamamlandi(true),
  }

  switch (bilgi.envanter_tipi) {
    case 'liderlik_stili':
      return <LiderlikForm {...ortakProps} />
    case 'motivasyon':
      return <MotivasjonForm {...ortakProps} />
    case 'kisisel_etkilesim':
      return <EtkilesimForm {...ortakProps} />
    case 'problem_cozme':
      return <ProblemForm {...ortakProps} />
    default:
      return <div className="p-8 text-center text-gray-500">Bilinmeyen envanter tipi</div>
  }
}
