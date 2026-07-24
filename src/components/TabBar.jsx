function TabBar({ view, setView }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 px-4 pointer-events-none">
      <div
        className="rounded-full px-2 py-1.5 flex gap-2 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      >
        <button
          onClick={() => setView('live')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition ${
            view === 'live'
              ? 'bg-blue-600 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setView('stats')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition ${
            view === 'stats'
              ? 'bg-blue-600 text-white'
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