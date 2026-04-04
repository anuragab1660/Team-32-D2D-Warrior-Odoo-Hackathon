import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined) return '₹0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(
  date: string | Date | undefined | null,
  fmt = 'dd MMM yyyy'
): string {
  if (!date) return '—'
  try {
    return format(new Date(date), fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function computeDiscount(
  discount: { type: string; value: number } | null | undefined,
  unitPrice: number,
  quantity: number
): number {
  if (!discount) return 0
  const total = unitPrice * quantity
  if (discount.type === 'percentage') return total * (discount.value / 100)
  if (discount.type === 'fixed') return Math.min(discount.value, total)
  return 0
}

export function billingPeriodLabel(period: string): string {
  const map: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  }
  return map[period] || period
}

/**
 * Calculate the price for a given billing period based on the monthly base price.
 * - daily:   proportional (monthly / 30)
 * - weekly:  proportional (monthly × 7 / 30)
 * - monthly: base price (no change)
 * - yearly:  10× monthly (2 months free — ~16.7% discount)
 * - onetime: same as monthly
 */
export function getPeriodPrice(baseMonthlyPrice: number, period: string): number {
  switch (period) {
    case 'daily':   return Math.max(1, Math.round(baseMonthlyPrice / 30))
    case 'weekly':  return Math.round((baseMonthlyPrice * 7) / 30)
    case 'monthly': return baseMonthlyPrice
    case 'yearly':  return Math.round(baseMonthlyPrice * 10)
    case 'onetime': return baseMonthlyPrice
    default:        return baseMonthlyPrice
  }
}

/**
 * Returns annual savings vs paying monthly × 12 (0 if no savings).
 */
export function getPeriodSavings(baseMonthlyPrice: number, period: string): number {
  if (period === 'yearly') return Math.round(baseMonthlyPrice * 2)
  return 0
}

/**
 * Returns a human-readable label like "₹1,000/month" or "₹10,000/year".
 */
export function formatPeriodPrice(price: number, period: string): string {
  const periodSuffix: Record<string, string> = {
    daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year', onetime: 'one-time',
  }
  const suffix = periodSuffix[period] ?? period
  return period === 'onetime'
    ? `₹${price.toLocaleString('en-IN')}`
    : `₹${price.toLocaleString('en-IN')}/${suffix}`
}
