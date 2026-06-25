import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Panel from './pages/Panel'
import Raporlar from './pages/Raporlar'
import Katilimcilar from './pages/Katilimcilar'
import KatilimciProfil from './pages/KatilimciProfil'
import FormSayfasi from './pages/FormSayfasi'
import RaporSayfasi from './pages/RaporSayfasi'
import Yoneticiler from './pages/Yoneticiler'
import Gonderimleri from './pages/Gonderimleri'
import Ayarlar from './pages/Ayarlar'
import KorumaRota from './components/KorumaRota'
import SuperAdmin from './pages/SuperAdmin'
import HesapKur from './pages/HesapKur'

function App() {
  const basePath = import.meta.env.VITE_BASE_PATH || '/'

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/hesap-kur" element={<HesapKur />} />
        <Route path="/form/:token" element={<FormSayfasi />} />

        <Route path="/panel" element={<KorumaRota gerekliRol="ik_yoneticisi"><Panel /></KorumaRota>} />
        <Route path="/katilimcilar" element={<KorumaRota gerekliRol="ik_yoneticisi"><Katilimcilar /></KorumaRota>} />
        <Route path="/katilimcilar/:id" element={<KorumaRota gerekliRol="ik_yoneticisi"><KatilimciProfil /></KorumaRota>} />
        <Route path="/katilimcilar/:katilimciId/rapor" element={<KorumaRota><RaporSayfasi /></KorumaRota>} />
        <Route path="/raporlar" element={<KorumaRota><Raporlar /></KorumaRota>} />
        <Route path="/yoneticiler" element={<KorumaRota gerekliRol="ik_yoneticisi"><Yoneticiler /></KorumaRota>} />
        <Route path="/gonderimleri" element={<KorumaRota gerekliRol="ik_yoneticisi"><Gonderimleri /></KorumaRota>} />
        <Route path="/ayarlar" element={<KorumaRota><Ayarlar /></KorumaRota>} />

        <Route path="/yonetim" element={<KorumaRota gerekliRol="super_admin"><SuperAdmin /></KorumaRota>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
