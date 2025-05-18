import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import {
  X,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Save,
  PlusCircle,
  Folder,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  ChevronDown,
} from "lucide-react";
import {
  getIncomeCategories,
  getExpenseCategories,
  ensureCategoryExists,
  deleteIncome,
  deleteExpense,
  updateIncome,
  updateExpense,
} from "../../utils/firestoreHelpers";
import { useNavigate } from "react-router-dom";

export default function HistoricalData() {
  const [entryType, setEntryType] = useState("income");
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [showEntries, setShowEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    setSelectedDate(formattedToday);
  }, [formattedToday]);

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
        setErrorMessage("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchEntriesForDate();
    }
  }, [selectedDate, entryType]);

  const fetchEntriesForDate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const recordRef = doc(db, "users", user.uid, "records", selectedDate);
      const docSnap = await getDoc(recordRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const entriesArray =
          entryType === "income" ? data.income || [] : data.expense || [];
        setEntries(entriesArray);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowForm(true);
    setIsEditing(false);
    setEditingEntry(null);
    setAmount("");
    setRemark("");
    setErrorMessage("");
  };

  const switchEntryType = (type) => {
    setEntryType(type);
    setSelectedCategory("");
    setShowForm(false);
    setEditingEntry(null);
    setIsEditing(false);
    setErrorMessage("");
  };

  const addIncome = async (amount, category, remark) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      throw new Error("Invalid amount provided");
    }

    const now = new Date();
    const entryData = {
      category,
      amount: numericAmount,
      remark: remark || "",
      timestamp: now.getTime(),
    };

    try {
      await ensureCategoryExists("income", category);
      const recordRef = doc(db, "users", user.uid, "records", selectedDate);
      const docSnap = await getDoc(recordRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const currentTotalIncome = parseFloat(existingData.totalIncome) || 0;

        await updateDoc(recordRef, {
          income: arrayUnion(entryData),
          totalIncome: currentTotalIncome + numericAmount,
        });
      } else {
        await setDoc(recordRef, {
          income: [entryData],
          expense: [],
          totalIncome: numericAmount,
          totalExpense: 0,
        });
      }

      await fetchEntriesForDate();
      return true;
    } catch (error) {
      console.error("Error adding income:", error);
      throw error;
    }
  };

  const addExpense = async (amount, category, remark) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      throw new Error("Invalid amount provided");
    }

    const now = new Date();
    const entryData = {
      category,
      amount: numericAmount,
      remark: remark || "",
      timestamp: now.getTime(),
    };

    try {
      await ensureCategoryExists("expense", category);
      const recordRef = doc(db, "users", user.uid, "records", selectedDate);
      const docSnap = await getDoc(recordRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const currentTotalExpense = parseFloat(existingData.totalExpense) || 0;

        await updateDoc(recordRef, {
          expense: arrayUnion(entryData),
          totalExpense: currentTotalExpense + numericAmount,
        });
      } else {
        await setDoc(recordRef, {
          income: [],
          expense: [entryData],
          totalIncome: 0,
          totalExpense: numericAmount,
        });
      }

      await fetchEntriesForDate();
      return true;
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  };

  const saveHistoricalData = async () => {
    if (
      !selectedDate ||
      !selectedCategory ||
      !amount ||
      isNaN(parseFloat(amount))
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      if (isEditing && editingEntry) {
        // Handle editing
        const updatedData = {
          amount: parseFloat(amount),
          category: selectedCategory,
          remark: remark || "",
        };

        if (entryType === "income") {
          await updateIncome(editingEntry, updatedData);
        } else {
          await updateExpense(editingEntry, updatedData);
        }
      } else {
        // Handle adding new entry
        if (entryType === "income") {
          await addIncome(amount, selectedCategory, remark);
        } else {
          await addExpense(amount, selectedCategory, remark);
        }
      }

      setSuccess(true);
      setAmount("");
      setRemark("");
      setIsEditing(false);
      setEditingEntry(null);
      await fetchEntriesForDate();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving historical data:", error);
      setErrorMessage("Failed to save data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = (entry) => {
    setIsEditing(true);
    setEditingEntry(entry);
    setSelectedCategory(entry.category);
    setAmount(entry.amount.toString());
    setRemark(entry.remark || "");
    setShowForm(true);
    setErrorMessage("");
  };

  const handleDeleteEntry = async (entry) => {
    setIsDeleting(true);
    try {
      let success;
      if (entryType === "income") {
        success = await deleteIncome(entry);
      } else {
        success = await deleteExpense(entry);
      }

      if (success) {
        await fetchEntriesForDate();
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setErrorMessage("Failed to delete entry. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      setErrorMessage("Failed to delete entry. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/settings")}
                className="p-2 rounded-full hover:bg-gray-100 flex items-center"
                aria-label="Back"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-xl font-medium ml-3 text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Historical Data Entry
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Date Selector Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="p-5">
            <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Select Date
            </h2>
            <div className="flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setShowForm(false);
                  setEditingEntry(null);
                  setIsEditing(false);
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={formattedToday}
              />
            </div>
          </div>
        </div>

        {/* Material Card - Entry Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex justify-around">
              <button
                onClick={() => switchEntryType("income")}
                className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                  entryType === "income"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowUp
                    size={16}
                    className={
                      entryType === "income" ? "text-blue-600" : "text-gray-600"
                    }
                  />
                  INCOME
                </div>
                {entryType === "income" && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => switchEntryType("expense")}
                className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                  entryType === "expense"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowDown
                    size={16}
                    className={
                      entryType === "expense"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }
                  />
                  EXPENSE
                </div>
                {entryType === "expense" && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* Existing entries for the selected date */}
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                EXISTING {entryType.toUpperCase()} ENTRIES
              </h3>
              <button
                onClick={() => setShowEntries(!showEntries)}
                className="flex items-center gap-1 text-sm text-blue-600"
              >
                {showEntries ? "Hide" : "Show"}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    showEntries ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showEntries && (
              <div className="mb-6">
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : entries.length > 0 ? (
                  <div className="space-y-3">
                    {entries.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-800">
                              ₹{entry.amount.toFixed(2)}
                            </div>
                            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                              {entry.category}
                            </div>
                          </div>
                          {entry.remark && (
                            <div className="text-sm text-gray-500 mt-1">
                              {entry.remark}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No {entryType} entries for this date.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="p-5 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              SELECT CATEGORY TO ADD NEW ENTRY
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(entryType === "income"
                  ? incomeCategories
                  : expenseCategories
                ).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex flex-col items-center justify-center px-3 py-4 rounded-lg border transition-all ${
                      selectedCategory === category && !isEditing
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mb-2 ${
                        selectedCategory === category && !isEditing
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Folder
                        size={18}
                        className={
                          selectedCategory === category && !isEditing
                            ? "text-blue-600"
                            : "text-gray-600"
                        }
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 text-center">
                      {category}
                    </span>
                    {selectedCategory === category && !isEditing && (
                      <CheckCircle
                        size={16}
                        className="text-blue-600 absolute top-2 right-2"
                      />
                    )}
                  </button>
                ))}

                {(entryType === "income" ? incomeCategories : expenseCategories)
                  .length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500">
                    No {entryType} categories yet. Add some in Settings.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-20 overflow-hidden">
            <div className="p-5">
              <h2 className="text-lg font-medium text-gray-800 mb-5 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit size={18} className="text-blue-600" />
                    Edit {entryType === "income" ? "Income" : "Expense"}:{" "}
                    {selectedCategory}
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} className="text-blue-600" />
                    Add {entryType === "income" ? "Income" : "Expense"}:{" "}
                    {selectedCategory}
                  </>
                )}
              </h2>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="remark"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description (optional)
                  </label>
                  <input
                    id="remark"
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add a description"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-700">
                  <X size={16} className="text-red-500" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={saveHistoricalData}
                disabled={saving || !amount || isNaN(parseFloat(amount))}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium transition ${
                  saving || !amount || isNaN(parseFloat(amount))
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {isEditing ? "Update" : "Save"}{" "}
                    {entryType === "income" ? "Income" : "Expense"}
                  </>
                )}
              </button>

              {success && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600 py-3 px-3 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle size={18} />
                  <span>Successfully {isEditing ? "updated" : "saved"}!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
