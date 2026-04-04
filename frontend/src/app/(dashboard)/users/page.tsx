'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import type { ColumnDef } from '@tanstack/react-table'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { PlusIcon, LoaderIcon, ToggleLeftIcon, MailIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

const buildColumns = (
  onToggle: (id: string) => void,
  onResend: (id: string) => void,
): ColumnDef<User, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
        {row.original.name}
      </span>
    ),
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <span
        className="capitalize text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontFamily: 'Inter, sans-serif' }}
      >
        {row.original.role}
      </span>
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
          <button
            onClick={() => setDialogOpen(true)}
            className="btn-gradient flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Invite User
          </button>
        }
      />

      <DataTable
        columns={buildColumns(handleToggle, handleResend)}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Invite team members to get started."
      />

      {/* Invite Modal */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDialogOpen(false) }}
        >
          <div
            className="glass-panel w-full max-w-md p-6"
            style={{ animation: 'fade-in-scale 0.2s ease' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
              >
                Invite User
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
                {fieldLabel('Name (optional)')}
                <input
                  placeholder="John Doe"
                  value={inviteForm.name}
                  onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Email')}
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  className="input-soft w-full"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel('Role')}
                <select
                  className="input-soft w-full"
                  value={inviteForm.role}
                  onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="internal">Internal</option>
                  <option value="portal">Portal (Customer)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteForm.email}
                className="btn-gradient flex items-center gap-2 flex-1 justify-center"
                style={{ opacity: (inviting || !inviteForm.email) ? 0.7 : 1 }}
              >
                {inviting ? <><LoaderIcon className="h-4 w-4 animate-spin" />Inviting...</> : 'Send Invite'}
              </button>
              <button onClick={() => setDialogOpen(false)} className="btn-soft">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
