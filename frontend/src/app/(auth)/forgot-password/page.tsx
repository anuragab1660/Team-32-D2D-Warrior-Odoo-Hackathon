'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoaderIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="shadow-lg border-slate-200">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500 mb-6">
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link href="/login" className="text-indigo-600 text-sm font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeftIcon className="h-3 w-3" />
            Back to login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Forgot password?</CardTitle>
        <CardDescription className="text-center">
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-400' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : 'Send Reset Link'}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/login" className="text-sm text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeftIcon className="h-3 w-3" />
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
