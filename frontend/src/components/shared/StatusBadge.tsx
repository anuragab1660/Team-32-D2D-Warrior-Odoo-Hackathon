import type { SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@/types'

const subscriptionBadgeClass: Record<SubscriptionStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  quotation: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-violet-100 text-violet-700 border-violet-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-200 text-slate-500 border-slate-300',
}

const invoiceBadgeClass: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const paymentBadgeClass: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
}

interface StatusBadgeProps {
  status: string
  type: 'subscription' | 'invoice' | 'payment'
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let className = 'bg-slate-100 text-slate-600 border-slate-200'
  if (type === 'subscription') className = subscriptionBadgeClass[status as SubscriptionStatus] || className
  else if (type === 'invoice') className = invoiceBadgeClass[status as InvoiceStatus] || className
  else if (type === 'payment') className = paymentBadgeClass[status as PaymentStatus] || className

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function ActiveBadge({ isActive, activeLabel = 'Active', inactiveLabel = 'Inactive' }: {
  isActive: boolean; activeLabel?: string; inactiveLabel?: string
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
      isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
    }`}>
      {isActive ? activeLabel : inactiveLabel}
    </span>
  )
}
