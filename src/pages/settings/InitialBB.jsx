import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function InitialBankBalance() {
  const [initialBalance, setInitialBalance] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch initial balance on component mount
  useEffect(() => {
    const fetchInitialBalance = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const bankRef = doc(db, "users", user.uid, "settings", "bank");
        const bankSnap = await getDoc(bankRef);

        if (bankSnap.exists()) {
          setInitialBalance(bankSnap.data().initialBalance || "");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching initial balance:", error);
        setLoading(false);
      }
    };

    fetchInitialBalance();
  }, []);

  const saveInitialBalance = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("You must be logged in to save settings", "error");
      return;
    }

    try {
      const bankRef = doc(db, "users", user.uid, "settings", "bank");
      await setDoc(bankRef, { initialBalance: Number(initialBalance) });

      showToast("Initial balance saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save balance:", error);
      showToast("Failed to save balance. Please try again.", "error");
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  return (
    <div className="max-w-xl mx-auto w-full">
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
              <h1 className="text-xl font-normal ml-3 text-gray-800">
                Category Records
              </h1>
            </div>
          </div>
        </div>
      </header>
      {/* Card with Google-style elevation and rounded corners */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        {/* Header with Google-style typography */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-normal text-gray-800 flex items-center">
            <span className="material-icons-outlined text-gray-500 mr-3 text-xl">
              account_balance
            </span>
            Initial Bank Balance
          </h2>
        </div>

        {/* Content area with proper padding */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              {/* Google-style loading spinner */}
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin"></div>
              <span className="ml-3 text-gray-600 text-sm font-medium">
                Loading...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Google-style input field */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors group pb-1">
                  <span className="material-icons-outlined text-gray-400 group-focus-within:text-blue-500 mr-2">
                    currency_rupee
                  </span>

                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full py-2 text-gray-700 bg-transparent outline-none text-lg"
                    placeholder="0.00"
                  />
                </div>
                <label className="absolute -top-6 left-0 text-xs font-medium text-blue-600">
                  INITIAL AMOUNT
                </label>
              </div>

              {/* Buttons with Google-style layout */}
              <div className="flex justify-end items-center space-x-3 pt-4">
                {/* Cancel button (optional) */}
                <button className="py-2 px-5 text-blue-600 font-medium text-sm rounded-full hover:bg-blue-50 transition-colors">
                  Cancel
                </button>

                {/* Save button with Google-style */}
                <button
                  onClick={saveInitialBalance}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google-style toast notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 left-0 right-0 mx-auto max-w-sm py-3 px-4 rounded-lg shadow-lg text-white text-sm flex items-center justify-center z-50 transition-all duration-300 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <span className="material-icons-outlined mr-2 text-sm">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
