'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const pathname = usePathname()

  return (
    <AuthGuard allowedRoles={['admin', 'internal']}>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <TopNav onSearchOpen={() => setCmdOpen(true)} />
        <main className="ml-60 pt-16 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </AuthGuard>
  )
}
