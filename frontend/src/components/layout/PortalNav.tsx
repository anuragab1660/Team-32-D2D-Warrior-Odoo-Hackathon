'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HomeIcon, ShoppingBagIcon, ShoppingCartIcon,
  FileTextIcon, UserIcon, ZapIcon, LogOutIcon, BellIcon,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart'
import { useEffect, useState } from 'react'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useInvoices } from '@/hooks/useInvoices'

const links = [
  { label: 'Home', href: '/home', icon: HomeIcon },
  { label: 'Shop', href: '/shop', icon: ShoppingBagIcon },
  { label: 'My Orders', href: '/orders', icon: ZapIcon },
  { label: 'Invoices', href: '/my-invoices', icon: FileTextIcon },
]

const READ_KEY = 'prosubx_read_notifications'

function getReadCount(): number {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]').length } catch { return 0 }
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function PortalNav() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const totalItems = useCartStore(s => s.totalItems())
  const { subscriptions, fetchMySubscriptions } = useSubscriptions()
  const { invoices, fetchMyInvoices } = useInvoices()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMySubscriptions()
    fetchMyInvoices()
  }, [fetchMySubscriptions, fetchMyInvoices])

  useEffect(() => {
    // Build total notification count
    let total = 0
    subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.expiration_date) {
        const d = daysUntil(sub.expiration_date)
        if (d >= 0 && d <= 7) total++
      }
      if (sub.status === 'active') total++
    })
    invoices.forEach(inv => {
      if (['overdue', 'confirmed', 'paid'].includes(inv.status)) total++
    })
    const readCount = getReadCount()
    setUnreadCount(Math.max(total - readCount, 0))
  }, [subscriptions, invoices])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ZapIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 hidden sm:block" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            ProsubX
          </span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href))
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <link.icon className="h-4 w-4" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Bell icon */}
          <Button variant="ghost" size="sm" asChild className="relative">
            <Link href="/notifications">
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Cart icon */}
          <Button variant="ghost" size="sm" asChild className="relative">
            <Link href="/cart">
              <ShoppingCartIcon className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-semibold">
                      {getInitials(user.name ?? '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/my-account"><UserIcon className="h-4 w-4" />My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/notifications">
                    <BellIcon className="h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <LogOutIcon className="h-4 w-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
