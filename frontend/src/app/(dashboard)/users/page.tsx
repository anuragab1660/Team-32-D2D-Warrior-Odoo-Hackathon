'use client'

import { useEffect, useState } from 'react'
import { useUsers } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { InviteUserDialog, type InviteUserFormState } from '@/features/users/components/InviteUserDialog'
import { buildUsersColumns } from '@/features/users/components/usersTableColumns'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersPage() {
  const { users, loading, fetchUsers, toggleUser, resendInvite, inviteUser } = useUsers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteUserFormState>({ name: '', email: '', role: 'internal' })
  const [inviting, setInviting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const handleToggle = async (id: string) => {
    try {
      await toggleUser(id)
      fetchUsers()
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleResend = async (id: string) => {
    try {
      await resendInvite(id)
    } catch {
      toast.error('Failed to resend invitation')
    }
  }

  const handleInvite = async () => {
    if (!inviteForm.email) return
    setInviting(true)
    try {
      await inviteUser({
        name: inviteForm.name || undefined,
        email: inviteForm.email,
        role: inviteForm.role as 'admin' | 'internal',
      })
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
        columns={buildUsersColumns(handleToggle, handleResend)}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Invite team members to get started."
      />

      <InviteUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={inviteForm}
        onFormChange={setInviteForm}
        onSubmit={handleInvite}
        loading={inviting}
        title="Invite User"
        submitLabel="Send Invite"
        showRoleSelect
      />
    </div>
  )
}
