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
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  children?: { label: string; href: string; roles?: string[] }[]
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
      { label: 'Discounts', href: '/configuration/discounts', roles: ['admin'] },
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
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 shrink-0">
        <motion.div
          className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <ZapIcon className="h-4 w-4 text-white" />
        </motion.div>
        <span className="font-bold text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          ProsubX
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {filteredNav.map((item, index) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          const isExpanded = expanded === item.label

          if (item.children) {
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
              >
                <motion.button
                  onClick={() => setExpanded(isExpanded ? null : item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </motion.div>
                </motion.button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-7 mt-0.5 space-y-0.5 pl-3 border-l border-slate-200">
                        {item.children.filter(child => !child.roles || child.roles.includes(user?.role ?? '')).map((child, ci) => (
                          <motion.div
                            key={child.href}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ci * 0.04 }}
                          >
                            <Link
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
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-indigo-50 rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 shrink-0 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* User footer */}
      {user && (
        <motion.div
          className="px-4 py-3 border-t border-slate-200 shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        </motion.div>
      )}
    </aside>
  )
}
