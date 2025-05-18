import { auth, db } from "../firebase/firebase";
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
  addDoc,
  writeBatch,
 
} from "firebase/firestore";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const remarksMatch = (remark1, remark2) => {
  const r1 = remark1 === undefined || remark1 === null ? "" : String(remark1);
  const r2 = remark2 === undefined || remark2 === null ? "" : String(remark2);
  return r1 === r2;
};

const ensureCategoryExists = async (type, category) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for ensureCategoryExists");
    return;
  }

  const categoriesRef = collection(db, "users", user.uid, `${type}Categories`);
  const q = query(categoriesRef, where("name", "==", category));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    try {
      await addDoc(categoriesRef, {
        name: category,
        createdAt: new Date().toISOString(),
      });
      console.log(`Category "${category}" added for ${type}.`);
    } catch (error) {
      console.error(`Error adding ${type} category:`, error);
    }
  }
};

const addIncome = async (amount, category, remark) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for addIncome");
    return;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);
  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) {
    console.error("Invalid amount provided for addIncome:", amount);
    return;
  }

  const newItem = {
    amount: numericAmount,
    category,
    remark: remark === undefined || remark === null ? "" : remark,
    timestamp: Date.now(),
  };

  try {
    await ensureCategoryExists("income", category);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const currentTotalIncome = Number(snap.data().totalIncome) || 0;
      await updateDoc(ref, {
        income: arrayUnion(newItem),
        totalIncome: currentTotalIncome + numericAmount,
      });
    } else {
      await setDoc(ref, {
        income: [newItem],
        expense: [],
        totalIncome: numericAmount,
        totalExpense: 0,
      });
    }
    console.log("Income added successfully");
  } catch (error) {
    console.error("Error adding income:", error);
    throw error;
  }
};

const addExpense = async (amount, category, remark) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for addExpense");
    return;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);
  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) {
    console.error("Invalid amount provided for addExpense:", amount);
    return;
  }

  const newItem = {
    amount: numericAmount,
    category,
    remark: remark === undefined || remark === null ? "" : remark,
    timestamp: Date.now(),
  };

  try {
    await ensureCategoryExists("expense", category);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const currentTotalExpense = Number(snap.data().totalExpense) || 0;
      await updateDoc(ref, {
        expense: arrayUnion(newItem),
        totalExpense: currentTotalExpense + numericAmount,
      });
    } else {
      await setDoc(ref, {
        income: [],
        expense: [newItem],
        totalIncome: 0,
        totalExpense: numericAmount,
      });
    }
    console.log("Expense added successfully");
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

const deleteIncome = async (incomeToDelete) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for deleteIncome");
    return false;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error("Document for today does not exist, cannot delete income.");
      return false;
    }

    const data = snap.data();
    const currentIncomes = data.income || [];

    const numericAmountToDelete = Number(incomeToDelete.amount);
    const numericTimestampToDelete = Number(incomeToDelete.timestamp);

    const indexToDelete = currentIncomes.findIndex(
      (item) =>
        Number(item.amount) === numericAmountToDelete &&
        item.category === incomeToDelete.category &&
        remarksMatch(item.remark, incomeToDelete.remark) &&
        Number(item.timestamp) === numericTimestampToDelete
    );

    if (indexToDelete === -1) {
      console.error(
        "Could not find income to delete in Firebase. Check matching criteria:",
        incomeToDelete
      );
      console.log("incomeToDelete:", incomeToDelete);
      console.log(
        "Current incomes in DB for matching:",
        currentIncomes.map((ci) => ({
          amount: ci.amount,
          category: ci.category,
          remark: ci.remark,
          timestamp: ci.timestamp,
        }))
      );
      return false;
    }

    const updatedIncomes = [
      ...currentIncomes.slice(0, indexToDelete),
      ...currentIncomes.slice(indexToDelete + 1),
    ];

    const newTotalIncome = updatedIncomes.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    await updateDoc(ref, {
      income: updatedIncomes,
      totalIncome: newTotalIncome,
    });

    console.log("Income deleted successfully from Firebase.");
    return true;
  } catch (error) {
    console.error("Error deleting income from Firebase:", error);
    throw error;
  }
};

