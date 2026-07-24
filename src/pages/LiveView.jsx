import { useState, useEffect } from 'react'
import { Thermometer, Gauge, Zap, Droplet } from 'lucide-react'
import SensorCard from '../components/SensorCard'
import HeaterToggle from '../components/HeaterToggle'

const waterLevelStates = ['Max', 'Medium', 'Low', 'Critical']
const waterLevelColors = {
  Max: 'text-green-400',
  Medium: 'text-yellow-400',
  Low: 'text-orange-400',
  Critical: 'text-red-400',
}

function LiveView() {
  const [data, setData] = useState({
    temperature: 78.5,
    pressure: 2.0,
    kwh: 152.3,
    waterLevel: 'Max',
  })

  const [heaters, setHeaters] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, isOn: Math.random() > 0.5 }))
  )

  const [waterPumpOn, setWaterPumpOn] = useState(false)

  const toggleHeater = (id) => {
    setHeaters((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isOn: !h.isOn } : h))
    )
  }

  useEffect(() => {
  const interval = setInterval(() => {
    setData((prev) => {
      const nextTemp = Math.max(70, Math.min(90, prev.temperature + (Math.random() - 0.5) * 1.2))
      const nextPressure = Math.max(1.5, Math.min(3, prev.pressure + (Math.random() - 0.5) * 0.15))
      const nextKwh = Math.max(120, Math.min(180, prev.kwh + (Math.random() - 0.5) * 5))

      let nextWaterLevel = prev.waterLevel
      if (Math.random() < 0.1) {
        const currentIndex = waterLevelStates.indexOf(prev.waterLevel)
        const direction = Math.random() < 0.5 ? -1 : 1
        const nextIndex = Math.min(waterLevelStates.length - 1, Math.max(0, currentIndex + direction))
        nextWaterLevel = waterLevelStates[nextIndex]
      }

      return {
        temperature: +nextTemp.toFixed(1),
        pressure: +nextPressure.toFixed(1),
        kwh: +nextKwh.toFixed(1),
        waterLevel: nextWaterLevel,
      }
    })
  }, 8000)

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
        <SensorCard
          icon={Thermometer}
          label="Boiler Temperature"
          value={data.temperature}
          unit="°C"
          color="text-orange-400"
        />
        <SensorCard
          icon={Gauge}
          label="Pressure"
          value={data.pressure}
          unit="bar"
          color="text-blue-400"
        />
        <SensorCard
          icon={Zap}
          label="Power (kWh)"
          value={data.kwh}
          unit="kWh"
          color="text-yellow-400"
        />
        <SensorCard
          icon={Droplet}
          label="Water Level"
          value={data.waterLevel}
          unit=""
          color="text-cyan-400"
          isStatus={true}
          statusColor={waterLevelColors[data.waterLevel]}
        />
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 mt-8">Heater Status</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
        {heaters.map((heater) => (
          <HeaterToggle
            key={heater.id}
            label={`Heater ${heater.id}`}
            isOn={heater.isOn}
            onToggle={() => toggleHeater(heater.id)}
          />
        ))}
      </div>
      <h2 className="text-2xl font-bold text-white mb-6 mt-8">Water Pump Status</h2>
        <div className="flex justify-center">
          <HeaterToggle
          label="Water Pump"
          isOn={waterPumpOn}
          onToggle={() => setWaterPumpOn((prev) => !prev)}
        />
      </div>
    </div>
  )
}

export default LiveView