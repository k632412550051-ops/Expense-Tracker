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
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('expense_tracker_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(DEFAULT_INCOME_CATEGORIES);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);
  const [budgets, setBudgets] = useState<BudgetMap>(DEFAULT_BUDGETS);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const user = firebaseUser || (isGuestMode ? ({
    uid: 'guest',
    displayName: localStorage.getItem('expense_tracker_guest_name') || 'Khách',
    isAnonymous: true
  } as any) : null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setFirebaseUser(u);
      if (u) {
        // If user logged in and had existing guest expenses, migrate them seamlessly
        try {
          const guestRaw = localStorage.getItem('expense_tracker_guest_expenses');
          if (guestRaw) {
            const guestExps: Expense[] = JSON.parse(guestRaw);
            if (Array.isArray(guestExps) && guestExps.length > 0) {
              for (const item of guestExps) {
                const { id, ...cleanItem } = item;
                const ref = doc(collection(db, 'users', u.uid, 'expenses'));
                await setDoc(ref, {
                  ...cleanItem,
                  createdAt: new Date().toISOString()
                });
              }
            }
            localStorage.removeItem('expense_tracker_guest_expenses');
            localStorage.removeItem('expense_tracker_guest_mode');
            setIsGuestMode(false);
          }
        } catch (migErr) {
          console.warn("Guest data migration notice:", migErr);
        }
      } else {
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    // 1. If real Firebase authenticated user
    if (firebaseUser) {
      const backupKey = `expense_tracker_backup_${firebaseUser.uid}`;
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

      const userRef = doc(db, 'users', firebaseUser.uid);

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
          setDoc(userRef, {
            categories: DEFAULT_CATEGORIES,
            incomeCategories: DEFAULT_INCOME_CATEGORIES,
            categoryColors: DEFAULT_CATEGORY_COLORS,
            budgets: DEFAULT_BUDGETS,
            email: firebaseUser.email,
            profile: {
              displayName: firebaseUser.displayName || '',
              baseCurrency: 'VND',
              frequentCurrencies: ['VND', 'USD'],
              onboarded: false,
            }
          }, { merge: true }).catch((err) => {
            console.warn("Could not auto-initialize user document:", err);
          });
        }
        setLoading(false);
      }, (error) => {
         console.warn("User data sync notice:", error);
         setLoading(false);
      });

      const expensesCol = collection(db, 'users', firebaseUser.uid, 'expenses');
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

        exps.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        if (exps.length > 0) {
          setExpenses(exps);
          try {
            localStorage.setItem(backupKey, JSON.stringify(exps));
          } catch (e) {
            console.warn("Could not write local backup:", e);
          }
        } else {
          // Check local backups if available
          try {
            let recovered: Expense[] = [];
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

            if (recovered.length > 0) {
              setExpenses(recovered);
              localStorage.setItem(backupKey, JSON.stringify(recovered));
              for (const item of recovered) {
                try {
                  const ref = doc(collection(db, 'users', firebaseUser.uid, 'expenses'));
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
    } 
    
    // 2. If guest mode (No Firebase account required)
    if (isGuestMode) {
      try {
        const rawExpenses = localStorage.getItem('expense_tracker_guest_expenses');
        if (rawExpenses) {
          const parsed = JSON.parse(rawExpenses);
          if (Array.isArray(parsed)) setExpenses(parsed);
        }

        const rawBudgets = localStorage.getItem('expense_tracker_guest_budgets');
        if (rawBudgets) {
          setBudgets(JSON.parse(rawBudgets));
        }

        const rawCategories = localStorage.getItem('expense_tracker_guest_categories');
        if (rawCategories) {
          setCategories(JSON.parse(rawCategories));
        }

        const rawIncomeCategories = localStorage.getItem('expense_tracker_guest_income_categories');
        if (rawIncomeCategories) {
          setIncomeCategories(JSON.parse(rawIncomeCategories));
        }

        const rawCategoryColors = localStorage.getItem('expense_tracker_guest_category_colors');
        if (rawCategoryColors) {
          setCategoryColors(JSON.parse(rawCategoryColors));
        }

        const rawProfile = localStorage.getItem('expense_tracker_guest_profile');
        if (rawProfile) {
          setUserProfile(JSON.parse(rawProfile));
        } else {
          setUserProfile({
            displayName: localStorage.getItem('expense_tracker_guest_name') || 'Khách',
            persona: 'student',
            baseCurrency: 'VND',
            frequentCurrencies: ['VND', 'USD'],
            onboarded: true
          });
        }
      } catch (err) {
        console.warn("Error hydrating guest data:", err);
      }
      setLoading(false);
      return;
    }

    // 3. Not logged in and not in guest mode
    setExpenses([]);
    setUserProfile(null);
    setCategories(DEFAULT_CATEGORIES);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setCategoryColors(DEFAULT_CATEGORY_COLORS);
    setBudgets({});
    setLoading(false);
  }, [firebaseUser, isGuestMode]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      if (firebaseUser) {
        const expenseRef = doc(collection(db, 'users', firebaseUser.uid, 'expenses'));
        const cleanExpense = Object.fromEntries(
          Object.entries(expense).filter(([_, v]) => v !== undefined)
        );
        await setDoc(expenseRef, {
          ...cleanExpense,
          createdAt: new Date().toISOString()
        });
        return expenseRef.id;
      } else if (isGuestMode) {
        const newId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const newExpense: Expense = {
          ...expense,
          id: newId
        };
        setExpenses(prev => {
          const next = [newExpense, ...prev];
          try {
            localStorage.setItem('expense_tracker_guest_expenses', JSON.stringify(next));
          } catch (e) {
            console.warn("Local storage write error:", e);
          }
          return next;
        });
        return newId;
      }
      return;
    } catch (error: any) {
      console.error("Lỗi khi thêm chi tiêu:", error);
      alert("Không thể lưu chi tiêu: " + error.message);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'expenses', id));
      } catch (error: any) {
        console.error("Lỗi khi xoá chi tiêu:", error);
        throw error;
      }
    } else if (isGuestMode) {
      setExpenses(prev => {
        const next = prev.filter(e => e.id !== id);
        try {
          localStorage.setItem('expense_tracker_guest_expenses', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } else {
      throw new Error("Chưa đăng nhập");
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'expenses', id), updates);
      } catch (error: any) {
        console.error("Lỗi khi cập nhật chi tiêu:", error);
        throw error;
      }
    } else if (isGuestMode) {
      setExpenses(prev => {
        const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
        try {
          localStorage.setItem('expense_tracker_guest_expenses', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } else {
      throw new Error("Chưa đăng nhập");
    }
  };

  const updateUserSettings = async (
    newBudgets: BudgetMap, 
    newCategories: Category[], 
    newIncomeCategories?: Category[],
    newCategoryColors?: Record<string, string>
  ) => {
    const safeBudgets = { ...newBudgets };
    Object.keys(safeBudgets).forEach(key => {
      if (safeBudgets[key] === undefined) {
        delete safeBudgets[key];
      }
    });

    if (firebaseUser) {
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
      await setDoc(doc(db, 'users', firebaseUser.uid), updateData, { merge: true });
    } else if (isGuestMode) {
      setBudgets(safeBudgets);
      setCategories(newCategories);
      if (newIncomeCategories) setIncomeCategories(newIncomeCategories);
      if (newCategoryColors) setCategoryColors(newCategoryColors);
      try {
        localStorage.setItem('expense_tracker_guest_budgets', JSON.stringify(safeBudgets));
        localStorage.setItem('expense_tracker_guest_categories', JSON.stringify(newCategories));
        if (newIncomeCategories) localStorage.setItem('expense_tracker_guest_income_categories', JSON.stringify(newIncomeCategories));
        if (newCategoryColors) localStorage.setItem('expense_tracker_guest_category_colors', JSON.stringify(newCategoryColors));
      } catch (e) {}
    }
  };
  
  const updateExpensesCategory = async (renames: {old: string, new: string}[]) => {
     if (renames.length === 0) return;
     if (firebaseUser) {
       const promises = expenses.map(async (exp) => {
          const rename = renames.find(r => r.old === exp.category);
          if (rename) {
             await updateDoc(doc(db, 'users', firebaseUser.uid, 'expenses', exp.id), {
               category: rename.new
             });
          }
       });
       await Promise.all(promises);
     } else if (isGuestMode) {
       setExpenses(prev => {
         const next = prev.map(exp => {
           const rename = renames.find(r => r.old === exp.category);
           return rename ? { ...exp, category: rename.new } : exp;
         });
         try {
           localStorage.setItem('expense_tracker_guest_expenses', JSON.stringify(next));
         } catch (e) {}
         return next;
       });
     }
  };

  const updateUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        profile: {
          ...(userProfile || {}),
          ...profileUpdates
        }
      }, { merge: true });
    } else if (isGuestMode) {
      setUserProfile(prev => {
        const next: UserProfile = {
          displayName: 'Khách',
          persona: 'student',
          baseCurrency: 'VND',
          frequentCurrencies: ['VND', 'USD'],
          onboarded: true,
          ...(prev || {}),
          ...profileUpdates
        };
        try {
          localStorage.setItem('expense_tracker_guest_profile', JSON.stringify(next));
          if (next.displayName) {
            localStorage.setItem('expense_tracker_guest_name', next.displayName);
          }
        } catch (e) {}
        return next;
      });
    }
  };

  const enterGuestMode = (displayName: string = 'Khách') => {
    try {
      localStorage.setItem('expense_tracker_guest_mode', 'true');
      localStorage.setItem('expense_tracker_guest_name', displayName);
    } catch (e) {}
    setIsGuestMode(true);
    setLoading(false);
  };

  const exitGuestMode = () => {
    try {
      localStorage.removeItem('expense_tracker_guest_mode');
    } catch (e) {}
    setIsGuestMode(false);
  };

  return {
    user,
    firebaseUser,
    isGuestMode,
    enterGuestMode,
    exitGuestMode,
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
