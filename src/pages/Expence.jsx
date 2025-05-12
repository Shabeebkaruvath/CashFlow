import React, { useState, useEffect } from "react";
import {
  addExpense,
  getTodayExpenses,
  addExpenseCategory,
  getExpenseCategories,
  updateExpense,
  deleteExpense,
} from "../utils/firestoreHelpers";
import { auth } from "../firebase/firebase";

function Expenses() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [formData, setFormData] = useState({ amount: "", remark: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [user, setUser] = useState(null);

  // New state for edit functionality
  const [editingExpense, setEditingExpense] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(null);

  // Load categories and expenses when the user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await loadCategoriesAndExpenses();
      } else {
        setUser(null);
        setCategories([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load categories and expenses from Firestore
  const loadCategoriesAndExpenses = async () => {
    try {
      const [savedCategories, todayExpenses] = await Promise.all([
        getExpenseCategories(),
        getTodayExpenses(),
      ]);

      const merged = savedCategories.map((categoryName) => {
        const match = todayExpenses.find((item) => item.name === categoryName);
        return {
          name: categoryName,
          expenses: match ? match.expenses : [],
        };
      });

      setCategories(merged);
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle adding a new expense category
  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      setMessage({ text: "Category name cannot be empty", type: "error" });
      return;
    }
    if (
      categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())
    ) {
      setMessage({ text: "Category already exists", type: "error" });
      return;
    }

    try {
      await addExpenseCategory(name);
      setCategories([...categories, { name, expenses: [] }]);
      setNewCategory("");
      setMessage({ text: "Category added successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving category:", err);
      setMessage({ text: "Error saving category", type: "error" });
    }
  };

  // Handle adding an expense to a category
  const handleAddExpense = async (index) => {
    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: "Please enter a valid amount", type: "error" });
      return;
    }

    if (!user) {
      setMessage({ text: "Please log in to save expense", type: "error" });
      return;
    }

    const categoryName = categories[index].name;
    setIsSubmitting(true);

    try {
      await addExpense(amount, categoryName, formData.remark);

      // Update local state to show the new expense
      const updated = [...categories];
      updated[index].expenses.push({
        amount,
        remark: formData.remark,
        timestamp: Date.now(), // Use numeric timestamp to match Firestore
        category: categoryName,
      });
      setCategories(updated);
      setFormData({ amount: "", remark: "" });
      setActiveCategoryIndex(null);
      setMessage({ text: "Expense added successfully!", type: "success" });
    } catch (error) {
      console.error("Failed to add expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing an expense
  const handleEditExpense = async () => {
    if (!editingExpense) return;

    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: "Please enter a valid amount", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the original expense to edit
      const categoryIndex = categories.findIndex(
        (cat) => cat.name === editingExpense.categoryName
      );
      
      if (categoryIndex === -1) {
        throw new Error("Category not found");
      }
      
      const originalExpense = categories[categoryIndex].expenses[editingExpense.index];
      
      // Create updated expense data
      const updatedExpenseData = {
        amount,
        remark: formData.remark,
      };

      // Update in Firestore with new function signature
      const success = await updateExpense(originalExpense, updatedExpenseData);

      if (success) {
        // Update local state
        const updatedCategories = [...categories];
        updatedCategories[categoryIndex].expenses[editingExpense.index] = {
          ...originalExpense,
          amount,
          remark: formData.remark,
        };

        setCategories(updatedCategories);
        setEditingExpense(null);
        setFormData({ amount: "", remark: "" });
        setMessage({ text: "Expense updated successfully!", type: "success" });
      } else {
        throw new Error("Failed to update expense in database");
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpense) return;

    setIsSubmitting(true);

    try {
      const categoryIndex = categories.findIndex(
        (cat) => cat.name === confirmDeleteExpense.categoryName
      );
      
      if (categoryIndex === -1) {
        throw new Error("Category not found");
      }
      
      // Get the expense to delete
      const expenseToDelete = categories[categoryIndex].expenses[confirmDeleteExpense.index];
      
      // Delete from Firestore with new function signature
      const success = await deleteExpense(expenseToDelete);

      if (success) {
        // Update local state
        const updatedCategories = [...categories];
        updatedCategories[categoryIndex].expenses.splice(
          confirmDeleteExpense.index,
          1
        );

        setCategories(updatedCategories);
        setConfirmDeleteExpense(null);
        setMessage({ text: "Expense deleted successfully!", type: "success" });
      } else {
        throw new Error("Failed to delete expense from database");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the total for each category
  const getCategoryTotal = (expenses) =>
    expenses.reduce((sum, e) => sum + e.amount, 0);

  // Get the grand total of all expenses
  const grandTotal = categories.reduce(
    (total, cat) => total + getCategoryTotal(cat.expenses),
    0
  );

  // Open edit modal for a specific expense
  const openEditModal = (categoryName, expenseIndex) => {
    const categoryData = categories.find((cat) => cat.name === categoryName);
    if (!categoryData) return;
    
    const expense = categoryData.expenses[expenseIndex];
    if (!expense) return;

    setEditingExpense({
      categoryName,
      index: expenseIndex,
      timestamp: expense.timestamp,
    });

    setFormData({
      amount: expense.amount.toString(),
      remark: expense.remark || "",
    });

    // Close any open menus
    setOpenMenuIndex(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {message.text && (
        <div
          className={`p-3 rounded-lg text-center transition-opacity duration-300 ${
            message.type === "success"
              ? "bg-green-100 text-[#7295f6]"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-700 text-center">
          Please log in to save your expenses to the database.
        </div>
      )}

      {user && (
        <>
          <h2
            className="text-3xl md:text-4xl font-bold text-center"
            style={{ color: "#7295f6" }}
          >
            Total Expense: ₹{grandTotal.toFixed(2)}
          </h2>

          {/* Add Category */}
          <div className="bg-white p-4 shadow-md rounded-2xl space-y-3">
            <h3 className="text-xl font-semibold text-gray-700">
              Add New Category
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="E.g., Food, Utilities"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-[#7295f6] focus:border-transparent"
              />
              <button
                onClick={handleAddCategory}
                style={{ backgroundColor: "#7295f6" }}
                className="text-white px-4 py-2 rounded-lg text-base font-medium transition-colors hover:opacity-90"
              >
                Add Category
              </button>
            </div>
          </div>

          {categories.length === 0 && (
            <div
              className="bg-green-50 p-4 rounded-lg text-center"
              style={{ color: "#7295f6" }}
            >
              No categories yet. Add your first category above!
            </div>
          )}

          {/* Category Cards */}
          {categories.map((category, categoryIndex) => (
            <div
              key={category.name}
              className="bg-white p-4 shadow-md rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {category.name}
                </h3>
                <span
                  className="font-bold text-2xl"
                  style={{ color: "#7295f6" }}
                >
                  ₹{getCategoryTotal(category.expenses).toFixed(2)}
                </span>
              </div>

              {category.expenses.length === 0 ? (
                <p className="text-gray-500 italic">
                  No expenses in this category yet.
                </p>
              ) : (
                <ul className="text-base text-gray-700 space-y-2">
                  {category.expenses.map((expense, expenseIndex) => (
                    <li
                    key={expenseIndex}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 relative"
                  >
                    {/* Left side: Remark */}
                    <span>{expense.remark || "No remark"}</span>
                  
                    {/* Right side: Amount and Options button */}
                    <div className="flex items-center space-x-2">
                      <span
                        className="font-medium"
                        style={{ color: "#7295f6" }}
                      >
                        ₹
                        {expense.amount && !isNaN(expense.amount)
                          ? Number(expense.amount).toFixed(2)
                          : "0.00"}
                      </span>
                  
                      <button
                        onClick={() =>
                          setOpenMenuIndex(
                            openMenuIndex === `${categoryIndex}-${expenseIndex}`
                              ? null
                              : `${categoryIndex}-${expenseIndex}`
                          )
                        }
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                        aria-label="Options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                  
                      {openMenuIndex === `${categoryIndex}-${expenseIndex}` && (
                        <div className="absolute right-0 mt-2 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                          <div
                            className="py-1"
                            role="menu"
                            aria-orientation="vertical"
                          >
                            <button
                              onClick={() => {
                                openEditModal(category.name, expenseIndex);
                                setOpenMenuIndex(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              role="menuitem"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDeleteExpense({
                                  categoryName: category.name,
                                  index: expenseIndex,
                                });
                                setOpenMenuIndex(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800"
                              role="menuitem"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                  
                  ))}
                </ul>
              )}

              <button
                onClick={() => setActiveCategoryIndex(categoryIndex)}
                className="text-base font-medium flex items-center space-x-1 mt-2 underline"
                style={{ color: "#7295f6" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ color: "#7295f6" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Add Expense</span>
              </button>

              {/* Add Expense Modal */}
              {activeCategoryIndex === categoryIndex && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                  <div className="relative bg-white p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4">
                    {/* Three dot icon positioned at the top right */}
                    <button
                      onClick={() => setActiveCategoryIndex(null)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label="Close modal"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <h4 className="text-xl font-semibold text-gray-800">
                      Add Expense to {category.name}
                    </h4>
                    <input
                      type="number"
                      placeholder="Amount (e.g., 100.00)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-[#7295f6] focus:border-transparent"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="text"
                      placeholder="Remark (e.g., Lunch, Transportation)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-[#7295f6] focus:border-transparent"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setActiveCategoryIndex(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddExpense(categoryIndex)}
                        style={{ backgroundColor: "#7295f6" }}
                        className={`px-4 py-2 text-white rounded-lg text-base font-medium transition-colors ${
                          isSubmitting
                            ? "cursor-not-allowed opacity-75"
                            : "hover:opacity-90"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Adding..." : "Add Expense"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Expense Modal */}
              {editingExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">
                      Edit Expense - {editingExpense.categoryName}
                    </h4>
                    <input
                      type="number"
                      placeholder="Amount (e.g., 100.00)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-[#7295f6] focus:border-transparent"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="text"
                      placeholder="Remark (e.g., Lunch, Transportation)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-[#7295f6] focus:border-transparent"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingExpense(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditExpense}
                        style={{ backgroundColor: "#7295f6" }}
                        className={`px-4 py-2 text-white rounded-lg text-base font-medium transition-colors ${
                          isSubmitting
                            ? "cursor-not-allowed opacity-75"
                            : "hover:opacity-90"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Updating..." : "Update Expense"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {confirmDeleteExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">
                      Confirm Deletion
                    </h4>
                    <p className="text-gray-600">
                      Are you sure you want to delete this expense? This action
                      cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setConfirmDeleteExpense(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteExpense}
                        className={`px-4 py-2 ${
                          isSubmitting
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        } text-white rounded-lg text-base font-medium transition-colors`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Expenses;