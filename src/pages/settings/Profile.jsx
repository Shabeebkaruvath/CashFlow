import React, { useState, useEffect } from "react";
import { ArrowLeft  } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase"; // Make sure path matches your project structure
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
     const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
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

  return (
    <section aria-labelledby="profile-heading" className="max-w-xl mx-auto w-full">
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
              <h1 className="text-xl font-normal ml-3 text-gray-800">Category Records</h1>
            </div>
             
          </div>
        </div>
      </header>
      {/* Header with Google-style typography */}
      <div className="px-1 py-4 flex items-center">
        <span className="material-icons-outlined mr-3 text-blue-600">account_circle</span>
        <h2
          id="profile-heading"
          className="text-xl font-normal text-gray-800"
        >
          Profile Information
        </h2>
      </div>

      {/* Card with Google-style elevation and rounded corners */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            {/* Google-style loading spinner */}
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
            <p className="text-gray-600 text-sm">Loading user information</p>
          </div>
        ) : user ? (
          <div className="divide-y divide-gray-100">
            {/* User avatar header */}
            <div className="px-6 py-5 flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 
                 user.email ? user.email.charAt(0).toUpperCase() : 
                 <span className="material-icons-outlined">person</span>}
              </div>
              <div className="ml-4">
                <h3 className="text-lg text-gray-800 font-medium">{user.displayName || "User"}</h3>
                <p className="text-sm text-gray-500">{user.email || "No email provided"}</p>
              </div>
            </div>
            
            {/* Profile details with Google-style list */}
            <div className="px-6 py-4">
              {[
                { 
                  icon: "person",
                  label: "Full Name", 
                  value: user.displayName || "Not provided" 
                },
                { 
                  icon: "email",
                  label: "Email Address", 
                  value: user.email || "Not provided" 
                },
                { 
                  icon: "schedule",
                  label: "Last Login", 
                  value: user.metadata?.lastSignInTime
                    ? formatDateForProfile(user.metadata.lastSignInTime)
                    : "Not available"
                },
              ].map((item, index) => (
                <div key={item.label} className={`flex items-start py-3 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <span className="material-icons-outlined text-gray-400 mr-4 mt-0.5 text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-sm text-gray-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons footer with Google-style */}
             
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="material-icons-outlined text-gray-400 text-2xl">person_off</span>
            </div>
            <p className="text-gray-600 text-base mb-5">No user is currently logged in</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
              Sign In
            </button>
          </div>
        )}
      </div>
    </section>
  );
}