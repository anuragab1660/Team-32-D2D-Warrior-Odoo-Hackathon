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
      <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top left, rgba(39,78,130,0.14), transparent 24%), radial-gradient(circle at bottom right, rgba(5,150,105,0.08), transparent 20%), linear-gradient(180deg, #f8faff 0%, #eef3fb 100%)' }}>
        <Sidebar />
        <TopNav onSearchOpen={() => setCmdOpen(true)} />
        <main style={{ marginLeft: '256px', paddingTop: '72px', minHeight: '100vh' }}>
          <div className="p-6 sm:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </AuthGuard>
  )
}
