import { apiFetch } from './index'

// Boş string alanları null'a çevirir
const temizle = (veri) => Object.fromEntries(
  Object.entries(veri).map(([k, v]) => [k, v === '' ? null : v])
)

export const panelIstatistik = () =>
  apiFetch('/api/katilimcilar/istatistik')

export const katilimciListesi = (arama = '', limit = null) => {
  const params = new URLSearchParams()
  if (arama) params.append('arama', arama)
  if (limit) params.append('limit', String(limit))
  const q = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/api/katilimcilar${q}`)
}

// Envanter tipleri artık body içinde gidiyor
export const katilimciEkle = (veri, envanterTipleri = [], dil = 'tr') => {
  return apiFetch('/api/katilimcilar', {
    method: 'POST',
    body: JSON.stringify({
      ...temizle(veri),
      envanter_tipleri: envanterTipleri,
      dil
    })
  })
}

export const katilimciDetay = (id) =>
  apiFetch(`/api/katilimcilar/${id}`)

export const katilimciRaporOzeti = (id) =>
  apiFetch(`/api/rapor/${id}/butunlesik`)

export const katilimciGuncelle = (id, veri) =>
  apiFetch(`/api/katilimcilar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(temizle(veri))
  })

export const envanterAta = (id, envanterTipleri, dil = 'tr') =>
  apiFetch(`/api/katilimcilar/${id}/envanter-ata`, {
    method: 'POST',
    body: JSON.stringify({ envanter_tipleri: envanterTipleri, dil })
  })

export const hatirlatmaGonder = (katilimciId, atamaId) =>
  apiFetch(`/api/katilimcilar/${katilimciId}/hatirlatma/${atamaId}`, { method: 'POST' })

export const notEkle = (katilimciId, metin, rapora_dahil = false, yoneticiden_gizle = false) =>
  apiFetch(`/api/katilimcilar/${katilimciId}/not`, {
    method: 'POST',
    body: JSON.stringify({ metin, rapora_dahil, yoneticiden_gizle })
  })

export const gonderimleriListele = (durum = '', envanterTipi = '') => {
  const params = new URLSearchParams()
  if (durum) params.append('durum', durum)
  if (envanterTipi) params.append('envanter_tipi', envanterTipi)
  const q = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/api/katilimcilar/gonderimleri${q}`)
}

export const topluHatirlatmaGonder = () =>
  apiFetch('/api/katilimcilar/toplu-hatirlatma', { method: 'POST' })

export const beklemesSayisi = () =>
  apiFetch('/api/katilimcilar/bekleme-sayisi')
