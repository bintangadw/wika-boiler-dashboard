function SensorCard({ icon: Icon, label, value, unit, color, isStatus, statusColor }) {
  return (
    <div
      className="relative rounded-3xl p-6 flex flex-col gap-4 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-100/80 text-sm font-medium">{label}</span>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>

      {isStatus ? (
        <span className={`text-2xl font-bold ${statusColor}`}>{value}</span>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{value}</span>
          <span className="text-slate-100/70 text-lg">{unit}</span>
        </div>
      )}
    </div>
  )
}

export default SensorCard