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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
        <h3 className="text-lg font-bold mb-2">Confirm Logout</h3>
        <p className="text-sm text-gray-600">Are you sure you want to logout?</p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
