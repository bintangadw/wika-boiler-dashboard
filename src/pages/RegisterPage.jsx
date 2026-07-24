import { useState } from 'react'
import logo from '../assets/Wika_beton.gif'

function RegisterPage({ onRegisterSuccess, onGoToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      setError('Semua field wajib diisi')
      return
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    setError('')
    onRegisterSuccess()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
        <img src={logo} alt="Wika Beton" className="h-14 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Boiler Dashboard</h1>
        <p className="text-white/60 text-sm text-center mb-6">Buat akun baru</p>

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

          <div>
            <label className="text-white/80 text-sm mb-1 block">Konfirmasi Password</label>
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
            Daftar
          </button>
        </form>

        <p className="text-white/60 text-sm text-center mt-6">
          Sudah punya akun?{' '}
          <button onClick={onGoToLogin} className="text-blue-300 hover:text-blue-200 font-medium">
            Login di sini
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage