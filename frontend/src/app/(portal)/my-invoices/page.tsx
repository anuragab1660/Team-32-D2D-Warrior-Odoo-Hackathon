'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileTextIcon, CheckCircleIcon } from 'lucide-react'
import type { InvoiceStatus } from '@/types'

/**
 * @module portal/my-invoices
 * @api-calls GET /api/invoices/my
 * @depends-on useInvoices
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: invoice list with status filter tabs, outstanding total, quick pay
 */

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'confirmed' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function PortalInvoicesPage() {
  /**
   * @module portal/my-invoices
   * @api-calls GET /api/invoices/my
   * @depends-on useInvoices
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: invoice list with status filter tabs, outstanding total, quick pay
   */
  const { invoices, loading, fetchMyInvoices } = useInvoices()
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchMyInvoices({ limit: 50 })
  }, [fetchMyInvoices])

  const filtered = activeTab === 'all'
    ? invoices
    : invoices.filter(i => i.status === (activeTab as InvoiceStatus))

  const outstanding = invoices
    .filter(i => i.status === 'confirmed' || i.status === 'overdue')
    .reduce((s, i) => s + i.grand_total, 0)
  const outstandingCount = invoices.filter(i => i.status === 'confirmed' || i.status === 'overdue').length

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.grand_total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
          <p className="text-slate-500 mt-1">Your billing history</p>
        </div>
        {outstanding > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-sm font-semibold text-amber-800">
              ₹{outstanding.toLocaleString('en-IN')} outstanding across {outstandingCount} invoice{outstandingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
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
                {invoices.filter(i => i.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileTextIcon className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold mb-1">No invoices</p>
          <p className="text-sm text-slate-400">
            {activeTab === 'all' ? 'Invoices will appear here once they are issued.' : `No ${activeTab} invoices found.`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((invoice, i) => {
              const isOverdue = invoice.status === 'overdue'
              const isPaid = invoice.status === 'paid'
              const isPending = invoice.status === 'confirmed'
              const overdueDays = isOverdue && invoice.due_date ? daysSince(invoice.due_date) : 0
              const subId = invoice.subscription_id

              return (
                <motion.div
                  key={invoice.id}
                  custom={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className={`border-slate-200 hover:shadow-sm transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                            <StatusBadge status={invoice.status} type="invoice" />
                            {isOverdue && overdueDays > 0 && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                {overdueDays} day{overdueDays !== 1 ? 's' : ''} overdue
                              </Badge>
                            )}
                            {isPaid && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Issued {fmtDate(invoice.issued_date)}
                            {invoice.due_date ? ` · Due ${fmtDate(invoice.due_date)}` : ''}
                          </p>
                          {subId && (
                            <Link href={`/orders/${subId}`} className="text-xs text-indigo-500 hover:underline mt-0.5 block">
                              Subscription: {(invoice as unknown as Record<string,string>).subscription_number ?? subId.slice(0, 8)}
                            </Link>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <p className="font-bold text-slate-900 text-lg">₹{invoice.grand_total.toLocaleString('en-IN')}</p>
                          <div className="flex gap-2">
                            <Link href={`/my-invoices/${invoice.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs">View Details</Button>
                            </Link>
                            {(isPending || isOverdue) && (
                              <Link href={`/my-invoices/${invoice.id}`}>
                                <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                                  Pay ₹{invoice.grand_total.toLocaleString('en-IN')}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Summary row */}
          <div className="flex flex-wrap gap-4 justify-between text-sm text-slate-500 border-t border-slate-100 pt-4">
            <span>Showing {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-4">
              <span>Total paid: <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span></span>
              <span>Outstanding: <span className="font-semibold text-amber-600">₹{outstanding.toLocaleString('en-IN')}</span></span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
