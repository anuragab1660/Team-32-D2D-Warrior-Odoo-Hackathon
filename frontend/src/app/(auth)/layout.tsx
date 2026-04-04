export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'radial-gradient(circle at top left, rgba(39,78,130,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(5,150,105,0.10), transparent 24%), linear-gradient(180deg, #f8faff 0%, #eef3fb 100%)' }}>
      <div
        className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12 text-white"
        style={{ background: 'linear-gradient(160deg, #07192f 0%, #0b2344 48%, #13335f 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #1f5a95, #4f8bd6)' }}>
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>ProsubX</span>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ background: 'rgba(255,255,255,0.12)' }}>
            Subscription architecture
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-[1.05] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.05em' }}>
              Calm finance tooling
              <br />for serious teams.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
              Manage subscriptions, billing, and portals from a single system designed to feel precise, fast, and composed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Subscriptions', value: '∞' },
            { label: 'Uptime', value: '99.9%' },
          ].map(stat => (
            <div key={stat.label} className="rounded-[1.5rem] p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{stat.value}</p>
              <p className="text-xs mt-1 uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a2f5c, #1f5a95)' }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>ProsubX</p>
              <p className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>Subscription architecture</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
