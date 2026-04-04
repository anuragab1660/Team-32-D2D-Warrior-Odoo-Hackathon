'use client'

import { useEffect, useState } from 'react'
import { usePlans } from '@/hooks/usePlans'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import type { ColumnDef } from '@tanstack/react-table'
import type { RecurringPlan } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PlusIcon, LoaderIcon, XIcon, ToggleLeftIcon } from 'lucide-react'

const buildColumns = (onToggle: (id: string) => void): ColumnDef<RecurringPlan, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
        ₹{row.original.price.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'billing_period',
    header: 'Billing Period',
    cell: ({ row }) => <span className="capitalize">{row.original.billing_period}</span>,
  },
  { accessorKey: 'min_quantity', header: 'Min Qty' },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <button
        onClick={() => onToggle(row.original.id)}
        className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
        style={{ color: 'var(--on-surface-variant)', fontFamily: 'Inter, sans-serif' }}
      >
        <ToggleLeftIcon className="h-3.5 w-3.5" />Toggle
      </button>
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
          <button onClick={() => setDialogOpen(true)} className="btn-gradient flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />New Plan
          </button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle)}
        data={plans}
        loading={loading}
        emptyTitle="No recurring plans"
        emptyDescription="Create billing plans to use in subscriptions."
      />

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDialogOpen(false) }}
        >
          <div className="glass-panel w-full max-w-md p-6" style={{ animation: 'fade-in-scale 0.2s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
              >
                New Recurring Plan
              </h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-muted)' }}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                {fieldLabel('Plan Name')}
                <input
                  placeholder="Monthly Basic"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {fieldLabel('Price (₹)')}
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="input-soft w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  {fieldLabel('Billing Period')}
                  <select
                    className="input-soft w-full"
                    value={form.billing_period}
                    onChange={e => setForm(p => ({ ...p, billing_period: e.target.value }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Minimum Quantity')}
                <input
                  type="number"
                  min="1"
                  value={form.min_quantity}
                  onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.price}
                className="btn-gradient flex items-center gap-2 flex-1 justify-center"
                style={{ opacity: (saving || !form.name || !form.price) ? 0.7 : 1 }}
              >
                {saving ? <><LoaderIcon className="h-4 w-4 animate-spin" />Creating...</> : 'Create'}
              </button>
              <button onClick={() => setDialogOpen(false)} className="btn-soft">Cancel</button>
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
        </div>
      )}
    </div>
  )
}
