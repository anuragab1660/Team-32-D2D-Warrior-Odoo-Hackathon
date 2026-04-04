'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/hooks/useAuth'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HomeIcon, ShoppingBagIcon, ShoppingCartIcon,
  FileTextIcon, UserIcon, ZapIcon, LogOutIcon,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart'

const links = [
  { label: 'Home', href: '/home', icon: HomeIcon },
  { label: 'Shop', href: '/shop', icon: ShoppingBagIcon },
  { label: 'My Orders', href: '/orders', icon: ZapIcon },
  { label: 'Invoices', href: '/my-invoices', icon: FileTextIcon },
]

export function PortalNav() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const totalItems = useCartStore(s => s.totalItems())

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/70"
      style={{
        background: 'rgba(248, 249, 255, 0.84)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)' }}>
            <ZapIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[17px] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            ProsubX
          </span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-1">
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/75'
                )}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #0a2f5c, #1f5a95)' : undefined,
                  color: isActive ? 'white' : 'var(--on-surface-variant)',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: isActive ? '0 14px 28px -18px rgba(6, 54, 105, 0.6)' : undefined,
                }}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center h-10 w-10 rounded-2xl transition-all"
            style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 16px 36px -30px rgba(6,54,105,0.35)' }}
          >
            <ShoppingCartIcon className="h-5 w-5" style={{ color: 'var(--on-surface-variant)' }} />
            {totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                style={{ background: 'linear-gradient(135deg, #063669, #274e82)', fontFamily: 'Manrope, sans-serif' }}
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 h-10 px-3 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '1rem', boxShadow: '0 16px 36px -30px rgba(6,54,105,0.35)' }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)', fontFamily: 'Manrope, sans-serif' }}
                  >
                    {getInitials(user.name ?? '')}
                  </div>
                  <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--on-surface)', fontFamily: 'Inter, sans-serif' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 rounded-2xl"
                style={{
                  background: 'var(--surface-container-lowest)',
                  border: 'none',
                  boxShadow: '0 8px 32px -8px rgba(6, 54, 105, 0.15)',
                }}
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
                    {user.email}
                  </p>
                </div>
                <div className="mx-3 my-1 tonal-divider" />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer mx-1 rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Link href="/profile">
                    <UserIcon className="h-4 w-4" style={{ color: 'var(--on-surface-variant)' }} />
                    <span style={{ color: 'var(--on-surface)' }}>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <div className="mx-3 my-1 tonal-divider" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer mx-1 mb-1 rounded-xl"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <LogOutIcon className="h-4 w-4" style={{ color: '#dc2626' }} />
                  <span style={{ color: '#dc2626' }}>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
