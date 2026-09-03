import React, { useState } from 'react';
import { BudgetMap, Category, PRESET_CATEGORY_COLORS, getCategoryColor } from '../types';
import { X, Save, Plus, Trash2, Edit2, Palette } from 'lucide-react';

interface BudgetSettingsModalProps {
  budgets: BudgetMap;
  categories: Category[];
  incomeCategories: Category[];
  categoryColors?: Record<string, string>;
  onSave: (
    newBudgets: BudgetMap, 
    newCategories: Category[], 
    renames: {old: string, new: string}[], 
    newIncomeCategories: Category[], 
    incomeRenames: {old: string, new: string}[],
    newCategoryColors: Record<string, string>
  ) => void;
  onClose: () => void;
}

export function BudgetSettingsModal({ budgets, categories, incomeCategories, categoryColors = {}, onSave, onClose }: BudgetSettingsModalProps) {
  const [tab, setTab] = useState<'expense' | 'income'>('income');
  const [localBudgets, setLocalBudgets] = useState<BudgetMap>({ ...budgets });
  const [localCategories, setLocalCategories] = useState<Category[]>([...categories]);
  const [localIncomeCategories, setLocalIncomeCategories] = useState<Category[]>([...incomeCategories]);
  const [localColors, setLocalColors] = useState<Record<string, string>>({ ...categoryColors });
  const [colorPickerCategory, setColorPickerCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState<string>('');
  const [renames, setRenames] = useState<{old: string, new: string}[]>([]);
  const [incomeRenames, setIncomeRenames] = useState<{old: string, new: string}[]>([]);

  const handleChange = (category: Category, value: string) => {
    setLocalBudgets(prev => ({
      ...prev,
      [category]: Number(value) || 0
    }));
  };

  const handleSetCategoryColor = (category: Category, color: string) => {
    setLocalColors(prev => ({
      ...prev,
      [category]: color
    }));
    setColorPickerCategory(null);
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (tab === 'expense') {
      if (localCategories.includes(trimmed)) return;
      setLocalCategories(prev => [...prev, trimmed]);
      setLocalBudgets(prev => ({ ...prev, [trimmed]: 0 }));
      if (!localColors[trimmed]) {
        setLocalColors(prev => ({
          ...prev,
          [trimmed]: getCategoryColor(trimmed, 'expense')
        }));
      }
    } else {
      if (localIncomeCategories.includes(trimmed)) return;
      setLocalIncomeCategories(prev => [...prev, trimmed]);
      if (!localColors[trimmed]) {
        setLocalColors(prev => ({
          ...prev,
          [trimmed]: '#10B981'
        }));
      }
    }
    setNewCatName('');
  };

  const handleDeleteCategory = (category: Category) => {
    if (tab === 'expense') {
      setLocalCategories(prev => prev.filter(c => c !== category));
    } else {
      setLocalIncomeCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleSaveRename = () => {
    if (!editingCategory) return;
    const trimmed = editCategoryName.trim();
    if (!trimmed || trimmed === editingCategory) {
      setEditingCategory(null);
      return;
    }
    
    // Transfer color
    setLocalColors(prev => {
      const next = { ...prev };
      if (next[editingCategory]) {
        next[trimmed] = next[editingCategory];
        delete next[editingCategory];
      }
      return next;
    });

    if (tab === 'expense') {
      if (localCategories.includes(trimmed)) {
        setEditingCategory(null);
        return;
      }
      setLocalCategories(prev => prev.map(c => c === editingCategory ? trimmed : c));
      setLocalBudgets(prev => {
        const next = { ...prev };
        next[trimmed] = next[editingCategory] !== undefined ? next[editingCategory] : 0;
        delete next[editingCategory];
        return next;
      });
      setRenames(prev => {
        const existing = prev.find(r => r.new === editingCategory);
        if (existing) {
          return prev.map(r => r.new === editingCategory ? { ...r, new: trimmed } : r);
        }
        return [...prev, { old: editingCategory, new: trimmed }];
      });
    } else {
      if (localIncomeCategories.includes(trimmed)) {
        setEditingCategory(null);
        return;
      }
      setLocalIncomeCategories(prev => prev.map(c => c === editingCategory ? trimmed : c));
      setIncomeRenames(prev => {
        const existing = prev.find(r => r.new === editingCategory);
        if (existing) {
          return prev.map(r => r.new === editingCategory ? { ...r, new: trimmed } : r);
        }
        return [...prev, { old: editingCategory, new: trimmed }];
      });
    }
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localBudgets, localCategories, renames, localIncomeCategories, incomeRenames, localColors);
  };

  const currentList = tab === 'expense' ? localCategories : localIncomeCategories;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="liquid-glass-elevated rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white flex flex-col max-h-[90vh] relative">
        {/* Specular line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

        <div className="flex items-center justify-between p-5 border-b border-blue-100/40 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Thiết lập danh mục</h2>
            <p className="text-xs text-slate-500 font-medium">Tùy chỉnh tên, màu sắc và ngân sách</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/80 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex p-1 rounded-2xl bg-blue-950/5 border border-white/70 backdrop-blur-md mb-5">
            <button
              type="button"
              onClick={() => setTab('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'income' ? 'bg-white text-emerald-600 shadow-md shadow-blue-500/10 border border-white/80' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khoản thu
            </button>
            <button
              type="button"
              onClick={() => setTab('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'expense' ? 'bg-white text-blue-700 shadow-md shadow-blue-500/10 border border-white/80' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khoản chi & Ngân sách
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-4 font-medium">
            Thêm, xóa, hoặc đổi tên danh mục{tab === 'expense' ? ' và điều chỉnh hạn mức chi tiêu' : ''}. Nhấp vào tên để đổi.
          </p>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Tên danh mục mới..."
              className="flex-1 px-3.5 py-2.5 bg-white/60 border border-white/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-xs sm:text-sm shadow-inner shadow-blue-900/5 font-medium"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
            />
            <button 
              type="button"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-4 py-2.5 liquid-glass-btn-primary text-white rounded-2xl disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 pr-1">
            {currentList.length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-6 font-medium">Chưa có danh mục nào.</p>
            ) : currentList.map(category => {
              const currentColor = localColors[category] || getCategoryColor(category, tab === 'income' ? 'income' : 'expense');
              const isPickerOpen = colorPickerCategory === category;

              return (
              <div key={category} className="flex flex-col gap-2 relative bg-white/50 p-3 rounded-2xl border border-white/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
                    {/* Color Swatch / Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setColorPickerCategory(isPickerOpen ? null : category)}
                        className="w-6 h-6 rounded-full ring-2 ring-white shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: currentColor }}
                        title="Chọn màu đại diện"
                      />

                      {/* Color Palette Popover */}
                      {isPickerOpen && (
                        <div className="absolute left-0 top-8 z-30 bg-white p-3 rounded-xl shadow-xl border border-gray-100 w-56 flex flex-col gap-2">
                          <div className="text-xs font-semibold text-gray-500 flex items-center justify-between">
                            <span>Bảng màu danh mục</span>
                            <button 
                              type="button" 
                              onClick={() => setColorPickerCategory(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-2 pt-1">
                            {PRESET_CATEGORY_COLORS.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleSetCategoryColor(category, c)}
                                className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${c === currentColor ? 'ring-2 ring-emerald-500 ring-offset-1' : 'border-gray-200'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Tùy chọn:</span>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => handleSetCategoryColor(category, e.target.value)}
                              className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                            />
                            <span className="text-xs font-mono text-gray-600 uppercase">{currentColor}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {editingCategory === category ? (
                      <input 
                        type="text"
                        value={editCategoryName}
                        onChange={e => setEditCategoryName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveRename(); }
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        onBlur={handleSaveRename}
                      />
                    ) : (
                      <label 
                        className="text-sm font-medium text-gray-700 cursor-pointer hover:text-emerald-600 flex items-center gap-2 group"
                        onClick={() => {
                           setEditingCategory(category);
                           setEditCategoryName(category);
                        }}
                        title="Nhấn để đổi tên"
                      >
                        {category}
                        <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-emerald-500" />
                      </label>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {tab === 'expense' && (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={localBudgets[category] || ''}
                      onChange={(e) => handleChange(category, e.target.value)}
                      className="w-full pl-4 pr-12 py-2 bg-white/70 border border-white/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-xs sm:text-sm font-semibold shadow-inner shadow-blue-900/5 text-slate-800"
                      placeholder="0"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">VNĐ</span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
          
        <div className="p-4 border-t border-blue-100/40 flex justify-end gap-3 bg-white/40 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 hover:bg-white/80 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            className="liquid-glass-btn-primary liquid-crystal-sheen px-5 py-2.5 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/25"
          >
            <Save className="w-4 h-4" /> 
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

