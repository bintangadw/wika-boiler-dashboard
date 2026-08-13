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

const JWT_SECRET = 'ganti_dengan_string_acak_yang_panjang_dan_rahasia'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bintang.aw206@gmail.com',
    pass: 'npfr eops zisf iwmp',
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

    const verifyUrl = `http://172.26.16.1:4000/api/verify?token=${verificationToken}`

    await transporter.sendMail({
      from: '"Boiler Dashboard" <emailgmailkamu@gmail.com>',
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

    if (!user) {
      return res.status(400).json({ error: 'Email atau password salah' })
    }
    if (!user.is_verified) {
      return res.status(400).json({ error: 'Email belum diverifikasi, cek inbox kamu' })
    }

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(400).json({ error: 'Email atau password salah' })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login gagal' })
  }
})

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user) {
      return res.json({ message: 'Kalau email terdaftar, link reset password sudah dikirim' })
    }

    const resetToken = uuidv4()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 jam dari sekarang

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, expires, email]
    )

    const resetUrl = `http://172.26.16.1:3000/reset-password?token=${resetToken}`

    await transporter.sendMail({
      from: '"Boiler Dashboard" <emailgmailkamu@gmail.com>',
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

    if (!user) {
      return res.status(400).json({ error: 'Link reset tidak valid atau sudah kedaluwarsa' })
    }

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

app.get('/api/live', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1'
    )
    res.json(result.rows[0] || {})
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
        to_timestamp(floor(extract(epoch from created_at) / $1) * $1) AS bucket_time,
        AVG(suhu) AS suhu,
        AVG(tekanan) AS tekanan,
        AVG(kwh_meter) AS kwh_meter,
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

app.listen(4000, '0.0.0.0', () => {
  console.log('Backend API jalan di port 4000')
})