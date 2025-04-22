import React, { useState, useEffect } from 'react';
import { addIncome, getTodayIncomes } from '../utils/firestoreHelpers';
import { auth } from '../firebase/firebase';

function Income() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [formData, setFormData] = useState({ amount: '', remark: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        console.log("No user is signed in");
      } else {
        console.log("User is signed in:", user.uid);
        fetchIncomes();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchIncomes = async () => {
    const data = await getTodayIncomes();
    setCategories(
      data.map(item => ({ name: item.name, incomes: item.incomes }))
    );
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAddIncome = async (index) => {
    const amount = parseFloat(formData.amount);
    if (!amount || isNaN(amount)) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (!auth.currentUser) {
      setMessage({ text: 'Please log in to save income', type: 'error' });
      return;
    }

    const categoryName = categories[index].name;
    setIsSubmitting(true);

    try {
      await addIncome(amount, categoryName, formData.remark);
      const updated = [...categories];
      updated[index].incomes.push({ amount, remark: formData.remark });
      setCategories(updated);
      setFormData({ amount: '', remark: '' });
      setActiveCategoryIndex(null);
      setMessage({ text: 'Income added successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to add income:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() === '') {
      setMessage({ text: 'Category name cannot be empty', type: 'error' });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setMessage({ text: 'Category already exists', type: 'error' });
      return;
    }
    setCategories([...categories, { name: newCategory.trim(), incomes: [] }]);
    setNewCategory('');
    setMessage({ text: 'Category added successfully!', type: 'success' });
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
        <div className={`p-3 rounded-lg text-center ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {!auth.currentUser && (
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-700 text-center">
          Please log in to save your income to the database
        </div>
      )}

      <h2 className="text-4xl font-bold text-green-600 text-center">
        Total Income: ₹{grandTotal.toFixed(2)}
      </h2>

      <div className="bg-white p-4 shadow rounded-2xl space-y-3">
        <h3 className="text-xl font-semibold text-gray-700">
          Add Category
        </h3>
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

      {categories.map((category, index) => (
        <div
          key={category.name}
          className="bg-white p-4 shadow rounded-2xl space-y-3"
        >
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
              {category.incomes?.map((income, i) => (
                <li key={i} className="flex justify-between">
                  <span>{income.remark || 'No remark'}</span>
                  <span className="text-green-600">₹{income.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setActiveCategoryIndex(index)}
            className="text-base text-green-600 font-medium underline"
          >
            + Add Income
          </button>

          {activeCategoryIndex === index && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl w-80 shadow-lg space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">
                  Add Income - {category.name}
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
                    onClick={() => handleAddIncome(index)}
                    className={`px-3 py-1 ${isSubmitting ? 'bg-green-400' : 'bg-green-600'} text-white rounded text-base`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Income;
