'use client'

import { useEffect, useState } from 'react'
import { useTaxes } from '@/hooks/useTaxes'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { ColumnDef } from '@tanstack/react-table'
import type { Tax } from '@/types'
import { PlusIcon, LoaderIcon, ToggleLeftIcon } from 'lucide-react'

const buildColumns = (onToggle: (id: string) => void): ColumnDef<Tax, unknown>[] => [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="capitalize">{row.original.type}</span> },
  {
    accessorKey: 'rate',
    header: 'Rate',
    cell: ({ row }) => row.original.type === 'percentage' ? `${row.original.rate}%` : `₹${row.original.rate}`,
  },
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
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Tax
          </Button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle)}
        data={taxes}
        loading={loading}
        emptyTitle="No taxes configured"
        emptyDescription="Add tax rates to apply to your products."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Tax Rate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="GST 18%" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
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
                <Label>Rate {form.type === 'percentage' ? '(%)' : '(₹)'}</Label>
                <Input type="number" step="0.01" placeholder="18" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.rate} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
