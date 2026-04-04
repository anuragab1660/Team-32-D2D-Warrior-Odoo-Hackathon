'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { usePlans } from '@/hooks/usePlans'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoaderIcon, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import type { Customer } from '@/types'

const schema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  plan_id: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  expiration_date: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

export default function NewSubscriptionPage() {
  const router = useRouter()
  const { createSubscription } = useSubscriptions()
  const { plans, fetchPlans } = usePlans()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { start_date: new Date().toISOString().split('T')[0] },
  })

  useEffect(() => {
    fetchPlans(true)
    api.get('/api/customers').then(({ data }) => setCustomers(data.data || [])).catch(() => {})
  }, [fetchPlans])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      const sub = await createSubscription({
        customer_id: data.customer_id,
        plan_id: data.plan_id || undefined,
        start_date: data.start_date,
        expiration_date: data.expiration_date || undefined,
        payment_terms: data.payment_terms || undefined,
        notes: data.notes || undefined,
      })
      router.push(`/subscriptions/${sub.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to create subscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="New Subscription"
        description="Create a new customer subscription"
        action={
          <Link href="/subscriptions">
            <button className="btn-soft flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />Back
            </button>
          </Link>
        }
      />

      <div className="section-card">
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
        >
          Subscription Details
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            {fieldLabel('Customer')}
            <select
              className="input-soft w-full"
              style={errors.customer_id ? { outlineColor: '#dc2626' } : {}}
              defaultValue=""
              onChange={(e) => setValue('customer_id', e.target.value)}
            >
              <option value="" disabled>Select customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.email || c.id}</option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.customer_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Recurring Plan (optional)')}
            <select
              className="input-soft w-full"
              defaultValue=""
              onChange={(e) => setValue('plan_id', e.target.value)}
            >
              <option value="">No plan selected</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ₹{p.price}/{p.billing_period}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {fieldLabel('Start Date')}
              <input
                id="start_date"
                type="date"
                {...register('start_date')}
                className="input-soft w-full"
                style={errors.start_date ? { outlineColor: '#dc2626' } : {}}
              />
              {errors.start_date && (
                <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Expiration Date')}
              <input id="expiration_date" type="date" {...register('expiration_date')} className="input-soft w-full" />
            </div>
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Payment Terms')}
            <input id="payment_terms" placeholder="e.g. Net 30" {...register('payment_terms')} className="input-soft w-full" />
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Notes')}
            <input id="notes" placeholder="Optional notes" {...register('notes')} className="input-soft w-full" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient flex items-center gap-2"
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? <><LoaderIcon className="h-4 w-4 animate-spin" />Creating...</> : 'Create Subscription'}
            </button>
            <Link href="/subscriptions">
              <button type="button" className="btn-soft">Cancel</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
