import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase"; // Ensure this path is correct
import { ArrowLeft, MoreVertical, Search } from "lucide-react"; // Added MoreVertical and Search for a more Google-like header
import { useNavigate } from "react-router-dom";

function Monthly() {
  const [monthlyData, setMonthlyData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        // Optionally navigate to login or show a message
        return;
      }

      const monthlySummary = {};

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "records")
        );
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Assuming doc.id is in 'YYYY-MM-DD' format or just 'YYYY-MM'
          // Let's make it robust for 'YYYY-MM-DD' or 'YYYY-MM'
          const parts = doc.id.split("-");
          const year = parts[0];
          const month = parts[1];
          const key = `${year}-${month}`; // e.g., "2023-08"

          if (!monthlySummary[key]) {
            monthlySummary[key] = {
              month: key, // Store for sorting and display
              displayMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: 'numeric' }), // For user-friendly display
              income: 0,
              expense: 0
            };
          }

          monthlySummary[key].income += data.totalIncome || 0;
          monthlySummary[key].expense += data.totalExpense || 0;
        });

        const formatted = Object.values(monthlySummary).sort((a, b) =>
          a.month.localeCompare(b.month) // Sort by YYYY-MM string
        );

        setMonthlyData(formatted);
      } catch (error) {
        console.error("Error fetching monthly data:", error);
        // Handle error display to the user if necessary
      }
    };

    fetchMonthlyData();
  }, []);

  // Google-like color palette
  const googleBlue = "#1a73e8";
  const googleRed = "#ea4335";
  const googleTextPrimary = "#202124"; // Dark gray for primary text
  const googleTextSecondary = "#5f6368"; // Lighter gray for secondary text
  const googleBorderColor = "#dadce0"; // Light gray for borders/dividers
  const googleBackground = "#f8f9fa"; // Off-white background
  const googleCardBackground = "#ffffff";

  return (
    <div className={`min-h-screen bg-[${googleBackground}] flex flex-col`}>
      {/* Google-style App Bar */}
      <header className={`bg-[${googleCardBackground}] border-b border-[${googleBorderColor}] shadow-sm sticky top-0 z-10`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/settings")} // Ensure this route is correct
              className={`p-2 rounded-full hover:bg-gray-200 text-[${googleTextSecondary}] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${googleBlue}] mr-2`}
              aria-label="Back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className={`text-xl text-[${googleTextPrimary}] font-medium`}>
              Monthly Summary
            </h1>
          </div>
          
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-6 container mx-auto">
        <div className={`bg-[${googleCardBackground}] p-4 sm:p-6 rounded-lg border border-[${googleBorderColor}] shadow-md`}>
          <h2 className={`text-lg font-medium text-[${googleTextPrimary}] mb-1`}>
            Income vs. Expense
          </h2>
          <p className={`text-sm text-[${googleTextSecondary}] mb-6`}>
            Overview of your financial activity by month.
          </p>

          {monthlyData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10v11h6M3 10l6-6m0 0l6 6m-6-6v11m0-11h6m-6 6H3m0 0h6m6 6V10m0 5h6m0 0l-6-6m6 6l-6 6" />
                </svg>
                <p className={`text-md text-[${googleTextSecondary}]`}>No monthly data available yet.</p>
                <p className={`text-sm text-gray-400`}>Your recorded income and expenses will appear here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={monthlyData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }} // Adjusted margins for better fit
              >
                <XAxis
                  dataKey="displayMonth" // Use the user-friendly month name
                  tick={{ fontSize: 12, fill: googleTextSecondary }}
                  axisLine={{ stroke: googleBorderColor }}
                  tickLine={{ stroke: googleBorderColor }}
                  dy={10} // Offset tick labels down slightly
                />
                <YAxis
                  tick={{ fontSize: 12, fill: googleTextSecondary }}
                  axisLine={{ stroke: googleBorderColor }}
                  tickLine={{ stroke: googleBorderColor }}
                  tickFormatter={(value) =>
                    `$${new Intl.NumberFormat("en-US").format(value)}` // Assuming USD, adjust as needed
                  }
                  dx={-10} // Offset tick labels left slightly
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: googleCardBackground,
                    borderColor: googleBorderColor,
                    borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: googleTextPrimary }}
                  labelStyle={{ color: googleTextPrimary, fontWeight: "500", marginBottom: "4px" }}
                  formatter={(value, name) => [
                    new Intl.NumberFormat("en-US", { // Assuming USD
                      style: "currency",
                      currency: "USD",
                    }).format(value),
                    name === "income" ? "Income" : "Expense",
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend
                  iconSize={12}
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "13px",
                    color: googleTextSecondary,
                  }}
                  formatter={(value) => <span style={{color: googleTextSecondary}}>{value}</span>}
                />
                <Bar
                  dataKey="income"
                  fill={googleBlue} // Google Blue
                  name="Income"
                  radius={[4, 4, 0, 0]} // Rounded top corners for bars
                  barSize={25}
                />
                <Bar
                  dataKey="expense"
                  fill={googleRed} // Google Red
                  name="Expense"
                  radius={[4, 4, 0, 0]} // Rounded top corners for bars
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

         
      </main>

      
    </div>
  );
}

export default Monthly;