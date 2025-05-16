import React from "react";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function LogoutConfirm({ onCancel }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
      {/* Google-style dialog */}
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full animate-fadeIn overflow-hidden">
        {/* Dialog header with icon */}
        <div className="p-6 pb-0">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <span className="material-icons-outlined text-red-600">logout</span>
            </div>
          </div>
          <h3 className="text-lg text-center text-gray-800 font-medium">Sign out</h3>
          <p className="text-center text-gray-600 mt-2 mb-4">
            Are you sure you want to sign out of your account?
          </p>
        </div>
        
        {/* Dialog actions - Google places these at the bottom right */}
        <div className="px-4 py-3 flex justify-end space-x-2 border-t border-gray-100">
          {/* Cancel button - text only for secondary action */}
          <button
            onClick={onCancel}
            className="py-2 px-5 text-blue-600 font-medium text-sm rounded-full hover:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          
          {/* Confirm button - filled for primary action */}
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}