const deleteExpense = async (expenseToDelete) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for deleteExpense");
    return false;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error(
        "Document for today does not exist, cannot delete expense."
      );
      return false;
    }

    const data = snap.data();
    const currentExpenses = data.expense || [];

    const numericAmountToDelete = Number(expenseToDelete.amount);
    const numericTimestampToDelete = Number(expenseToDelete.timestamp);

    const indexToDelete = currentExpenses.findIndex(
      (item) =>
        Number(item.amount) === numericAmountToDelete &&
        item.category === expenseToDelete.category &&
        remarksMatch(item.remark, expenseToDelete.remark) &&
        Number(item.timestamp) === numericTimestampToDelete
    );

    if (indexToDelete === -1) {
      console.error(
        "Could not find expense to delete in Firebase. Check matching criteria:",
        expenseToDelete
      );
      console.log("expenseToDelete:", expenseToDelete);
      console.log(
        "Current expenses in DB for matching:",
        currentExpenses.map((ce) => ({
          amount: ce.amount,
          category: ce.category,
          remark: ce.remark,
          timestamp: ce.timestamp,
        }))
      );
      return false;
    }

    const updatedExpenses = [
      ...currentExpenses.slice(0, indexToDelete),
      ...currentExpenses.slice(indexToDelete + 1),
    ];

    const newTotalExpense = updatedExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    await updateDoc(ref, {
      expense: updatedExpenses,
      totalExpense: newTotalExpense,
    });

    console.log("Expense deleted successfully from Firebase.");
    return true;
  } catch (error) {
    console.error("Error deleting expense from Firebase:", error);
    throw error;
  }
};

const updateIncome = async (originalIncome, updatedIncomeData) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for updateIncome");
    return false;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error("Document for today does not exist, cannot update income.");
      return false;
    }

    const data = snap.data();
    const currentIncomes = data.income || [];

    const numericOriginalAmount = Number(originalIncome.amount);
    const numericOriginalTimestamp = Number(originalIncome.timestamp);

    const indexToUpdate = currentIncomes.findIndex(
      (item) =>
        Number(item.amount) === numericOriginalAmount &&
        item.category === originalIncome.category &&
        remarksMatch(item.remark, originalIncome.remark) &&
        Number(item.timestamp) === numericOriginalTimestamp
    );

    if (indexToUpdate === -1) {
      console.error(
        "Could not find income to update in Firebase. Check matching criteria for originalIncome:",
        originalIncome
      );
      console.log(
        "Current incomes in DB for matching:",
        currentIncomes.map((ci) => ({
          amount: ci.amount,
          category: ci.category,
          remark: ci.remark,
          timestamp: ci.timestamp,
        }))
      );
      return false;
    }

    const updatedIncomes = [...currentIncomes];
    const finalUpdatedData = { ...updatedIncomeData };
    if (finalUpdatedData.hasOwnProperty("remark")) {
      finalUpdatedData.remark =
        finalUpdatedData.remark === undefined ||
        finalUpdatedData.remark === null
          ? ""
          : finalUpdatedData.remark;
    }

    updatedIncomes[indexToUpdate] = {
      ...currentIncomes[indexToUpdate],
      ...finalUpdatedData,
      amount: Number(finalUpdatedData.amount),
    };

    if (
      updatedIncomeData.category &&
      updatedIncomeData.category !== originalIncome.category
    ) {
      await ensureCategoryExists("income", updatedIncomeData.category);
    }

    const newTotalIncome = updatedIncomes.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    await updateDoc(ref, {
      income: updatedIncomes,
      totalIncome: newTotalIncome,
    });

    console.log("Income updated successfully in Firebase.");
    return true;
  } catch (error) {
    console.error("Error updating income in Firebase:", error);
    throw error;
  }
};
const updateExpense = async (originalExpense, updatedExpenseData) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for updateExpense");
    return false;
  }

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error(
        "Document for today does not exist, cannot update expense."
      );
      return false;
    }

    const data = snap.data();
    const currentExpenses = data.expense || [];

    const numericOriginalAmount = Number(originalExpense.amount);
    const numericOriginalTimestamp = Number(originalExpense.timestamp);

    const indexToUpdate = currentExpenses.findIndex(
      (item) =>
        Number(item.amount) === numericOriginalAmount &&
        item.category === originalExpense.category &&
        remarksMatch(item.remark, originalExpense.remark) &&
        Number(item.timestamp) === numericOriginalTimestamp
    );

    if (indexToUpdate === -1) {
      console.error(
        "Could not find expense to update in Firebase. Check matching criteria for originalExpense:",
        originalExpense
      );
      console.log(
        "Current expenses in DB for matching:",
        currentExpenses.map((ce) => ({
          amount: ce.amount,
          category: ce.category,
          remark: ce.remark,
          timestamp: ce.timestamp,
        }))
      );
      return false;
    }

    const updatedExpenses = [...currentExpenses];
    const finalUpdatedData = { ...updatedExpenseData };
    if (finalUpdatedData.hasOwnProperty("remark")) {
      finalUpdatedData.remark =
        finalUpdatedData.remark === undefined ||
        finalUpdatedData.remark === null
          ? ""
          : finalUpdatedData.remark;
    }

    updatedExpenses[indexToUpdate] = {
      ...currentExpenses[indexToUpdate],
      ...finalUpdatedData,
      amount: Number(finalUpdatedData.amount),
    };

    if (
      updatedExpenseData.category &&
      updatedExpenseData.category !== originalExpense.category
    ) {
      await ensureCategoryExists("expense", updatedExpenseData.category);
    }

    const newTotalExpense = updatedExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    await updateDoc(ref, {
      expense: updatedExpenses,
      totalExpense: newTotalExpense,
    });

    console.log("Expense updated successfully in Firebase.");
    return true;
  } catch (error) {
    console.error("Error updating expense in Firebase:", error);
    throw error;
  }
};

