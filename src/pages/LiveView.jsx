import { useState, useEffect } from 'react'
import { Thermometer, Gauge, Zap, Droplet } from 'lucide-react'
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

  useEffect(() => {
    const fetchData = () => {
      fetch('http://172.26.16.1:4000/api/live')
        .then((res) => res.json())
        .then((row) => {
          console.log('DEBUG row.pompa:', row.pompa, typeof row.pompa)

          setData({
            temperature: +(row.suhu / 10).toFixed(1),
            pressure: +(((row.tekanan - 400) / 1600) * 10).toFixed(2),
            kwh: +(row.kwh_meter * (1 / 400)).toFixed(1),
            waterLevel: mapWaterLevel(row.water_level_ta, row.water_level_tb),
          })

          setHeaters(
            Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              isOn: row[`heater_${i + 1}`] === 1,
            }))
          )

          setWaterPumpOn(Number(row.pompa) === 1)
        })
        .catch((err) => console.error('Fetch gagal:', err))
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Live Sensor Readings</h2>

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
        <SensorCard icon={Thermometer} label="Boiler Temperature" value={data.temperature} unit="°C" color="text-orange-400" />
        <SensorCard icon={Gauge} label="Pressure" value={data.pressure} unit="bar" color="text-blue-400" />
        <SensorCard icon={Zap} label="Power (kWh)" value={data.kwh} unit="kWh" color="text-yellow-400" />
        <SensorCard icon={Droplet} label="Water Level" value={data.waterLevel} unit="" color="text-cyan-400" isStatus={true} statusColor={waterLevelColors[data.waterLevel]} />
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 mt-8">Heater Status</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
        {heaters.map((heater) => (
          <HeaterToggle key={heater.id} label={`Heater ${heater.id}`} isOn={heater.isOn} />
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 mt-8">Water Pump Status</h2>
      <div className="flex justify-center">
        <HeaterToggle label="Water Pump" isOn={waterPumpOn} />
      </div>
    </div>
  )
}

export default LiveView