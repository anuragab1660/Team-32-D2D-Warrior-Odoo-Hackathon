'use client'

import { useEffect, useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
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
import type { QuotationTemplate } from '@/types'
import { PlusIcon, LoaderIcon } from 'lucide-react'

const buildColumns = (): ColumnDef<QuotationTemplate, unknown>[] => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
  { accessorKey: 'validity_days', header: 'Validity (days)' },
  { accessorKey: 'plan', header: 'Plan', cell: ({ row }) => row.original.plan?.name ?? '—' },
  {
    id: 'lines',
    header: 'Lines',
    cell: ({ row }) => row.original.lines?.length ?? 0,
  },
  { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} /> },
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
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Template
          </Button>
        }
      />

      <DataTable
        columns={buildColumns()}
        data={templates}
        loading={loading}
        emptyTitle="No templates yet"
        emptyDescription="Create templates to speed up subscription creation."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Quotation Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="Basic Monthly Template" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Validity (days)</Label>
              <Input type="number" min="1" value={form.validity_days} onChange={e => setForm(p => ({ ...p, validity_days: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Recurring Plan (optional)</Label>
              <Select value={form.recurring_plan_id} onValueChange={v => setForm(p => ({ ...p, recurring_plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No plan</SelectItem>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
