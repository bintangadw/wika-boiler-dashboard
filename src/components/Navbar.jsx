import { useState, useEffect } from 'react'
import logo from '../assets/logo_wika_beton_baru-removebg-preview.png'

function Navbar() {
  const [isConnected, setIsConnected] = useState(false)

const API_BASE = `http://${window.location.hostname}:4000`

useEffect(() => {
  const checkStatus = () => {
    fetch(`${API_BASE}/api/live`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal ambil status')
        return res.json()
      })
      .then((row) => {
        setIsConnected(Number(row.sistem_run) === 1)
      })
      .catch(() => setIsConnected(false))
  }

  checkStatus()
  const interval = setInterval(checkStatus, 3000)
  return () => clearInterval(interval)
}, [])
  return (
    <>
      <div
        className="fixed top-4 right-4 z-10 flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <span
          className={`w-10.5 h-10.5 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
        <span className="text-2xl text-white/90 hidden sm:inline">
          {isConnected ? 'On' : 'Off'}
        </span>
      </div>

      <div className="w-full flex justify-center pt-6 pb-4 px-4">
        <nav
          className="rounded-3xl px-10 py-3 flex items-center"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wika Beton" className="h-12 w-auto" />
            <div className="flex flex-col items-center leading-tight">
              <span className="text-white font-bold text-lg tracking-wide">
                Dashboard Water Heater
              </span>
              <span className="text-white font-bold text-lg tracking-wide">
                Jalur 2
              </span>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Navbar