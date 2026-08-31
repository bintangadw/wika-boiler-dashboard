import { useState } from 'react'
import logo from '../assets/logo_wika_beton_baru-removebg-preview.png'
const API_BASE = `http://${window.location.hostname}:4000`

function ResetPasswordPage({ token, onResetSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      setError('Semua field wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    setError('')

    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal reset password')
        return
      }

      onResetSuccess()
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
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Reset Password</h1>
        <p className="text-white/60 text-sm text-center mb-6">Masukkan password baru kamu</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/80 text-sm mb-1 block">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm mb-1 block">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            className="mt-2 bg-blue-600 hover:bg-blue-500 transition text-white font-semibold rounded-xl py-2.5"
          >
            Ubah Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage