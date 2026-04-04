'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboardIcon, ZapIcon, PackageIcon, FileTextIcon,
  CreditCardIcon, BarChart3Icon, UsersIcon, SettingsIcon,
} from 'lucide-react'

const commands = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon, group: 'Navigation' },
  { label: 'Subscriptions', href: '/subscriptions', icon: ZapIcon, group: 'Navigation' },
  { label: 'New Subscription', href: '/subscriptions/new', icon: ZapIcon, group: 'Actions' },
  { label: 'Products', href: '/products', icon: PackageIcon, group: 'Navigation' },
  { label: 'Invoices', href: '/invoices', icon: FileTextIcon, group: 'Navigation' },
  { label: 'Payments', href: '/payments', icon: CreditCardIcon, group: 'Navigation' },
  { label: 'Reports', href: '/reports', icon: BarChart3Icon, group: 'Navigation' },
  { label: 'Users', href: '/users', icon: UsersIcon, group: 'Navigation' },
  { label: 'Recurring Plans', href: '/configuration/recurring-plans', icon: SettingsIcon, group: 'Configuration' },
  { label: 'Quotation Templates', href: '/configuration/quotation-templates', icon: SettingsIcon, group: 'Configuration' },
  { label: 'Discounts', href: '/configuration/discounts', icon: SettingsIcon, group: 'Configuration' },
  { label: 'Taxes', href: '/configuration/taxes', icon: SettingsIcon, group: 'Configuration' },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()

  const groups = Array.from(new Set(commands.map(c => c.group)))

  const run = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, i) => (
          <div key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {commands.filter(c => c.group === group).map(cmd => (
                <CommandItem key={cmd.href} onSelect={() => run(cmd.href)} className="gap-2">
                  <cmd.icon className="h-4 w-4 text-slate-400" />
                  {cmd.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
