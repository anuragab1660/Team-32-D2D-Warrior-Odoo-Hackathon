'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingBagIcon, FileTextIcon, ZapIcon, ArrowRightIcon } from 'lucide-react'

export default function PortalHomePage() {
  const { user } = useAuth()
  const { subscriptions, fetchMySubscriptions } = useSubscriptions()
  const { invoices, fetchInvoices } = useInvoices()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchMySubscriptions(), fetchInvoices()])
      setLoaded(true)
    }
    load()
  }, [fetchMySubscriptions, fetchInvoices])

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const pendingInvoices = invoices.filter(i => i.status === 'confirmed')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'}!
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Active Subscriptions</p>
              <ZapIcon className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{loaded ? activeSubscriptions.length : '—'}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Pending Invoices</p>
              <FileTextIcon className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{loaded ? pendingInvoices.length : '—'}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <p className="text-sm text-slate-500 mb-2">Browse Products</p>
            <Link href="/shop">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <ShoppingBagIcon className="h-4 w-4" />Go to Shop
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {activeSubscriptions.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">My Subscriptions</CardTitle>
            <Link href="/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSubscriptions.slice(0, 3).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{sub.subscription_number}</p>
                    <p className="text-xs text-slate-500">{sub.plan?.name ?? 'No plan'} · Started {new Date(sub.start_date).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={sub.status} type="subscription" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingInvoices.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Invoices Due</CardTitle>
            <Link href="/invoices" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500">Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{inv.grand_total.toLocaleString()}</p>
                    <Link href={`/invoices/${inv.id}`} className="text-xs text-indigo-600 hover:underline">Pay now</Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
