import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { MailIcon, ToggleLeftIcon } from 'lucide-react'

export const buildUsersColumns = (
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
