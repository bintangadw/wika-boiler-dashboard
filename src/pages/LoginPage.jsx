import { useState } from 'react'
import logo from '../assets/logo_wika_beton_baru-removebg-preview.png'
const API_BASE = `http://${window.location.hostname}:4000`

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      setError('Username dan password wajib diisi')
      return
    }
    setError('')

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal')
        return
      }

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userRole', data.role)
      onLogin()
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
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Dashboard Water Heater Jalur 2</h1>
        <p className="text-white/60 text-sm text-center mb-6">Masuk ke akun kamu</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/80 text-sm mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            className="mt-2 bg-blue-600 hover:bg-blue-500 transition text-white font-semibold rounded-xl py-2.5"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage