import { useState } from 'react'
import logo from '../assets/logo_wika_beton_baru-removebg-preview.png'
const API_BASE = `http://${window.location.hostname}:4000`

function ForgotPasswordPage({ onGoToLogin }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Email wajib diisi')
      return
    }
    setError('')
    setMessage('')

    try {
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setMessage(data.message)
    } catch (err) {
      setError('Gagal terhubung ke server')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Wika Beton" className="h-14 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Lupa Password</h1>
        <p className="text-white/60 text-sm text-center mb-6">Masukkan email kamu untuk reset password</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/80 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="nama@email.com"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          {message && <p className="text-green-300 text-sm">{message}</p>}

          <button
            type="submit"
            className="mt-2 bg-blue-600 hover:bg-blue-500 transition text-white font-semibold rounded-xl py-2.5"
          >
            Kirim Link Reset
          </button>
        </form>

        <p className="text-white/60 text-sm text-center mt-6">
          <button onClick={onGoToLogin} className="text-blue-300 hover:text-blue-200 font-medium">
            Kembali ke Login
          </button>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage