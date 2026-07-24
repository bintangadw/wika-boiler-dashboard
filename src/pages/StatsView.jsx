import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const waterLevelMap = { Critical: 0, Low: 1, Medium: 2, Max: 3 }
const waterLevelStates = ['Max', 'Medium', 'Low', 'Critical']
const waterLevelLabels = ['Critical', 'Low', 'Medium', 'Max']

const TIME_RANGES = [
  { label: '15 Menit', value: '15m' },
  { label: '1 Jam', value: '1h' },
  { label: '6 Jam', value: '6h' },
  { label: '1 Hari', value: '1d' },
  { label: '1 Bulan', value: '1mo' },
  { label: '6 Bulan', value: '6mo' },
  { label: '1 Tahun', value: '1y' },
  { label: '5 Tahun', value: '5y' },
  { label: 'Maks', value: 'max' },
]

const RANGE_CONFIG = {
  '15m': { points: 15, stepMs: 60 * 1000 },
  '1h': { points: 12, stepMs: 5 * 60 * 1000 },
  '6h': { points: 12, stepMs: 30 * 60 * 1000 },
  '1d': { points: 24, stepMs: 60 * 60 * 1000 },
  '1mo': { points: 30, stepMs: 24 * 60 * 60 * 1000 },
  '6mo': { points: 26, stepMs: 7 * 24 * 60 * 60 * 1000 },
  '1y': { points: 12, stepMs: 30 * 24 * 60 * 60 * 1000 },
  '5y': { points: 20, stepMs: 91 * 24 * 60 * 60 * 1000 },
  max: { points: 15, stepMs: 365 * 24 * 60 * 60 * 1000 },
}

function formatTimeLabel(date, rangeValue) {
  if (['15m', '1h', '6h', '1d'].includes(rangeValue)) {
    return date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  if (['1mo', '6mo'].includes(rangeValue)) {
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
    })
  }
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'short',
    year: '2-digit',
  })
}

function generateMockSeries(rangeValue) {
  const { points, stepMs } = RANGE_CONFIG[rangeValue]
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const date = new Date(now - (points - 1 - i) * stepMs)
    const waterState = waterLevelStates[Math.floor(Math.random() * waterLevelStates.length)]
    return {
      time: formatTimeLabel(date, rangeValue),
      temperature: +(75 + Math.random() * 10).toFixed(1),
      pressure: +(3.5 + Math.random() * 2).toFixed(1),
      kwh: +(140 + Math.random() * 30).toFixed(1),
      waterLevel: waterLevelMap[waterState],
    }
  })
}

function RangeSelector({ value, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-white/15 text-white text-sm rounded-lg px-3 py-1.5 border border-white/25 focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
    >
      {TIME_RANGES.map((r) => (
        <option key={r.value} value={r.value} className="bg-slate-800 text-white">
          {r.label}
        </option>
      ))}
    </select>
  )
}

function StatsView() {
  const [globalRange, setGlobalRange] = useState('1h')
  const overviewData = useMemo(() => generateMockSeries(globalRange), [globalRange])

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Statistics</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Rentang Waktu Global:</span>
          <RangeSelector value={globalRange} onChange={setGlobalRange} />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-white font-semibold mb-4">Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={overviewData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="temperature" stroke="#fb923c" strokeWidth={2} dot={false} name="Temp (°C)" />
            <Line type="monotone" dataKey="pressure" stroke="#60a5fa" strokeWidth={2} dot={false} name="Pressure (bar)" />
            <Line type="monotone" dataKey="kwh" stroke="#facc15" strokeWidth={2} dot={false} name="Power (kWh)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Temperature (°C)" dataKey="temperature" color="#fb923c" globalRange={globalRange} />
        <ChartCard title="Pressure (bar)" dataKey="pressure" color="#60a5fa" globalRange={globalRange} />
        <ChartCard title="Power (kWh)" dataKey="kwh" color="#facc15" globalRange={globalRange} />
        <WaterLevelChartCard globalRange={globalRange} />
      </div>
    </div>
  )
}

function ChartCard({ title, dataKey, color, globalRange }) {
  const [range, setRange] = useState(globalRange)

  useEffect(() => {
    setRange(globalRange)
  }, [globalRange])

  const data = useMemo(() => generateMockSeries(range), [range])

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold">{title}</h3>
        <RangeSelector value={range} onChange={setRange} className="text-xs px-2 py-1" />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" fontSize={10} />
          <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function WaterLevelChartCard({ globalRange }) {
  const [range, setRange] = useState(globalRange)

  useEffect(() => {
    setRange(globalRange)
  }, [globalRange])

  const data = useMemo(() => generateMockSeries(range), [range])

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold">Water Level</h3>
        <RangeSelector value={range} onChange={setRange} className="text-xs px-2 py-1" />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" fontSize={10} />
          <YAxis
            stroke="rgba(255,255,255,0.6)"
            fontSize={10}
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(val) => waterLevelLabels[3 - val] ?? ''}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(val) => [waterLevelLabels[3 - val], 'Status']}
          />
          <Line type="stepAfter" dataKey="waterLevel" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StatsView