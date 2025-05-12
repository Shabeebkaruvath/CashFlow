import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import {
  addIncome,
  getTodayIncomes,
  addIncomeCategory,
  getIncomeCategories,
  updateIncome,
  deleteIncome
} from '../utils/firestoreHelpers';

function Income() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [formData, setFormData] = useState({ amount: '', remark: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null); // Track user authentication state
  const [editMode, setEditMode] = useState(false);
  const [editItemInfo, setEditItemInfo] = useState(null); // {categoryIndex, incomeIndex, data}
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemInfo, setDeleteItemInfo] = useState(null); // {categoryIndex, incomeIndex}

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user); // Set authenticated user
        await loadCategoriesAndIncomes(); // Removed user parameter
      } else {
        setUser(null); // No user logged in, clear categories
        setCategories([]);
      }
    });
    return () => unsubscribe(); // Clean up on unmount
  }, []);

  const loadCategoriesAndIncomes = async () => {
    try {
      const [savedCategories, todayIncomes] = await Promise.all([
        getIncomeCategories(),
        getTodayIncomes()
      ]);

      // Assuming savedCategories is an array of strings based on getIncomeCategories implementation
      const merged = savedCategories.map((categoryName) => {
        const match = todayIncomes.find((item) => item.name === categoryName);
        return {
          name: categoryName,
          incomes: match ? match.incomes : [],
        };
      });

      setCategories(merged);
    } catch (err) {
      console.error('Error loading data:', err);
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

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      setMessage({ text: 'Category name cannot be empty', type: 'error' });
      return;
    }
    if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
      setMessage({ text: 'Category already exists', type: 'error' });
      return;
    }

    try {
      await addIncomeCategory(name); // Removed user parameter
      setCategories([...categories, { name, incomes: [] }]);
      setNewCategory('');
      setMessage({ text: 'Category added successfully!', type: 'success' });
    } catch (err) {
      console.error('Error saving category:', err);
      setMessage({ text: 'Error saving category', type: 'error' });
    }
  };

  const handleAddIncome = async (index) => {
    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (!user) {
      setMessage({ text: 'Please log in to save income', type: 'error' });
      return;
    }

    const categoryName = categories[index].name;
    setIsSubmitting(true);

    try {
      await addIncome(amount, categoryName, formData.remark); // Removed user parameter
      
      // Update local state to show the new income
      const updated = [...categories];
      updated[index].incomes.push({ 
        amount, 
        remark: formData.remark,
        timestamp: new Date().toISOString() // Match the timestamp format used in addIncome
      });
      
      setCategories(updated);
      setFormData({ amount: '', remark: '' });
      setActiveCategoryIndex(null);
      setMessage({ text: 'Income added successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to add income:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncome = async () => {
    if (!editItemInfo) return;
    
    const { categoryIndex, incomeIndex } = editItemInfo;
    const amount = parseFloat(formData.amount);
    
    if (!amount || isNaN(amount)) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const categoryName = categories[categoryIndex].name;
      const incomeId = categories[categoryIndex].incomes[incomeIndex].id; // Assuming each income has an id
      
      await updateIncome(incomeId, amount, categoryName, formData.remark);
      
      // Update local state
      const updated = [...categories];
      updated[categoryIndex].incomes[incomeIndex] = {
        ...updated[categoryIndex].incomes[incomeIndex],
        amount,
        remark: formData.remark
      };
      
      setCategories(updated);
      setEditMode(false);
      setEditItemInfo(null);
      setActiveCategoryIndex(null);
      setFormData({ amount: '', remark: '' });
      setMessage({ text: 'Income updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to update income:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async () => {
    if (!deleteItemInfo) return;
    
    const { categoryIndex, incomeIndex } = deleteItemInfo;
    setIsSubmitting(true);
    
    try {
      const categoryName = categories[categoryIndex].name;
      const incomeId = categories[categoryIndex].incomes[incomeIndex].id; // Assuming each income has an id
      
      await deleteIncome(incomeId, categoryName);
      
      // Update local state
      const updated = [...categories];
      updated[categoryIndex].incomes.splice(incomeIndex, 1);
      
      setCategories(updated);
      setShowDeleteConfirm(false);
      setDeleteItemInfo(null);
      setMessage({ text: 'Income deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to delete income:', error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditIncome = (categoryIndex, incomeIndex) => {
    const income = categories[categoryIndex].incomes[incomeIndex];
    setFormData({
      amount: income.amount.toString(),
      remark: income.remark || ''
    });
    setEditMode(true);
    setEditItemInfo({ categoryIndex, incomeIndex });
    setActiveCategoryIndex(categoryIndex);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditItemInfo(null);
    setActiveCategoryIndex(null);
    setFormData({ amount: '', remark: '' });
  };

  const confirmDelete = (categoryIndex, incomeIndex) => {
    setDeleteItemInfo({ categoryIndex, incomeIndex });
    setShowDeleteConfirm(true);
  };

  const getCategoryTotal = (incomes) =>
    incomes.reduce((sum, i) => sum + i.amount, 0);

  const grandTotal = categories.reduce(
    (total, cat) => total + getCategoryTotal(cat.incomes),
    0
  );

  return (
    <div className="space-y-6">
      {message.text && (
        <div
          className={`p-3 rounded-lg text-center ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-700 text-center">
          Please log in to save your income to the database
        </div>
      )}

      <h2 className="text-4xl font-bold text-green-600 text-center">
        Total Income: ₹{grandTotal.toFixed(2)}
      </h2>

      {/* Add Category */}
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
            className="bg-green-600 text-white px-4 py-2 rounded text-base"
          >
            Add
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="bg-green-50 p-4 rounded-lg text-center text-green-700">
          No categories yet. Add your first category above!
        </div>
      )}

      {/* Category Cards */}
      {categories.map((category, index) => (
        <div key={category.name} className="bg-white p-4 shadow rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-700">{category.name}</h3>
            <span className="font-bold text-2xl text-green-500">
              ₹{getCategoryTotal(category.incomes).toFixed(2)}
            </span>
          </div>

          {category.incomes?.length === 0 ? (
            <p className="text-gray-500 italic">No income in this category yet</p>
          ) : (
            <ul className="text-base text-gray-600 space-y-1">
              {category.incomes.map((income, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{income.remark || 'No remark'}</span>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-3">₹{income.amount.toFixed(2)}</span>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          document.querySelectorAll('.dropdown-menu').forEach(el => {
                            if (el.id !== `dropdown-${index}-${i}`) {
                              el.classList.add('hidden');
                            }
                          });
                          document.getElementById(`dropdown-${index}-${i}`).classList.toggle('hidden');
                        }}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      <div
                        id={`dropdown-${index}-${i}`}
                        className="dropdown-menu hidden absolute right-0 mt-2 w-24 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById(`dropdown-${index}-${i}`).classList.add('hidden');
                              startEditIncome(index, i);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById(`dropdown-${index}-${i}`).classList.add('hidden');
                              confirmDelete(index, i);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
              setEditMode(false);
              setFormData({ amount: '', remark: '' });
            }}
            className="text-base text-green-600 font-medium underline"
          >
            + Add Income
          </button>

          {activeCategoryIndex === index && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">
                  {editMode ? `Edit Income - ${category.name}` : `Add Income - ${category.name}`}
                </h4>
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full border rounded px-3 py-2 text-base"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Remark"
                  className="w-full border rounded px-3 py-2 text-base"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={editMode ? cancelEdit : () => setActiveCategoryIndex(null)}
                    className="px-3 py-1 bg-gray-200 rounded text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editMode ? handleUpdateIncome : () => handleAddIncome(index)}
                    className={`px-3 py-1 ${
                      isSubmitting ? 'bg-green-400' : 'bg-green-600'
                    } text-white rounded text-base`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? (editMode ? 'Updating...' : 'Adding...') 
                      : (editMode ? 'Update' : 'Add')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
            <h4 className="text-xl font-semibold text-gray-700">Confirm Delete</h4>
            <p className="text-gray-600">
              Are you sure you want to delete this income entry? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-gray-200 rounded text-base"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIncome}
                className={`px-3 py-1 ${
                  isSubmitting ? 'bg-red-400' : 'bg-red-600'
                } text-white rounded text-base`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close all dropdowns */}
      <div 
        onClick={() => {
          document.querySelectorAll('.dropdown-menu').forEach(el => {
            el.classList.add('hidden');
          });
        }} 
        className="fixed inset-0 z-0 hidden" 
        id="dropdown-overlay"
      ></div>
    </div>
  );
}

export default Income;