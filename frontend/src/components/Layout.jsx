import { NavLink, useNavigate } from 'react-router-dom'

const ROL_ETIKETI = {
  super_admin: 'Süper Admin',
  ik_yoneticisi: 'IK Yöneticisi',
  yonetici: 'Yönetici',
  katilimci: 'Katılımcı',
}

function NavSection({ label }) {
  return (
    <div className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
      {label}
    </div>
  )
}

const navLinkClass = ({ isActive }) =>
  `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 ${
    isActive
      ? 'bg-tatko/10 text-tatko border-tatko'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'
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

  const basHarfler = kullanici.ad
    ? kullanici.ad.split(' ').map(k => k[0]).join('').slice(0, 2).toUpperCase()
    : 'KU'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="no-print w-56 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 border-b border-slate-100 flex-shrink-0" style={{ height: 52 }}>
          <div className="w-7 h-7 bg-tatko rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">PI</span>
          </div>
          <span className="text-slate-900 text-sm font-semibold tracking-tight">PI Envanter</span>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">

          {isIK && (
            <>
              <NavSection label="Ana" />
              <NavLink to="/panel" className={navLinkClass}>
                <span className="text-base leading-none flex-shrink-0">⊞</span>
                <span>Panel</span>
              </NavLink>
              <NavLink to="/katilimcilar" className={navLinkClass}>
                <span className="text-base leading-none flex-shrink-0">👥</span>
                <span>Katılımcılar</span>
              </NavLink>
              <NavLink to="/gonderimleri" className={navLinkClass}>
                <span className="text-base leading-none flex-shrink-0">📤</span>
                <span>Gönderimler</span>
              </NavLink>
            </>
          )}

          <NavSection label="Raporlar" />
          <NavLink to="/raporlar" className={navLinkClass}>
            <span className="text-base leading-none flex-shrink-0">📄</span>
            <span>Bireysel</span>
          </NavLink>

          {isIK && (
            <>
              <NavSection label="Sistem" />
              <NavLink to="/yoneticiler" className={navLinkClass}>
                <span className="text-base leading-none flex-shrink-0">🏢</span>
                <span>Yöneticiler</span>
              </NavLink>
              <NavLink to="/ayarlar" className={navLinkClass}>
                <span className="text-base leading-none flex-shrink-0">⚙</span>
                <span>Ayarlar</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Sağ taraf: topbar + içerik */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Global topbar — kullanıcı bilgisi */}
        <header className="no-print bg-white border-b border-slate-200 flex items-center justify-end px-6 flex-shrink-0" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 leading-tight">{kullanici.ad || 'Kullanıcı'}</div>
              <div className="text-xs text-slate-400 leading-tight">{ROL_ETIKETI[kullanici.rol] || ''}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-tatko/10 text-tatko flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {basHarfler}
            </div>
            <button
              onClick={cikisYap}
              className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>

      </div>
    </div>
  )
}
