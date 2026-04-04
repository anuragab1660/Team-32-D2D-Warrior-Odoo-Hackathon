'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  PlusIcon, LoaderIcon, PenLineIcon, ToggleLeftIcon, ToggleRightIcon,
  KeyIcon, CalendarIcon, UserIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { ContentBlock } from '@/types'

const defaultForm = { key: '', title: '', body: '' }

export default function InternalContentPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/content')
      setBlocks(data.data || [])
    } catch {
      toast.error('Failed to load content blocks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (block: ContentBlock) => {
    setEditing(block)
    setForm({ key: block.key, title: block.title, body: block.body })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.body) return
    if (!editing && !form.key) return
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/api/content/${editing.id}`, { title: form.title, body: form.body })
        toast.success('Content block updated')
      } else {
        await api.post('/api/content', form)
        toast.success('Content block created')
      }
      setDialogOpen(false)
      setForm(defaultForm)
      setEditing(null)
      fetchBlocks()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to save content block')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      await api.patch(`/api/content/${id}/toggle`)
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to toggle status')
    } finally {
      setTogglingId(null)
    }
  }

  const keyPreview = (k: string) =>
    k.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Manage text content blocks — announcements, notices, and informational messages"
        action={
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Content Block
          </Button>
        }
      />

      {/* Blocks grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 text-slate-400"
        >
          <PenLineIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600 mb-1">No content blocks yet</p>
          <p className="text-sm mb-4">Create your first content block to get started.</p>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <PlusIcon className="h-4 w-4" />New Content Block
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block, i) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`border-slate-200 hover:shadow-md transition-all ${!block.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{block.title}</h3>
                          <Badge
                            variant={block.is_active ? 'default' : 'secondary'}
                            className={`text-[10px] shrink-0 ${block.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}
                          >
                            {block.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <KeyIcon className="h-3 w-3 text-slate-400" />
                          <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {block.key}
                          </code>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">{block.body}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {block.created_by_name && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {block.created_by_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(block.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(block.id)}
                          disabled={togglingId === block.id}
                          className="h-7 text-xs gap-1 hover:bg-slate-100"
                        >
                          {togglingId === block.id ? (
                            <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                          ) : block.is_active ? (
                            <ToggleRightIcon className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <ToggleLeftIcon className="h-3.5 w-3.5" />
                          )}
                          {block.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(block)}
                          className="h-7 text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <PenLineIcon className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditing(null); setForm(defaultForm) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Content Block' : 'New Content Block'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <div className="space-y-2">
                <Label>
                  Key <span className="text-slate-400 font-normal text-xs">(unique identifier, cannot be changed)</span>
                </Label>
                <Input
                  placeholder="e.g. homepage_banner"
                  value={form.key}
                  onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
                />
                {form.key && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <KeyIcon className="h-3 w-3" />
                    Will be stored as: <code className="ml-1 bg-slate-100 px-1 rounded font-mono">{keyPreview(form.key)}</code>
                  </p>
                )}
              </div>
            )}

            {editing && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <KeyIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Key (read-only)</p>
                  <code className="text-sm font-mono text-slate-700">{editing.key}</code>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Homepage Announcement"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                placeholder="Enter the content text here..."
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-slate-400">{form.body.length} characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditing(null); setForm(defaultForm) }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title || !form.body || (!editing && !form.key)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving
                ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                : editing ? 'Save Changes' : 'Create Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
