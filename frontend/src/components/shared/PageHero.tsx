import { cn } from '@/lib/utils'

interface PageHeroProps {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHero({ eyebrow, title, description, action, children, className }: PageHeroProps) {
  return (
    <section
      className={cn('relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_70px_-45px_rgba(6,54,105,0.45)] backdrop-blur-xl page-fade-in', className)}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(39,78,130,0.14), transparent 34%), radial-gradient(circle at bottom left, rgba(5,150,105,0.10), transparent 28%)' }} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: 'rgba(39,78,130,0.08)', color: 'var(--primary)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)' }} />
              {eyebrow}
            </div>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.04em' }}>
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children && <div className="relative mt-6">{children}</div>}
    </section>
  )
}