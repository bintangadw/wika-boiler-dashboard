import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import TabBar from './components/TabBar'
import LiveView from './pages/LiveView'
import StatsView from './pages/StatsView'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { LogOut } from 'lucide-react'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const [authScreen, setAuthScreen] = useState(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('token') ? 'reset-password' : 'login'
})
const resetToken = new URLSearchParams(window.location.search).get('token')
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
  return localStorage.getItem('isLoggedIn') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn)
  }, [isLoggedIn])

  const [view, setView] = useState(() => {
    return localStorage.getItem('dashboardView') || 'live'
  })

  useEffect(() => {
    localStorage.setItem('dashboardView', view)
  }, [view])

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a1128 0%, #1e3a8a 25%, #1e40af 45%, #0c2461 65%, #030712 100%)',
        }}
      >
        {authScreen === 'login' && (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
        )}
        {authScreen === 'register' && (
        <RegisterPage
        onRegisterSuccess={() => setAuthScreen('login')}
        onGoToLogin={() => setAuthScreen('login')}
      />
        )}
        {authScreen === 'forgot-password' && (
        <ForgotPasswordPage onGoToLogin={() => setAuthScreen('login')} />
        )}
        {authScreen === 'reset-password' && (
        <ResetPasswordPage
        token={resetToken}
        onResetSuccess={() => {
        window.history.replaceState({}, '', '/')
        setAuthScreen('login')
      }}
    />
)}
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a1128 0%, #1e3a8a 25%, #1e40af 45%, #0c2461 65%, #030712 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(96,165,250,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.2) 0%, transparent 50%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="relative">
        <Navbar />

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === 'live' ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === 'live' ? 50 : -50 }}
            transition={{ duration: 0.3 }}
          >
            {view === 'live' ? <LiveView /> : <StatsView />}
          </motion.div>
        </AnimatePresence>

        <TabBar view={view} setView={setView} />

        <button
          onClick={() => setIsLoggedIn(false)}
          className="glass-panel fixed bottom-6 right-6 z-10 rounded-full p-3 hover:bg-white/20 transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  )
}

export default App