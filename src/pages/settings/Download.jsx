import React, { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Downloads() {
  const [exportMonth, setExportMonth] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleExport = async () => {
    const user = auth.currentUser;
    if (!user || !exportMonth) {
      setError("Please select a month");
      return;
    }

    const snapshot = await getDocs(
      collection(db, "users", user.uid, "records")
    );
    const rows = [["Date", "Income", "Expense"]];
    let found = false;

    snapshot.forEach((doc) => {
      const [year, month] = doc.id.split("-");
      const data = doc.data();

      if (`${year}-${month}` === exportMonth) {
        found = true;
        rows.push([doc.id, data.totalIncome || 0, data.totalExpense || 0]);
      }
    });

    if (!found) {
      setError("No records found for this month");
      return;
    }

    // Convert to CSV and download
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `finance-${exportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 p-6"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      {/* App Bar */}
      <div className="bg-white shadow-sm p-4 mb-6 flex items-center">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center text-gray-700 hover:text-blue-500 transition-colors focus:outline-none"
        >
          <ArrowLeft style={{ fontSize: 24 }} className="mr-2" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Header */}
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">
        Download Monthly Data Records
      </h1>

      {/* Card */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-5">
          <label className="block text-gray-700 mb-1 font-medium">
            Select Month
          </label>
          <input
            type="month"
            value={exportMonth}
            onChange={(e) => {
              setExportMonth(e.target.value);
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={!exportMonth}
          className={`w-full py-2 rounded text-white transition-colors flex items-center justify-center space-x-2 
    ${
      exportMonth
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-blue-400 cursor-not-allowed"
    }`}
        >
          <Download />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

export default Downloads;
