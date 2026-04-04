'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/hooks/useAuth'
import {
  LayoutDashboardIcon, UsersIcon, PackageIcon, FileTextIcon,
  CreditCardIcon, BarChart3Icon, SettingsIcon, ChevronRightIcon,
  ZapIcon, TagIcon, PercentIcon, ReceiptIcon, BookTemplateIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Subscriptions', href: '/subscriptions', icon: ZapIcon },
  { label: 'Products', href: '/products', icon: PackageIcon },
  { label: 'Invoices', href: '/invoices', icon: FileTextIcon },
  { label: 'Payments', href: '/payments', icon: CreditCardIcon },
  { label: 'Reports', href: '/reports', icon: BarChart3Icon },
  { label: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
  {
    label: 'Configuration', href: '/configuration', icon: SettingsIcon,
    children: [
      { label: 'Recurring Plans', href: '/configuration/recurring-plans' },
      { label: 'Templates', href: '/configuration/quotation-templates' },
      { label: 'Discounts', href: '/configuration/discounts' },
      { label: 'Taxes', href: '/configuration/taxes' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [expanded, setExpanded] = useState<string | null>(
    pathname.startsWith('/dashboard/configuration') ? 'Configuration' : null
  )

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role ?? '')
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <ZapIcon className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          ProsubX
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {filteredNav.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          const isExpanded = expanded === item.label

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRightIcon className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 pl-3 border-l border-slate-200">
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-1.5 rounded-md text-sm transition-colors',
                          pathname === child.href
                            ? 'text-indigo-700 font-medium bg-indigo-50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-4 py-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
