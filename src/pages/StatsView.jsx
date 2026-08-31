import { useState, useEffect, useMemo } from 'react'
import LogDownload from '../components/LogDownload'
import DailyEfficiencyDownload from '../components/DailyEfficiencyDownload'
const API_BASE = `http://${window.location.hostname}:4000`

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

function formatTimeLabel(dateStr, rangeValue) {
  const date = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')

  if (['15m', '1h', '6h', '1d'].includes(rangeValue)) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  if (['1mo', '6mo'].includes(rangeValue)) {
    return `${pad(date.getDate())} ${months[date.getMonth()]}`
  }
  return `${months[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`
}

function mapWaterLevelNumeric(ta, tb) {
  if (ta === 1 && tb === 0) return 3 // Max
  if (ta === 0 && tb === 1) return 1 // Low
  if (ta === 0 && tb === 0) return 0 // Critical
  return 2 // fallback
}

function formatFullDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const wib = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return `${pad(wib.getDate())} ${months[wib.getMonth()]} ${wib.getFullYear()}, ${pad(wib.getHours())}:${pad(wib.getMinutes())}`
}

async function fetchHistory(range) {
  const res = await fetch(`${API_BASE}/api/history?range=${range}`)
  const rows = await res.json()

  return rows.map((row) => ({
    time: formatTimeLabel(new Date(row.bucket_time), range),
    fullDate: formatFullDate(new Date(row.bucket_time)),
    temperature: +(row.suhu / 10).toFixed(1),
    pressure: +(((row.tekanan - 400) / 1600) * 10).toFixed(2),
    kwh: +(row.kwh_meter * (1 / 400)).toFixed(1),
    cumulativeKwh: +(row.cumulative_kwh * (1 / 400)).toFixed(2),
    waterLevel: mapWaterLevelNumeric(row.water_level_ta, row.water_level_tb),
  }))
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
  const [overviewData, setOverviewData] = useState([])

  useEffect(() => {
    fetchHistory(globalRange).then(setOverviewData)
  }, [globalRange])

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Statistics</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Rentang Waktu Global:</span>
          <RangeSelector value={globalRange} onChange={setGlobalRange} />
        </div>
      </div>

      <LogDownload />
      <DailyEfficiencyDownload />

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
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
            />
            <Legend />
            <Line isAnimationActive={false} type="monotone" dataKey="temperature" stroke="#fb923c" strokeWidth={2} dot={false} name="Temp (°C)" />
            <Line isAnimationActive={false} type="monotone" dataKey="pressure" stroke="#60a5fa" strokeWidth={2} dot={false} name="Pressure (bar)" />
            <Line isAnimationActive={false} type="monotone" dataKey="kwh" stroke="#facc15" strokeWidth={2} dot={false} name="Power (kWh)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Temperature (°C)" dataKey="temperature" color="#fb923c" globalRange={globalRange} />
        <ChartCard title="Pressure (bar)" dataKey="pressure" color="#60a5fa" globalRange={globalRange} />
        <ChartCard title="Power (kWh)" dataKey="kwh" color="#facc15" globalRange={globalRange} />
        <WaterLevelChartCard globalRange={globalRange} />
        <CostEfficiencyChartCard globalRange={globalRange} />
      </div>
    </div>
  )
}

function ChartCard({ title, dataKey, color, globalRange }) {
  const [range, setRange] = useState(globalRange)
  const [data, setData] = useState([])

  useEffect(() => {
    setRange(globalRange)
  }, [globalRange])

  useEffect(() => {
    fetchHistory(range).then(setData)
  }, [range])

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
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
          />
          <Line isAnimationActive={false} type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function WaterLevelChartCard({ globalRange }) {
  const [range, setRange] = useState(globalRange)
  const [data, setData] = useState([])

  useEffect(() => {
    setRange(globalRange)
  }, [globalRange])

  useEffect(() => {
    fetchHistory(range).then(setData)
  }, [range])

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
            tickFormatter={(val) => waterLevelLabels[val] ?? ''}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(val) => [waterLevelLabels[val], 'Status']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
          />
          <Line isAnimationActive={false} type="stepAfter" dataKey="waterLevel" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const RANGE_TO_SECONDS = {
  '15m': 900, '1h': 3600, '6h': 21600, '1d': 86400,
  '1mo': 2592000, '6mo': 15552000, '1y': 31536000, '5y': 157680000, max: 315360000,
}

function CostEfficiencyChartCard({ globalRange }) {
  const [range, setRange] = useState(globalRange)
  const [data, setData] = useState([])

  useEffect(() => {
    setRange(globalRange)
  }, [globalRange])

  useEffect(() => {
    async function load() {
      const rows = await fetchHistory(range)
      const settingsRes = await fetch(`${API_BASE}/api/settings`)
      const settings = await settingsRes.json()
      const kwhPrice = Number(settings.kwh_price) || 0
      const gasCostRef = Number(settings.gas_cost_ref) || 0

      const processed = rows.map((row, i) => {
      const prevKwh = i === 0 ? row.cumulativeKwh : rows[i - 1].cumulativeKwh
      const deltaKwh = Math.max(0, row.cumulativeKwh - prevKwh)
      const periodCost = +(deltaKwh * kwhPrice).toFixed(0)
      const periodGasEquivalent = +((gasCostRef / 1000) * deltaKwh).toFixed(0)
      const periodEfficiency = periodGasEquivalent - periodCost
      return { time: row.time, fullDate: row.fullDate, periodCost, periodEfficiency }
    })
      setData(processed)
    }
    load()
  }, [range])

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold">Efisiensi Biaya (per periode)</h3>
        <RangeSelector value={range} onChange={setRange} className="text-xs px-2 py-1" />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" fontSize={10} />
          <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} tickFormatter={(v) => `Rp${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(val, name) => [`Rp ${val.toLocaleString('id-ID')}`, name === 'periodCost' ? 'Biaya Listrik' : 'Efisiensi']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
          />
          <Legend />
          <Line isAnimationActive={false} type="monotone" dataKey="periodCost" stroke="#facc15" strokeWidth={2} dot={false} name="Biaya Listrik" />
          <Line isAnimationActive={false} type="monotone" dataKey="periodEfficiency" stroke="#4ade80" strokeWidth={2} dot={false} name="Efisiensi" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StatsView