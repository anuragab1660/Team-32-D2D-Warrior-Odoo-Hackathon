import { cn } from '@/lib/utils'

interface AuthPanelProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthPanel({ eyebrow, title, description, children, footer, className }: AuthPanelProps) {
  return (
    <section className={cn('relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_32px_72px_-48px_rgba(6,54,105,0.55)] backdrop-blur-xl page-fade-in', className)}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(39,78,130,0.12), transparent 36%), radial-gradient(circle at bottom left, rgba(5,150,105,0.08), transparent 30%)' }} />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: 'rgba(39,78,130,0.08)', color: 'var(--primary)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)' }} />
          {eyebrow}
        </div>
        <div className="mt-4 space-y-2">
          <h1 className="text-2xl sm:text-[2rem] font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.04em' }}>
            {title}
          </h1>
          <p className="text-sm sm:text-base" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
            {description}
          </p>
        </div>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </section>
  )
}