import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({ page, totalPages, onPageChange, className }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const btnBase: React.CSSProperties = {
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    border: 'none',
  }

  return (
    <div className={`flex items-center gap-1 mt-4 ${className ?? ''}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        style={{
          ...btnBase,
          background: 'var(--surface-container-low)',
          color: page === 1 ? 'var(--on-surface-muted)' : 'var(--on-surface-variant)',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'var(--on-surface-muted)' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={{
              ...btnBase,
              background: p === page ? 'linear-gradient(135deg, #063669, #274e82)' : 'var(--surface-container-low)',
              color: p === page ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        style={{
          ...btnBase,
          background: 'var(--surface-container-low)',
          color: page === totalPages ? 'var(--on-surface-muted)' : 'var(--on-surface-variant)',
          opacity: page === totalPages ? 0.5 : 1,
        }}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
