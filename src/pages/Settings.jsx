import React, { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

// Import individual settings pages (kept from original)
import UserProfile from "./settings/Profile";
import InitialBankBalance from "./settings/InitialBB";
import DayRecordChecker from "./settings/Dailydata";
import CategoryRecords from "./settings/Categories";
import LogoutConfirm from "./settings/Logout";
import Monthly from "./settings/Monthly";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Extract current path to highlight active tab
    const path = location.pathname.split("/").pop();
    if (path && path !== "settings") {
      setActiveTab(path);
    }

    // Auth check (kept from original)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate, location]);

  const settingsOptions = [
    {
      name: "Profile",
      path: "profile",
      icon: "account_circle",
      description: "Personal information and account settings",
    },
    {
      name: "Initial Balance",
      path: "initial-balance",
      icon: "account_balance",
      description: "Set your starting account balance",
    },
    
    {
      name: "Daily Records",
      path: "daily-records",
      icon: "calendar_today", // or "view_list"
      description: "Manage your daily transaction records",
    },

    {
      name: "Categories",
      path: "categories",
      icon: "category",
      description: "Customize expense and income categories",
    },
    {
      name: "Monthly Chart",
      path: "monthly_data",
      icon: "bar_chart", // or "insert_chart"
      description: "View monthly income vs expense chart",
    },
    {
      name: "Download",
      path: "download",
      icon: "download",
      description: "Download your financial data",
    },
    {
      name: "Logout",
      path: "logout",
      icon: "logout",
      description: "Sign out from your account",
      danger: true,
    },
  ];

  const handleOptionClick = (path) => {
    setActiveTab(path);
    navigate(`/settings/${path}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Google-style top app bar with slight elevation */}
      <header className="bg-white py-3 px-4 md:px-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center m-2">
          <span className="material-icons-outlined mr-1 text-black text-3xl">
            settings
          </span>
          <h1 className="text-3xl font-light text-gray-800">Settings</h1>
        </div>
      </header>

      {/* Content container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Settings menu */}
          <div className="divide-y divide-gray-100">
            {settingsOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleOptionClick(option.path)}
                className={`w-full text-left flex items-center px-6 py-4 hover:bg-gray-50 focus:outline-none transition-colors ${
                  activeTab === option.path ? "bg-blue-50" : ""
                }`}
              >
                <span
                  className={`material-icons-outlined mr-4 text-xl ${
                    option.danger
                      ? "text-red-600"
                      : activeTab === option.path
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {option.icon}
                </span>

                <div className="flex-1">
                  <span
                    className={`text-base font-medium ${
                      option.danger ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {option.name}
                  </span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {option.description}
                  </p>
                </div>

                <span className="material-icons-outlined text-gray-400">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer with additional links - optional */}
        <div className="mt-8 text-center text-sm text-gray-500 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <p className="hover:text-blue-600 cursor-pointer">Help</p>
          <p className="hover:text-blue-600 cursor-pointer">Privacy Policy</p>
          <p className="hover:text-blue-600 cursor-pointer">Terms of Service</p>
        </div>
      </div>

      {/* Safe area spacing */}
      <div className="pb-6 md:pb-8" />
    </div>
  );
}
