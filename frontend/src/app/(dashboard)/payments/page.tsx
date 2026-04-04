'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePayments } from '@/hooks/usePayments'
import { useInvoices } from '@/hooks/useInvoices'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon, LoaderIcon, CopyIcon, CreditCardIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Invoice } from '@/types'

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'other', label: 'Other' },
]

const defaultForm = {
  invoice_id: '',
  amount: '',
  payment_method: 'bank_transfer',
  reference_number: '',
  payment_date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function PaymentsPage() {
  const { payments, loading, pagination, fetchPayments, manualPayment } = usePayments()
  const { invoices, fetchInvoices } = useInvoices()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchPayments()
    // Fetch unpaid invoices for the dropdown
    fetchInvoices({ status: 'sent' })
  }, [fetchPayments, fetchInvoices])

  const unpaidInvoices = (invoices as (Invoice & Record<string, unknown>)[]).filter(
    inv => inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'pending'
  )

  const handleInvoiceSelect = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId) as (Invoice & Record<string, unknown>) | undefined
    setForm(f => ({
      ...f,
      invoice_id: invoiceId,
      amount: inv ? String(inv.grand_total) : f.amount,
    }))
  }

  const handleCreate = async () => {
    setFormError('')
    if (!form.invoice_id) { setFormError('Please select an invoice'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Enter a valid amount'); return }
    if (!form.payment_date) { setFormError('Payment date is required'); return }

    setSaving(true)
    try {
      await manualPayment({
        invoice_id: form.invoice_id,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        reference_number: form.reference_number || undefined,
        notes: form.notes || undefined,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      fetchPayments()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e?.response?.data?.error || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => {})
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Payments"
        description="Track all payment transactions"
        action={
          <Button
            onClick={() => { setFormError(''); setDialogOpen(true) }}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <PlusIcon className="h-4 w-4" />Record Payment
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Payment ID</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                  <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No payments found</p>
                  <p className="text-sm">Payments will appear here once invoices are paid.</p>
                </TableCell>
              </TableRow>
            ) : (
              (payments as (typeof payments[0] & Record<string, unknown>)[]).map((pay, i) => (
                <motion.tr
                  key={pay.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {pay.id.slice(0, 12)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(pay.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy full ID"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pay.invoice_id ? (
                      <Link
                        href={`/invoices/${pay.invoice_id as string}`}
                        className="text-indigo-600 hover:underline text-sm font-medium"
                      >
                        {(pay.invoice_number as string) ?? pay.invoice?.invoice_number ?? '—'}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {(pay.customer_name as string) ?? pay.customer?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    ₹{Number(pay.amount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm capitalize">
                    {pay.payment_method.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(pay.payment_date).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pay.status} type="payment" />
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => fetchPayments({ page: p })}
      />

      {/* Manual Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setFormError(''); setDialogOpen(o) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{formError}</div>
            )}

            <div className="space-y-2">
              <Label>Invoice <span className="text-red-500">*</span></Label>
              <Select value={form.invoice_id} onValueChange={handleInvoiceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unpaid invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {(inv as Invoice & Record<string, unknown>).invoice_number as string ?? inv.id} — ₹{Number(inv.grand_total).toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference / Transaction Number</Label>
              <Input
                placeholder="e.g. UTR number, cheque no."
                value={form.reference_number}
                onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Recording...</> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
