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
 
      
<section aria-labelledby="profile-heading" className="max-w-xl mx-auto w-full m-10">
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
        <h2 id="profile-heading" className="text-xl font-normal text-gray-800">
          Profile
        </h2>
      </div>
    </div>
  </header>

  {/* Main Content with Material Design Card */}
  <div className="px-4 py-6">
    {loading ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center">
        {/* Google-style circular loading spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin mb-4"></div>
        <p className="text-gray-600">Loading profile information...</p>
      </div>
    ) : user ? (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* User header with large avatar */}
        <div className="bg-blue-50 px-6 py-8 flex flex-col items-center border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-medium mb-3">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 
             user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 className="text-xl text-gray-800 font-medium">{user.displayName || "User"}</h3>
          <p className="text-sm text-gray-500 mt-1">{user.email || "No email provided"}</p>
        </div>
        
        {/* Profile details with Google-style list */}
        <div className="py-2">
          {[
            { 
              icon: "person",
              label: "Name", 
              value: user.displayName || "Not provided" 
            },
            { 
              icon: "email",
              label: "Email", 
              value: user.email || "Not provided" 
            },
            { 
              icon: "schedule",
              label: "Last sign-in", 
              value: user.metadata?.lastSignInTime
                ? formatDateForProfile(user.metadata.lastSignInTime)
                : "Not available"
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center px-6 py-4 hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <span className="material-icons-outlined text-gray-600">{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.value}</p>
              </div>
              <span className="material-icons-outlined text-gray-400">chevron_right</span>
            </div>
          ))}
        </div>

        {/* Action button - Google style floating action button */}
        <div className="px-6 py-4 flex justify-center border-t border-gray-100">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-8 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
            Edit Profile
          </button>
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <span className="material-icons-outlined text-gray-400 text-3xl">person_off</span>
        </div>
        <p className="text-gray-700 text-lg mb-6">No user is currently signed in</p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
          Sign in
        </button>
      </div>
    )}
  </div>
</section>
   
  
  );
}