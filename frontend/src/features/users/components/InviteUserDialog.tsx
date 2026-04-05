import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoaderIcon } from 'lucide-react'

export type InviteUserRole = 'admin' | 'internal'

export interface InviteUserFormState {
  name: string
  email: string
  role: InviteUserRole
}

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: InviteUserFormState
  onFormChange: (form: InviteUserFormState) => void
  onSubmit: () => void
  loading: boolean
  error?: string
  title?: string
  submitLabel?: string
  showRoleSelect?: boolean
  helperText?: string
}

export function InviteUserDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  loading,
  error,
  title = 'Invite User',
  submitLabel = 'Send Invite',
  showRoleSelect = true,
  helperText,
}: InviteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>

          {showRoleSelect && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => onFormChange({ ...form, role: v as InviteUserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading || !form.email} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
