import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Income from './pages/Income'
import Expense from './pages/Expence'
import Navbar from './components/Navbar'
import Signup from './pages/Signin'
import Login from './pages/Login'

function App() {
  const location = useLocation()
  const authRoutes = ['/login', '/signup']
  const isAuthPage = authRoutes.includes(location.pathname)

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
