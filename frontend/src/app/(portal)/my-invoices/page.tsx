'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { FileTextIcon } from 'lucide-react'

export default function PortalInvoicesPage() {
  const { invoices, loading, fetchInvoices } = useInvoices()

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-500 mt-1">Your billing history</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileTextIcon className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold mb-1">No invoices yet</p>
          <p className="text-sm text-slate-400">Invoices will appear here once they are issued.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => (
            <Card key={invoice.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <Link href={`/my-invoices/${invoice.id}`} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Issued {new Date(invoice.issued_date).toLocaleDateString()}
                      {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{invoice.grand_total.toLocaleString()}</p>
                    <div className="mt-1">
                      <StatusBadge status={invoice.status} type="invoice" />
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
