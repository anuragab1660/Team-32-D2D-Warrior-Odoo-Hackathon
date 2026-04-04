'use client'

import { useEffect, useState } from 'react'
import { usePlans } from '@/hooks/usePlans'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { ColumnDef } from '@tanstack/react-table'
import type { RecurringPlan } from '@/types'
import { Switch } from '@/components/ui/switch'
import { PlusIcon, LoaderIcon, ToggleLeftIcon } from 'lucide-react'

const buildColumns = (onToggle: (id: string) => void): ColumnDef<RecurringPlan, unknown>[] => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => `₹${row.original.price.toLocaleString()}` },
  { accessorKey: 'billing_period', header: 'Billing Period', cell: ({ row }) => <span className="capitalize">{row.original.billing_period}</span> },
  { accessorKey: 'min_quantity', header: 'Min Qty' },
  { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} /> },
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

const defaultForm = {
  name: '', price: '', billing_period: 'monthly', min_quantity: '1',
  start_date: '', end_date: '',
  auto_close: false, closable: true, pausable: false, renewable: true,
}

export default function RecurringPlansPage() {
  const { plans, loading, fetchPlans, createPlan, togglePlan } = usePlans()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const handleToggle = async (id: string) => {
    await togglePlan(id)
    fetchPlans()
  }

  const handleCreate = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      await createPlan({
        name: form.name,
        price: parseFloat(form.price),
        billing_period: form.billing_period as RecurringPlan['billing_period'],
        min_quantity: parseInt(form.min_quantity) || 1,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        auto_close: form.auto_close,
        closable: form.closable,
        pausable: form.pausable,
        renewable: form.renewable,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      fetchPlans()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Plans"
        description="Define billing plans for subscriptions"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Plan
          </Button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle)}
        data={plans}
        loading={loading}
        emptyTitle="No recurring plans"
        emptyDescription="Create billing plans to use in subscriptions."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Recurring Plan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input placeholder="Monthly Basic" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" step="0.01" placeholder="999" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <Select value={form.billing_period} onValueChange={v => setForm(p => ({ ...p, billing_period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Quantity</Label>
              <Input type="number" min="1" value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (optional)</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1">
              {([
                ['auto_close', 'Auto Close'],
                ['closable', 'Closable'],
                ['pausable', 'Pausable'],
                ['renewable', 'Renewable'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-normal text-slate-700">{label}</Label>
                  <Switch
                    checked={form[key] as boolean}
                    onCheckedChange={v => setForm(p => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.price} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
