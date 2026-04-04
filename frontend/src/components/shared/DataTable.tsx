'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDownIcon, InboxIcon } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  if (loading) {
    return (
      <div className="rounded-[1.5rem] overflow-hidden border border-white/70 bg-white/82 shadow-[0_24px_60px_-42px_rgba(6,54,105,0.28)] backdrop-blur-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse"
            style={{
              background: i % 2 === 0
                ? 'var(--surface-container-lowest)'
                : 'var(--surface-container-low)',
            }}
          />
        ))}
      </div>
    )
  }

  if (table.getRowModel().rows.length === 0) {
    return (
      <div
        className="rounded-[1.5rem] py-24 flex flex-col items-center justify-center text-center border border-white/70 bg-white/82 shadow-[0_24px_60px_-42px_rgba(6,54,105,0.28)] backdrop-blur-xl"
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(39,78,130,0.10), rgba(5,150,105,0.10))' }}
        >
          <InboxIcon className="h-6 w-6" style={{ color: 'var(--on-surface-muted)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {emptyTitle}
        </p>
        {emptyDescription && (
          <p className="text-sm" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
            {emptyDescription}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-[1.5rem] overflow-hidden border border-white/70 bg-white/82 shadow-[0_24px_60px_-42px_rgba(6,54,105,0.28)] backdrop-blur-xl">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr
              key={hg.id}
              style={{ background: 'linear-gradient(180deg, rgba(39,78,130,0.08), rgba(39,78,130,0.03))' }}
            >
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--on-surface-muted)',
                    borderBottom: 'none',
                  }}
                >
                  {header.isPlaceholder ? null : (
                    header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                        style={{ fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: 'inherit' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDownIcon className="h-3 w-3 opacity-50" />
                      </button>
                    ) : flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className="table-row-alt transition-all duration-100"
              style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.86)' : 'rgba(241,246,253,0.86)',
              }}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className="px-6 py-4"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.875rem',
                    color: 'var(--on-surface)',
                    borderTop: '1px solid rgba(39,78,130,0.05)',
                    borderBottom: 'none',
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function createSortableHeader(label: string) {
  return label
}
