'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBagIcon, FileTextIcon, ZapIcon, ArrowRightIcon,
  UserIcon, AlertTriangleIcon, CheckCircleIcon, RotateCcwIcon,
} from 'lucide-react'

/**
 * @module portal/home
 * @api-calls GET /api/subscriptions/my, GET /api/invoices/my
 * @depends-on useSubscriptions, useInvoices, useAuth
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: portal dashboard - shows KPIs, active subs, invoices due
 */

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const first = name.split(' ')[0] ?? 'there'
  if (hour < 12) return `Good morning, ${first}! 👋`
  if (hour < 17) return `Good afternoon, ${first}! 👋`
  return `Good evening, ${first}! 👋`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

export default function PortalHomePage() {
  /**
   * @module portal/home
   * @api-calls GET /api/subscriptions/my, GET /api/invoices/my
   * @depends-on useSubscriptions, useInvoices, useAuth
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: portal dashboard - shows KPIs, active subs, invoices due
   */
  const { user } = useAuth()
  const { subscriptions, fetchMySubscriptions } = useSubscriptions()
  const { invoices, fetchMyInvoices } = useInvoices()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchMySubscriptions(), fetchMyInvoices()])
      setLoaded(true)
    }
    load()
  }, [fetchMySubscriptions, fetchMyInvoices])

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const pendingInvoices = invoices.filter(i => i.status === 'confirmed' || i.status === 'overdue')
  const totalSpentThisYear = invoices
    .filter(i => i.status === 'paid' && new Date(i.issued_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, i) => sum + Number(i.grand_total ?? 0), 0)

  const nextDueInvoice = pendingInvoices
    .filter(i => i.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]

  const expiringSoon = activeSubscriptions.filter(s => s.expiration_date && daysUntil(s.expiration_date) <= 7 && daysUntil(s.expiration_date) >= 0)

  // Empty state — no subscriptions at all
  if (loaded && subscriptions.length === 0 && invoices.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user?.name ? getGreeting(user.name) : 'Welcome!'}</h1>
          <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your subscriptions today.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
            <ZapIcon className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">You haven&apos;t subscribed to anything yet</h2>
          <p className="text-slate-400 mb-6 max-w-sm">Browse our products and subscribe to get started.</p>
          <Link href="/shop">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <ShoppingBagIcon className="h-4 w-4" />Browse Shop
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {user?.name ? getGreeting(user.name) : 'Welcome back!'}
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your subscriptions today.</p>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {(() => {
                const lines0 = (expiringSoon[0] as unknown as Record<string,unknown>).lines as { product_name: string }[] ?? []
                const names0 = lines0.map(l => l.product_name).filter(Boolean)
                const label0 = names0.length > 0 ? names0.join(', ') : ((expiringSoon[0] as unknown as Record<string,string>).plan_name ?? 'Your subscription')
                return `${label0} expires in ${daysUntil(expiringSoon[0].expiration_date!)} day${daysUntil(expiringSoon[0].expiration_date!) !== 1 ? 's' : ''}.`
              })()}
            </p>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">Renew now →</Link>
        </div>
      )}

      {/* KPI Row */}
      {!loaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div custom={0} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Active Subscriptions</p>
                  <ZapIcon className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{activeSubscriptions.length}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={1} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Pending Invoices</p>
                  <FileTextIcon className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{pendingInvoices.length}</p>
                {pendingInvoices.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ₹{pendingInvoices.reduce((s, i) => s + i.grand_total, 0).toLocaleString('en-IN')} due
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Spent This Year</p>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">₹{totalSpentThisYear.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Next Invoice Due</p>
                  <FileTextIcon className="h-4 w-4 text-red-500" />
                </div>
                {nextDueInvoice ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">₹{nextDueInvoice.grand_total.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{nextDueInvoice.invoice_number}</p>
                    <p className="text-xs text-slate-400">
                      Due in {daysUntil(nextDueInvoice.due_date!)} day{daysUntil(nextDueInvoice.due_date!) !== 1 ? 's' : ''}
                    </p>
                    <Link href={`/my-invoices/${nextDueInvoice.id}`}>
                      <Button size="sm" className="mt-2 h-6 text-xs bg-indigo-600 hover:bg-indigo-700 px-2">Pay Now</Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">No pending invoices</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Active Subscriptions Panel */}
      {loaded && activeSubscriptions.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Subscriptions</CardTitle>
            <Link href="/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSubscriptions.slice(0, 3).map((sub, i) => {
                const pct = sub.expiration_date ? getProgressPct(sub.start_date, sub.expiration_date) : 0
                const totalDays = sub.expiration_date ? getPeriodDays(sub.start_date, sub.expiration_date) : 0
                const usedDays = getDaysUsed(sub.start_date)
                const daysLeft = sub.expiration_date ? daysUntil(sub.expiration_date) : null
                const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
                const planName = (sub as unknown as Record<string,string>).plan_name ?? null
                const billingPeriod = (sub as unknown as Record<string,string>).billing_period
                const subLines = (sub as unknown as Record<string,unknown>).lines as { product_name: string; unit_price: number; quantity: number }[] ?? []
                const productNames = subLines.map(l => l.product_name).filter(Boolean)
                const cardTitle = productNames.length > 0 ? productNames.join(', ') : (planName ?? 'Subscription')

                return (
                  <motion.div
                    key={sub.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{cardTitle}</p>
                        {isExpiringSoon && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Expiring soon</Badge>
                        )}
                      </div>
                      <StatusBadge status={sub.status} type="subscription" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {planName && <span className="text-xs text-slate-500">{planName}</span>}
                      {billingPeriod && (
                        <Badge variant="outline" className="text-xs capitalize">{billingPeriod}</Badge>
                      )}
                    </div>
                    {sub.expiration_date && (
                      <>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full transition-all ${isExpiringSoon ? 'bg-amber-400' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          {Math.min(usedDays, totalDays)} of {totalDays} days used · Expires {fmtDate(sub.expiration_date)}
                        </p>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {loaded && invoices.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Link href="/my-invoices" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 3).map((inv, i) => (
                <motion.div
                  key={inv.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500">{fmtDate(inv.issued_date)}{inv.due_date ? ` · Due ${fmtDate(inv.due_date)}` : ''}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">₹{inv.grand_total.toLocaleString('en-IN')}</p>
                      <StatusBadge status={inv.status} type="invoice" />
                    </div>
                    {(inv.status === 'confirmed' || inv.status === 'overdue') && (
                      <Link href={`/my-invoices/${inv.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                          Pay ₹{inv.grand_total.toLocaleString('en-IN')}
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: ShoppingBagIcon, label: 'Shop Products', href: '/shop', color: 'text-indigo-600 bg-indigo-50' },
            { icon: FileTextIcon, label: 'View Invoices', href: '/my-invoices', color: 'text-amber-600 bg-amber-50' },
            { icon: UserIcon, label: 'Edit Profile', href: '/my-account', color: 'text-green-600 bg-green-50' },
            { icon: RotateCcwIcon, label: 'My Orders', href: '/orders', color: 'text-purple-600 bg-purple-50' },
          ].map(({ icon: Icon, label, href, color }) => (
            <Link key={href} href={href}>
              <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
