'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUsers } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { InviteUserDialog, type InviteUserFormState } from '@/features/users/components/InviteUserDialog'
import { PlusIcon, UserCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function EmployeesPage() {
  const { users, loading, fetchInternalUsers, toggleUser, inviteUser } = useUsers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<InviteUserFormState>({ name: '', email: '', role: 'internal' })

  useEffect(() => { fetchInternalUsers() }, [])

  const handleToggle = async (id: string) => {
    try {
      await toggleUser(id)
      fetchInternalUsers()
    } catch {
      toast.error('Failed to update employee')
    }
  }

  const handleCreate = async () => {
    setFormError('')
    if (!form.name || !form.email) {
      setFormError('Name and email are required')
      return
    }
    setSaving(true)
    try {
      await inviteUser({
        name: form.name,
        email: form.email,
        role: 'internal',
      })
      setDialogOpen(false)
      setForm({ name: '', email: '', role: 'internal' })
      fetchInternalUsers()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e?.response?.data?.error || 'Failed to send invitation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Employees"
        description="Internal team members with access to the admin panel"
        action={
          <Button onClick={() => { setFormError(''); setDialogOpen(true) }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />
            Invite Employee
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <UserCheckIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No employees yet</p>
                  <p className="text-sm">Add your first employee to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                  <TableCell className="text-slate-600">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className={u.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id)} className="h-7 text-xs">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setFormError('')
          setDialogOpen(o)
        }}
        form={form}
        onFormChange={setForm}
        onSubmit={handleCreate}
        loading={saving}
        error={formError}
        title="Invite Employee"
        submitLabel="Send Invite"
        showRoleSelect={false}
        helperText="The employee will receive an email invitation to set their password and activate the account."
      />
    </motion.div>
  )
}
