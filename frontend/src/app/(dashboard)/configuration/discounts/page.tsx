'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDiscounts } from '@/hooks/useDiscounts'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import type { Discount, Product } from '@/types'
import { PlusIcon, LoaderIcon, ToggleLeftIcon, TagIcon, ArrowRightIcon } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

type ExtendedProduct = Product & { default_discount_id?: string; yearly_price?: number }

const defaultForm = {
  product_id: '',
  billing_period: 'monthly' as 'monthly' | 'yearly',
  type: 'percentage' as 'percentage' | 'fixed',
  value: '',
  name: '',
  start_date: '',
  end_date: '',
}

export default function DiscountsPage() {
  const { discounts, loading, fetchDiscounts, createDiscount, toggleDiscount } = useDiscounts()
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { fetchDiscounts() }, [fetchDiscounts])
  useEffect(() => {
    api.get('/api/products?is_active=true&limit=200').then(({ data }) => setProducts(data.data || [])).catch(() => {})
  }, [])

  // Auto-generate discount name
  useEffect(() => {
    const product = products.find(p => p.id === form.product_id)
    if (!product || !form.value) return
    const period = form.billing_period === 'monthly' ? 'Monthly' : 'Yearly'
    const val = form.type === 'percentage' ? `${form.value}% Off` : `₹${form.value} Off`
    setForm(f => ({ ...f, name: `${product.name} - ${period} - ${val}` }))
  }, [form.product_id, form.billing_period, form.type, form.value, products])

  const selectedProduct = products.find(p => p.id === form.product_id)
  const unitPrice = form.billing_period === 'yearly'
    ? (selectedProduct?.yearly_price || (selectedProduct ? Number(selectedProduct.sales_price) * 12 : 0))
    : (selectedProduct ? Number(selectedProduct.sales_price) : 0)
  const discountVal = parseFloat(form.value) || 0
  const discountAmount = form.type === 'percentage'
    ? Math.round(unitPrice * discountVal / 100 * 100) / 100
    : discountVal
  const finalPrice = Math.max(0, unitPrice - discountAmount)

  const handleToggle = async (id: string) => {
    await toggleDiscount(id)
    fetchDiscounts()
  }

  const handleOpen = () => {
    setForm(defaultForm)
    setFormError('')
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    setFormError('')
    if (!form.product_id) { setFormError('Please select a product'); return }
    if (!form.value || discountVal <= 0) { setFormError('Enter a valid discount value'); return }
    if (!form.name) { setFormError('Discount name is required'); return }
    setSaving(true)
    try {
      const discount = await createDiscount({
        name: form.name,
        type: form.type,
        value: discountVal,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        applies_to_products: true,
        applies_to_subscriptions: true,
      })
      // Link discount as default on the product
      if (discount?.id) {
        await api.put(`/api/products/${form.product_id}`, { default_discount_id: discount.id })
        toast.success(`Discount linked to ${selectedProduct?.name}`)
      }
      setDialogOpen(false)
      setForm(defaultForm)
      fetchDiscounts()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e?.response?.data?.error || 'Failed to create discount')
    } finally {
      setSaving(false)
    }
  }

  // Build product name map for table
  const discountProductMap = useCallback(() => {
    const map: Record<string, string> = {}
    products.forEach(p => {
      if (p.default_discount_id) map[p.default_discount_id] = p.name
    })
    return map
  }, [products])

  const productMap = discountProductMap()

  const columns: ColumnDef<Discount, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>,
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const pName = productMap[row.original.id]
        return pName
          ? <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 font-normal">{pName}</Badge>
          : <span className="text-slate-400 text-xs">—</span>
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize text-sm text-slate-600">{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600">
          {row.original.type === 'percentage' ? `${row.original.value}%` : `₹${row.original.value}`}
        </span>
      ),
    },
    {
      accessorKey: 'usage_count',
      header: 'Used',
      cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.usage_count}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => handleToggle(row.original.id)} className="h-7 text-xs gap-1">
          <ToggleLeftIcon className="h-3.5 w-3.5" />Toggle
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Create product discounts for monthly or yearly subscriptions"
        action={
          <Button onClick={handleOpen} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Discount
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        emptyTitle="No discounts yet"
        emptyDescription="Create your first discount and link it to a product."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setFormError(''); setDialogOpen(o) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-indigo-500" />
              New Discount
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{formError}</div>
            )}

            {/* Product */}
            <div className="space-y-2">
              <Label>Product <span className="text-red-500">*</span></Label>
              <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Period */}
            <div className="space-y-2">
              <Label>Billing Period <span className="text-red-500">*</span></Label>
              <Select
                value={form.billing_period}
                onValueChange={v => setForm(f => ({ ...f, billing_period: v as 'monthly' | 'yearly' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    Monthly
                    {selectedProduct ? ` — ₹${Number(selectedProduct.sales_price).toLocaleString('en-IN')}` : ''}
                  </SelectItem>
                  <SelectItem value="yearly">
                    Yearly
                    {selectedProduct
                      ? ` — ₹${Number(selectedProduct.yearly_price || Number(selectedProduct.sales_price) * 12).toLocaleString('en-IN')}`
                      : ''}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount Type <span className="text-red-500">*</span></Label>
                <Select
                  value={form.type}
                  onValueChange={v => setForm(f => ({ ...f, type: v as 'percentage' | 'fixed' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                />
              </div>
            </div>

            {/* Live Pricing Preview */}
            {selectedProduct && discountVal > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Pricing Preview</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">
                      {form.billing_period === 'monthly' ? 'Monthly' : 'Yearly'} Price
                    </p>
                    <p className="text-lg font-bold text-slate-700">
                      ₹{unitPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-emerald-600 font-medium mt-0.5">
                      −₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">After Discount</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₹{finalPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-generated name (editable) */}
            <div className="space-y-2">
              <Label>
                Discount Name <span className="text-red-500">*</span>
                <span className="ml-1.5 text-xs font-normal text-slate-400">(auto-filled, editable)</span>
              </Label>
              <Input
                placeholder="e.g. Tally ERP - Monthly - 10% Off"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Valid dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.product_id || !form.value || !form.name}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving
                ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                : 'Create & Link to Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
