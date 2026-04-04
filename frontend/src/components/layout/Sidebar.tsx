'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/hooks/useAuth'
import {
  LayoutDashboardIcon, UsersIcon, PackageIcon, FileTextIcon,
  CreditCardIcon, BarChart3Icon, SettingsIcon, ChevronDownIcon,
  ZapIcon,
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
    label: 'Configuration',
    href: '/configuration',
    icon: SettingsIcon,
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
    pathname.startsWith('/configuration') ? 'Configuration' : null
  )

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role ?? '')
  )

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/10 shadow-[0_24px_50px_-24px_rgba(6,54,105,0.55)]"
      style={{ background: 'linear-gradient(180deg, #07192f 0%, #0b2344 42%, #0f305d 100%)' }}
    >

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 shrink-0">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1f5a95, #4f8bd6)' }}>
          <ZapIcon className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white text-[17px] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          ProsubX
        </span>
      </div>

      {/* Tonal divider */}
      <div className="mx-4 h-px opacity-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
        {filteredNav.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          const isExpanded = expanded === item.label

          if (item.children) {
            const hasActiveChild = item.children.some(c => pathname === c.href)
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.label)}
                  className={cn(
                    'nav-item w-full',
                    (isActive || hasActiveChild) && 'active'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDownIcon className={cn(
                    'h-3.5 w-3.5 opacity-50 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          pathname === child.href
                            ? 'text-white bg-white/10'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        )}
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}
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
              className={cn('nav-item', isActive && 'active')}
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Tonal divider */}
      <div className="mx-4 h-px opacity-10" style={{ background: 'white' }} />

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #1f5a95, #4f8bd6)', fontFamily: 'Manrope, sans-serif' }}>
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {user.name}
              </p>
              <p className="text-[11px] capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
