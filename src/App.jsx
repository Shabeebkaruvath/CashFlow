import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/firebase'

import Home from './pages/Home'
import Settings from './pages/Settings'
import Income from './pages/Income'
import Expense from './pages/Expence'
import Navbar from './components/Navbar'
import Signup from './pages/Signin'
import Login from './pages/Login'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const authRoutes = ['/login', '/signup']
  const isAuthPage = authRoutes.includes(location.pathname)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !isAuthPage) {
        navigate('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [location.pathname])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className={isAuthPage ? 'min-h-screen' : 'pt-0 lg:pt-20 md:pl-20 pb-16 md:pb-0'}>
      {!isAuthPage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expense" element={<Expense />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  )
}

export default App
