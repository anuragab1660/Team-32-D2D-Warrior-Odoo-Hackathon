'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import api, { handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { UserIcon, LoaderIcon } from 'lucide-react'

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">{user?.name}</CardTitle>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input {...register('name')} placeholder="Your name" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input {...register('company_name')} placeholder="Your company" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input {...register('gstin')} placeholder="GST number" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input {...register('address')} placeholder="Street address" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input {...register('city')} placeholder="City" />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input {...register('state')} placeholder="State" />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input {...register('country')} placeholder="Country" />
              </div>
              <div className="space-y-1.5">
                <Label>Postal Code</Label>
                <Input {...register('postal_code')} placeholder="Postal code" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
