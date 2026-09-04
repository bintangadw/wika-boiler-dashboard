import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
const API_BASE = `http://${window.location.hostname}:4000`

function DailyEfficiencyDownload() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!start || !end) {
      setError('Pilih tanggal mulai dan selesai dulu')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${API_BASE}/api/daily-efficiency-log?start=${start}&end=${end}`
      )
      const rows = await res.json()

      if (!res.ok) {
        setError(rows.error || 'Gagal ambil data')
        setLoading(false)
        return
      }
      if (rows.length === 0) {
        setError('Tidak ada data pada rentang tanggal itu')
        setLoading(false)
        return
      }

      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text('Laporan Efisiensi Biaya Harian — WIKA Beton', 14, 15)
      doc.setFontSize(10)
      doc.text(`Rentang: ${start} s/d ${end}`, 14, 22)

      const head = [['Tanggal', 'kWh Terpakai', 'Biaya Listrik (Rp)', 'Referensi Gas (Rp)', 'Efisiensi (Rp)']]
      const body = rows.map((r) => [
        new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        Number(r.kwh_terpakai).toFixed(1),
        Math.round(r.biaya_listrik).toLocaleString('id-ID'),
        Math.round((r.referensi_gas / 1000) * r.kwh_terpakai).toLocaleString('id-ID'),
        Math.round(r.efisiensi).toLocaleString('id-ID'),
      ])

      const totalKwh = rows.reduce((sum, r) => sum + Number(r.kwh_terpakai), 0)
      const totalBiaya = rows.reduce((sum, r) => sum + Number(r.biaya_listrik), 0)
      const totalGasRef = rows.reduce((sum, r) => sum + (r.referensi_gas / 1000) * r.kwh_terpakai, 0)
      const totalEfisiensi = rows.reduce((sum, r) => sum + Number(r.efisiensi), 0)

      const foot = [[
        'TOTAL',
        totalKwh.toFixed(1),
        Math.round(totalBiaya).toLocaleString('id-ID'),
        Math.round(totalGasRef).toLocaleString('id-ID'),
        Math.round(totalEfisiensi).toLocaleString('id-ID'),
      ]]

      autoTable(doc, {
        head,
        body,
        foot,
        startY: 28,
        styles: { fontSize: 9 },
        footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      })
      doc.save(`efisiensi-harian-${start}-${end}.pdf`)
    } catch (err) {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
      <h3 className="text-white font-semibold">Unduh Laporan Efisiensi Harian</h3>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-white/70 text-sm mb-1 block">Dari Tanggal</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/15 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-white/70 text-sm mb-1 block">Sampai Tanggal</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg px-3 py-2 bg-white/15 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 transition text-white font-semibold rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Unduh PDF'}
        </button>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
    </div>
  )
}

export default DailyEfficiencyDownload