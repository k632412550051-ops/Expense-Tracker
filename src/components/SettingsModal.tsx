import React, { useState } from 'react';
import { AppSettings, CURRENCY_OPTIONS, CurrencyCode, ThemeMode } from '../types';
import { 
  X, 
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  Coins, 
  Sun, 
  Moon, 
  Laptop, 
  Eye, 
  EyeOff, 
  Sliders, 
  Check, 
  ShieldCheck, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  user: {
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  };
  onOpenBudgetModal: () => void;
  onLogout: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onOpenBudgetModal,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'currency' | 'appearance'>('general');

  if (!isOpen) return null;

  const userInitial = user.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : user.email 
      ? user.email.charAt(0).toUpperCase() 
      : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="liquid-glass-elevated w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/80 dark:border-white/10 dark:bg-slate-900/90 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
              <SettingsIcon className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight">
                Cài đặt & Tùy chọn
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tài khoản, tiền tệ và trải nghiệm Liquid Glass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Tài khoản & Riêng tư</span>
          </button>
          <button
            onClick={() => setActiveTab('currency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'currency'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Tiền tệ ({settings.currency})</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Giao diện</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: GENERAL & ACCOUNT */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Account Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="User Avatar" 
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-lg flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-xs">
                        {userInitial}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                        {user.displayName || 'Người dùng Google'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                        {user.email || 'Đã đăng nhập'}
                      </p>
                      <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Đồng bộ Firestore Cloud an toàn</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                </div>
              </div>

              {/* Privacy Mode Toggle */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                    settings.privacyMode 
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {settings.privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Chế độ riêng tư (Privacy Mode)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Che số dư và tổng tiền bằng <span className="font-mono font-bold">••••••</span> khi mở app ở nơi công cộng
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.privacyMode}
                    onChange={(e) => onUpdateSettings({ privacyMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Budget & Category Management Entry Point */}
              <div 
                onClick={() => {
                  onClose();
                  onOpenBudgetModal();
                }}
                className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Quản lý Ngân sách & Danh mục
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cấu hình định mức tháng, thêm/sửa danh mục Thu - Chi và đổi màu sắc
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRENCY */}
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Chọn đơn vị tiền tệ mặc định cho toàn bộ hóa đơn, biểu đồ và số dư của bạn:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {CURRENCY_OPTIONS.map((c) => {
                  const isSelected = settings.currency === c.code;
                  return (
                    <div
                      key={c.code}
                      onClick={() => onUpdateSettings({ currency: c.code })}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400/30'
                          : 'bg-white/70 dark:bg-slate-800/60 border-white/90 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                              {c.code} ({c.symbol})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Ví dụ định dạng: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(1500000, c.code)}</span>
                          </p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE / THEME */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tùy chỉnh phong cách giao diện Liquid Glass phù hợp với môi trường làm việc của bạn:
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Light */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                    settings.theme === 'light'
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400/30'
                      : 'bg-white/70 dark:bg-slate-800/60 border-white/90 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Sáng</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Kính pha lê</p>
                  </div>
                </button>

                {/* Dark */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                    settings.theme === 'dark'
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400/30'
                      : 'bg-white/70 dark:bg-slate-800/60 border-white/90 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Tối</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Obsidian Glass</p>
                  </div>
                </button>

                {/* System */}
                <button
                  onClick={() => onUpdateSettings({ theme: 'system' })}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                    settings.theme === 'system'
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400/30'
                      : 'bg-white/70 dark:bg-slate-800/60 border-white/90 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-500/20">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Hệ thống</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Tự động</p>
                  </div>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
                💡 <span className="font-semibold">Mẹo:</span> Chế độ Tối (Obsidian Glass) giúp tiết kiệm pin trên màn hình OLED và bảo vệ mắt khi ghi chép tài chính vào ban đêm.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
