import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import {
  addIncome,
  getTodayIncomes,
  addIncomeCategory,
  getIncomeCategories,
  updateIncome,
  deleteIncome,
  updateIncomeCategory,
  deleteIncomeCategory,
} from "../utils/firestoreHelpers"; // Need to add these two functions in your firestoreHelpers

function Income() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [formData, setFormData] = useState({ amount: "", remark: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editItemInfo, setEditItemInfo] = useState(null); // {categoryIndex, incomeIndex}
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemInfo, setDeleteItemInfo] = useState(null); // {categoryIndex, incomeIndex}
  const [editCategoryMode, setEditCategoryMode] = useState(false);
  const [editCategoryIndex, setEditCategoryIndex] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [deleteCategoryIndex, setDeleteCategoryIndex] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadCategoriesAndIncomes();
      } else {
        setUser(null);
        setCategories([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCategoriesAndIncomes = async () => {
    if (!auth.currentUser) return; // Ensure user is available for firestoreHelpers
    try {
      const [savedCategories, todayIncomesData] = await Promise.all([
        getIncomeCategories(),
        getTodayIncomes(),
      ]);

      const merged = savedCategories.map((categoryName) => {
        const match = todayIncomesData.find(
          (item) => item.name === categoryName
        );
        return {
          name: categoryName,
          incomes: match
            ? match.incomes.map((inc) => ({
                ...inc,
                amount: Number(inc.amount),
              }))
            : [], // Ensure amount is number
        };
      });

      setCategories(merged);
    } catch (err) {
      console.error("Error loading data:", err);
      setMessage({ text: "Failed to load data.", type: "error" });
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      await addIncomeCategory(name);
      // Optimistically update UI, or call loadCategoriesAndIncomes()
      setCategories([...categories, { name, incomes: [] }]);
      setNewCategory("");
      setMessage({ text: "Category added successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving category:", err);
      setMessage({ text: "Error saving category", type: "error" });
    }
  };

  const handleEditCategory = async () => {
    if (editCategoryIndex === null) return;
    
    const newName = editCategoryName.trim();
    const oldName = categories[editCategoryIndex].name;
    
    if (!newName) {
      setMessage({ text: "Category name cannot be empty", type: "error" });
      return;
    }
    
    if (newName === oldName) {
      setEditCategoryMode(false);
      setEditCategoryIndex(null);
      setEditCategoryName("");
      return;
    }
    
    if (categories.some((cat, index) => 
      index !== editCategoryIndex && cat.name.toLowerCase() === newName.toLowerCase()
    )) {
      setMessage({ text: "Category name already exists", type: "error" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the updateIncomeCategory function from firestoreHelpers
      await updateIncomeCategory(oldName, newName);
      
      // Update local state
      const updatedCategories = [...categories];
      updatedCategories[editCategoryIndex] = {
        ...updatedCategories[editCategoryIndex],
        name: newName
      };
      
      setCategories(updatedCategories);
      setEditCategoryMode(false);
      setEditCategoryIndex(null);
      setEditCategoryName("");
      setMessage({ text: "Category updated successfully!", type: "success" });
    } catch (err) {
      console.error("Error updating category:", err);
      setMessage({ text: "Error updating category", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteCategoryIndex === null) return;
    
    const categoryName = categories[deleteCategoryIndex].name;
    setIsSubmitting(true);
    
    try {
      // Call the deleteIncomeCategory function from firestoreHelpers
      await deleteIncomeCategory(categoryName);
      
      // Update local state
      const updatedCategories = [...categories];
      updatedCategories.splice(deleteCategoryIndex, 1);
      
      setCategories(updatedCategories);
      setShowCategoryDeleteConfirm(false);
      setDeleteCategoryIndex(null);
      setMessage({ text: "Category deleted successfully!", type: "success" });
    } catch (err) {
      console.error("Error deleting category:", err);
      setMessage({ text: "Error deleting category", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCategory = (index) => {
    setEditCategoryIndex(index);
    setEditCategoryName(categories[index].name);
    setEditCategoryMode(true);
  };

  const confirmDeleteCategory = (index) => {
    setDeleteCategoryIndex(index);
    setShowCategoryDeleteConfirm(true);
  };

  const cancelEditCategory = () => {
    setEditCategoryMode(false);
    setEditCategoryIndex(null);
    setEditCategoryName("");
  };

  const handleAddIncome = async (categoryIndex) => {
    const numericAmount = parseFloat(formData.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({
        text: "Please enter a valid positive amount",
        type: "error",
      });
      return;
    }

    if (!user) {
      setMessage({ text: "Please log in to save income", type: "error" });
      return;
    }

    const categoryName = categories[categoryIndex].name;
    setIsSubmitting(true);

    const newIncomeData = {
      amount: numericAmount,
      category: categoryName, // Firestore helper uses this
      remark: formData.remark,
      timestamp: Date.now(), // Use numeric timestamp
    };

    try {
      // The addIncome helper from firestoreHelpers will handle adding to DB
      // and ensuring category exists.
      await addIncome(numericAmount, categoryName, formData.remark);

      // Update local state optimistically or re-fetch
      const updatedCategories = [...categories];
      const categoryToUpdate = { ...updatedCategories[categoryIndex] };
      categoryToUpdate.incomes = [...categoryToUpdate.incomes, newIncomeData]; // Add the full object with numeric timestamp
      updatedCategories[categoryIndex] = categoryToUpdate;

      setCategories(updatedCategories);
      setFormData({ amount: "", remark: "" });
      setActiveCategoryIndex(null); // Close modal
      setMessage({ text: "Income added successfully!", type: "success" });
    } catch (error) {
      console.error("Failed to add income:", error);
      setMessage({
        text: `Error adding income: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncome = async () => {
    if (!editItemInfo) return;

    const { categoryIndex, incomeIndex } = editItemInfo;
    const numericAmount = parseFloat(formData.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({
        text: "Please enter a valid positive amount",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    const originalIncome = categories[categoryIndex].incomes[incomeIndex];
    const updatedIncomeData = {
      // Provide all fields that can be updated.
      // The helper merges this with the original, so only changed fields are needed.
      // Crucially, amount must be a number.
      amount: numericAmount,
      remark: formData.remark,
      category: originalIncome.category, // Assuming category doesn't change here, or handle category change UI
      // timestamp is usually not updated, original timestamp is preserved by helper if not provided
    };

    try {
      // Pass the original income object (for matching) and the new data
      const success = await updateIncome(originalIncome, updatedIncomeData);

      if (success) {
        // Update local state
        const updatedCategories = [...categories];
        const categoryToUpdate = { ...updatedCategories[categoryIndex] };
        const newIncomesArray = [...categoryToUpdate.incomes];
        newIncomesArray[incomeIndex] = {
          ...originalIncome, // Spread original to keep its timestamp and other unchanged fields
          ...updatedIncomeData, // Override with new data
        };
        categoryToUpdate.incomes = newIncomesArray;
        updatedCategories[categoryIndex] = categoryToUpdate;

        setCategories(updatedCategories);
        setEditMode(false);
        setEditItemInfo(null);
        setActiveCategoryIndex(null); // Close modal
        setFormData({ amount: "", remark: "" });
        setMessage({ text: "Income updated successfully!", type: "success" });
      } else {
        setMessage({
          text: "Failed to update income in database. Item not found or error.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to update income:", error);
      setMessage({
        text: `Error updating income: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async () => {
    if (!deleteItemInfo) return;

    const { categoryIndex, incomeIndex } = deleteItemInfo;
    setIsSubmitting(true);

    const incomeToDelete = categories[categoryIndex].incomes[incomeIndex];

    try {
      // Pass the full income object to be deleted
      const success = await deleteIncome(incomeToDelete);

      if (success) {
        // Update local state
        const updatedCategories = [...categories];
        const categoryToUpdate = { ...updatedCategories[categoryIndex] };
        const newIncomesArray = [...categoryToUpdate.incomes];
        newIncomesArray.splice(incomeIndex, 1); // Remove item
        categoryToUpdate.incomes = newIncomesArray;
        updatedCategories[categoryIndex] = categoryToUpdate;

        setCategories(updatedCategories);
        setShowDeleteConfirm(false);
        setDeleteItemInfo(null);
        setMessage({ text: "Income deleted successfully!", type: "success" });
      } else {
        setMessage({
          text: "Failed to delete income from database. Item not found or error.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to delete income:", error);
      setMessage({
        text: `Error deleting income: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditIncome = (categoryIndex, incomeIndex) => {
    const income = categories[categoryIndex].incomes[incomeIndex];
    if (!income) {
      console.error("Attempted to edit undefined income item.");
      setMessage({
        text: "Error: Could not load income item for editing.",
        type: "error",
      });
      return;
    }
    setFormData({
      amount: income.amount ? income.amount.toString() : "", // Handle if amount is somehow missing
      remark: income.remark || "",
    });
    setEditMode(true);
    setEditItemInfo({ categoryIndex, incomeIndex });
    setActiveCategoryIndex(categoryIndex); // Open modal for this category
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditItemInfo(null);
    setActiveCategoryIndex(null); // Close modal
    setFormData({ amount: "", remark: "" });
  };

  const confirmDelete = (categoryIndex, incomeIndex) => {
    setDeleteItemInfo({ categoryIndex, incomeIndex });
    setShowDeleteConfirm(true);
  };

  const getCategoryTotal = (incomes) => {
    if (!incomes) return 0;
    return incomes.reduce((sum, i) => {
      // Ensure 'i' and 'i.amount' are valid before adding
      const amount = i && i.amount ? Number(i.amount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const grandTotal = categories.reduce(
    (total, cat) => total + getCategoryTotal(cat.incomes),
    0
  );

  useEffect(() => {
  const handleClickOutside = (event) => {
    document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
      const wrapper = dropdown.closest(".relative.inline-block.text-left");

      if (!wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);


  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto m-20 mt-2">
      {message.text && (
        <div
          className={`p-3 rounded-lg text-center transition-opacity duration-300 ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-700 text-center">
          Please log in to manage your income.
        </div>
      )}

      {user && (
        <>
          <div className="flex flex-col items-center py-4">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Income
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <span className="material-icons-outlined text-green-600">
                  payments
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light  text-gray-800">
                ₹{grandTotal.toFixed(2)}
              </h2>
            </div>
            <div className="h-1 w-24 bg-green-500 rounded-full mt-3"></div>
          </div>

          {/* Add Category */}
          <div className="bg-white p-4 shadow-md rounded-2xl space-y-3">
            <h3 className="text-xl font-semibold text-gray-700">
              Add New Category
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="E.g., Salary, Freelance"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>

          {categories.length === 0 && user && (
            <div className="bg-green-50 p-4 rounded-lg text-center text-green-700">
              No income categories yet. Add your first category above to start
              tracking!
            </div>
          )}

          {/* Category Cards */}
          {categories.map((category, index) => (
            <div
              key={category.name + index}
              className="bg-white p-4 shadow-md rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {category.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-2xl text-green-500">
                    ₹{getCategoryTotal(category.incomes).toFixed(2)}
                  </span>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        document
                          .querySelectorAll(".dropdown-menu")
                          .forEach((el) => {
                            if (el.id !== `category-dropdown-${index}`) {
                              el.classList.add("hidden");
                            }
                          });
                        const currentDropdown = document.getElementById(
                          `category-dropdown-${index}`
                        );
                        if (currentDropdown)
                          currentDropdown.classList.toggle("hidden");
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                      aria-label="Category Options"
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
                    <div
                      id={`category-dropdown-${index}`}
                      className="dropdown-menu hidden absolute right-0 mt-2 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20" // Increased z-index
                    >
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentDropdown = document.getElementById(
                              `category-dropdown-${index}`
                            );
                            if (currentDropdown)
                              currentDropdown.classList.add("hidden");
                            startEditCategory(index);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentDropdown = document.getElementById(
                              `category-dropdown-${index}`
                            );
                            if (currentDropdown)
                              currentDropdown.classList.add("hidden");
                            confirmDeleteCategory(index);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800"
                          role="menuitem"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {category.incomes?.length === 0 ? (
                <p className="text-gray-500 italic">
                  No income recorded in this category yet.
                </p>
              ) : (
                <ul className="text-base text-gray-700 space-y-2">
                  {category.incomes.map((income, i) => (
                    <li
                      key={income.timestamp + "-" + i}
                      className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50"
                    >
                      {" "}
                      {/* Ensure income.timestamp is unique enough or use a better key */}
                      <span className="truncate max-w-[calc(100%-150px)]">
                        {income.remark || "N/A"}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-medium">
                          ₹
                          {income.amount && !isNaN(income.amount)
                            ? Number(income.amount).toFixed(2)
                            : "0.00"}
                        </span>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document
                                .querySelectorAll(".dropdown-menu")
                                .forEach((el) => {
                                  if (el.id !== `dropdown-${index}-${i}`) {
                                    el.classList.add("hidden");
                                  }
                                });
                              const currentDropdown = document.getElementById(
                                `dropdown-${index}-${i}`
                              );
                              if (currentDropdown)
                                currentDropdown.classList.toggle("hidden");
                            }}
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
                          <div
                            id={`dropdown-${index}-${i}`}
                            className="dropdown-menu hidden absolute right-0 mt-2 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20" // Increased z-index
                          >
                            <div
                              className="py-1"
                              role="menu"
                              aria-orientation="vertical"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentDropdown =
                                    document.getElementById(
                                      `dropdown-${index}-${i}`
                                    );
                                  if (currentDropdown)
                                    currentDropdown.classList.add("hidden");
                                  startEditIncome(index, i);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentDropdown =
                                    document.getElementById(
                                      `dropdown-${index}-${i}`
                                    );
                                  if (currentDropdown)
                                    currentDropdown.classList.add("hidden");
                                  confirmDelete(index, i);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800"
                                role="menuitem"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => {
                  setActiveCategoryIndex(index);
                  setEditMode(false); // Ensure it's add mode
                  setFormData({ amount: "", remark: "" }); // Clear form for new entry
                }}
                className="text-base text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 mt-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Add Income</span>
              </button>

              {/* Modal for Add/Edit Income */}
              {activeCategoryIndex === index && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">
                      {editMode
                        ? `Edit Income in ${category.name}`
                        : `Add Income to ${category.name}`}
                    </h4>
                    <input
                      type="number"
                      placeholder="Amount (e.g., 150.00)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="text"
                      placeholder="Remark (e.g., Monthly Salary)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={
                          editMode
                            ? cancelEdit
                            : () => setActiveCategoryIndex(null)
                        }
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={
                          editMode
                            ? handleUpdateIncome
                            : () => handleAddIncome(index)
                        }
                        className={`px-4 py-2 ${
                          isSubmitting
                            ? "bg-green-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white rounded-lg text-base font-medium transition-colors`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? editMode
                            ? "Updating..."
                            : "Adding..."
                          : editMode
                          ? "Update Income"
                          : "Add Income"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4">
            <h4 className="text-xl font-semibold text-gray-800">
              Confirm Deletion
            </h4>
            <p className="text-gray-600">
              Are you sure you want to delete this income entry? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIncome}
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

      {/* Edit Category Modal */}
      {editCategoryMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4">
            <h4 className="text-xl font-semibold text-gray-800">
              Edit Category
            </h4>
            <input
              type="text"
              placeholder="Category name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditCategory}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                className={`px-4 py-2 ${
                  isSubmitting
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } text-white rounded-lg text-base font-medium transition-colors`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {showCategoryDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4">
            <h4 className="text-xl font-semibold text-gray-800">
              Confirm Category Deletion
            </h4>
            <p className="text-gray-600">
              Are you sure you want to delete the "{categories[deleteCategoryIndex]?.name}" category? 
              This will remove all income entries in this category. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCategoryDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-base font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className={`px-4 py-2 ${
                  isSubmitting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white rounded-lg text-base font-medium transition-colors`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Income;