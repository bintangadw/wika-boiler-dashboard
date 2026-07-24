function playClickSound(isOn) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(isOn ? 600 : 300, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    isOn ? 900 : 150,
    ctx.currentTime + 0.08
  )

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.1)
}

function HeaterToggle({ label, isOn, onToggle }) {
  const handleClick = () => {
    playClickSound(!isOn)
    onToggle()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        className={`relative w-24 h-13 rounded-full transition-colors duration-300 ${
          isOn ? 'bg-green-500' : ''
        }`}
        style={
          isOn
            ? {}
            : {
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.15)',
              }
        }
      >
        <span
          className={`absolute top-1 left-1 w-11 h-11 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isOn ? 'translate-x-11' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-white/90 font-medium">{label}</span>
    </div>
  )
}

export default HeaterToggle