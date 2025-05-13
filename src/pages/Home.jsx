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
    <div className="p-4 md:p-6">
    <h1 className="text-2xl font-semibold text-gray-900 mb-5">Dashboard</h1>
  
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
      {/* Today's Income */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 flex flex-col">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-gray-600 tracking-wide uppercase">Income</h2>
          <p className="text-2xl font-semibold text-green-600">₹ {todayIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Today</p>
        </div>
        <Link
          to="/income"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline mt-auto flex items-center justify-end"
        >
          Details
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 ml-1"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
  
      {/* Today's Expense */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 flex flex-col">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-gray-600 tracking-wide uppercase">Expense</h2>
          <p className="text-2xl font-semibold text-red-500">₹ {todayExpense.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Today</p>
        </div>
        <Link
          to="/expense"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline mt-auto flex items-center justify-end"
        >
          Details
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 ml-1"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
  
      {/* Bank Balance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 flex flex-col">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-gray-600 tracking-wide uppercase">Balance</h2>
          <p className="text-2xl font-semibold text-blue-600">₹ {bankBalance.toFixed(2)}</p>
        </div>
        <Link
          to="/settings"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline mt-auto flex items-center justify-end"
        >
          Manage
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 ml-1"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </div>
  </div>
  );
}

export default Home;
