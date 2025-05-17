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
    <div className="max-w-xl mx-auto w-full m-10">
      {/* App Bar - Google Material Design 3 style */}
      <header className="bg-white sticky top-0 z-20 h-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center h-full px-4">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-normal text-gray-800">
              Category Records
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content with Material Design Card */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Card header with icon */}
          <div className="bg-blue-50 px-6 py-5 border-b border-gray-100 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <span className="material-icons-outlined text-blue-600">
                account_balance
              </span>
            </div>
            <h2 className="text-lg font-medium text-gray-800">
              Initial Bank Balance
            </h2>
          </div>

          {/* Content area with proper padding */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                {/* Google-style circular loading spinner */}
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin mb-4"></div>
                <span className="text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Google Material Design 3 input field */}
                <div className="relative pt-6">
                  <label className="absolute top-0 left-0 text-xs font-medium text-blue-600 tracking-wide">
                    INITIAL AMOUNT
                  </label>
                  <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors pb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                      <span className="material-icons-outlined text-gray-500">
                        currency_rupee
                      </span>
                    </div>
                    <input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="w-full py-2 text-gray-700 bg-transparent outline-none text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="h-0.5 w-0 bg-blue-500 group-focus-within:w-full transition-all duration-300"></div>
                </div>

                {/* Buttons with Google-style layout */}
                <div className="flex justify-end items-center space-x-3 pt-4">
                  {/* Cancel button - Google style text button */}
                  <button className="py-2.5 px-6 text-blue-600 font-medium text-sm rounded-full hover:bg-blue-50 transition-colors">
                    Cancel
                  </button>

                  {/* Save button - Google style filled button */}
                  <button
                    onClick={saveInitialBalance}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-8 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Google Material Design 3 toast notification */}
        {toast.show && (
          <div
            className={`fixed bottom-6 left-0 right-0 mx-auto max-w-sm py-3 px-5 rounded-full shadow-lg text-white text-sm flex items-center justify-center z-50 transition-all duration-300 ${
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
    </div>
  );
}
