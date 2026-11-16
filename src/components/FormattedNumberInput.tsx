import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CurrencyCode, CURRENCY_OPTIONS } from '../types';
import { formatNumberWithSeparators, parseFormattedNumber, cn } from '../lib/utils';

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | string;
  currency?: CurrencyCode;
  onValueChange: (numericValue: number, formattedValue: string) => void;
}

/**
 * Finds the caret index in `formatted` corresponding to `targetTokens` significant characters
 * (digits for zero-decimal currencies; digits or decimal dot for decimal currencies).
 */
function findCaretPosition(formatted: string, targetTokens: number, isZeroDecimal: boolean): number {
  if (targetTokens <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    const isToken = isZeroDecimal ? /\d/.test(ch) : /[\d.]/.test(ch);
    if (isToken) {
      seen++;
      if (seen === targetTokens) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

function formatWhileEditing(raw: string, prevDisplay: string, isZeroDecimal: boolean, fractionDigits: number): string {
  if (!raw) return '';

  if (isZeroDecimal) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    // If replacing a lone "0" by typing a non-zero digit at the end, drop the lone "0"
    if (prevDisplay === '0' && digits.length === 2 && digits[0] === '0' && digits[1] !== '0') {
      return digits[1];
    }
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Decimal currency (',' as thousand separator, '.' as decimal point)
  // Treat comma as decimal only if user just typed a comma when no dot exists and it's not a thousand separator
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  const firstDotIdx = cleaned.indexOf('.');
  if (firstDotIdx === -1) {
    if (prevDisplay === '0' && cleaned.length === 2 && cleaned[0] === '0' && cleaned[1] !== '0') {
      return cleaned[1];
    }
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const intPart = cleaned.slice(0, firstDotIdx);
  const decPart = cleaned.slice(firstDotIdx + 1).replace(/\./g, '').slice(0, fractionDigits);
  const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  return `${formattedInt}.${decPart}`;
}

export function FormattedNumberInput({
  value,
  currency = 'VND',
  onValueChange,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}: FormattedNumberInputProps) {
  const option = CURRENCY_OPTIONS.find(c => c.code === currency) || CURRENCY_OPTIONS[0];
  const isZeroDecimal = option.fractionDigits === 0;
  const separatorChar = isZeroDecimal ? '.' : ',';

  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const pendingCaretRef = useRef<number | null>(null);

  const formatExternal = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFormattedNumber(val);
    if (!num || num <= 0) return '';
    return formatNumberWithSeparators(num, currency);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatExternal(value));

  // Sync external value changes when not actively holding mid-edit zeros, or when externally cleared to 0/empty
  useEffect(() => {
    const externalNum = typeof value === 'number' ? value : parseFormattedNumber(value);
    const currentNum = parseFormattedNumber(displayValue);

    if (!isFocusedRef.current) {
      setDisplayValue(formatExternal(value));
    } else if ((value === '' || externalNum === 0) && currentNum !== 0) {
      // External reset (e.g. form submitted while still focused)
      setDisplayValue('');
    }
  }, [value, currency]);

  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && inputRef.current && isFocusedRef.current) {
      const pos = Math.min(pendingCaretRef.current, displayValue.length);
      inputRef.current.setSelectionRange(pos, pos);
      pendingCaretRef.current = null;
    }
  }, [displayValue]);

  const applyEdit = (rawNext: string, rawCaretPos: number) => {
    const beforeCaret = rawNext.slice(0, rawCaretPos);
    const tokensBeforeCaret = isZeroDecimal
      ? beforeCaret.replace(/\D/g, '').length
      : beforeCaret.replace(/[^0-9.]/g, '').length;

    const formatted = formatWhileEditing(rawNext, displayValue, isZeroDecimal, option.fractionDigits);
    const nextCaret = findCaretPosition(formatted, tokensBeforeCaret, isZeroDecimal);

    pendingCaretRef.current = nextCaret;
    setDisplayValue(formatted);
    onValueChange(parseFormattedNumber(formatted), formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    applyEdit(raw, caret);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    // Only intercept collapsed selection directly adjacent to a thousand separator
    if (start !== end) return;

    if (e.key === 'Backspace' && start > 0 && displayValue[start - 1] === separatorChar) {
      // Delete the digit immediately before the separator instead of letting separator re-insert block deletion
      if (start >= 2) {
        e.preventDefault();
        const nextRaw = displayValue.slice(0, start - 2) + displayValue.slice(start - 1);
        applyEdit(nextRaw, start - 2);
      }
    } else if (e.key === 'Delete' && start < displayValue.length && displayValue[start] === separatorChar) {
      // Delete the digit immediately after the separator
      if (start + 1 < displayValue.length) {
        e.preventDefault();
        const nextRaw = displayValue.slice(0, start + 1) + displayValue.slice(start + 2);
        applyEdit(nextRaw, start + 1);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    const num = parseFormattedNumber(displayValue);
    const normalized = num > 0 ? formatNumberWithSeparators(num, currency) : '';
    setDisplayValue(normalized);
    onValueChange(num, normalized);
    onBlur?.(e);
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode={isZeroDecimal ? 'numeric' : 'decimal'}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('tabular-nums', className)}
    />
  );
}
