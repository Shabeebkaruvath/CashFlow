import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'
import Settings from './pages/Settings'
import Income from './pages/Income'
import Expense from './pages/Expence'
import Navbar from './components/Navbar'
import Signup from './pages/Signin'
import Login from './pages/Login'

function App() {
  const location = useLocation()
  const { user, loading } = useAuth()

  const authRoutes = ['/login', '/signup']
  const isAuthPage = authRoutes.includes(location.pathname)

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className={isAuthPage ? 'min-h-screen' : 'pt-0 lg:pt-20 md:pl-20 pb-16 md:pb-0'}>
      {!isAuthPage && <Navbar />}

      <Routes>
        <Route 
          path="/" 
          element={user ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/income" 
          element={user ? <Income /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/expense" 
          element={user ? <Expense /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={user ? <Settings /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/" />} 
        />
      </Routes>
    </div>
  )
}

export default App