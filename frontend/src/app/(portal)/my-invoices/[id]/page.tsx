'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Invoice } from '@/types'
import { ArrowLeftIcon, LoaderIcon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/invoices/${id}`)
        setInvoice(data.data)
      } catch {
        toast.error('Invoice not found')
        router.push('/my-invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/my-invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />Back to invoices
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Issued {new Date(invoice.issued_date).toLocaleDateString()}
            {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
          </p>
        </div>
        <StatusBadge status={invoice.status} type="invoice" />
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Invoice Summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500 mb-1">Subtotal</dt>
              <dd className="font-medium text-slate-900">₹{invoice.subtotal.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Tax</dt>
              <dd className="text-slate-700">₹{invoice.tax_total.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Discount</dt>
              <dd className="text-slate-700">₹{invoice.discount_total.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Grand Total</dt>
              <dd className="text-xl font-bold text-slate-900">₹{invoice.grand_total.toLocaleString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {invoice.lines && invoice.lines.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.lines.map(line => (
                <div key={line.id} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{line.description}</p>
                    <p className="text-xs text-slate-500">
                      Qty: {line.quantity} × ₹{line.unit_price.toLocaleString()}
                      {line.tax_amount > 0 && ` · Tax: ₹${line.tax_amount.toLocaleString()}`}
                      {line.discount_amount > 0 && ` · Disc: ₹${line.discount_amount.toLocaleString()}`}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900 ml-4">₹{line.line_total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <PrinterIcon className="h-4 w-4" />Print Invoice
        </Button>
      </div>
    </div>
  )
}
