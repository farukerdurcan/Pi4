export default function TesekkurSayfasi({ bilgi }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-tatko px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-tatko font-medium text-sm">T</span>
          </div>
          <span className="text-white text-sm font-medium">TATKO PI Envanter</span>
        </div>
        <div className="h-1 bg-white/20 mt-3">
          <div className="h-full bg-white w-full" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Teşekkürler, {bilgi?.katilimci_ad}!
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            <strong>{bilgi?.envanter_adi}</strong> formu başarıyla tamamlandı.
            Sonuçlarınız İnsan Kaynakları ekibine iletildi.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-left">
            <div className="text-xs text-gray-400 mb-2">Form bilgisi</div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Envanter</span>
              <span className="text-gray-900 font-medium">{bilgi?.envanter_adi}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Durum</span>
              <span className="text-green-600 font-medium">Tamamlandı</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Bu pencereyi kapatabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
