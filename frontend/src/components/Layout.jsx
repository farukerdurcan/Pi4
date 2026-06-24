import { NavLink, useNavigate } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? 'bg-white/15 text-white border-r-2 border-white'
      : 'text-white/60 hover:text-white/90 hover:bg-white/8'
  }`

export default function Layout({ children }) {
  const navigate = useNavigate()
  const kullanici = JSON.parse(localStorage.getItem('tatko_kullanici') || '{}')
  const isIK = kullanici.rol === 'ik_yoneticisi'

  const cikisYap = () => {
    localStorage.removeItem('tatko_token')
    localStorage.removeItem('tatko_kullanici')
    navigate('/login')
  }

  // Baş harfleri avatar için al
  const basHarfler = kullanici.ad
    ? kullanici.ad.split(' ').map(k => k[0]).join('').slice(0, 2).toUpperCase()
    : 'KU'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="no-print w-48 bg-tatko flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-tatko font-bold text-sm">PI</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium leading-tight">PI Envanter</div>
            </div>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 py-3">
          {isIK && <div className="px-4 py-2 text-white/35 text-xs tracking-widest">ANA</div>}
          {isIK && (
            <>
              <NavLink to="/panel" className={navLinkClass}>
                <span className="text-base">⊞</span> Panel
              </NavLink>
              <NavLink to="/katilimcilar" className={navLinkClass}>
                <span className="text-base">👥</span> Katılımcılar
              </NavLink>
              <NavLink to="/gonderimleri" className={navLinkClass}>
                <span className="text-base">📤</span> Gönderimler
              </NavLink>
            </>
          )}

          <div className="px-4 py-2 mt-2 text-white/35 text-xs tracking-widest">RAPORLAR</div>
          <NavLink to="/raporlar" className={navLinkClass}>
            <span className="text-base">📄</span> Bireysel
          </NavLink>
          {isIK && (
            <NavLink to="/karsilastirma" className={navLinkClass}>
              <span className="text-base">⇌</span> Karşılaştırma
            </NavLink>
          )}

          {isIK && (
            <>
              <div className="px-4 py-2 mt-2 text-white/35 text-xs tracking-widest">SİSTEM</div>
              <NavLink to="/yoneticiler" className={navLinkClass}>
                <span className="text-base">🏢</span> Yöneticiler
              </NavLink>
              <NavLink to="/ayarlar" className={navLinkClass}>
                <span className="text-base">⚙</span> Ayarlar
              </NavLink>
            </>
          )}
        </nav>

        {/* Kullanıcı */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {basHarfler}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/80 text-xs truncate">{kullanici.ad || 'Kullanıcı'}</div>
            </div>
            <button
              onClick={cikisYap}
              className="text-white/40 hover:text-white/80 text-xs"
              title="Çıkış yap"
            >
              ⇥
            </button>
          </div>
        </div>
      </aside>

      {/* Ana içerik */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

    </div>
  )
}
