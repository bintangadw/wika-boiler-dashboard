import { useState, useEffect } from 'react'
import { Thermometer, Gauge, Zap, Droplet, TrendingUp, TrendingDown, Settings, X } from 'lucide-react'
import SensorCard from '../components/SensorCard'
import HeaterToggle from '../components/HeaterToggle'

const waterLevelColors = {
  Max: 'text-green-400',
  Medium: 'text-yellow-400',
  Low: 'text-orange-400',
  Critical: 'text-red-400',
  Unknown: 'text-slate-400',
}

function mapWaterLevel(ta, tb) {
  if (ta === 1 && tb === 0) return 'Max'
  if (ta === 0 && tb === 1) return 'Low'
  if (ta === 0 && tb === 0) return 'Critical'
  return 'Unknown'
}

function LiveView() {
  const [data, setData] = useState({
    temperature: 0,
    pressure: 0,
    kwh: 0,
    waterLevel: 'Unknown',
  })

  const [heaters, setHeaters] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, isOn: false }))
  )

  const [waterPumpOn, setWaterPumpOn] = useState(false)
  const [alarmPompaOn, setAlarmPompaOn] = useState(false)

  // State untuk kalkulasi efisiensi biaya
  const [gasCostRef, setGasCostRef] = useState(() => Number(localStorage.getItem('gasCostRef')) || 0)
  const [kwhPrice, setKwhPrice] = useState(() => Number(localStorage.getItem('kwhPrice')) || 0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    localStorage.setItem('gasCostRef', gasCostRef)
  }, [gasCostRef])

  useEffect(() => {
    localStorage.setItem('kwhPrice', kwhPrice)
  }, [kwhPrice])

  // Kalkulasi biaya
  const listrikCost = data.kwh * kwhPrice
  const efficiency = gasCostRef - listrikCost

  useEffect(() => {
    const fetchData = () => {
      fetch('http://192.168.2.98:4000/api/live')
        .then((res) => res.json())
        .then((row) => {
          console.log('DEBUG row.pompa:', row.pompa, typeof row.pompa)

          setData({
            temperature: +(row.suhu / 10).toFixed(1),
            pressure: +(((row.tekanan - 400) / 1600) * 10).toFixed(2),
            kwh: +(row.cumulative_kwh * (1 / 400)).toFixed(1),
            waterLevel: mapWaterLevel(row.water_level_ta, row.water_level_tb),
          })

          setHeaters(
            Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              isOn: row[`heater_${i + 1}`] === 1,
            }))
          )

          setWaterPumpOn(Number(row.pompa) === 1)
          setAlarmPompaOn(row.alarm_pompa === 1)
        })
        .catch((err) => console.error('Fetch gagal:', err))
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 mx-auto">
      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">Live Sensor Readings</h2>

      {(() => {
        const warnings = []
        if (data.waterLevel === 'Critical') {
          warnings.push('Water Level Critical — Pompa Air Perlu Dinyalakan')
        }
        if (data.pressure >= 2.3) {
          warnings.push('Pressure Melebihi Batas Aman (≥ 2.3 bar)')
        }

        if (warnings.length === 0) return null

        const warningText = warnings.map((w) => `⚠️ PERINGATAN: ${w} ⚠️`).join(' \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ')

        return (
          <div
            className="animate-fade-in relative overflow-hidden rounded-2xl mb-6 py-3"
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.5)',
            }}
          >
            <div className="animate-marquee whitespace-nowrap text-red-300 font-bold text-lg">
              {warningText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {warningText}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SensorCard icon={Thermometer} label="Water Heater Temperature" value={data.temperature} unit="°C" color="text-orange-400" />
        <SensorCard icon={Gauge} label="Pressure" value={data.pressure} unit="bar" color="text-blue-400" />
        <SensorCard icon={Zap} label="Power (kWh)" value={data.kwh} unit="kWh" color="text-yellow-400" />
        <SensorCard icon={Droplet} label="Water Level" value={data.waterLevel} unit="" color="text-cyan-400" isStatus={true} statusColor={waterLevelColors[data.waterLevel]} />
      </div>

      {/* Financial Efficiency Section */}
      <div className="flex justify-between items-center mb-4 mt-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Efisiensi Biaya</h2>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-white transition-all text-sm font-medium shadow-lg"
        >
          <Settings className="w-4 h-4" />
          Atur Biaya
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-3xl flex flex-col justify-center items-center text-center border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center mb-3 ring-1 ring-yellow-400/30">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wider">Biaya Listrik Heater</p>
          <h3 className="text-2xl font-bold text-white">Rp {listrikCost.toLocaleString('id-ID')}</h3>
        </div>

        <div className={`glass-panel p-5 rounded-3xl flex flex-col justify-center items-center text-center shadow-xl relative overflow-hidden group transition-all duration-300 ${efficiency >= 0 ? 'border border-green-500/30 bg-green-500/5' : 'border border-red-500/30 bg-red-500/5'}`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${efficiency >= 0 ? 'from-green-400/10 to-transparent' : 'from-red-400/10 to-transparent'}`} />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ring-1 ${efficiency >= 0 ? 'bg-green-400/10 ring-green-400/30' : 'bg-red-400/10 ring-red-400/30'}`}>
            {efficiency >= 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
          </div>
          <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wider">Efisiensi Rupiah</p>
          <h3 className={`text-3xl font-bold tracking-tight ${efficiency >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {efficiency >= 0 ? '+' : '-'}Rp {Math.abs(efficiency).toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Heater Status Card */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Heater Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-8 gap-x-4">
            {heaters.map((heater) => (
              <div key={heater.id} className="flex justify-center">
                <HeaterToggle label={`H${heater.id}`} isOn={heater.isOn} />
              </div>
            ))}
          </div>
        </div>

        {/* Pump Status Card */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-1 border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Pump Status</h2>
          <div className="flex justify-around items-center h-full pb-8">
            <div className="flex flex-col items-center">
              <HeaterToggle label="Water Pump" isOn={waterPumpOn} />
            </div>
            <div className="flex flex-col items-center">
              <HeaterToggle label="Alarm Pompa" isOn={alarmPompaOn} />
            </div>
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md relative border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Pengaturan Biaya
            </h3>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-white/80 text-sm mb-2 block font-medium">Referensi Biaya Gas Harian</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">Rp</span>
                  <input
                    type="number"
                    value={gasCostRef || ''}
                    onChange={(e) => setGasCostRef(Number(e.target.value))}
                    className="w-full rounded-xl pl-12 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 font-semibold text-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block font-medium">Harga Listrik per kWh</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">Rp</span>
                  <input
                    type="number"
                    value={kwhPrice || ''}
                    onChange={(e) => setKwhPrice(Number(e.target.value))}
                    className="w-full rounded-xl pl-12 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 font-semibold text-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default LiveView