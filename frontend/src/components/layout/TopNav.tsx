'use client'

import { useAuthStore } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { LogOutIcon, UserIcon, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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
    <motion.header
      className="fixed top-0 right-0 left-60 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-slate-400 w-64 justify-start hover:border-indigo-300 hover:text-slate-600 transition-colors"
            onClick={onSearchOpen}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-semibold">
                    {getInitials(user.name ?? '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <UserIcon className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOutIcon className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>
  )
}
