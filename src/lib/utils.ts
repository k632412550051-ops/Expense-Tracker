import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    const b = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${b}tỷ`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    const m = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${m}tr`;
  }
  if (Math.abs(amount) >= 1_000) {
    const k = (amount / 1_000).toFixed(0);
    return `${k}k`;
  }
  return `${amount}đ`;
}
