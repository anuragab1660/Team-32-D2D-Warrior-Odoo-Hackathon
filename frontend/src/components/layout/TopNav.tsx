'use client'

import { useAuthStore } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { LogOutIcon, UserIcon, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TopNavProps {
  onSearchOpen?: () => void
}

export function TopNav({ onSearchOpen }: TopNavProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-[4.5rem] flex items-center justify-between px-8"
      style={{
        left: '256px',
        background: 'rgba(248, 249, 255, 0.84)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(39, 78, 130, 0.08)',
      }}
    >
      {/* Search */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-150 hover:bg-white"
        style={{
          background: 'rgba(255,255,255,0.82)',
          minWidth: '280px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 16px 36px -28px rgba(6, 54, 105, 0.35)',
        }}
      >
        <SearchIcon className="h-4 w-4" style={{ color: 'var(--on-surface-muted)' }} />
        <span className="text-sm flex-1 text-left" style={{ color: 'var(--on-surface-muted)' }}>
          Search anything...
        </span>
        <kbd
          className="text-[10px] px-2 py-0.5 rounded-lg font-mono"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2.5 h-11 px-3 rounded-2xl hover:bg-white"
                style={{ background: 'rgba(255,255,255,0.82)', boxShadow: '0 16px 36px -28px rgba(6, 54, 105, 0.35)' }}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)', fontFamily: 'Manrope, sans-serif' }}
                >
                  {getInitials(user.name ?? '')}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate" style={{ color: 'var(--on-surface)', fontFamily: 'Inter, sans-serif' }}>
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl"
              style={{
                background: 'var(--surface-container-lowest)',
                border: 'none',
                boxShadow: '0 8px 32px -8px rgba(6, 54, 105, 0.15), 0 20px 48px -16px rgba(6, 54, 105, 0.10)',
              }}
            >
              <DropdownMenuLabel className="font-normal px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <div className="mx-3 my-1 tonal-divider" />
              <DropdownMenuItem className="gap-2 cursor-pointer mx-1 rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                <UserIcon className="h-4 w-4" style={{ color: 'var(--on-surface-variant)' }} />
                <span style={{ color: 'var(--on-surface)' }}>Profile</span>
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
    </header>
  )
}
