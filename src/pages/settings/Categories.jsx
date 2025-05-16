import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { X, AlertCircle, Calendar,ArrowLeft ,CheckCircle,Folder    } from "lucide-react";
import {
  getIncomeCategories,
  getExpenseCategories,
} from "../../utils/firestoreHelpers";
import { useNavigate } from "react-router-dom";

export default function CategoryRecords() {
  const [entryType, setEntryType] = useState("income");
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [popupData, setPopupData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const incomes = await getIncomeCategories();
        const expenses = await getExpenseCategories();

        setIncomeCategories(incomes);
        setExpenseCategories(expenses);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Watch for changes in selected category or entry type
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!selectedCategory) return;
      
      setCategoryLoading(true);
      try {
        const data = await getMonthlyEntriesByCategory(
          entryType,
          selectedCategory
        );
        setPopupData(data);
        setShowPopup(true);
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setCategoryLoading(false);
      }
    };

    if (selectedCategory) {
      fetchCategoryData();
    }
  }, [selectedCategory, entryType]);

  const getMonthlyEntriesByCategory = async (type = "income", categoryName) => {
    const user = auth.currentUser;
    if (!user) return [];

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const recordsRef = collection(db, "users", user.uid, "records");
    const querySnap = await getDocs(recordsRef);

    const results = [];
    querySnap.forEach((docSnap) => {
      const date = docSnap.id;
      if (date.startsWith(`${year}-${month}`)) {
        const data = docSnap.data();
        const entries = data[type] || [];
        entries.forEach((item) => {
          if (item.category === categoryName) {
            results.push({ date, remark: item.remark, amount: item.amount });
          }
        });
      }
    });

    return results;
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Data will be fetched via the useEffect
  };

  const switchEntryType = (type) => {
    setEntryType(type);
    setSelectedCategory(""); // Reset selected category when switching type
  };

  return (
 <div className="min-h-screen bg-gray-50 flex flex-col p-0 m-0">
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
          <Folder size={20} className="text-gray-600" />
          Category Records
        </h1>
      </div>
    </div>
  </div>
</header>


      <main className="flex-1 max-w-3xl mx-auto w-full">
        {/* Material Card */}
        <div className="bg-white rounded-lg shadow m-4">
          {/* Tabs */}
          <div className="pt-6 px-1">
            <div className="flex justify-center mx-4">
              <button
                onClick={() => switchEntryType("income")}
                className={`flex-1 py-2 px-4 text-center text-sm font-medium transition-colors relative ${
                  entryType === "income"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                INCOME
                {entryType === "income" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => switchEntryType("expense")}
                className={`flex-1 py-2 px-4 text-center text-sm font-medium transition-colors relative ${
                  entryType === "expense"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                EXPENSE
                {entryType === "expense" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-1">
                {(entryType === "income" ? incomeCategories : expenseCategories).map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-800">{category}</span>
                      {selectedCategory === category && (
                        <CheckCircle
                          size={20}
                          className="text-blue-600"
                        />
                      )}
                    </button>
                  )
                )}
                {(entryType === "income" ? incomeCategories : expenseCategories)
                  .length === 0 && (
                  <div className="py-6 text-center text-gray-500">
                    No {entryType} categories yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="px-4 py-3 border-t border-gray-100 text-center text-sm text-gray-500">
            Click on a category to view its records
          </div>
        </div>
      </main>

      {/* Category Data Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {selectedCategory} • {entryType === "income" ? "Income" : "Expense"}
                </h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {categoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : popupData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <AlertCircle size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600">No records found for this category</p>
                </div>
              ) : (
                <div>
                  {Object.entries(
                    popupData.reduce((acc, item) => {
                      if (!acc[item.date]) {
                        acc[item.date] = [];
                      }
                      acc[item.date].push(item);
                      return acc;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                    .map(([date, items]) => (
                      <div key={date} className="mb-5">
                        <div className="flex items-center mb-2">
                          <div className="bg-blue-50 p-1 rounded-full mr-2">
                            <Calendar size={16} className="text-blue-600" />
                          </div>
                          <h4 className="font-medium text-gray-800">
                            {new Date(date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                          </h4>
                        </div>
                        <div className="ml-7">
                          <ul className="space-y-2">
                            {items.map((item, idx) => (
                              <li
                                key={idx}
                                className="py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800">
                                    {item.remark || "No description"}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      entryType === "income"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    ₹{item.amount.toLocaleString()}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 text-right text-sm font-medium text-gray-600">
                            Day total: ₹
                            {items
                              .reduce((sum, item) => sum + item.amount, 0)
                              .toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            {popupData.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-gray-700">Total</span>
                  <span
                    className={`text-xl font-bold ${
                      entryType === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹
                    {popupData
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>




  );
}