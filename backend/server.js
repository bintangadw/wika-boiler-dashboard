import express from 'express'
import cors from 'cors'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const app = express()
app.use(cors())

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

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'

app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const verificationToken = uuidv4()
    await pool.query(
      'INSERT INTO users (email, password_hash, verification_token) VALUES ($1, $2, $3)',
      [email, passwordHash, verificationToken]
    )
    const verifyUrl = `http://192.168.2.98:4000/api/verify?token=${verificationToken}`
    await transporter.sendMail({
      from: `"Boiler Dashboard" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verifikasi Akun Boiler Dashboard',
      html: `<p>Klik link berikut buat verifikasi akun kamu:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    })
    res.json({ message: 'Registrasi berhasil, cek email untuk verifikasi' })
  } catch (err) {
    console.error(err)
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email sudah terdaftar' })
    }
    res.status(500).json({ error: 'Registrasi gagal' })
  }
})

app.get('/api/verify', async (req, res) => {
  const { token } = req.query
  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = TRUE WHERE verification_token = $1 RETURNING *',
      [token]
    )
    if (result.rows.length === 0) {
      return res.status(400).send('Token tidak valid')
    }
    res.send('Email berhasil diverifikasi! Silakan login di dashboard.')
  } catch (err) {
    console.error(err)
    res.status(500).send('Verifikasi gagal')
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) return res.status(400).json({ error: 'Email atau password salah' })
    if (!user.is_verified) return res.status(400).json({ error: 'Email belum diverifikasi, cek inbox kamu' })
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(400).json({ error: 'Email atau password salah' })
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login gagal' })
  }
})

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email wajib diisi' })
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) return res.json({ message: 'Kalau email terdaftar, link reset password sudah dikirim' })
    const resetToken = uuidv4()
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, expires, email]
    )
    const resetUrl = `http://192.168.2.98:3000/reset-password?token=${resetToken}`
    await transporter.sendMail({
      from: `"Boiler Dashboard" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset Password Boiler Dashboard',
      html: `<p>Klik link berikut untuk membuat password baru (berlaku 1 jam):</p><a href="${resetUrl}">${resetUrl}</a>`,
    })
    res.json({ message: 'Kalau email terdaftar, link reset password sudah dikirim' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal memproses permintaan' })
  }
})

app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token dan password baru wajib diisi' })
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )
    const user = result.rows[0]
    if (!user) return res.status(400).json({ error: 'Link reset tidak valid atau sudah kedaluwarsa' })
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    )
    res.json({ message: 'Password berhasil diubah' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal reset password' })
  }
})

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT kwh_price, gas_cost_ref FROM app_settings WHERE id = 1')
    res.json(result.rows[0] || { kwh_price: 0, gas_cost_ref: 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal ambil settings' })
  }
})

app.post('/api/settings', async (req, res) => {
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

app.get('/api/live', async (req, res) => {
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
        MAX(water_level_ta) AS water_level_ta,
        MAX(water_level_tb) AS water_level_tb
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

app.get('/api/log', async (req, res) => {
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

app.get('/api/daily-efficiency-log', async (req, res) => {
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

app.listen(4000, '0.0.0.0', () => {
  console.log('Backend API jalan di port 4000')
})