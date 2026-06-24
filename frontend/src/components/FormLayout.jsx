import { useEffect, useRef } from 'react'

export default function FormLayout({ katilimciAd, envanter, adimlar, ilerlemeYuzdesi, children, onGeri, onIleri, ileriLabel = 'Devam et →', geriGoster = true, yukleniyor = false, scrollKey, hata }) {
  const icerikRef = useRef(null)

  useEffect(() => {
    if (icerikRef.current) icerikRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollKey])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-tatko flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <span className="text-tatko font-medium text-sm">T</span>
            </div>
            <span className="text-white text-sm font-medium">TATKO PI Envanter</span>
          </div>
          <span className="text-white/70 text-xs">{katilimciAd}</span>
        </div>
        <div className="h-1 bg-white/20">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${ilerlemeYuzdesi}%` }} />
        </div>
      </div>

      {adimlar && adimlar.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-1 max-w-2xl mx-auto">
            {adimlar.map((adim, i) => (
              <div key={adim.id} className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    adim.tamamlandi ? 'bg-tatko text-white'
                    : adim.aktif ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {adim.tamamlandi ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${adim.aktif ? 'text-blue-700 font-medium' : adim.tamamlandi ? 'text-gray-500' : 'text-gray-400'}`}>
                    {adim.label}
                  </span>
                </div>
                {i < adimlar.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto" ref={icerikRef}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>

      {/* Footer — hata mesajı burada, devam butonu yanında */}
      <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-xs text-gray-400">{envanter}</div>
          {hata && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-red-500 text-xs">⚠</span>
              <span className="text-xs text-red-600">{hata}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {geriGoster && (
            <button onClick={onGeri} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              ← Geri
            </button>
          )}
          <button onClick={onIleri} disabled={yukleniyor}
            className="px-5 py-2 bg-tatko text-white rounded-lg text-sm font-medium hover:bg-tatko-koyu disabled:opacity-60">
            {yukleniyor ? 'Kaydediliyor...' : ileriLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
