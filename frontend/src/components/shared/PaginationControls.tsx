import { Button } from '@/components/ui/button'
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

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <Button
        variant="outline" size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-slate-400">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p as number)}
            className="h-8 w-8 p-0 text-xs"
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline" size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
