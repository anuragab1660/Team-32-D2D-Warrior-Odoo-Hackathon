'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import api, { handleApiError } from '@/lib/api'
import { toast } from 'sonner'
import { UserIcon, LoaderIcon } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  gstin: z.string().optional(),
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

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      company_name: user?.company_name ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
      city: user?.city ?? '',
      state: user?.state ?? '',
      country: user?.country ?? '',
      postal_code: user?.postal_code ?? '',
      gstin: user?.gstin ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      await api.put('/api/auth/profile', data)
      toast.success('Profile updated successfully')
      await refreshUser()
    } catch (err) {
      handleApiError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHero
        eyebrow="Portal profile"
        title="My profile"
        description="Update the contact and billing details tied to your account."
      />

      <div className="section-card">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #063669, #274e82)' }}
          >
            <UserIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <p
              className="font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              {user?.name}
            </p>
            <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {fieldLabel('Full Name')}
              <input {...register('name')} placeholder="Your name" className="input-soft w-full" />
              {errors.name && (
                <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Company Name')}
              <input {...register('company_name')} placeholder="Your company" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Phone')}
              <input {...register('phone')} placeholder="+91 98765 43210" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('GSTIN')}
              <input {...register('gstin')} placeholder="GST number" className="input-soft w-full" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              {fieldLabel('Address')}
              <input {...register('address')} placeholder="Street address" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('City')}
              <input {...register('city')} placeholder="City" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('State')}
              <input {...register('state')} placeholder="State" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Country')}
              <input {...register('country')} placeholder="Country" className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Postal Code')}
              <input {...register('postal_code')} placeholder="Postal code" className="input-soft w-full" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex items-center gap-2"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <><LoaderIcon className="h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
