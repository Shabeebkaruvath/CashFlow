import React, { useEffect, useState } from 'react'
import { auth, db } from '../firebase/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [dailyData, setDailyData] = useState(null)
  const [showDayPopup, setShowDayPopup] = useState(false)
  const [initialBalance, setInitialBalance] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login')
      } else {
        setUser(currentUser)
        const bankRef = doc(db, 'users', currentUser.uid, 'settings', 'bank')
        const bankSnap = await getDoc(bankRef)
        if (bankSnap.exists()) {
          setInitialBalance(bankSnap.data().initialBalance || '')
        }
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      alert('Logout failed. Try again.')
      console.error('Logout error:', error)
    }
  }

  const fetchDayData = async (date) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'records', date)

    try {
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setDailyData(snap.data())
        setShowDayPopup(true)
      } else {
        setDailyData(null)
        alert('No data found for this date.')
      }
    } catch (error) {
      console.error('Error fetching daily data:', error)
    }
  }

  const saveInitialBalance = async () => {
    if (!user) return
    const bankRef = doc(db, 'users', user.uid, 'settings', 'bank')
    try {
      await setDoc(bankRef, { initialBalance: Number(initialBalance) })
      alert('Initial balance saved!')
    } catch (error) {
      console.error('Failed to save balance:', error)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-8 mt-8">
      {/* Profile Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Profile</h2>
        {user ? (
          <div className="space-y-2 text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">
            <p><span className="font-semibold">Full Name:</span> {user.displayName || 'N/A'}</p>
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Last Login:</span> {user.metadata.lastSignInTime}</p>
          </div>
        ) : (
          <p className="text-gray-600">Loading user information...</p>
        )}
      </div>

      {/* Initial Bank Balance Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Initial Bank Balance</h2>
        <input
          type="number"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={saveInitialBalance}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save Initial Balance
        </button>
      </div>

      {/* Date Picker Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Check Day's Record</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={() => fetchDayData(selectedDate)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View Day Record
        </button>
      </div>

      {/* Logout Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Logout</h2>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Confirm Logout</h3>
            <p className="text-sm text-gray-600">Are you sure you want to logout?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Data Popup */}
      {showDayPopup && dailyData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Records for {selectedDate}</h3>
            <div>
              <p className="text-green-600 font-semibold">Total Income: ₹{dailyData.totalIncome || 0}</p>
              {dailyData.income?.map((entry, idx) => (
                <div key={idx} className="text-sm text-gray-700 ml-2">
                  • ₹{entry.amount} - {entry.remark}
                </div>
              ))}
            </div>
            <div>
              <p className="text-red-500 font-semibold">Total Expense: ₹{dailyData.totalExpense || 0}</p>
              {dailyData.expense?.map((entry, idx) => (
                <div key={idx} className="text-sm text-gray-700 ml-2">
                  • ₹{entry.amount} - {entry.remark}
                </div>
              ))}
            </div>
            <div className="font-bold text-gray-800">
              Day Total: ₹{(dailyData.totalIncome || 0) - (dailyData.totalExpense || 0)}
            </div>
            <button
              onClick={() => setShowDayPopup(false)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}