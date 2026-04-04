'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { ZapIcon } from 'lucide-react'

export default function OrdersPage() {
  const { subscriptions, loading, fetchMySubscriptions } = useSubscriptions()

  useEffect(() => {
    fetchMySubscriptions()
  }, [fetchMySubscriptions])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-slate-500 mt-1">Your subscription history and active orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ZapIcon className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold mb-1">No orders yet</p>
          <p className="text-sm text-slate-400 mb-4">Browse the shop and subscribe to products.</p>
          <Link href="/shop" className="text-indigo-600 text-sm font-medium hover:underline">Browse Shop</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map(sub => (
            <Card key={sub.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <Link href={`/orders/${sub.id}`} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{sub.subscription_number}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {(sub as unknown as Record<string, string>).plan_name ?? sub.plan?.name ?? 'No plan'} · Started {new Date(sub.start_date).toLocaleDateString()}
                    </p>
                    {sub.expiration_date && (
                      <p className="text-xs text-slate-400">
                        Expires {new Date(sub.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={sub.status} type="subscription" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
