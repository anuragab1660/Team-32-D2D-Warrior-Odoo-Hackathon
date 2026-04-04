'use client'

import { useEffect, useState } from 'react'
import { useDiscounts } from '@/hooks/useDiscounts'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { ColumnDef } from '@tanstack/react-table'
import type { Discount } from '@/types'
import { PlusIcon, LoaderIcon, ToggleLeftIcon } from 'lucide-react'

const columns = (onToggle: (id: string) => void): ColumnDef<Discount, unknown>[] => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => row.original.type === 'percentage' ? `${row.original.value}%` : `₹${row.original.value}`,
  },
  { accessorKey: 'usage_count', header: 'Used', cell: ({ row }) => row.original.usage_count },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" onClick={() => onToggle(row.original.id)} className="h-7 text-xs gap-1">
        <ToggleLeftIcon className="h-3.5 w-3.5" />Toggle
      </Button>
    ),
  },
]

const defaultForm = { name: '', type: 'percentage', value: '', min_purchase: '', usage_limit: '' }

export default function DiscountsPage() {
  const { discounts, loading, fetchDiscounts, createDiscount, toggleDiscount } = useDiscounts()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDiscounts() }, [fetchDiscounts])

  const handleToggle = async (id: string) => {
    await toggleDiscount(id)
    fetchDiscounts()
  }

  const handleCreate = async () => {
    if (!form.name || !form.value) return
    setSaving(true)
    try {
      await createDiscount({
        name: form.name,
        type: form.type as 'fixed' | 'percentage',
        value: parseFloat(form.value),
        min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : undefined,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
        applies_to_products: true,
        applies_to_subscriptions: true,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      fetchDiscounts()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Manage discount codes and promotions"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Discount
          </Button>
        }
      />

      <DataTable
        columns={columns(handleToggle)}
        data={discounts}
        loading={loading}
        emptyTitle="No discounts yet"
        emptyDescription="Create your first discount to offer promotions."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Discount</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Summer Sale" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value {form.type === 'percentage' ? '(%)' : '(₹)'}</Label>
                <Input type="number" placeholder="10" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Purchase (₹)</Label>
                <Input type="number" placeholder="Optional" value={form.min_purchase} onChange={e => setForm(p => ({ ...p, min_purchase: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" placeholder="Optional" value={form.usage_limit} onChange={e => setForm(p => ({ ...p, usage_limit: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.value} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
