import api from "@/api/axios"

const API_KEY = import.meta.env.VITE_API_KEY
const API_AI = import.meta.env.VITE_API_AI || 'http://127.0.0.1:9000/api/v1'

export async function askChat(payload) {
  try {
    const url = API_AI.replace(/\/$/, '') + '/chat' // ensure single /chat
    const res = await api.post(url, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    })
    return res.data
  } catch (err) {
    // normalize error similar to other api modules
    const msg = err?.response?.data?.detail || err.message || 'API error'
    throw new Error(msg)
  }
}