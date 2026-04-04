'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useInvoices } from '@/hooks/useInvoices'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BellIcon, CheckCheckIcon } from 'lucide-react'

/**
 * @module portal/notifications
 * @api-calls GET /api/subscriptions/my, GET /api/invoices/my
 * @depends-on useSubscriptions, useInvoices
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: client-side notification center derived from subscriptions and invoices
 */

interface Notification {
  id: string
  type: 'invoice_issued' | 'invoice_overdue' | 'sub_expiring' | 'payment_confirmed' | 'sub_active'
  icon: string
  message: string
  href: string
  timestamp: string
}

const READ_KEY = 'prosubx_read_notifications'

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')) } catch { return new Set() }
}

function markRead(ids: string[]) {
  try {
    const existing = getReadIds()
    ids.forEach(id => existing.add(id))
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(existing)))
  } catch { /* noop */ }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function NotificationsPage() {
  /**
   * @module portal/notifications
   * @api-calls GET /api/subscriptions/my, GET /api/invoices/my
   * @depends-on useSubscriptions, useInvoices
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: client-side notification center derived from subscriptions and invoices
   */
  const { subscriptions, fetchMySubscriptions } = useSubscriptions()
  const { invoices, fetchMyInvoices } = useInvoices()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setReadIds(getReadIds())
  }, [])

  const buildNotifications = useCallback(() => {
    const notifs: Notification[] = []

    // Expiring subscriptions
    subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.expiration_date) {
        const days = daysUntil(sub.expiration_date)
        if (days >= 0 && days <= 7) {
          notifs.push({
            id: `sub_expiring_${sub.id}`,
            type: 'sub_expiring',
            icon: '⚠️',
            message: `${sub.subscription_number} expires in ${days} day${days !== 1 ? 's' : ''}. Renew now.`,
            href: `/orders/${sub.id}`,
            timestamp: sub.expiration_date,
          })
        }
      }
      if (sub.status === 'active') {
        notifs.push({
          id: `sub_active_${sub.id}`,
          type: 'sub_active',
          icon: '🟢',
          message: `Your subscription ${sub.subscription_number} is active.`,
          href: `/orders/${sub.id}`,
          timestamp: sub.start_date,
        })
      }
    })

    // Invoices
    invoices.forEach(inv => {
      if (inv.status === 'overdue') {
        const days = inv.due_date ? Math.abs(daysUntil(inv.due_date)) : 0
        notifs.push({
          id: `inv_overdue_${inv.id}`,
          type: 'invoice_overdue',
          icon: '🔴',
          message: `Invoice ${inv.invoice_number} is ${days} day${days !== 1 ? 's' : ''} overdue. Pay ₹${inv.grand_total.toLocaleString('en-IN')} now.`,
          href: `/my-invoices/${inv.id}`,
          timestamp: inv.due_date || inv.issued_date,
        })
      } else if (inv.status === 'confirmed') {
        notifs.push({
          id: `inv_issued_${inv.id}`,
          type: 'invoice_issued',
          icon: '📄',
          message: `Invoice ${inv.invoice_number} (₹${inv.grand_total.toLocaleString('en-IN')}) is due${inv.due_date ? ` on ${fmtDate(inv.due_date)}` : ''}.`,
          href: `/my-invoices/${inv.id}`,
          timestamp: inv.issued_date,
        })
      } else if (inv.status === 'paid') {
        notifs.push({
          id: `inv_paid_${inv.id}`,
          type: 'payment_confirmed',
          icon: '✅',
          message: `Payment of ₹${inv.grand_total.toLocaleString('en-IN')} received for ${inv.invoice_number}.`,
          href: `/my-invoices/${inv.id}`,
          timestamp: inv.issued_date,
        })
      }
    })

    // Sort by most urgent/recent
    const priority: Record<string, number> = { invoice_overdue: 0, sub_expiring: 1, invoice_issued: 2, payment_confirmed: 3, sub_active: 4 }
    notifs.sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99))

    setNotifications(notifs)
  }, [subscriptions, invoices])

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchMySubscriptions(), fetchMyInvoices()])
      setLoading(false)
    }
    load()
  }, [fetchMySubscriptions, fetchMyInvoices])

  useEffect(() => {
    if (!loading) buildNotifications()
  }, [loading, buildNotifications])

  const handleMarkAllRead = () => {
    const ids = notifications.map(n => n.id)
    markRead(ids)
    setReadIds(new Set(ids))
  }

  const handleMarkRead = (id: string) => {
    markRead([id])
    setReadIds(prev => new Set(Array.from(prev).concat(id)))
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheckIcon className="h-4 w-4" />Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BellIcon className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold mb-1">No notifications</p>
          <p className="text-sm text-slate-400">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const isRead = readIds.has(notif.id)
            return (
              <motion.div
                key={notif.id}
                custom={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={notif.href}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors hover:shadow-sm ${
                    isRead
                      ? 'bg-white border-slate-100 text-slate-500'
                      : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
                  }`}
                >
                  <span className="text-xl mt-0.5">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isRead ? 'text-slate-500' : 'font-medium text-slate-800'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(notif.timestamp)}</p>
                  </div>
                  {!isRead && (
                    <Badge className="bg-indigo-600 text-white text-[10px] h-4 w-4 rounded-full p-0 flex items-center justify-center shrink-0">
                      •
                    </Badge>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
