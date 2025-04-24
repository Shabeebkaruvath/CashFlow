import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase/firebase'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (error) {
      alert(error.message)
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()

    try {
      // Use redirect in standalone PWA mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        await signInWithRedirect(auth, provider)
      } else {
        await signInWithPopup(auth, provider)
        navigate('/')
      }
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect
        await signInWithRedirect(auth, provider)
      } else {
        alert(error.message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 px-4 py-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row">
        {/* Left Side Icon */}
        <div className="hidden md:flex flex-col items-center justify-center bg-blue-600 text-white p-8 md:w-1/2">
          <LogIn size={80} />
          <h2 className="text-3xl font-bold mt-4">Welcome Back</h2>
          <p className="mt-2 text-sm text-blue-100 text-center">Log in to manage your finances.</p>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-semibold text-blue-600">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold text-blue-600">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Log In
            </button>
          </form>

          <div className="my-4 text-center text-sm text-blue-500">OR</div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
          >
            Log in with Google
          </button>

          <p className="text-sm text-center mt-4 text-blue-700">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