const getTodayIncomes = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const date = getTodayDate();
  const ref = doc(db, "users", user.uid, "records", date);

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
        amount: Number(item.amount),
        remark:
          item.remark === undefined || item.remark === null ? "" : item.remark,
        timestamp: item.timestamp,
        category: item.category,
      });
    });

    return Object.entries(categorized).map(([name, incomeEntries]) => ({
      name,
      incomes: incomeEntries,
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
  const ref = doc(db, "users", user.uid, "records", date);

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
        amount: Number(item.amount),
        remark:
          item.remark === undefined || item.remark === null ? "" : item.remark,
        timestamp: item.timestamp,
        category: item.category,
      });
    });

    return Object.entries(categorized).map(([name, expenseEntries]) => ({
      name,
      expenses: expenseEntries,
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
    const categoriesRef = collection(db, "users", user.uid, "incomeCategories");
    const querySnap = await getDocs(categoriesRef);
    return querySnap.docs.map((doc) => doc.data().name);
  } catch (error) {
    console.error("Error fetching income categories:", error);
    return [];
  }
};

const getExpenseCategories = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const categoriesRef = collection(
      db,
      "users",
      user.uid,
      "expenseCategories"
    );
    const querySnap = await getDocs(categoriesRef);
    return querySnap.docs.map((doc) => doc.data().name);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return [];
  }
};

const addIncomeCategory = async (categoryName) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for addIncomeCategory");
    return;
  }
  if (!categoryName || categoryName.trim() === "") {
    console.error("Category name cannot be empty.");
    return;
  }

  try {
    const existingCategories = await getIncomeCategories();
    if (existingCategories.includes(categoryName.trim())) {
      console.warn(`Income category "${categoryName.trim()}" already exists.`);
      return;
    }

    const categoryRef = collection(db, "users", user.uid, "incomeCategories");
    await addDoc(categoryRef, {
      name: categoryName.trim(),
      createdAt: new Date().toISOString(),
    });
    console.log(`Income category "${categoryName.trim()}" added.`);
  } catch (error) {
    console.error("Error adding income category: ", error);
    throw error;
  }
};

const addExpenseCategory = async (categoryName) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated for addExpenseCategory");
    return;
  }
  if (!categoryName || categoryName.trim() === "") {
    console.error("Category name cannot be empty.");
    return;
  }

  try {
    const existingCategories = await getExpenseCategories();
    if (existingCategories.includes(categoryName.trim())) {
      console.warn(`Expense category "${categoryName.trim()}" already exists.`);
      return;
    }
    const categoryRef = collection(db, "users", user.uid, "expenseCategories");
    await addDoc(categoryRef, {
      name: categoryName.trim(),
      createdAt: new Date().toISOString(),
    });
    console.log(`Expense category "${categoryName.trim()}" added.`);
  } catch (error) {
    console.error("Error adding expense category: ", error);
    throw error;
  }
};

export const deleteIncomeCategory = async (categoryName) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user is signed in");
      return false;
    }

    const userId = user.uid;
    const batch = writeBatch(db);

    // Step 1: Delete the category from the categories collection
    const categoriesRef = collection(db, "users", userId, "incomeCategories");
    const categoryQuery = query(categoriesRef, where("name", "==", categoryName));
    const categorySnapshot = await getDocs(categoryQuery);

    if (categorySnapshot.empty) {
      console.error("Category not found");
      return false;
    }

    // Add category deletion to batch
    categorySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Step 2: Update any records that use this category
    // Get all dates that might have records
    const recordsRef = collection(db, "users", userId, "records");
    const recordsSnapshot = await getDocs(recordsRef);

    recordsSnapshot.forEach((recordDoc) => {
      const recordData = recordDoc.data();
      let recordUpdated = false;
      
      // Check if this record has incomes to update
      if (recordData.income && Array.isArray(recordData.income)) {
        const updatedIncomes = recordData.income.filter(item => item.category !== categoryName);
        
        // If we filtered out any items, we need to update the record
        if (updatedIncomes.length !== recordData.income.length) {
          recordUpdated = true;
          console.log("recordUpdated", recordUpdated);
          // Recalculate the total income
          const newTotalIncome = updatedIncomes.reduce(
            (sum, item) => sum + Number(item.amount), 0
          );
          
          // Update the record with new data
          batch.update(recordDoc.ref, {
            income: updatedIncomes,
            totalIncome: newTotalIncome
          });
        }
      }
    });

    // Execute the batch
    await batch.commit();
    console.log(`Income category "${categoryName}" successfully deleted from database.`);
    return true;
  } catch (error) {
    console.error("Error deleting income category:", error);
    throw error;
  }
};

