import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where, writeBatch } from 'firebase/firestore';
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

    // 1. Immediately hydrate from local backup if available so data is never blank
    const backupKey = `expense_tracker_backup_${user.uid}`;
    try {
      const cached = localStorage.getItem(backupKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExpenses(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read local backup:", e);
    }

    const userRef = doc(db, 'users', user.uid);

    const unsubUser = onSnapshot(userRef, (snapshot) => {
      const isFromCache = Boolean(snapshot.metadata?.fromCache);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.profile) {
          setUserProfile(data.profile);
        }
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setIncomeCategories(data.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setCategoryColors(data.categoryColors || DEFAULT_CATEGORY_COLORS);
        setBudgets(data.budgets || {});
      } else if (!isFromCache) {
        // Document does not exist on server yet; initialize default template safely
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
        }, { merge: true }).catch((err) => {
          console.warn("Could not auto-initialize user document (client may be offline):", err);
        });
      }
      setLoading(false);
    }, (error) => {
       console.warn("User data sync notice (client may be offline):", error);
       setLoading(false);
    });

    // 2. Fetch expenses without restrictive server-side orderBy (which fails if any doc lacks date field)
    const expensesCol = collection(db, 'users', user.uid, 'expenses');
    const unsubExpenses = onSnapshot(expensesCol, async (snapshot) => {
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
          date: data.date || '',
          note: data.note || '',
          type: data.type || 'expense',
          isReimbursable: data.isReimbursable || false,
          isResolved: data.isResolved || false,
          calendarEventId: data.calendarEventId,
          calendarEventLink: data.calendarEventLink,
          calendarSyncedAt: data.calendarSyncedAt,
          reimbursementReminderDate: data.reimbursementReminderDate,
        });
      });

      // Sort client-side safely by date descending
      exps.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // If user has expenses in Firestore, update state and backup to localStorage
      if (exps.length > 0) {
        setExpenses(exps);
        try {
          localStorage.setItem(backupKey, JSON.stringify(exps));
        } catch (e) {
          console.warn("Could not write local backup:", e);
        }
      } else {
        // 3. Fallback recovery: If Firestore subcollection has 0 items, check potential legacy stores
        try {
          let recovered: Expense[] = [];
          
          // Check common localStorage keys from earlier offline/local sessions
          const potentialKeys = ['expenses', 'expense_tracker_expenses', 'local_expenses', 'transactions', 'user_expenses'];
          for (const key of potentialKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].amount !== undefined) {
                  recovered = parsed;
                  break;
                }
              } catch (_) {}
            }
          }

          // Check if any other user backup exists in localStorage
          if (recovered.length === 0) {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('expense_tracker_backup_')) {
                const raw = localStorage.getItem(k);
                if (raw) {
                  try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      recovered = parsed;
                      break;
                    }
                  } catch (_) {}
                }
              }
            }
          }

          // Check root collection /expenses for any documents belonging to this user
          if (recovered.length === 0) {
            try {
              const rootCol = collection(db, 'expenses');
              const q = query(rootCol, where('userId', '==', user.uid));
              const rootSnap = await getDocs(q);
              if (!rootSnap.empty) {
                rootSnap.forEach((d) => {
                  const data = d.data();
                  recovered.push({
                    id: d.id,
                    amount: data.amount,
                    currency: data.currency,
                    exchangeRate: data.exchangeRate,
                    convertedAmount: data.convertedAmount,
                    category: data.category,
                    date: data.date || '',
                    note: data.note || '',
                    type: data.type || 'expense',
                    isReimbursable: data.isReimbursable || false,
                    isResolved: data.isResolved || false,
                  });
                });
              }
            } catch (rootErr) {
              console.warn("Root collection check notice:", rootErr);
            }
          }

          // If recovered items found, automatically restore them to user's Firestore subcollection!
          if (recovered.length > 0) {
            console.log(`Recovered ${recovered.length} legacy expenses. Restoring to Firestore...`);
            setExpenses(recovered);
            localStorage.setItem(backupKey, JSON.stringify(recovered));

            // Seamlessly migrate to Firestore
            for (const item of recovered) {
              try {
                const ref = doc(collection(db, 'users', user.uid, 'expenses'));
                const { id, ...cleanItem } = item;
                await setDoc(ref, {
                  ...cleanItem,
                  createdAt: new Date().toISOString()
                });
              } catch (importErr) {
                console.warn("Failed to migrate recovered item:", importErr);
              }
            }
          } else {
            setExpenses([]);
          }
        } catch (recoverErr) {
          console.warn("Recovery scan notice:", recoverErr);
          setExpenses([]);
        }
      }
    }, (error) => {
      console.error("Error fetching expenses", error);
      // Even on error, do NOT wipe out user data if local backup is present
      const cached = localStorage.getItem(backupKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExpenses(parsed);
          }
        } catch (_) {}
      }
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
      // Clean undefined fields for Firestore
      const cleanExpense = Object.fromEntries(
        Object.entries(expense).filter(([_, v]) => v !== undefined)
      );
      await setDoc(expenseRef, {
        ...cleanExpense,
        createdAt: new Date().toISOString()
      });
      return expenseRef.id;
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
