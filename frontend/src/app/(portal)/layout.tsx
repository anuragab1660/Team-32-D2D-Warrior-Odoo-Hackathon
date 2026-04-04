'use client'

import { PortalNav } from '@/components/layout/PortalNav'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['portal']}>
      <div className="min-h-screen bg-slate-50">
        <PortalNav />
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
