import React, { useState, useEffect } from 'react';
import {
  addExpense,
  getTodayExpenses,
  addExpenseCategory,
  getExpenseCategories,
  updateExpense,
  deleteExpense
} from '../utils/firestoreHelpers';
import { auth } from '../firebase/firebase';

function Expenses() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [formData, setFormData] = useState({ amount: '', remark: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
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
        getTodayExpenses()
      ]);

      const merged = savedCategories.map(categoryName => {
        const match = todayExpenses.find(item => item.name === categoryName);
        return {
          name: categoryName,
          expenses: match ? match.expenses : []
        };
      });

      setCategories(merged);
    } catch (err) {
      console.error('Error loading expenses:', err);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle adding a new expense category
  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      setMessage({ text: 'Category name cannot be empty', type: 'error' });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      setMessage({ text: 'Category already exists', type: 'error' });
      return;
    }

    try {
      await addExpenseCategory(name);
      setCategories([...categories, { name, expenses: [] }]);
      setNewCategory('');
      setMessage({ text: 'Category added successfully!', type: 'success' });
    } catch (err) {
      console.error('Error saving category:', err);
      setMessage({ text: 'Error saving category', type: 'error' });
    }
  };

  // Handle adding an expense to a category
  const handleAddExpense = async (index) => {
    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (!user) {
      setMessage({ text: 'Please log in to save expense', type: 'error' });
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
        timestamp: new Date().toISOString()
      });
      setCategories(updated);
      setFormData({ amount: '', remark: '' });
      setActiveCategoryIndex(null);
      setMessage({ text: 'Expense added successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to add expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing an expense
  const handleEditExpense = async () => {
    if (!editingExpense) return;

    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    try {
      // Update in Firestore
      await updateExpense(
        editingExpense.categoryName, 
        editingExpense.index, 
        amount, 
        formData.remark
      );

      // Update local state
      const updatedCategories = [...categories];
      const categoryIndex = updatedCategories.findIndex(
        cat => cat.name === editingExpense.categoryName
      );
      
      if (categoryIndex !== -1) {
        updatedCategories[categoryIndex].expenses[editingExpense.index] = {
          amount,
          remark: formData.remark,
          timestamp: editingExpense.timestamp // Keep original timestamp
        };
        
        setCategories(updatedCategories);
        setEditingExpense(null);
        setFormData({ amount: '', remark: '' });
        setMessage({ text: 'Expense updated successfully!', type: 'success' });
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpense) return;

    try {
      // Delete from Firestore
      await deleteExpense(
        confirmDeleteExpense.categoryName, 
        confirmDeleteExpense.index
      );

      // Update local state
      const updatedCategories = [...categories];
      const categoryIndex = updatedCategories.findIndex(
        cat => cat.name === confirmDeleteExpense.categoryName
      );
      
      if (categoryIndex !== -1) {
        updatedCategories[categoryIndex].expenses.splice(
          confirmDeleteExpense.index, 
          1
        );
        
        setCategories(updatedCategories);
        setConfirmDeleteExpense(null);
        setMessage({ text: 'Expense deleted successfully!', type: 'success' });
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
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
    const expense = categories
      .find(cat => cat.name === categoryName)
      .expenses[expenseIndex];
    
    setEditingExpense({
      categoryName,
      index: expenseIndex,
      timestamp: expense.timestamp
    });
    
    setFormData({
      amount: expense.amount.toString(),
      remark: expense.remark || ''
    });
    
    // Close any open menus
    setOpenMenuIndex(null);
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-3 rounded-lg text-center ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-700 text-center">
          Please log in to save your expenses to the database
        </div>
      )}

      {user && (
        <>
          <h2 className="text-4xl font-bold text-blue-600 text-center">
            Total Expense: ₹{grandTotal.toFixed(2)}
          </h2>

          <div className="bg-white p-4 shadow rounded-2xl space-y-3">
            <h3 className="text-xl font-semibold text-gray-700">Add Category</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-base"
              />
              <button
                onClick={handleAddCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded text-base"
              >
                Add
              </button>
            </div>
          </div>

          {categories.length === 0 && (
            <div className="bg-blue-50 p-4 rounded-lg text-center text-blue-700">
              No categories yet. Add your first category above!
            </div>
          )}

          {categories.map((category, categoryIndex) => (
            <div
              key={category.name}
              className="bg-white p-4 shadow rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-700">{category.name}</h3>
                <span className="font-bold text-2xl text-blue-500">
                  ₹{getCategoryTotal(category.expenses).toFixed(2)}
                </span>
              </div>

              {category.expenses.length === 0 ? (
                <p className="text-gray-500 italic">No expenses in this category yet</p>
              ) : (
                <ul className="text-base text-gray-600 space-y-1">
                  {category.expenses.map((e, expenseIndex) => (
                    <li 
                      key={expenseIndex} 
                      className="flex justify-between items-center relative"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button 
                            onClick={() => 
                              setOpenMenuIndex(
                                openMenuIndex === `${categoryIndex}-${expenseIndex}` 
                                  ? null 
                                  : `${categoryIndex}-${expenseIndex}`
                              )
                            }
                            className="text-gray-500 hover:text-gray-700"
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
                            <div className="absolute left-full top-0 ml-2 z-10 bg-white shadow-lg rounded-md border">
                              <button 
                                onClick={() => {
                                  openEditModal(category.name, expenseIndex);
                                  setOpenMenuIndex(null);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => {
                                  setConfirmDeleteExpense({
                                    categoryName: category.name,
                                    index: expenseIndex
                                  });
                                  setOpenMenuIndex(null);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <span>{e.remark || 'No remark'}</span>
                      </div>
                      <span>₹{e.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => setActiveCategoryIndex(categoryIndex)}
                className="text-base text-blue-600 font-medium underline"
              >
                + Add Expense
              </button>

              {/* Add Expense Modal */}
              {activeCategoryIndex === categoryIndex && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
                    <h4 className="text-xl font-semibold text-gray-700">
                      Add Expense - {category.name}
                    </h4>
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-full border rounded px-3 py-2 text-base"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Remark"
                      className="w-full border rounded px-3 py-2 text-base"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setActiveCategoryIndex(null)}
                        className="px-3 py-1 bg-gray-200 rounded text-base"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddExpense(categoryIndex)}
                        className={`px-3 py-1 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'} text-white rounded text-base`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Expense Modal */}
              {editingExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
                    <h4 className="text-xl font-semibold text-gray-700">
                      Edit Expense - {editingExpense.categoryName}
                    </h4>
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-full border rounded px-3 py-2 text-base"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Remark"
                      className="w-full border rounded px-3 py-2 text-base"
                      value={formData.remark}
                      onChange={(e) =>
                        setFormData({ ...formData, remark: e.target.value })
                      }
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingExpense(null)}
                        className="px-3 py-1 bg-gray-200 rounded text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditExpense}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-base"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {confirmDeleteExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
                    <h4 className="text-xl font-semibold text-gray-700">
                      Confirm Delete
                    </h4>
                    <p className="text-gray-600">
                      Are you sure you want to delete this expense?
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setConfirmDeleteExpense(null)}
                        className="px-3 py-1 bg-gray-200 rounded text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteExpense}
                        className="px-3 py-1 bg-red-600 text-white rounded text-base"
                      >
                        Delete
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