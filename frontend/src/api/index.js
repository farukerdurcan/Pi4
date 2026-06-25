import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tatko_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tatko_token')
      localStorage.removeItem('tatko_kullanici')
      const base = import.meta.env.VITE_BASE_PATH || '/'
      window.location.href = base.replace(/\/$/, '') + '/login'
    }
    return Promise.reject(err)
  }
)

export const girisYap = async (email, sifre) => {
  const f = new FormData()
  f.append('username', email)
  f.append('password', sifre)
  const { data } = await axios.post(`${BASE}/api/auth/login`, f)
  return data
}

// Hata mesajını her zaman string'e çevirir
const hataMetni = async (res) => {
  try {
    const j = await res.json()
    if (typeof j.detail === 'string') return j.detail
    if (Array.isArray(j.detail)) return j.detail.map(e => e.msg || e).join(', ')
    if (j.detail) return JSON.stringify(j.detail)
    return `Sunucu hatası (${res.status})`
  } catch {
    return `Sunucu hatası (${res.status})`
  }
}

// Native fetch — axios params serialize sorununu önler
export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('tatko_token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
  if (res.status === 401) {
    localStorage.removeItem('tatko_token')
    localStorage.removeItem('tatko_kullanici')
    const base = import.meta.env.VITE_BASE_PATH || '/'
    window.location.href = base.replace(/\/$/, '') + '/login'
    return
  }
  if (!res.ok) {
    const mesaj = await hataMetni(res)
    throw new Error(mesaj)
  }
  return res.json()
}

export const sifreDegistir = (mevcutSifre, yeniSifre) =>
  apiFetch('/api/auth/sifre-degistir', {
    method: 'POST',
    body: JSON.stringify({ mevcut_sifre: mevcutSifre, yeni_sifre: yeniSifre })
  })

export const hesapKur = (token, yeniSifre) =>
  apiFetch('/api/auth/hesap-kur', {
    method: 'POST',
    body: JSON.stringify({ token, yeni_sifre: yeniSifre })
  })

export const sifreSifirlaIste = (email) =>
  apiFetch('/api/auth/sifre-sifirla-iste', {
    method: 'POST',
    body: JSON.stringify({ email })
  })

export const sifreSifrarlaTamamla = (token, yeniSifre) =>
  apiFetch('/api/auth/sifre-sifirla-tamamla', {
    method: 'POST',
    body: JSON.stringify({ token, yeni_sifre: yeniSifre })
  })

export default api
