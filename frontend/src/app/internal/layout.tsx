'use client'

import { InternalSidebar } from '@/components/layout/InternalSidebar'
import { TopNav } from '@/components/layout/TopNav'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AuthGuard allowedRoles={['internal']}>
      <div className="min-h-screen bg-slate-50">
        <InternalSidebar />
        <TopNav />
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
      </div>
    </AuthGuard>
  )
}
