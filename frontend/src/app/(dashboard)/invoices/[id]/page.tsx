'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeftIcon, DownloadIcon, PrinterIcon, CheckCircle2Icon } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceLine {
  id: string
  product_id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  tax_amount: number
  discount_amount: number
  line_total: number
}

interface InvoiceDetail {
  id: string
  invoice_number: string
  status: string
  issued_date: string
  due_date: string
  paid_at: string
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  customer_name: string
  customer_email: string
  company_name: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  gstin: string
  payment_id: string
  lines: InvoiceLine[]
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await api.get(`/api/invoices/${id}`)
        setInvoice(data.data)
      } catch {
        toast.error('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [id])

  const handleDownloadPDF = async () => {
    if (!invoice || !printRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`Invoice-${invoice.invoice_number}.pdf`)
      toast.success('PDF downloaded successfully')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!invoice) {
    return <div className="text-slate-500">Invoice not found.</div>
  }

  const isPaid = invoice.status === 'paid'

  return (
    <motion.div
      className="space-y-4 max-w-3xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/invoices" className="hover:text-indigo-600 transition-colors">Invoices</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{invoice.invoice_number}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />Print
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading
              ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Generating...</>
              : <><DownloadIcon className="h-4 w-4" />Download PDF</>
            }
          </Button>
        </div>
      </div>

      {/* Invoice card — captured for PDF */}
      <div ref={printRef} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header bar */}
        <div className="bg-indigo-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ProsubX</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Subscription Management</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">INVOICE</p>
              <p className="text-indigo-200 text-sm font-mono">{invoice.invoice_number}</p>
              {isPaid && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-green-400/20 text-green-100 text-xs font-semibold border border-green-400/30">
                  <CheckCircle2Icon className="h-3 w-3" />PAID
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Bill to + dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold text-slate-900">{invoice.company_name || invoice.customer_name}</p>
              <p className="text-sm text-slate-600">{invoice.customer_email}</p>
              {invoice.phone && <p className="text-sm text-slate-600">{invoice.phone}</p>}
              {invoice.address && <p className="text-sm text-slate-600">{invoice.address}</p>}
              {(invoice.city || invoice.state) && (
                <p className="text-sm text-slate-600">{[invoice.city, invoice.state, invoice.postal_code].filter(Boolean).join(', ')}</p>
              )}
              {invoice.gstin && <p className="text-xs text-slate-500 mt-1">GSTIN: {invoice.gstin}</p>}
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs text-slate-400">Issue Date</p>
                <p className="text-sm font-medium text-slate-800">{new Date(invoice.issued_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs text-slate-400">Due Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <p className="text-xs text-slate-400">Paid On</p>
                  <p className="text-sm font-medium text-green-700">{new Date(invoice.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              )}
              <Badge className={isPaid ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                  <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Qty</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Rate (₹)</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Tax (₹)</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lines || []).map((line, i) => (
                  <tr key={line.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3">
                      <p className="font-medium text-slate-800">{line.product_name || line.description}</p>
                      {line.description && line.product_name && <p className="text-xs text-slate-400">{line.description}</p>}
                    </td>
                    <td className="py-3 text-center text-slate-600">{line.quantity}</td>
                    <td className="py-3 text-right text-slate-700">{Number(line.unit_price).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-slate-600">{Number(line.tax_amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-medium text-slate-800">{Number(line.line_total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {(!invoice.lines || invoice.lines.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No line items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(invoice.tax_total) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span>
                  <span>₹{Number(invoice.tax_total).toLocaleString('en-IN')}</span>
                </div>
              )}
              {Number(invoice.discount_total) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span className="text-green-600">-₹{Number(invoice.discount_total).toLocaleString('en-IN')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-indigo-700">₹{Number(invoice.grand_total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment reference */}
          {invoice.payment_id && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-semibold text-green-700 mb-0.5">Payment Reference</p>
              <p className="text-sm text-green-800 font-mono break-all">{invoice.payment_id}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">Thank you for your business!</p>
            <p className="text-xs text-slate-400 mt-0.5">ProsubX • Subscription Management Platform</p>
          </div>
        </div>
      </div>

      {/* Back button */}
      <Link href="/invoices">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeftIcon className="h-4 w-4" />Back to Invoices
        </Button>
      </Link>
    </motion.div>
  )
}
