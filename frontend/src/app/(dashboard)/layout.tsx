'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { CommandPalette } from '@/components/layout/CommandPalette'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)

  return (
    <AuthGuard allowedRoles={['admin', 'internal']}>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <TopNav onSearchOpen={() => setCmdOpen(true)} />
        <main className="ml-60 pt-16 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </AuthGuard>
  )
}
