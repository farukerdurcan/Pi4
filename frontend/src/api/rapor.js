import { apiFetch } from './index'

export const bireyselRapor = (katilimciId, atamaId) =>
  apiFetch(`/api/rapor/${katilimciId}/bireysel/${atamaId}`)

export const butunlesikRapor = (katilimciId) =>
  apiFetch(`/api/rapor/${katilimciId}/butunlesik`)

export const karsilastirmaRaporu = (katilimciIdler) =>
  apiFetch('/api/rapor/karsilastirma', {
    method: 'POST',
    body: JSON.stringify(katilimciIdler)
  })
