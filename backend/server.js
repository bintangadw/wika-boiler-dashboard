import express from 'express'
import cors from 'cors'
import pg from 'pg'
import 'dotenv/config'
import ratelimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { Pool } = pg

const app = express()
app.use(cors({
  origin: ['http://192.168.2.98:3000', 'http://103.165.139.117:3000'], // nanti diganti lagi setelah dapet ip 
})) 

const loginLimiter = ratelimit({
  windowMs: 15 * 16 * 1000,
  max: 5,
  message: {error: "terlalu banyak percobaan login, coba lagi nanti"},
})

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err)
})

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token tidak ada' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak, khusus admin' })
  }
  next()
}

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET


app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    const user = result.rows[0]
    if (!user) return res.status(400).json({ error: 'Username atau password salah' })
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(400).json({ error: 'Username atau password salah' })
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, role: user.role })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login gagal' })
  }
})

app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT kwh_price, gas_cost_ref FROM app_settings WHERE id = 1')
    res.json(result.rows[0] || { kwh_price: 0, gas_cost_ref: 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil settings' })
  }
})

app.post('/api/settings', verifyToken, requireAdmin, async (req, res) => {
  const { kwhPrice, gasCostRef } = req.body
  try {
    await pool.query(
      'UPDATE app_settings SET kwh_price = $1, gas_cost_ref = $2 WHERE id = 1',
      [kwhPrice, gasCostRef]
    )
    res.json({ message: 'Settings berhasil disimpan' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal simpan settings' })
  }
})

app.get('/api/live', verifyToken, async (req, res) => {
  try {
    const sensorResult = await pool.query('SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1')
    const kwhResult = await pool.query('SELECT cumulative_kwh FROM kwh_state WHERE id = 1')
    const trackerResult = await pool.query('SELECT kwh_at_day_start FROM daily_kwh_tracker WHERE id = 1')

    const row = sensorResult.rows[0] || {}
    row.cumulative_kwh = kwhResult.rows[0]?.cumulative_kwh || 0
    row.kwh_at_day_start = trackerResult.rows[0]?.kwh_at_day_start || 0

    res.json(row)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil data' })
  }
})

app.get('/api/history', async (req, res) => {
  const range = req.query.range || '1h'
  const rangeConfig = {
    '15m': { intervalSql: '15 minutes', bucketSeconds: 60 },
    '1h': { intervalSql: '1 hour', bucketSeconds: 300 },
    '6h': { intervalSql: '6 hours', bucketSeconds: 1800 },
    '1d': { intervalSql: '1 day', bucketSeconds: 3600 },
    '1mo': { intervalSql: '30 days', bucketSeconds: 86400 },
    '6mo': { intervalSql: '180 days', bucketSeconds: 604800 },
    '1y': { intervalSql: '365 days', bucketSeconds: 2592000 },
    '5y': { intervalSql: '1825 days', bucketSeconds: 7884000 },
    max: { intervalSql: '3650 days', bucketSeconds: 7884000 },
  }
  const config = rangeConfig[range] || rangeConfig['1h']
  try {
    const result = await pool.query(
    `SELECT
      to_timestamp(floor(extract(epoch from (created_at AT TIME ZONE 'Asia/Jakarta')) / $1) * $1) AS bucket_time,
      AVG(suhu) AS suhu,
      AVG(tekanan) AS tekanan,
      AVG(kwh_meter) AS kwh_meter,
      MAX(cumulative_kwh) AS cumulative_kwh,
      MIN(
        CASE
          WHEN water_level_ta = 1 AND water_level_tb = 0 THEN 2
          WHEN water_level_ta = 0 AND water_level_tb = 1 THEN 1
          WHEN water_level_ta = 0 AND water_level_tb = 0 THEN 0
          ELSE 2
        END
      ) AS water_level_severity
    FROM sensor_readings
    WHERE created_at >= NOW() - $2::interval
    GROUP BY bucket_time
    ORDER BY bucket_time ASC`,
    [config.bucketSeconds, config.intervalSql]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil data histori' })
  }
})

app.get('/api/log', verifyToken, requireAdmin, async (req, res) => {
  const { start, end } = req.query
  if (!start || !end) {
    return res.status(400).json({ error: 'Parameter start dan end wajib diisi' })
  }
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (date_trunc('hour', created_at AT TIME ZONE 'Asia/Jakarta'))
      date_trunc('hour', created_at AT TIME ZONE 'Asia/Jakarta') AS hour_bucket,
      suhu, tekanan, cumulative_kwh, water_level_ta, water_level_tb,
      heater_1, heater_2, heater_3, heater_4, heater_5,
      heater_6, heater_7, heater_8, heater_9, heater_10,
      pompa
      FROM sensor_readings
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY date_trunc('hour', created_at AT TIME ZONE 'Asia/Jakarta'), created_at DESC`,
      [start, end]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil data log' })
  }
})

app.get('/api/daily-efficiency-log', verifyToken, requireAdmin, async (req, res) => {
  const { start, end } = req.query
  if (!start || !end) {
    return res.status(400).json({ error: 'Parameter start dan end wajib diisi' })
  }
  try {
    const result = await pool.query(
      `SELECT tanggal, kwh_terpakai, biaya_listrik, referensi_gas, efisiensi
       FROM daily_efficiency
       WHERE tanggal BETWEEN $1 AND $2
       ORDER BY tanggal ASC`,
      [start, end]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil data efisiensi harian' })
  }
})

app.use(express.static(path.join(__dirname, '../dist')))

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(4000, '0.0.0.0', () => {
  console.log('Backend API jalan di port 4000')
})