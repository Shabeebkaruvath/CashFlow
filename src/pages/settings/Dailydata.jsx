import React, { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  X,
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DayRecordChecker() {
  const [selectedDate, setSelectedDate] = useState("");
  const [dailyData, setDailyData] = useState(null);
  const [showDayPopup, setShowDayPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDayData = async () => {
    if (!selectedDate) {
      setError("Please select a date");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to view records");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ref = doc(db, "users", user.uid, "records", selectedDate);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setDailyData(snap.data());
        setShowDayPopup(true);
      } else {
        setError("No data found for this date");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Error fetching daily data:", err);
      setError("Failed to fetch data. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handlePrevDay = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split("T")[0];
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split("T")[0];
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-00 m-0">
      {/* App Bar */}

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
  <div className="max-w-6xl mx-auto">
    <div className="flex items-center justify-between px-4 h-14">
      <div className="flex items-center">
        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-full hover:bg-gray-100 flex items-center"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-normal ml-3 text-gray-800 flex items-center gap-2">
          <Calendar size={20} className="text-gray-600" />
          Day Records
        </h1>
      </div>
    </div>
  </div>
</header>


      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white w-64 h-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Finance App</h2>
            </div>
            <nav className="p-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={18} className="mr-3" />
                Back to Settings
              </button>
              {/* Add more menu items here */}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Date Selector Card */}
        <section className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h2 className="text-lg font-medium text-gray-800">
              Check Day's Record
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="flex items-center">
                <button
                  onClick={handlePrevDay}
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>

                <div className="relative flex-1 mx-2">
                  <div className="flex items-center justify-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <Calendar size={18} className="ml-3 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      className="flex-1 py-2 px-3 text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  aria-label="Next day"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center p-3 text-sm bg-red-50 border-l-4 border-red-500 text-red-700">
                <X size={16} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={fetchDayData}
              disabled={loading || !selectedDate}
              className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white font-medium transition ${
                !selectedDate
                  ? "bg-blue-200 cursor-not-allowed"
                  : loading
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                "View Record"
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Modal */}
      {showDayPopup && dailyData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDayPopup(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center">
                  <Calendar size={18} className="mr-2" />
                  {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setShowDayPopup(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex flex-col items-center">
                  <span className="text-sm text-green-700 mb-1">Income</span>
                  <span className="text-xl font-medium text-green-700">
                    ₹{dailyData.totalIncome?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col items-center">
                  <span className="text-sm text-red-700 mb-1">Expense</span>
                  <span className="text-xl font-medium text-red-700">
                    ₹{dailyData.totalExpense?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Net Balance */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                <span className="font-medium text-gray-700">Net Balance</span>
                <span
                  className={`text-lg font-medium ${
                    (dailyData.totalIncome || 0) -
                      (dailyData.totalExpense || 0) >=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ₹
                  {(
                    (dailyData.totalIncome || 0) - (dailyData.totalExpense || 0)
                  ).toLocaleString()}
                </span>
              </div>

              {/* Income List */}
              <div className="mb-6">
                <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Income Details
                </h4>
                {dailyData.income?.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {dailyData.income.map((entry, idx) => (
                      <li
                        key={idx}
                        className="py-3 flex justify-between items-center"
                      >
                        <span className="text-gray-700">{entry.remark}</span>
                        <span className="text-green-600 font-medium">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No income recorded
                  </p>
                )}
              </div>

              {/* Expense List */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Expense Details
                </h4>
                {dailyData.expense?.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {dailyData.expense.map((entry, idx) => (
                      <li
                        key={idx}
                        className="py-3 flex justify-between items-center"
                      >
                        <span className="text-gray-700">{entry.remark}</span>
                        <span className="text-red-600 font-medium">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No expenses recorded
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowDayPopup(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
