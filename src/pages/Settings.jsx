import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import {
  getIncomeCategories,
  getExpenseCategories,
} from "../utils/firestoreHelpers"; // Adjust path as needed

export default function Settings() {
  const [user, setUser] = useState(null);
  const [initialBalance, setInitialBalance] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dailyData, setDailyData] = useState(null);

  const [entryType, setEntryType] = useState("income");
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [popupData, setPopupData] = useState([]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDayPopup, setShowDayPopup] = useState(false);

  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);

        const bankRef = doc(db, "users", currentUser.uid, "settings", "bank");
        const bankSnap = await getDoc(bankRef);
        if (bankSnap.exists()) {
          setInitialBalance(bankSnap.data().initialBalance || "");
        }

        // Fetch categories when user logs in
        fetchCategories();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch both income and expense categories
  const fetchCategories = async () => {
    try {
      const incomes = await getIncomeCategories();
      const expenses = await getExpenseCategories();

      setIncomeCategories(incomes);
      setExpenseCategories(expenses);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Watch for changes in selected category or entry type
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!selectedCategory) return;
      const data = await getMonthlyEntriesByCategory(
        entryType,
        selectedCategory
      );
      setPopupData(data);
      setShowPopup(true);
    };

    if (selectedCategory) {
      fetchCategoryData();
    }
  }, [selectedCategory, entryType]);

  const getMonthlyEntriesByCategory = async (type = "income", categoryName) => {
    const user = auth.currentUser;
    if (!user) return [];

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const recordsRef = collection(db, "users", user.uid, "records");
    const querySnap = await getDocs(recordsRef);

    const results = [];
    querySnap.forEach((docSnap) => {
      const date = docSnap.id;
      if (date.startsWith(`${year}-${month}`)) {
        const data = docSnap.data();
        const entries = data[type] || [];
        entries.forEach((item) => {
          if (item.category === categoryName) {
            results.push({ date, remark: item.remark, amount: item.amount });
          }
        });
      }
    });

    return results;
  };

  const fetchDayData = async (date) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "records", date);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDailyData(snap.data());
        setShowDayPopup(true);
      } else {
        alert("No data found for this date.");
      }
    } catch (error) {
      console.error("Error fetching daily data:", error);
    }
  };

  const saveInitialBalance = async () => {
    if (!user) return;
    try {
      const bankRef = doc(db, "users", user.uid, "settings", "bank");
      await setDoc(bankRef, { initialBalance: Number(initialBalance) });
      alert("Initial balance saved!");
    } catch (error) {
      console.error("Failed to save balance:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      alert("Logout failed. Try again.");
      console.error("Logout error:", error);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    // Data will be fetched via the useEffect
  };

  const switchEntryType = (type) => {
    setEntryType(type);
    setSelectedCategory(""); // Reset selected category when switching type
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-8 mt-8">
      <section>
        <h2 className="text-xl font-bold">Profile</h2>
        {user ? (
          <div className="text-sm bg-gray-100 p-4 rounded">
            <p>
              <strong>Full Name:</strong> {user.displayName || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Last Login:</strong>{" "}
              {user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleString(
                    "en-IN",
                    {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )
                : "N/A"}
            </p>
          </div>
        ) : (
          <p>Loading user info...</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Initial Bank Balance</h2>
        <input
          type="number"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={saveInitialBalance}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </section>

      <section>
        <h2 className="text-xl font-bold">Check Day's Record</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={() => fetchDayData(selectedDate)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          View
        </button>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Category Records</h2>

        {/* Simple tabs for switching between income and expense */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => switchEntryType("income")}
            className={`px-4 py-2 ${
              entryType === "income"
                ? "border-b-2 border-blue-500 text-blue-500 font-medium"
                : "text-gray-500"
            }`}
          >
            Income
          </button>
          <button
            onClick={() => switchEntryType("expense")}
            className={`px-4 py-2 ${
              entryType === "expense"
                ? "border-b-2 border-red-500 text-red-500 font-medium"
                : "text-gray-500"
            }`}
          >
            Expense
          </button>
        </div>

        {/* Categories displayed as a simple list */}
        <div className="overflow-y-auto max-h-60 bg-gray-50 rounded p-2">
          {entryType === "income" ? (
            incomeCategories.length > 0 ? (
              <div className="space-y-1">
                {incomeCategories.map((category) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-3 rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                      selectedCategory === category
                        ? "bg-blue-100 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <span>{category}</span>
                    {selectedCategory === category && (
                      <span className="text-blue-500">●</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No income categories found
              </div>
            )
          ) : expenseCategories.length > 0 ? (
            <div className="space-y-1">
              {expenseCategories.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`p-3 rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                    selectedCategory === category
                      ? "bg-red-100 border-l-4 border-red-500"
                      : ""
                  }`}
                >
                  <span>{category}</span>
                  {selectedCategory === category && (
                    <span className="text-red-500">●</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No expense categories found
            </div>
          )}
        </div>

        {/* Show a hint for the user */}
        <p className="text-sm text-gray-500 mt-2">
          Click on a category to view its records
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Logout</h2>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </section>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-bold">Confirm Logout</h3>
            <p className="text-sm">Are you sure you want to logout?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDayPopup && dailyData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-2">
              Records for {selectedDate}
            </h3>
            <div>
              <p className="text-green-600 font-semibold">
                Income: ₹{dailyData.totalIncome || 0}
              </p>
              {dailyData.income?.map((entry, idx) => (
                <p key={idx} className="text-sm">
                  • ₹{entry.amount} - {entry.remark}
                </p>
              ))}
            </div>
            <div>
              <p className="text-red-500 font-semibold">
                Expense: ₹{dailyData.totalExpense || 0}
              </p>
              {dailyData.expense?.map((entry, idx) => (
                <p key={idx} className="text-sm">
                  • ₹{entry.amount} - {entry.remark}
                </p>
              ))}
            </div>
            <p className="font-bold mt-2">
              Net Total: ₹
              {(dailyData.totalIncome || 0) - (dailyData.totalExpense || 0)}
            </p>
            <button
              onClick={() => setShowDayPopup(false)}
              className="w-full mt-4 bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {selectedCategory} -{" "}
              {entryType === "income" ? "Income" : "Expense"} Records
            </h3>
            {popupData.length === 0 ? (
              <p>No records found for this category.</p>
            ) : (
              <ul className="space-y-2">
                {popupData.map((item, index) => (
                  <li key={index} className="border-b pb-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.date}</span>
                      <span className="font-bold text-right">
                        ₹{item.amount}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{item.remark}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-2 border-t">
              <p className="font-bold text-lg">
                Total: ₹{popupData.reduce((sum, item) => sum + item.amount, 0)}
              </p>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full mt-4 bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
