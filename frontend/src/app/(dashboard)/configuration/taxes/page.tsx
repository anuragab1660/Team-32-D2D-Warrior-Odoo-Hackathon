'use client'

import { useEffect, useState } from 'react'
import { useTaxes } from '@/hooks/useTaxes'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import type { ColumnDef } from '@tanstack/react-table'
import type { Tax } from '@/types'
import { PlusIcon, LoaderIcon, XIcon, ToggleLeftIcon } from 'lucide-react'

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

const buildColumns = (onToggle: (id: string) => void): ColumnDef<Tax, unknown>[] => [
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: 'rate',
    header: 'Rate',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
        {row.original.type === 'percentage' ? `${row.original.rate}%` : `₹${row.original.rate}`}
      </span>
    ),
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

const defaultForm = { name: '', type: 'percentage', rate: '', description: '' }

export default function TaxesPage() {
  const { taxes, loading, fetchTaxes, createTax, toggleTax } = useTaxes()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTaxes() }, [fetchTaxes])

  const handleToggle = async (id: string) => {
    await toggleTax(id)
    fetchTaxes()
  }

  const handleCreate = async () => {
    if (!form.name || !form.rate) return
    setSaving(true)
    try {
      await createTax({
        name: form.name,
        type: form.type as 'percentage' | 'fixed',
        rate: parseFloat(form.rate),
        description: form.description || undefined,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      fetchTaxes()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes"
        description="Configure tax rates applied to products and subscriptions"
        action={
          <button onClick={() => setDialogOpen(true)} className="btn-gradient flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />New Tax
          </button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle)}
        data={taxes}
        loading={loading}
        emptyTitle="No taxes configured"
        emptyDescription="Add tax rates to apply to your products."
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
                New Tax Rate
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
                {fieldLabel('Name')}
                <input
                  placeholder="GST 18%"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {fieldLabel('Type')}
                  <select
                    className="input-soft w-full"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  {fieldLabel(`Rate ${form.type === 'percentage' ? '(%)' : '(₹)'}`)}
                  <input
                    type="number"
                    step="0.01"
                    placeholder="18"
                    value={form.rate}
                    onChange={e => setForm(p => ({ ...p, rate: e.target.value }))}
                    className="input-soft w-full"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Description (optional)')}
                <input
                  placeholder="Optional description"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.rate}
                className="btn-gradient flex items-center gap-2 flex-1 justify-center"
                style={{ opacity: (saving || !form.name || !form.rate) ? 0.7 : 1 }}
              >
                {saving ? <><LoaderIcon className="h-4 w-4 animate-spin" />Creating...</> : 'Create'}
              </button>
              <button onClick={() => setDialogOpen(false)} className="btn-soft">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
