'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <motion.div
      className={cn('flex items-start justify-between', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          {title}
        </h1>
        {description && (
          <motion.p
            className="mt-1 text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {description}
          </motion.p>
        )}
      </div>
      {action && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}
