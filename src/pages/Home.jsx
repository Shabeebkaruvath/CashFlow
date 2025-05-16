import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

function Home() {
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchTodayData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const today = getTodayDate();
      const todayRef = doc(db, "users", user.uid, "records", today);

      try {
        const todaySnap = await getDoc(todayRef);
        if (todaySnap.exists()) {
          const data = todaySnap.data();
          setTodayIncome(data.totalIncome || 0);
          setTodayExpense(data.totalExpense || 0);
        }
      } catch (error) {
        console.error("Error fetching today's data:", error);
      }
    };

    const fetchAllTimeBankBalance = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const recordsRef = collection(db, "users", user.uid, "records");
      const bankRef = doc(db, "users", user.uid, "settings", "bank");

      try {
        const snapshot = await getDocs(recordsRef);
        let incomeSum = 0;
        let expenseSum = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          incomeSum += data.totalIncome || 0;
          expenseSum += data.totalExpense || 0;
        });

        // Fetch initial balance
        const bankSnap = await getDoc(bankRef);
        const initialBalance = bankSnap.exists()
          ? bankSnap.data().initialBalance || 0
          : 0;

        setBankBalance(initialBalance + incomeSum - expenseSum);
      } catch (error) {
        console.error("Error calculating bank balance:", error);
      }
    };

    fetchTodayData();
    fetchAllTimeBankBalance();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen mb-20" >
      {/* Google-style app bar */}
      <div className="bg-white shadow-sm px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            <span className="material-icons-outlined mr-3 text-blue-600">
              dashboard
            </span>
            <h1 className="text-xl font-normal text-gray-800">Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Summary cards section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Income Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center mb-3">
                <span className="material-icons-outlined mr-2 text-green-600">
                  trending_up
                </span>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Income
                </h2>
              </div>
              <div className="mb-1">
                <p className="text-2xl font-normal text-gray-900">
                  ₹ {todayIncome.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <Link
                to="/income"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-between"
              >
                View details
                <span className="material-icons-outlined text-lg">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center mb-3">
                <span className="material-icons-outlined mr-2 text-red-600">
                  trending_down
                </span>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Expense
                </h2>
              </div>
              <div className="mb-1">
                <p className="text-2xl font-normal text-gray-900">
                  ₹ {todayExpense.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <Link
                to="/expense"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-between"
              >
                View details
                <span className="material-icons-outlined text-lg">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center mb-3">
                <span className="material-icons-outlined mr-2 text-blue-600">
                  account_balance_wallet
                </span>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Balance
                </h2>
              </div>
              <div className="mb-1">
                <p className="text-2xl font-normal text-gray-900">
                  ₹ {bankBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current</p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <Link
                to="/settings"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-between"
              >
                Manage settings
                <span className="material-icons-outlined text-lg">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>

        

         
      </div>

      {/* Floating action button - mobile only */}
      <div className="fixed right-5 bottom-6 md:hidden">
        <button className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
          <span className="material-icons-outlined text-white">add</span>
        </button>
      </div>
    </div>
  );
}

export default Home;
