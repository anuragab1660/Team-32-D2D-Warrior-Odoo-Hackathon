import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 p-5 sm:p-6 shadow-[0_24px_60px_-42px_rgba(6,54,105,0.38)] backdrop-blur-xl page-fade-in', className)}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(39,78,130,0.12), transparent 34%), radial-gradient(circle at bottom left, rgba(5,150,105,0.08), transparent 30%)' }} />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ background: 'rgba(39,78,130,0.08)', color: 'var(--primary)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)' }} />
            Management
          </div>
          <h1
            className="text-2xl sm:text-[2.15rem] font-bold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.04em' }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  )
}
