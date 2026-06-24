import { apiFetch } from './index'

export const yoneticiListesi = () =>
  apiFetch('/api/yoneticiler')

export const yoneticiOlustur = (veri) =>
  apiFetch('/api/yoneticiler', {
    method: 'POST',
    body: JSON.stringify(veri),
  })

export const yoneticiDetay = (id) =>
  apiFetch(`/api/yoneticiler/${id}`)

export const katilimciAta = (yoneticiId, katilimciIdler) =>
  apiFetch(`/api/yoneticiler/${yoneticiId}/katilimcilar`, {
    method: 'PUT',
    body: JSON.stringify({ katilimci_idler: katilimciIdler }),
  })
