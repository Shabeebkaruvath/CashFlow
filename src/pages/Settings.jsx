import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { X, AlertCircle, Calendar, UserCircle } from "lucide-react";
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
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
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

  const formatDateForProfile = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short", // Using 'short' for better readability e.g., "May"
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

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

      // Show toast instead of alert
      setToast({
        show: true,
        message: "Initial balance saved!",
        type: "success",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Failed to save balance:", error);
      setToast({
        show: true,
        message: "Failed to save balance",
        type: "error",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
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
      <section aria-labelledby="profile-heading" className="w-full">
        <div className="flex items-center mb-5 sm:mb-6">
          <UserCircle
            strokeWidth={1.5}
            size={30} // Slightly larger icon
            className="text-sky-600 mr-3"
          />
          <h2
            id="profile-heading"
            className="text-2xl sm:text-3xl font-semibold text-slate-800"
          >
            Profile Information
          </h2>
        </div>

        {user ? (
          <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-200/80 space-y-4">
            {[
              { label: "Full Name", value: user.displayName || "Not Provided" },
              { label: "Email Address", value: user.email || "Not Provided" },
              {
                label: "Last Login Time",
                value: user.metadata?.lastSignInTime
                  ? formatDateForProfile(user.metadata.lastSignInTime)
                  : "Not Available",
              },
            ].map((item, index, arr) => (
              <React.Fragment key={item.label}>
                <div className="text-sm sm:text-base">
                  <strong className="block sm:inline-block text-slate-600 font-medium mb-0.5 sm:mb-0">
                    {item.label}:
                  </strong>
                  <span className="block sm:inline-block sm:float-right text-slate-800 sm:text-right break-words">
                    {item.value}
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <hr className="border-slate-200/90 my-3 sm:my-3.5" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-2xl shadow-lg border border-slate-200/80 text-center">
            <div className="animate-pulse flex flex-col items-center">
              {/* You can use a spinner SVG or a library spinner here */}
              <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-500 font-medium text-base">
                Loading user information, please wait...
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="py-6 px-4 rounded-md bg-white shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Initial Bank Balance
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter initial amount"
            />
          </div>
          <button
            onClick={saveInitialBalance}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out"
          >
            Save
          </button>
        </div>
      </section>

      <section className="py-6 px-4 rounded-md bg-white shadow-sm border border-gray-200">
  <h2 className="text-lg font-medium text-gray-800 mb-4">Check Day's Record</h2>
  <div className="flex items-center space-x-4">
    <div className="flex-grow">
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
    <button
      onClick={() => fetchDayData(selectedDate)}
      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out"
    >
      View
    </button>
  </div>
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

      <section className="py-6 px-6 rounded-lg bg-gray-50">
 
  <button
    onClick={() => setShowLogoutConfirm(true)}
    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-md focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-150 ease-in-out"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar size={18} className="mr-2 text-gray-600" />
                <span>{selectedDate}</span>
              </h3>
              <button
                onClick={() => setShowDayPopup(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-80 overflow-y-auto space-y-6">
              {/* Income Section */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <h4 className="text-gray-800 font-medium">Income</h4>
                  <span className="ml-auto font-semibold text-green-600">
                    ₹{dailyData.totalIncome?.toLocaleString() || 0}
                  </span>
                </div>

                {dailyData.income?.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {dailyData.income.map((entry, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between"
                      >
                        <span className="text-gray-700">{entry.remark}</span>
                        <span className="font-medium text-green-600 ml-2">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic pl-5">
                    No income recorded
                  </p>
                )}
              </div>

              {/* Expense Section */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <h4 className="text-gray-800 font-medium">Expense</h4>
                  <span className="ml-auto font-semibold text-red-600">
                    ₹{dailyData.totalExpense?.toLocaleString() || 0}
                  </span>
                </div>

                {dailyData.expense?.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {dailyData.expense.map((entry, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between"
                      >
                        <span className="text-gray-700">{entry.remark}</span>
                        <span className="font-medium text-red-600 ml-2">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic pl-5">
                    No expenses recorded
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-gray-700">Net Total</span>
                <span
                  className={
                    (dailyData.totalIncome || 0) -
                      (dailyData.totalExpense || 0) >=
                    0
                      ? "text-lg font-bold text-green-600"
                      : "text-lg font-bold text-red-600"
                  }
                >
                  ₹
                  {(
                    (dailyData.totalIncome || 0) - (dailyData.totalExpense || 0)
                  ).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setShowDayPopup(false)}
                className="w-full py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                <span className="text-gray-800">{selectedCategory}</span>
                <span
                  className={
                    entryType === "income"
                      ? "text-green-600 ml-2"
                      : "text-red-600 ml-2"
                  }
                >
                  ({entryType === "income" ? "Income" : "Expense"})
                </span>
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-80 overflow-y-auto">
              {popupData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <AlertCircle size={40} />
                  <p className="mt-2">No records found for this category.</p>
                </div>
              ) : (
                <div>
                  {/* Group by date and render each date section */}
                  {Object.entries(
                    popupData.reduce((acc, item) => {
                      if (!acc[item.date]) {
                        acc[item.date] = [];
                      }
                      acc[item.date].push(item);
                      return acc;
                    }, {})
                  )
                    .sort(
                      ([dateA], [dateB]) => new Date(dateB) - new Date(dateA)
                    )
                    .map(([date, items]) => (
                      <div key={date} className="mb-6">
                        <div className="flex items-center mb-2">
                          <Calendar size={16} className="text-gray-600 mr-2" />
                          <h4 className="font-medium text-gray-700">{date}</h4>
                        </div>
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li
                              key={idx}
                              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">
                                  {item.remark || "No description"}
                                </span>
                                <span
                                  className={
                                    entryType === "income"
                                      ? "font-medium text-green-600"
                                      : "font-medium text-red-600"
                                  }
                                >
                                  ₹{item.amount.toLocaleString()}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-right text-sm font-medium text-gray-600">
                          Day total: ₹
                          {items
                            .reduce((sum, item) => sum + item.amount, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-gray-700">Total</span>
                <span
                  className={
                    entryType === "income"
                      ? "text-lg font-bold text-green-600"
                      : "text-lg font-bold text-red-600"
                  }
                >
                  ₹
                  {popupData
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Simple Toast */}
      {toast.show && (
        <div
          className={`fixed top-4 left-0 right-0 mx-auto w-64 py-3 px-4 rounded-lg shadow-lg text-white text-center ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
