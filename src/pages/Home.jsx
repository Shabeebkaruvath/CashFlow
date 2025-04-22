import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

function Home() {
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTodayData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const today = getTodayDate();
      const todayRef = doc(db, 'users', user.uid, 'records', today);

      try {
        const todaySnap = await getDoc(todayRef);
        if (todaySnap.exists()) {
          const data = todaySnap.data();
          setTodayIncome(data.totalIncome || 0);
          setTodayExpense(data.totalExpense || 0);
        }
      } catch (error) {
        console.error('Error fetching today\'s data:', error);
      }
    };

    const fetchAllTimeBankBalance = async () => {
      const user = auth.currentUser;
      if (!user) return;
    
      const recordsRef = collection(db, 'users', user.uid, 'records');
      const bankRef = doc(db, 'users', user.uid, 'settings', 'bank');
    
      try {
        const snapshot = await getDocs(recordsRef);
        let incomeSum = 0;
        let expenseSum = 0;
    
        snapshot.forEach(doc => {
          const data = doc.data();
          incomeSum += data.totalIncome || 0;
          expenseSum += data.totalExpense || 0;
        });
    
        // Fetch initial balance
        const bankSnap = await getDoc(bankRef);
        const initialBalance = bankSnap.exists() ? bankSnap.data().initialBalance || 0 : 0;
    
        setBankBalance(initialBalance + incomeSum - expenseSum);
      } catch (error) {
        console.error('Error calculating bank balance:', error);
      }
    };
    

    fetchTodayData();
    fetchAllTimeBankBalance();
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Income */}
        <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Today's Income</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">₹ {todayIncome.toFixed(2)}</p>
          </div>
          <Link
            to="/income"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View More →
          </Link>
        </div>

        {/* Today's Expense */}
        <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Today's Expense</h2>
            <p className="text-3xl font-bold text-red-500 mt-2">₹ {todayExpense.toFixed(2)}</p>
          </div>
          <Link
            to="/expense"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View More →
          </Link>
        </div>

        {/* Bank Balance */}
        <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Bank Balance</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">₹ {bankBalance.toFixed(2)}</p>
          </div>
          <Link
            to="/settings"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View More →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
