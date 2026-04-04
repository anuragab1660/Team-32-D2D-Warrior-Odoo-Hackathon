import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
  description?: string
  className?: string
}

export function MetricCard({ label, value, icon: Icon, accent = 'linear-gradient(135deg, #0a2f5c 0%, #17457d 100%)', description, className }: MetricCardProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_55px_-38px_rgba(6,54,105,0.35)] backdrop-blur-xl', className)}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.75), transparent 48%)' }} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="metric-label mb-2">{label}</p>
          <p className="metric-value text-[2rem] leading-none">{value}</p>
          {description && (
            <p className="mt-2 text-sm" style={{ color: 'var(--on-surface-muted)' }}>
              {description}
            </p>
          )}
        </div>
        <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg" style={{ background: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}