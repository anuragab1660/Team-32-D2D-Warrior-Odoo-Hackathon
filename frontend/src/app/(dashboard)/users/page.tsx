'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
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
import type { User } from '@/types'
import { PlusIcon, LoaderIcon, ToggleLeftIcon, MailIcon } from 'lucide-react'
import { toast } from 'sonner'

const buildColumns = (
  onToggle: (id: string) => void,
  onResend: (id: string) => void,
): ColumnDef<User, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>,
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize text-xs">{row.original.role}</Badge>
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onToggle(row.original.id)} className="h-7 text-xs gap-1">
          <ToggleLeftIcon className="h-3.5 w-3.5" />
          {row.original.is_active ? 'Deactivate' : 'Activate'}
        </Button>
        {!row.original.is_active && (
          <Button variant="ghost" size="sm" onClick={() => onResend(row.original.id)} className="h-7 text-xs gap-1">
            <MailIcon className="h-3.5 w-3.5" />Resend
          </Button>
        )}
      </div>
    ),
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'internal' })
  const [inviting, setInviting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/users')
      setUsers(data.data || [])
    } catch {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/api/users/${id}/toggle`)
      toast.success('User status updated')
      fetchUsers()
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleResend = async (id: string) => {
    try {
      await api.post(`/api/users/${id}/resend-invite`)
      toast.success('Invitation resent')
    } catch {
      toast.error('Failed to resend invitation')
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email) return
    setInviting(true)
    try {
      await api.post('/api/users/invite', inviteForm)
      toast.success('Invitation sent!')
      setDialogOpen(false)
      setInviteForm({ name: '', email: '', role: 'internal' })
      fetchUsers()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e?.response?.data?.error || 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage team members and customer accounts"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <PlusIcon className="h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle, handleResend)}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Invite team members to get started."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                placeholder="John Doe"
                value={inviteForm.name}
                onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="portal">Portal (Customer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteForm.email} className="bg-indigo-600 hover:bg-indigo-700">
              {inviting ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Inviting...</> : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
