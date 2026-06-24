import { apiFetch } from './index'

// Token ile form bilgisini getir
export const formBilgisiGetir = (token) =>
  apiFetch(`/api/form/${token}`)

// Form yanıtlarını kaydet (ara kayıt veya tamamla)
export const yanitKaydet = (token, yanitlar, tamamlandi = false) =>
  apiFetch(`/api/form/${token}/kaydet`, {
    method: 'POST',
    body: JSON.stringify({ yanitlar, tamamlandi })
  })
