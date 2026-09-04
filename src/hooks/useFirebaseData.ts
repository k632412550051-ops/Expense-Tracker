import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Expense, 
  BudgetMap, 
  DEFAULT_CATEGORIES, 
  DEFAULT_BUDGETS, 
  Category, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_CATEGORY_COLORS,
  UserProfile
} from '../types';

export function useFirebaseData() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(DEFAULT_INCOME_CATEGORIES);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);
  const [budgets, setBudgets] = useState<BudgetMap>(DEFAULT_BUDGETS);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setUserProfile(null);
      setCategories(DEFAULT_CATEGORIES);
      setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      setCategoryColors(DEFAULT_CATEGORY_COLORS);
      setBudgets({});
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    // Check if user doc exists, create if not
    getDoc(userRef).then((docSnap) => {
      if (!docSnap.exists()) {
        setDoc(userRef, {
          categories: DEFAULT_CATEGORIES,
          incomeCategories: DEFAULT_INCOME_CATEGORIES,
          categoryColors: DEFAULT_CATEGORY_COLORS,
          budgets: DEFAULT_BUDGETS,
          email: user.email,
          profile: {
            displayName: user.displayName || '',
            baseCurrency: 'VND',
            frequentCurrencies: ['VND', 'USD'],
            onboarded: false,
          }
        });
      }
    });

    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.profile) {
          setUserProfile(data.profile);
        }
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setIncomeCategories(data.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setCategoryColors(data.categoryColors || DEFAULT_CATEGORY_COLORS);
        setBudgets(data.budgets || {});
      }
      setLoading(false);
    }, (error) => {
       console.error("Error fetching user Data", error);
       setLoading(false);
    });

    const expensesQ = query(collection(db, 'users', user.uid, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(expensesQ, (snapshot) => {
      const exps: Expense[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        exps.push({
          id: d.id,
          amount: data.amount,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          convertedAmount: data.convertedAmount,
          category: data.category,
          date: data.date,
          note: data.note,
          type: data.type || 'expense',
          isReimbursable: data.isReimbursable || false,
          isResolved: data.isResolved || false
        });
      });
      setExpenses(exps);
    }, (error) => {
      console.error("Error fetching expenses", error);
    });

    return () => {
      unsubUser();
      unsubExpenses();
    };
  }, [user]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      if (!user) return;
      const expenseRef = doc(collection(db, 'users', user.uid, 'expenses'));
      await setDoc(expenseRef, {
        ...expense,
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Lỗi khi thêm chi tiêu:", error);
      alert("Không thể lưu chi tiêu: " + error.message);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) {
      throw new Error("Chưa đăng nhập");
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    } catch (error: any) {
      console.error("Lỗi khi xoá chi tiêu:", error);
      throw error;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!user) {
      throw new Error("Chưa đăng nhập");
    }
    try {
      await updateDoc(doc(db, 'users', user.uid, 'expenses', id), updates);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật chi tiêu:", error);
      throw error;
    }
  };

  const updateUserSettings = async (
    newBudgets: BudgetMap, 
    newCategories: Category[], 
    newIncomeCategories?: Category[],
    newCategoryColors?: Record<string, string>
  ) => {
    if (!user) return;
    
    // Remove any undefined values to satisfy Firestore
    const safeBudgets = { ...newBudgets };
    Object.keys(safeBudgets).forEach(key => {
      if (safeBudgets[key] === undefined) {
        delete safeBudgets[key];
      }
    });

    const updateData: any = {
      budgets: safeBudgets,
      categories: newCategories
    };
    if (newIncomeCategories) {
      updateData.incomeCategories = newIncomeCategories;
    }
    if (newCategoryColors) {
      updateData.categoryColors = newCategoryColors;
    }
    await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
  };
  
  const updateExpensesCategory = async (renames: {old: string, new: string}[]) => {
     if (!user || renames.length === 0) return;
     const promises = expenses.map(async (exp) => {
        const rename = renames.find(r => r.old === exp.category);
        if (rename) {
           await updateDoc(doc(db, 'users', user.uid, 'expenses', exp.id), {
             category: rename.new
           });
        }
     });
     await Promise.all(promises);
  };

  const updateUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      profile: {
        ...(userProfile || {}),
        ...profileUpdates
      }
    }, { merge: true });
  };

  return {
    user,
    loading,
    userProfile,
    categories,
    incomeCategories,
    categoryColors,
    budgets,
    expenses,
    addExpense,
    deleteExpense,
    updateExpense,
    updateUserSettings,
    updateExpensesCategory,
    updateUserProfile
  };
}
