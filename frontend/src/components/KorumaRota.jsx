import { Navigate } from 'react-router-dom'

export default function KorumaRota({ children, gerekliRol }) {
  const token = localStorage.getItem('tatko_token')
  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || 'null')

  if (!token || !kullanici) {
    return <Navigate to="/login" replace />
  }

  if (gerekliRol && kullanici.rol !== gerekliRol) {
    if (kullanici.rol === 'super_admin') return <Navigate to="/yonetim" replace />
    if (kullanici.rol === 'ik_yoneticisi') return <Navigate to="/panel" replace />
    if (kullanici.rol === 'yonetici') return <Navigate to="/raporlar" replace />
    return <Navigate to="/login" replace />
  }

  return children
}
