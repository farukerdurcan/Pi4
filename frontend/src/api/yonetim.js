import { apiFetch } from './index'

export const firmaListesi = () => apiFetch('/api/yonetim/firmalar')

export const firmaOlustur = (veri) => apiFetch('/api/yonetim/firmalar', {
  method: 'POST',
  body: JSON.stringify(veri)
})

export const firmaGuncelle = (id, veri) => apiFetch(`/api/yonetim/firmalar/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(veri)
})

export const firmaKullanicilari = (firmaId, aktif = true) =>
  apiFetch(`/api/yonetim/firmalar/${firmaId}/kullanicilar?aktif=${aktif}`)

export const ikKullaniciEkle = (firmaId, veri) =>
  apiFetch(`/api/yonetim/firmalar/${firmaId}/kullanicilar`, {
    method: 'POST',
    body: JSON.stringify(veri)
  })

export const kullaniciAktifGuncelle = (firmaId, kullaniciId, aktif) =>
  apiFetch(`/api/yonetim/firmalar/${firmaId}/kullanicilar/${kullaniciId}`, {
    method: 'PATCH',
    body: JSON.stringify({ aktif })
  })

export const ikKullaniciSil = (firmaId, kullaniciId) =>
  apiFetch(`/api/yonetim/firmalar/${firmaId}/kullanicilar/${kullaniciId}`, {
    method: 'DELETE'
  })

export const sifreSifirla = (firmaId, kullaniciId, yeniSifre) =>
  apiFetch(`/api/yonetim/firmalar/${firmaId}/kullanicilar/${kullaniciId}/sifre`, {
    method: 'POST',
    body: JSON.stringify({ yeni_sifre: yeniSifre })
  })
