'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { usePlans } from '@/hooks/usePlans'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
      if (sub) router.push(`/subscriptions/${sub.id}`)
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
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Subscription Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            <div className="space-y-2">
              <Label>Customer</Label>
              <Select onValueChange={(v) => setValue('customer_id', v)}>
                <SelectTrigger className={errors.customer_id ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.email || c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Recurring Plan (optional)</Label>
              <Select onValueChange={(v) => setValue('plan_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — ₹{p.price}/{p.billing_period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" {...register('start_date')} className={errors.start_date ? 'border-red-400' : ''} />
                {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input id="expiration_date" type="date" {...register('expiration_date')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input id="payment_terms" placeholder="e.g. Net 30" {...register('payment_terms')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Optional notes" {...register('notes')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Subscription'}
              </Button>
              <Link href="/subscriptions">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
