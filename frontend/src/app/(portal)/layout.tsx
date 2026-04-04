'use client'

import { PortalNav } from '@/components/layout/PortalNav'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['portal']}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top left, rgba(39,78,130,0.08), transparent 26%), radial-gradient(circle at bottom right, rgba(5,150,105,0.08), transparent 24%), linear-gradient(180deg, #f8faff 0%, #eef3fb 100%)' }}>
        <PortalNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
