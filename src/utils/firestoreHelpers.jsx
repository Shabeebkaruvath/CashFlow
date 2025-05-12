import { auth, db } from '../firebase/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
  addDoc
} from 'firebase/firestore';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Util to check and add category if not exists
const ensureCategoryExists = async (type, category) => {
  const user = auth.currentUser;
  if (!user) return;

  const categoriesRef = collection(db, 'users', user.uid, `${type}Categories`);
  const q = query(categoriesRef, where('name', '==', category));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    await addDoc(categoriesRef, {
      name: category,
      createdAt: new Date().toISOString(),
    });
  }
};

const addIncome = async (amount, category, remark) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  const newItem = {
    amount,
    category,
    remark,
    timestamp: new Date().toISOString(),
  };

  try {
    await ensureCategoryExists('income', category);

    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        income: arrayUnion(newItem),
        totalIncome: (snap.data().totalIncome || 0) + amount,
      });
    } else {
      await setDoc(ref, {
        income: [newItem],
        expense: [],
        totalIncome: amount,
        totalExpense: 0,
      });
    }
  } catch (error) {
    console.error('Error adding income:', error);
  }
};

const addExpense = async (amount, category, remark) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  const newItem = {
    amount,
    category,
    remark,
    timestamp: new Date().toISOString(),
  };

  try {
    await ensureCategoryExists('expense', category);

    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        expense: arrayUnion(newItem),
        totalExpense: (snap.data().totalExpense || 0) + amount,
      });
    } else {
      await setDoc(ref, {
        income: [],
        expense: [newItem],
        totalIncome: 0,
        totalExpense: amount,
      });
    }
  } catch (error) {
    console.error('Error adding expense:', error);
  }
};

// New function to delete an income entry
const deleteIncome = async (category, incomeToDelete) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const incomes = data.income || [];
    console.log(incomes);

    // Remove the specific income and update total income
    await updateDoc(ref, {
      income: arrayRemove(incomeToDelete),
      totalIncome: (data.totalIncome || 0) - incomeToDelete.amount
    });
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// New function to delete an expense
const deleteExpense = async (category, expenseToDelete) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const expenses = data.expense || [];
    console.log(expenses);

    // Remove the specific expense and update total expense
    await updateDoc(ref, {
      expense: arrayRemove(expenseToDelete),
      totalExpense: (data.totalExpense || 0) - expenseToDelete.amount
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// New function to update an income entry
const updateIncome = async (category, originalIncome, updatedIncome) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const incomes = data.income || [];
    console.log(incomes);

    // Remove the original income
    await updateDoc(ref, {
      income: arrayRemove(originalIncome),
      totalIncome: (data.totalIncome || 0) - originalIncome.amount
    });

    // Add the updated income
    await updateDoc(ref, {
      income: arrayUnion(updatedIncome),
      totalIncome: (data.totalIncome || 0) + updatedIncome.amount
    });
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
};

const getTodayIncomes = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const incomes = snap.data().income || [];

    const categorized = {};
    incomes.forEach((item) => {
      if (!categorized[item.category]) {
        categorized[item.category] = [];
      }
      categorized[item.category].push({
        amount: item.amount,
        remark: item.remark,
        timestamp: item.timestamp,
      });
    });

    return Object.entries(categorized).map(([name, incomes]) => ({
      name,
      incomes,
    }));
  } catch (error) {
    console.error("Error fetching today's incomes:", error);
    return [];
  }
};

const getTodayExpenses = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const expenses = snap.data().expense || [];

    const categorized = {};
    expenses.forEach((item) => {
      if (!categorized[item.category]) {
        categorized[item.category] = [];
      }
      categorized[item.category].push({
        amount: item.amount,
        remark: item.remark,
        timestamp: item.timestamp,
      });
    });

    return Object.entries(categorized).map(([name, expenses]) => ({
      name,
      expenses,
    }));
  } catch (error) {
    console.error("Error fetching today's expenses:", error);
    return [];
  }
};

const getIncomeCategories = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const categoriesRef = collection(db, 'users', user.uid, 'incomeCategories');
    const querySnap = await getDocs(categoriesRef);

    const categories = [];
    querySnap.forEach((doc) => {
      categories.push(doc.data().name);
    });

    return categories;
  } catch (error) {
    console.error('Error fetching income categories:', error);
    return [];
  }
};

const getExpenseCategories = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const categoriesRef = collection(db, 'users', user.uid, 'expenseCategories');
    const querySnap = await getDocs(categoriesRef);

    const categories = [];
    querySnap.forEach((doc) => {
      categories.push(doc.data().name);
    });

    return categories;
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return [];
  }
};

const addIncomeCategory = async (categoryName) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const categoryRef = collection(db, 'users', user.uid, 'incomeCategories');
    await addDoc(categoryRef, { name: categoryName });
  } catch (error) {
    console.error('Error adding income category: ', error);
    throw error;
  }
};

const addExpenseCategory = async (categoryName) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const categoryRef = collection(db, 'users', user.uid, 'expenseCategories');
    await addDoc(categoryRef, { name: categoryName });
  } catch (error) {
    console.error('Error adding expense category: ', error);
    throw error;
  }
};

// New function to update an existing expense
const updateExpense = async (category, originalExpense, updatedExpense) => {
  const user = auth.currentUser;
  if (!user) return;

  const date = getTodayDate();
  const ref = doc(db, 'users', user.uid, 'records', date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const expenses = data.expense || [];
    console.log(expenses);

    // Calculate the difference in amounts
    const amountDifference = updatedExpense.amount - originalExpense.amount;
console.log(amountDifference);
    // Remove the original expense
    await updateDoc(ref, {
      expense: arrayRemove(originalExpense),
      totalExpense: (data.totalExpense || 0) - originalExpense.amount
    });

    // Add the updated expense
    await updateDoc(ref, {
      expense: arrayUnion(updatedExpense),
      totalExpense: (data.totalExpense || 0) + updatedExpense.amount
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Single consolidated export statement
export { 
  addIncome, 
  addExpense, 
  deleteIncome,
  deleteExpense,
  updateIncome,
  updateExpense,
  getTodayIncomes, 
  getTodayExpenses, 
  addIncomeCategory,
  addExpenseCategory,
  getIncomeCategories,
  getExpenseCategories 
};