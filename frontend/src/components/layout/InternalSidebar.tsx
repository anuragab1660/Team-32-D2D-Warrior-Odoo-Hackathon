'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/hooks/useAuth'
import {
  LayoutDashboardIcon, BarChart3Icon, ReceiptIcon,
  ZapIcon, PenLineIcon, ClipboardListIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Dashboard', href: '/internal/dashboard', icon: LayoutDashboardIcon },
  { label: 'Customer Orders', href: '/internal/orders', icon: ClipboardListIcon },
  { label: 'Reports', href: '/internal/reports', icon: BarChart3Icon },
  { label: 'Taxes', href: '/internal/taxes', icon: ReceiptIcon },
  { label: 'Content', href: '/internal/content', icon: PenLineIcon },
]

export function InternalSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 shrink-0">
        <motion.div
          className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <ZapIcon className="h-4 w-4 text-white" />
        </motion.div>
        <div>
          <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            ProsubX
          </span>
          <p className="text-[10px] text-emerald-600 font-medium leading-none mt-0.5">Internal Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item, index) => {
          const isActive = item.href === '/internal/dashboard'
            ? pathname === '/internal/dashboard'
            : pathname.startsWith(item.href)

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
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInternalNav"
                    className="absolute inset-0 bg-emerald-50 rounded-lg"
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
              className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {user.name?.charAt(0).toUpperCase() ?? 'U'}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Internal Staff</p>
            </div>
          </div>
        </motion.div>
      )}
    </aside>
  )
}
