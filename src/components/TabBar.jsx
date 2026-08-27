import { useState, useEffect } from 'react'

function TabBar({ view, setView }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    let timeout
    const handleMouseMove = () => {
      setShow(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setShow(false)
      }, 3000) // Hide after 3 seconds of inactivity
    }

    timeout = setTimeout(() => setShow(false), 3000)

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className={`fixed bottom-0 left-0 right-0 flex justify-center pb-6 px-4 pointer-events-none transition-all duration-700 ease-in-out ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div
        className="rounded-full px-2 py-1.5 flex gap-2 pointer-events-auto shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 10px 25px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={() => setView('live')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition ${
            view === 'live'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setView('stats')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition ${
            view === 'stats'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Statistics
        </button>
      </div>
    </div>
  )
}

export default TabBar