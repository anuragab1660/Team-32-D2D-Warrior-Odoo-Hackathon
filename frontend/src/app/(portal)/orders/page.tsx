'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ZapIcon, ArrowRightIcon } from 'lucide-react'
import type { SubscriptionStatus } from '@/types'

/**
 * @module portal/orders
 * @api-calls GET /api/subscriptions/my
 * @depends-on useSubscriptions
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: subscription list with status filters, progress bars, expiry warnings
 */

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
]

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getProgressPct(startDate: string, expiryDate: string) {
  const start = new Date(startDate).getTime()
  const end = new Date(expiryDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  const pct = ((now - start) / (end - start)) * 100
  return Math.min(Math.max(pct, 0), 100)
}

function getPeriodDays(startDate: string, expiryDate: string) {
  const diff = new Date(expiryDate).getTime() - new Date(startDate).getTime()
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1)
}

function getDaysUsed(startDate: string) {
  const diff = Date.now() - new Date(startDate).getTime()
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersPage() {
  /**
   * @module portal/orders
   * @api-calls GET /api/subscriptions/my
   * @depends-on useSubscriptions
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: subscription list with status filters, progress bars, expiry warnings
   */
  const { subscriptions, loading, fetchMySubscriptions } = useSubscriptions()
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchMySubscriptions()
  }, [fetchMySubscriptions])

  const filtered = activeTab === 'all'
    ? subscriptions
    : subscriptions.filter(s => s.status === (activeTab as SubscriptionStatus))

  // Status counts for subtitle
  const counts = {
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Subscriptions</h1>
        <p className="text-slate-500 mt-1">
          {counts.active} active
          {counts.paused > 0 ? ` · ${counts.paused} paused` : ''}
          {counts.expired > 0 ? ` · ${counts.expired} expired` : ''}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTab === tab.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {subscriptions.filter(s => s.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ZapIcon className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold mb-1">No subscriptions yet</p>
          <p className="text-sm text-slate-400 mb-4">Browse the shop and subscribe to products.</p>
          <Link href="/shop">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Browse Shop</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub, i) => {
            const pct = sub.expiration_date ? getProgressPct(sub.start_date, sub.expiration_date) : 0
            const totalDays = sub.expiration_date ? getPeriodDays(sub.start_date, sub.expiration_date) : 0
            const usedDays = getDaysUsed(sub.start_date)
            const daysLeft = sub.expiration_date ? daysUntil(sub.expiration_date) : null
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
            const isExpired = sub.status === 'expired' || (daysLeft !== null && daysLeft < 0)
            const planName = (sub as unknown as Record<string,string>).plan_name ?? sub.plan?.name ?? 'No plan'
            const billingPeriod = (sub as unknown as Record<string,string>).billing_period
            const linesCount = (sub as unknown as Record<string,unknown>).lines_count as number ?? sub.lines?.length ?? 0
            const totalAmount = (sub as unknown as Record<string,unknown>).total_amount as number ?? 0

            let barColor = 'bg-indigo-500'
            if (isExpiringSoon) barColor = 'bg-amber-400'
            if (isExpired) barColor = 'bg-red-400'

            return (
              <motion.div
                key={sub.id}
                custom={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">{sub.subscription_number}</p>
                        {isExpiringSoon && !isExpired && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Expiring soon</Badge>
                        )}
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Expired</Badge>
                        )}
                      </div>
                      <Link href={`/orders/${sub.id}`}>
                        <ArrowRightIcon className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-slate-600">{planName}</span>
                      {billingPeriod && (
                        <Badge variant="outline" className="text-xs capitalize">{billingPeriod}</Badge>
                      )}
                      <StatusBadge status={sub.status} type="subscription" />
                    </div>

                    {sub.expiration_date && (
                      <>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          {Math.min(usedDays, totalDays)} of {totalDays} days used · Expires {fmtDate(sub.expiration_date)}
                        </p>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {linesCount > 0 ? `${linesCount} product${linesCount !== 1 ? 's' : ''}` : 'No products'}
                        {totalAmount > 0 ? ` · ₹${totalAmount.toLocaleString('en-IN')}/mo` : ''}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/orders/${sub.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">View Details</Button>
                        </Link>
                        <Link href="/my-invoices">
                          <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">Pay Invoice</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
