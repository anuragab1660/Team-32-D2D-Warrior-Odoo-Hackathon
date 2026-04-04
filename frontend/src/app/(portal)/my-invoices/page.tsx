'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FileTextIcon, ChevronRightIcon } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'

export default function PortalInvoicesPage() {
  const { invoices, loading, fetchMyInvoices } = useInvoices()

  useEffect(() => {
    fetchMyInvoices()
  }, [fetchMyInvoices])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHero
        eyebrow="Portal invoices"
        title="Invoices"
        description="Your billing history with a more concise, scan-friendly layout."
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'var(--surface-container-low)' }}
            />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <FileTextIcon className="h-6 w-6" style={{ color: 'var(--on-surface-muted)' }} />
          </div>
          <p className="font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            No invoices yet
          </p>
          <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
            Invoices will appear here once they are issued.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => (
            <Link key={invoice.id} href={`/my-invoices/${invoice.id}`}>
              <div className="section-card p-4 flex items-center justify-between hover:shadow-[0_26px_55px_-34px_rgba(6,54,105,0.4)] transition-shadow cursor-pointer">
                <div>
                  <p
                    className="font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}
                  >
                    {invoice.invoice_number}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
                  >
                    Issued {new Date(invoice.issued_date).toLocaleDateString()}
                    {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className="font-bold"
                      style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                    >
                      ₹{invoice.grand_total.toLocaleString()}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={invoice.status} type="invoice" />
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" style={{ color: 'var(--on-surface-muted)' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
