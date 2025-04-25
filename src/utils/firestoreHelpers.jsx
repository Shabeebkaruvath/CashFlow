import { auth, db } from '../firebase/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
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

// Add the missing function for expense categories
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

// Single consolidated export statement
export { 
  addIncome, 
  addExpense, 
  getTodayIncomes, 
  getTodayExpenses, 
  addIncomeCategory,
  addExpenseCategory,  // Added the missing export here
  getIncomeCategories,
  getExpenseCategories 
};