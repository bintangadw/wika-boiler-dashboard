import logo from '../assets/Wika_beton.gif'

function Navbar() {
  const isConnected = true

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
          className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
        <span className="text-xs text-white/90 hidden sm:inline">
          {isConnected ? 'Connected' : 'Disconnected'}
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
            <img src={logo} alt="Wika Beton" className="h-8 w-auto" />
            <span className="text-white font-bold text-lg tracking-wide">
              Boiler Dashboard
            </span>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Navbar