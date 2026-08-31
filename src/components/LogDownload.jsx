import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
const API_BASE = `http://${window.location.hostname}:4000`

function mapWaterLevelLabel(ta, tb) {
  if (ta === 1 && tb === 0) return 'Max'
  if (ta === 0 && tb === 1) return 'Low'
  if (ta === 0 && tb === 0) return 'Critical'
  return 'Unknown'
}

function LogDownload() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!start || !end) {
      setError('Pilih tanggal & jam mulai dan selesai dulu')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE}/api/log?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      )
      const rows = await res.json()

      if (!res.ok) {
        setError(rows.error || 'Gagal ambil data')
        setLoading(false)
        return
      }
      if (rows.length === 0) {
        setError('Tidak ada data pada rentang waktu itu')
        setLoading(false)
        return
      }

      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text('Log Data Sensor Boiler — WIKA Beton', 14, 15)
      doc.setFontSize(10)
      doc.text(`Rentang: ${start.replace('T', ' ')} s/d ${end.replace('T', ' ')}`, 14, 22)

      const head = [[
        'Jam', 'Suhu (°C)', 'Tekanan (bar)', 'kWh', 'Water Level',
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'Pompa',
      ]]

      const body = rows.map((r) => {
        const jam = new Date(r.hour_bucket).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })
        return [
          jam,
          (r.suhu / 10).toFixed(1),
          (((r.tekanan - 400) / 1600) * 10).toFixed(2),
          ((r.cumulative_kwh || 0) * (1 / 400)).toFixed(1),
          mapWaterLevelLabel(r.water_level_ta, r.water_level_tb),
          r.heater_1 === 1 ? 'ON' : 'OFF',
          r.heater_2 === 1 ? 'ON' : 'OFF',
          r.heater_3 === 1 ? 'ON' : 'OFF',
          r.heater_4 === 1 ? 'ON' : 'OFF',
          r.heater_5 === 1 ? 'ON' : 'OFF',
          r.heater_6 === 1 ? 'ON' : 'OFF',
          r.heater_7 === 1 ? 'ON' : 'OFF',
          r.heater_8 === 1 ? 'ON' : 'OFF',
          r.heater_9 === 1 ? 'ON' : 'OFF',
          r.heater_10 === 1 ? 'ON' : 'OFF',
          r.pompa === 1 ? 'ON' : 'OFF',
        ]
      })

      autoTable(doc, { head, body, startY: 28, styles: { fontSize: 7 } })
      doc.save(`log-boiler-${start}-${end}.pdf`)
    } catch (err) {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
      <h3 className="text-white font-semibold">Unduh Log (Per Jam)</h3>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-white/70 text-sm mb-1 block">Dari</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/15 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-white/70 text-sm mb-1 block">Sampai</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/15 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 transition text-white font-semibold rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Unduh PDF'}
        </button>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
    </div>
  )
}

export default LogDownload