export const updateIncomeCategory = async (oldCategoryName, newCategoryName) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user is signed in");
      return false; 
    }

    if (!oldCategoryName || !newCategoryName || oldCategoryName === newCategoryName) {
      console.error("Invalid category names provided");
      return false;
    }

    const userId = user.uid;
    const batch = writeBatch(db);

    // Step 1: Check if new category name already exists
    const existingCategories = await getIncomeCategories();
    if (existingCategories.includes(newCategoryName)) {
      console.error(`Income category "${newCategoryName}" already exists.`);
      return false;
    }

    // Step 2: Find the category document to update
    const categoriesRef = collection(db, "users", userId, "incomeCategories");
    const q = query(categoriesRef, where("name", "==", oldCategoryName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`Category "${oldCategoryName}" not found`);
      return false;
    }

    // Update the category name in the categories collection
    snapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { name: newCategoryName });
    });

    // Step 3: Update any records that use this category
    const recordsRef = collection(db, "users", userId, "records");
    const recordsSnapshot = await getDocs(recordsRef);

    recordsSnapshot.forEach((recordDoc) => {
      const recordData = recordDoc.data();
      let recordUpdated = false;
      
      // Check if this record has incomes to update
      if (recordData.income && Array.isArray(recordData.income)) {
        const updatedIncomes = recordData.income.map(item => {
          if (item.category === oldCategoryName) {
            recordUpdated = true;
            return { ...item, category: newCategoryName };
          }
          return item;
        });
        
        // If we updated any items, update the record
        if (recordUpdated) {
          batch.update(recordDoc.ref, {
            income: updatedIncomes
          });
        }
      }
    });

    // Execute the batch
    await batch.commit();
    console.log(`Income category "${oldCategoryName}" successfully updated to "${newCategoryName}" in database.`);
    return true;
  } catch (error) {
    console.error("Error updating income category:", error);
    throw error;
  }
};
export const deleteExpenseCategory = async (categoryName) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const userId = user.uid;
    const batch = writeBatch(db);

    // Step 1: Delete the category from the categories collection
    const categoriesRef = collection(db, "users", userId, "expenseCategories");
    const categoryQuery = query(
      categoriesRef,
      where("name", "==", categoryName)
    );
    const categorySnapshot = await getDocs(categoryQuery);

    if (categorySnapshot.empty) {
      throw new Error("Category not found");
    }

    // Add category deletion to batch
    categorySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Step 2: Delete all expenses in that category
    const expensesRef = collection(db, "users", userId, "expenses");
    const expensesQuery = query(
      expensesRef,
      where("category", "==", categoryName)
    );
    const expenseSnapshot = await getDocs(expensesQuery);

    // Add expense deletions to batch
    expenseSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Execute the batch write
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

export const updateExpenseCategory = async (oldCategoryName, newCategoryName) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    if (!oldCategoryName || !newCategoryName || oldCategoryName === newCategoryName) {
      throw new Error("Invalid category names provided");
    }

    const userId = user.uid;
    const batch = writeBatch(db);

    // Find the expense category document to update
    const categoriesRef = collection(db, "users", userId, "expenseCategories");
    const q = query(categoriesRef, where("name", "==", oldCategoryName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error(`Category "${oldCategoryName}" not found`);

    // Update the category name in the category collection
    snapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { name: newCategoryName });
    });

    // Update the category name in the current month's expenses
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthKey = `${year}-${month}`;
    const expensesDocRef = doc(db, "users", userId, "expenses", monthKey);
    const expensesDoc = await getDoc(expensesDocRef);

    if (expensesDoc.exists()) {
      const expensesData = expensesDoc.data();

      if (expensesData[oldCategoryName]) {
        expensesData[newCategoryName] = expensesData[oldCategoryName];
        delete expensesData[oldCategoryName];
        batch.set(expensesDocRef, expensesData);
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};


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
  getExpenseCategories,
  ensureCategoryExists,
};
