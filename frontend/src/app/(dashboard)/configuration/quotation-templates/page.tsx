'use client'

import { useEffect, useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { usePlans } from '@/hooks/usePlans'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import type { ColumnDef } from '@tanstack/react-table'
import type { QuotationTemplate } from '@/types'
import { PlusIcon, LoaderIcon, XIcon } from 'lucide-react'

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

const buildColumns = (): ColumnDef<QuotationTemplate, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
        {row.original.name}
      </span>
    ),
  },
  { accessorKey: 'validity_days', header: 'Validity (days)' },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => row.original.plan?.name ?? '—',
  },
  {
    id: 'lines',
    header: 'Lines',
    cell: ({ row }) => row.original.lines?.length ?? 0,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
  },
]

const defaultForm = { name: '', validity_days: '30', recurring_plan_id: '' }

export default function QuotationTemplatesPage() {
  const { templates, loading, fetchTemplates, createTemplate } = useTemplates()
  const { plans, fetchPlans } = usePlans()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchPlans(true)
  }, [fetchTemplates, fetchPlans])

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      await createTemplate({
        name: form.name,
        validity_days: parseInt(form.validity_days) || 30,
        recurring_plan_id: form.recurring_plan_id || undefined,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      fetchTemplates()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Templates"
        description="Pre-configured templates for creating subscriptions quickly"
        action={
          <button onClick={() => setDialogOpen(true)} className="btn-gradient flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />New Template
          </button>
        }
      />

      <DataTable
        columns={buildColumns()}
        data={templates}
        loading={loading}
        emptyTitle="No templates yet"
        emptyDescription="Create templates to speed up subscription creation."
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
                New Quotation Template
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
                {fieldLabel('Template Name')}
                <input
                  placeholder="Basic Monthly Template"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Validity (days)')}
                <input
                  type="number"
                  min="1"
                  value={form.validity_days}
                  onChange={e => setForm(p => ({ ...p, validity_days: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Recurring Plan (optional)')}
                <select
                  className="input-soft w-full"
                  value={form.recurring_plan_id}
                  onChange={e => setForm(p => ({ ...p, recurring_plan_id: e.target.value }))}
                >
                  <option value="">No plan</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving || !form.name}
                className="btn-gradient flex items-center gap-2 flex-1 justify-center"
                style={{ opacity: (saving || !form.name) ? 0.7 : 1 }}
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
