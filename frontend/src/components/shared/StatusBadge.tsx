import type { SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@/types'

const subscriptionConfig: Record<SubscriptionStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'status-draft' },
  quotation: { label: 'Quotation', cls: 'status-blue' },
  confirmed: { label: 'Confirmed', cls: 'status-purple' },
  active:    { label: 'Active',    cls: 'status-active' },
  closed:    { label: 'Closed',    cls: 'status-draft' },
}

const invoiceConfig: Record<InvoiceStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'status-draft' },
  confirmed: { label: 'Confirmed', cls: 'status-blue' },
  paid:      { label: 'Paid',      cls: 'status-active' },
  cancelled: { label: 'Cancelled', cls: 'status-error' },
}

const paymentConfig: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'status-pending' },
  success: { label: 'Paid',    cls: 'status-active' },
  failed:  { label: 'Failed',  cls: 'status-error' },
}

interface StatusBadgeProps {
  status: string
  type: 'subscription' | 'invoice' | 'payment'
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let cls = 'status-draft'
  let label = status.charAt(0).toUpperCase() + status.slice(1)

  if (type === 'subscription') {
    const cfg = subscriptionConfig[status as SubscriptionStatus]
    if (cfg) { cls = cfg.cls; label = cfg.label }
  } else if (type === 'invoice') {
    const cfg = invoiceConfig[status as InvoiceStatus]
    if (cfg) { cls = cfg.cls; label = cfg.label }
  } else if (type === 'payment') {
    const cfg = paymentConfig[status as PaymentStatus]
    if (cfg) { cls = cfg.cls; label = cfg.label }
  }

  return <span className={cls}>{label}</span>
}

export function ActiveBadge({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <span className={isActive ? 'status-active' : 'status-draft'}>
      {isActive ? activeLabel : inactiveLabel}
    </span>
  )
}
