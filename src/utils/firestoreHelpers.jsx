import { auth, db } from '../firebase/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'

const getTodayDate = () => new Date().toISOString().split('T')[0]

export const addIncome = async (amount, category, remark) => {
  const user = auth.currentUser
  if (!user) return

  const date = getTodayDate()
  const ref = doc(db, 'users', user.uid, 'records', date)

  const newItem = {
    amount,
    category,
    remark,
    timestamp: new Date().toISOString(),
  }

  try {
    const snap = await getDoc(ref)

    if (snap.exists()) {
      await updateDoc(ref, {
        income: arrayUnion(newItem),
        totalIncome: (snap.data().totalIncome || 0) + amount,
      })
    } else {
      await setDoc(ref, {
        income: [newItem],
        expense: [],
        totalIncome: amount,
        totalExpense: 0,
      })
    }
  } catch (error) {
    console.error('Error adding income:', error)
  }
}

export const addExpense = async (amount, category, remark) => {
  const user = auth.currentUser
  if (!user) return

  const date = getTodayDate()
  const ref = doc(db, 'users', user.uid, 'records', date)

  const newItem = {
    amount,
    category,
    remark,
    timestamp: new Date().toISOString(),
  }

  try {
    const snap = await getDoc(ref)

    if (snap.exists()) {
      await updateDoc(ref, {
        expense: arrayUnion(newItem),
        totalExpense: (snap.data().totalExpense || 0) + amount,
      })
    } else {
      await setDoc(ref, {
        income: [],
        expense: [newItem],
        totalIncome: 0,
        totalExpense: amount,
      })
    }
  } catch (error) {
    console.error('Error adding expense:', error)
  }
}
export const getTodayIncomes = async () => {
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


export const getTodayExpenses = async () => {
  const user = auth.currentUser
  if (!user) return []

  const date = getTodayDate()
  const ref = doc(db, 'users', user.uid, 'records', date)

  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) return []

    const expenses = snap.data().expense || []

    const categorized = {}
    expenses.forEach((item) => {
      if (!categorized[item.category]) {
        categorized[item.category] = []
      }
      categorized[item.category].push({
        amount: item.amount,
        remark: item.remark,
        timestamp: item.timestamp,
      })
    })

    return Object.entries(categorized).map(([name, expenses]) => ({
      name,
      expenses,
    }))
  } catch (error) {
    console.error('Error fetching today\'s expenses:', error)
    return []
  }
}
