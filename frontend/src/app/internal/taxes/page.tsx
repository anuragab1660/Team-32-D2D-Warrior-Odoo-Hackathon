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
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import type { Tax } from '@/types'
import { PlusIcon, LoaderIcon, ToggleLeftIcon, InfoIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const buildColumns = (onToggle: (id: string) => void): ColumnDef<Tax, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize text-xs">{row.original.type}</Badge>
    ),
  },
  {
    accessorKey: 'rate',
    header: 'Rate',
    cell: ({ row }) =>
      row.original.type === 'percentage'
        ? <span className="font-semibold text-emerald-700">{row.original.rate}%</span>
        : <span className="font-semibold text-emerald-700">₹{row.original.rate}</span>,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.description || '—'}</span>,
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(row.original.id)}
        className="h-7 text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ToggleLeftIcon className="h-3.5 w-3.5" />
        {row.original.is_active ? 'Deactivate' : 'Activate'}
      </Button>
    ),
  },
]

const defaultForm = { name: '', type: 'percentage', rate: '', description: '' }

export default function InternalTaxesPage() {
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
      toast.success('Tax rate created successfully')
    } catch {
      toast.error('Failed to create tax rate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Tax Management"
        description="Create and manage tax rates applied to products and subscriptions"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Tax Rate
          </Button>
        }
      />

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
        <InfoIcon className="h-4 w-4 mt-0.5 shrink-0" />
        <p>You can create new tax rates and toggle their active status. To edit or delete a tax rate, please contact an administrator.</p>
      </div>

      <DataTable
        columns={buildColumns(handleToggle)}
        data={taxes}
        loading={loading}
        emptyTitle="No tax rates configured"
        emptyDescription="Add tax rates to apply to products and subscriptions."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Tax Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. GST 18%"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
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
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="18"
                  value={form.rate}
                  onChange={e => setForm(p => ({ ...p, rate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Goods and Services Tax"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(defaultForm) }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.name || !form.rate}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Tax Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
