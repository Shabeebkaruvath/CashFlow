import { useState } from 'react'
import { Link ,useNavigate} from 'react-router-dom'
import { auth } from '../firebase/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth'
import { UserPlus } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

const handleSignup = async (e) => {
  e.preventDefault()
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })
    navigate('/')  // ⬅ Redirect to home
  } catch (error) {
    alert(error.message)
  }
}


const handleGoogleSignup = async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    // Try popup first as it's more reliable across environments
    await signInWithPopup(auth, provider);
    navigate('/');
  } catch (error) {
    console.error("Auth error:", error.code, error.message);
    
    // Only use redirect as a fallback and with error handling
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user') {
      try {
        // Store a flag that we're attempting redirect auth
        sessionStorage.setItem('authRedirectAttempt', 'true');
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        alert("Authentication failed. Please try again or use a different browser.");
        console.error("Redirect error:", redirectError);
      }
    } else {
      alert(error.message);
    }
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 px-4 py-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
        {/* Left Side Icon */}
        <div className="hidden md:flex flex-col items-center justify-center bg-blue-600 text-white p-8 w-full md:w-1/2">
          <UserPlus size={80} />
          <h2 className="text-3xl font-bold mt-4">Welcome to CashFlow</h2>
          <p className="mt-2 text-sm text-blue-100">Track your income and expenses easily.</p>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">Create Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-semibold text-blue-600">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              Sign Up
            </button>
          </form>

          <div className="my-4 text-center text-sm text-blue-500">OR</div>

          <button
            onClick={handleGoogleSignup}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
          >
            Sign up with Google
          </button>

          <p className="text-sm text-center mt-4 text-blue-700">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
